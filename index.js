const { Client, GatewayIntentBits, Collection, REST, Routes, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const fs = require('fs');
require('dotenv').config(); // Carga las variables de entorno desde .env
const { createTicket } = require('./createTicket');
const { sendWelcomeMessage } = require('./welcome');
const { sendFarewellMessage } = require('./farewell');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent
    ]
});

client.commands = new Collection();
const commandFiles = fs.readdirSync('./slash_commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./slash_commands/${file}`);
    if (command && command.data && command.data.name) {
        client.commands.set(command.data.name, command);
    } else {
        console.error(`Error en el formato del archivo de comando: ${file}`);
    }
}

const rest = new REST({ version: '10' }).setToken(config.CLIENT_TOKEN);

(async () => {
    try {
        console.log('Started refreshing application (/) commands.');

        await rest.put(
            Routes.applicationGuildCommands(config.clientId, config.guildId),
            { body: client.commands.map(cmd => cmd.data.toJSON()) }
        );

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
})();

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {
    if (interaction.isCommand()) {
        const command = client.commands.get(interaction.commandName);

        if (!command) return;

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'Hubo un error ejecutando este comando.', ephemeral: true });
        }
    } else if (interaction.isStringSelectMenu()) {
        if (interaction.customId === 'select_ticket') {
            const modal = new ModalBuilder()
                .setCustomId(interaction.values[0])
                .setTitle('Describe tu problema');

            const descripcionInput = new TextInputBuilder()
                .setCustomId('descripcionProblema')
                .setLabel("Por favor, describe tu problema o necesidad:")
                .setStyle(TextInputStyle.Paragraph);

            const actionRow = new ActionRowBuilder().addComponents(descripcionInput);
            modal.addComponents(actionRow);

            await interaction.showModal(modal);
        }
    } else if (interaction.isModalSubmit()) {
        const descripcionProblema = interaction.fields.getTextInputValue('descripcionProblema');
        await createTicket(interaction, descripcionProblema);
    }
});

client.on('guildMemberAdd', member => {
    const channel = member.guild.channels.cache.find(ch => ch.name === 'bienvenida-y-reglas');
    if (channel) {
        sendWelcomeMessage(channel, member);
    }
});

client.on('guildMemberRemove', member => {
    const channel = member.guild.channels.cache.find(ch => ch.name === 'bienvenida-y-reglas');
    if (channel) {
        sendFarewellMessage(channel, member);
    }
});

process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
});

client.login(process.env.CLIENT_TOKEN); // Cambia config.CLIENT_TOKEN por process.env.CLIENT_TOKEN

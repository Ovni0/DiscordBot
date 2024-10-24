const { Client, GatewayIntentBits, Collection, REST, Routes, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
require('dotenv').config(); // Carga las variables de entorno desde .env
const { createTicket } = require('./createTicket');
const { sendWelcomeMessage } = require('./welcome');
const { sendFarewellMessage } = require('./farewell');
const { loadConfig, loadSuggestionsConfig } = require('./yamlHelper'); // Importieren der Funktionen aus yamlHelper

const cooldowns = new Map(); // Mapa para manejar los cooldowns
const COOLDOWN_SECONDS = 600; // 10 minutos de cooldown

// Configuración variable para das `config`
const config = loadConfig();

// Client-Definition und Initialisierung MUSS vor der Verwendung erfolgen
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

const rest = new REST({ version: '10' }).setToken(process.env.CLIENT_TOKEN);

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

        // Verifica si el usuario tiene los roles requeridos
        const requiredRoles = ['🛠️ | Moderador'];
        const memberRoles = interaction.member.roles.cache;
        const hasRequiredRoles = requiredRoles.some(roleName => {
            return memberRoles.some(role => role.name === roleName);
        });

        if (!hasRequiredRoles) {
            await interaction.reply({ content: 'No tienes permiso para usar este comando.', ephemeral: true });
            return;
        }

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'Hubo un error ejecutando este comando.', ephemeral: true });
        }
    } else if (interaction.isStringSelectMenu()) {
        if (interaction.customId === 'select_ticket') {
            const modal = new ModalBuilder()
                .setCustomId(`problem_description_modal-${interaction.values[0]}`) // Anpassen des CustomId zur Übermittlung des ausgewählten Wertes
                .setTitle('Describe tu problema');

            const descripcionInput = new TextInputBuilder()
                .setCustomId('descripcionProblema')
                .setLabel("Por favor, describe tu problema o necesidad:")
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true);

            const actionRow = new ActionRowBuilder().addComponents(descripcionInput);
            modal.addComponents(actionRow);

            await interaction.showModal(modal);
        }
    } else if (interaction.isModalSubmit()) {
        if (interaction.customId.startsWith('problem_description_modal-')) {
            let selectedValue = interaction.customId.split('-')[1]; // Extrahiere die Auswahl aus der CustomId

            try {
                const descripcionProblema = interaction.fields.getTextInputValue('descripcionProblema');
                const ticketChannelId = await createTicket(interaction, descripcionProblema, selectedValue); // Übergebe den ausgewählten Wert an die createTicket Funktion

                // Definiere hier das Ticket-Objekt
                const ticket = {
                    id: '123456789', // Einzigartige ID des Tickets
                    user: interaction.user.id, // ID des Benutzers, der das Ticket erstellt hat
                    category: selectedValue, // Kategorie des Tickets
                    totalMessages: 0, // Gesamtzahl der Nachrichten im Ticket (initial 0)
                    channelId: ticketChannelId // Speichern Sie die Kanal-ID für später
                };

                // Abwarten beim Schließen des Tickets
                await waitForTicketClosure(ticket);

            } catch (error) {
                console.error(error);
                await interaction.reply({ content: 'Hubo un error al intentar crear el ticket.', ephemeral: true });
            }
        }
    }
});

client.on('guildMemberAdd', member => {
    const channel = member.guild.channels.cache.find(ch => ch.name === '『🌞』bienvenidas');
    if (channel) {
        sendWelcomeMessage(channel, member);
    }
});

client.on('guildMemberRemove', member => {
    const channel = member.guild.channels.cache.find(ch => ch.name === '『🌚』despedidas');
    if (channel) {
        sendFarewellMessage(channel, member);
    }
});

client.on('messageCreate', async message => {
    if (message.author.bot) return; // Ignora mensajes de bots

    const config = loadSuggestionsConfig();

    // Verifica si el canal de sugerencias está configurado
    if (!config.suggestionChannelId) {
        console.error('El ID del canal de sugerencias no está configurado.');
        return;
    }

    // Verifica si el mensaje fue enviado en el canal de sugerencias
    if (message.channel.id === config.suggestionChannelId) {
        const now = Date.now();
        const userId = message.author.id;

        if (cooldowns.has(userId)) {
            const expirationTime = cooldowns.get(userId) + COOLDOWN_SECONDS * 1000;

            if (now < expirationTime) {
                const timeLeft = (expirationTime - now) / 1000;

                try {
                    const dmChannel = await message.author.createDM();

                    // Crear y enviar el embed
                    const cooldownEmbed = new EmbedBuilder()
                        .setColor('#FF0000') // Rojo para indicar espera
                        .setTitle('⏳ Cooldown Activo')
                        .setDescription(`Debes esperar ${Math.ceil(timeLeft)} segundos antes de enviar otra sugerencia.`);

                    const cooldownMessage = await dmChannel.send({ embeds: [cooldownEmbed] });

                    // Actualiza el mensaje de embed cada segundo
                    const interval = setInterval(() => {
                        const newTimeLeft = (expirationTime - Date.now()) / 1000;
                        if (newTimeLeft <= 0) {
                            clearInterval(interval);
                            cooldownEmbed.setDescription('Ya puedes enviar otra sugerencia.');
                            cooldownMessage.edit({ embeds: [cooldownEmbed] });
                        } else {
                            cooldownEmbed.setDescription(`Debes esperar ${Math.ceil(newTimeLeft)} segundos antes de enviar otra sugerencia.`);
                            cooldownMessage.edit({ embeds: [cooldownEmbed] });
                        }
                    }, 1000);

                } catch (error) {
                    console.error(`No se pudo enviar mensaje directo a ${message.author.tag}.`, error);
                }

                return await message.delete();
            }
        }

        cooldowns.set(userId, now);

        if (!message.content.trim()) {
            return await message.reply({
                content: '⚠️ Tu sugerencia no puede estar vacía. Por favor, escribe algo válido.',
            });
        }

        const suggestionContent = message.content.trim();

        if (suggestionContent) {
            const suggestionEmbed = new EmbedBuilder()
                .setColor('#4CAF50') // Cambia el color a un verde atractivo
                .setTitle('💡 Nueva Sugerencia Recibida')
                .addFields([
                    {
                        name: '👤 Autor:',
                        value: `<@${message.author.id}>`,
                        inline: false
                    },
                    {
                        name: '📝 Sugerencia:',
                        value: `*${suggestionContent}*`,
                        inline: false
                    }
                ])
                .setThumbnail(message.author.displayAvatarURL({ dynamic: true })) // Muestra el avatar del autor
                .setFooter({
                    text: 'Sistema de Sugerencias • Gracias por tu contribución',
                    iconURL: message.guild.iconURL({ dynamic: true }) // Muestra el icono del servidor
                })
                .setTimestamp();

            try {
                const suggestionMessage = await message.channel.send({ embeds: [suggestionEmbed] });

                await suggestionMessage.react('<:checkmark:1298694529821704354>'); // Voto positivo
                await suggestionMessage.react('<:borrar:1298694507654676561>'); // Voto negativo

                await message.delete();

                const confirmationMessage = await message.reply({
                    content: '✅ Tu sugerencia ha sido enviada correctamente. ¡Gracias por contribuir!',
                });

                setTimeout(() => {
                    confirmationMessage.delete().catch(err => console.error('Error al eliminar el mensaje de confirmación:', err));
                }, 5000);

            } catch (error) {
                console.error('Error al procesar la sugerencia:', error);
                try {
                    await message.reply('❌ Ocurrió un error al procesar tu sugerencia. Inténtalo nuevamente más tarde.');
                } catch (replyError) {
                    console.error('Error al enviar el mensaje de error:', replyError);
                }
            }
        } else {
            await message.reply({
                content: '⚠️ Tu sugerencia no puede estar vacía. Por favor, escribe algo válido.',
            });
        }
    }
});

process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
});

client.login(process.env.CLIENT_TOKEN);

async function waitForTicketClosure(ticket) {
    // Implementierung der Logik zum Warten auf das Ticket-Schließen
    console.log("waiting for ticket closure", ticket);
}

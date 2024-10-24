const { SlashCommandBuilder, ChannelType, EmbedBuilder } = require('discord.js');
const { loadSuggestionsConfig, saveSuggestionsConfig } = require('../yamlHelper'); // Asegúrate de que la ruta es correcta

module.exports = {
    data: new SlashCommandBuilder()
        .setName('suggestions')
        .setDescription('Configura el canal donde se enviarán las sugerencias.')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('El canal donde se enviarán las sugerencias')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true)
        ),
    async execute(interaction) {
        console.log("Ejecutando comando /suggestions");

        try {
            const suggestionChannel = interaction.options.getChannel('channel');
            console.log(`Canal de sugerencias seleccionado: ${suggestionChannel.id}`);

            // Cargar configuración existente
            const config = loadSuggestionsConfig();
            console.log('Configuración cargada:', config);

            // Establacer nuevo canal de sugerencias
            config.suggestionChannelId = suggestionChannel.id;
            saveSuggestionsConfig(config);
            console.log('Configuración guardada:', config);

            const botAvatarURL = interaction.client.user.displayAvatarURL({ dynamic: true });

            // Embed de confirmación
            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('📜 **Canal de Sugerencias Configurado**')
                .setDescription(`**Las sugerencias serán enviadas al canal:** ${suggestionChannel}\n\n📧 **Para enviar una sugerencia, escribe en el chat:**`)
                .addFields(
                    { name: 'Configurado por', value: `${interaction.user}`, inline: true },
                    { name: 'Canal de Sugerencias', value: `${suggestionChannel}`, inline: true },
                    { name: 'Fecha', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
                )
                .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
                .setFooter({ text: 'Sistema de Sugerencias de Army®', iconURL: botAvatarURL })
                .setTimestamp();

            // Responder la interacción
            await interaction.reply({ embeds: [embed], ephemeral: false });
            console.log("Interacción respondida correctamente.");
        } catch (error) {
            console.error("Error al ejecutar el comando /suggestions:", error);
            await interaction.reply({ content: 'Ocurrió un error al configurar el canal de sugerencias. Por favor, intenta nuevamente más tarde.', ephemeral: true });
        }
    }
};
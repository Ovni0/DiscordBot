const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ChannelType } = require('discord.js');
const { loadConfig, saveConfig } = require('../yamlHelper'); // Asegúrate de que la referencia sea correcta

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket')
        .setDescription('Crea un nuevo ticket.')
        .addChannelOption(option =>
            option.setName('logs')
                .setDescription('El canal donde se enviarán los logs de los tickets')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(false)
        ),
    async execute(interaction) {
        const logChannel = interaction.options.getChannel('logs');

        if (logChannel) {
            // Guardar el canal de logs en la configuración
            const config = loadConfig();
            config.logChannelId = logChannel.id; // Guardar el ID del canal
            saveConfig(config);

            // Embed de confirmación
            const botAvatarURL = interaction.client.user.displayAvatarURL({ dynamic: true });

            const logEmbed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('📜 **Log de Ticket Creado**')
                .setDescription(`**Logs serán enviados al canal:** ${logChannel}`)
                .addFields(
                    { name: 'Staff', value: `${interaction.user}`, inline: true },
                    { name: 'Canal de Logs', value: `${logChannel}`, inline: true },
                    { name: 'Fecha', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
                )
                .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
                .setFooter({ text: 'Sistema de Tickets de Army Bot®', iconURL: botAvatarURL })
                .setTimestamp();

            await logChannel.send({ embeds: [logEmbed] });
            await interaction.reply({ content: 'El canal de logs ha sido configurado correctamente.', ephemeral: true });
        } else {
            // Mostrar el panel de tickets si no se proporciona el canal de logs
            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle('Wizards RP (NEW)')
                .setDescription(
                    `**PANEL DE TICKETS**\n\n\n` +
                    `Para abrir un ticket, por favor selecciona el tipo de ticket que necesitas abrir en el menú desplegable a continuación.\n\n` +
                    `Mensaje enviado desde el Sistema de Tickets de Army®`
                )
                .setFooter({ text: 'Mensaje enviado desde el Sistema de Tickets de Army®', iconURL: interaction.guild.iconURL() });

            const row = new ActionRowBuilder()
                .addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId('select_ticket')
                        .setPlaceholder('Selecciona un Ticket...')
                        .addOptions([
                            {
                                label: 'Soporte Técnico',
                                description: 'Para problemas técnicos.',
                                value: 'soporte_tecnico',
                            },
                            {
                                label: 'Consulta General',
                                description: 'Para consultas generales.',
                                value: 'consulta_general',
                            },
                            {
                                label: 'Informe de Jugador',
                                description: 'Para informar sobre el comportamiento de un jugador.',
                                value: 'informe_jugador',
                            },
                        ]),
                );

            await interaction.reply({ embeds: [embed], components: [row] });
        }
    }
};

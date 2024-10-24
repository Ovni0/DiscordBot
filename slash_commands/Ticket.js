const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ChannelType } = require('discord.js');
const { loadConfig, saveConfig } = require('../yamlHelper'); // Asegúrate de que la referencia sea correcta

// Función para obtener los emojis
const getEmoji = (name, id) => {
    return `<:${name}:${id}>`;
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket')
        .setDescription('Crea un nuevo ticket.')
        .addChannelOption(option =>
            option.setName('logs')
                .setDescription('El canal donde se enviarán los logs de los tickets')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(false)
        )
        .addChannelOption(option =>
            option.setName('reseñas')
                .setDescription('El canal donde se enviarán las reseñas de los tickets')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(false)
        ),
    async execute(interaction) {
        const logChannel = interaction.options.getChannel('logs');
        const reviewChannel = interaction.options.getChannel('reseñas');

        if (logChannel) {
            const config = loadConfig();
            config.logChannelId = logChannel.id;
            saveConfig(config);

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
            return await interaction.reply({ content: 'El canal de logs ha sido configurado correctamente.', ephemeral: false });

        } else if (reviewChannel) {
            const config = loadConfig();
            config.reviewChannelId = reviewChannel.id;
            saveConfig(config);

            const botAvatarURL = interaction.client.user.displayAvatarURL({ dynamic: true });

            const reviewEmbed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('📜 **Reseña de Ticket Creado**')
                .setDescription(`**Reseñas serán enviadas al canal:** ${reviewChannel}`)
                .addFields(
                    { name: 'Staff', value: `${interaction.user}`, inline: true },
                    { name: 'Canal de Reseñas', value: `${reviewChannel}`, inline: true },
                    { name: 'Fecha', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
                )
                .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
                .setFooter({ text: 'Sistema de Tickets de Army Bot®', iconURL: botAvatarURL })
                .setTimestamp();

            await reviewChannel.send({ embeds: [reviewEmbed] });
            return await interaction.reply({ content: 'El canal de reseñas ha sido configurado correctamente.', ephemeral: false });

        } else {
            const ticketEmbed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle(getEmoji('Awards', '1298669940659982456') + ' **Panel de Tickets de Army**')
                .setDescription(
                    `**Bienvenido al Sistema de Tickets**\n\n` +
                    `Para abrir un ticket, selecciona el tipo de ticket que necesitas abrir en el menú desplegable a continuación:\n\n` +
                    `📩 *Mensaje enviado desde el Sistema de Tickets de Army®*`
                )
                .setFooter({
                    text: '¡Estamos aquí para ayudarte!',
                    iconURL: interaction.guild.iconURL()
                });

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
                                emoji: { name: 'SoporteTecnico', id: '1298685919058198638' }, // Asegúrate de que esta línea esté configurada correctamente
                            },
                            {
                                label: 'Consulta General',
                                description: 'Para consultas generales.',
                                value: 'consulta_general',
                                emoji: { name: 'Consulta', id: '1298685985248247898' }, // Usa la propiedad emoji para agregar un emoji personalizado
                            },
                            {
                                label: 'Informe de Jugador',
                                description: 'Para informar sobre el comportamiento de un jugador.',
                                value: 'informe_jugador',
                                emoji: { name: 'Informe', id: '1298686506755424346' }, // Añadir el emoji aquí también
                            },
                        ]),
                );

            // Envío del embed y el menú al canal
            return await interaction.reply({ embeds: [ticketEmbed], components: [row], ephemeral: false });
        }
    }
};

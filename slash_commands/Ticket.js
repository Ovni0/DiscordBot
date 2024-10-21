const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket')
        .setDescription('Crea un nuevo ticket.'),
    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('Wizards RP (NEW)')
            .setDescription(
                `**PANEL DE TICKETS**\n\n\n` +
                `Para abrir un ticket, por favor selecciona el tipo de ticket que necesitas abrir en el menú desplegable a continuación.\n\n` +
                `Mensaje enviado desde el Sistema de Tickets de Army®`
            )
            .setFooter({ text: 'Mensaje enviado desde el Sistema de Tickets de Army®' });

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
};
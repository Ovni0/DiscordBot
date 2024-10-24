const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ComponentType, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { loadConfig } = require('./yamlHelper');

async function requestTicketReview(ticket, client) {
    try {
        const user = await client.users.fetch(ticket.user);

        // Embed solicitando calificación de estrellas
        const reviewPrompt = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('📝 **Reseña de Ticket**')
            .setDescription('Gracias por usar nuestro sistema de soporte. Por favor, selecciona tu calificación de 1 a 5 estrellas:')
            .setFooter({
                text: 'Sistema de Tickets de Army Bot®',
                iconURL: client.user.displayAvatarURL({ dynamic: true })
            })
            .setTimestamp();

        // Menú desplegable para seleccionar la calificación
        const starSelectMenu = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('star_rating')
                    .setPlaceholder('Selecciona la calificación')
                    .addOptions([
                        { label: ':star: ', description: 'Calificación de 1 Estrella', value: '1_star' },
                        { label: ':star: ', description: 'Calificación de 2 Estrellas', value: '2_star' },
                        { label: ':star: ', description: 'Calificación de 3 Estrellas', value: '3_star' },
                        { label: ':star: ', description: 'Calificación de 4 Estrellas', value: '4_star' },
                        { label: ':star: ', description: 'Calificación de 5 Estrellas', value: '5_star' },
                    ])
            );

        const message = await user.send({
            embeds: [reviewPrompt],
            components: [starSelectMenu]
        });

        // Colector para el menú desplegable de calificación de estrellas
        const collector = message.createMessageComponentCollector({
            componentType: ComponentType.StringSelect,
            time: 60000 // 1 minuto
        });

        collector.on('collect', async (interaction) => {
            if (!interaction.isStringSelectMenu()) return;

            if (interaction.customId === 'star_rating') {
                const starRating = interaction.values[0].split('_')[0];
                collector.stop();

                // Modal para solicitar el comentario
                const modal = new ModalBuilder()
                    .setCustomId('review_modal')
                    .setTitle('📝 **Reseña de Ticket**');

                const commentInput = new TextInputBuilder()
                    .setCustomId('comment')
                    .setLabel('Describe tu experiencia:')
                    .setStyle(TextInputStyle.Paragraph);

                const actionRow = new ActionRowBuilder().addComponents(commentInput);
                modal.addComponents(actionRow);

                // Mostrar el modal al usuario
                await interaction.showModal(modal);

                client.once('interactionCreate', async modalInteraction => {
                    if (!modalInteraction.isModalSubmit()) return;
                    if (modalInteraction.customId === 'review_modal') {
                        const reviewComment = modalInteraction.fields.getTextInputValue('comment');
                        const config = loadConfig();
                        const reviewChannel = await client.channels.fetch(config.reviewChannelId);

                        // Embed para la nueva reseña de ticket
                        const reviewEmbed = new EmbedBuilder()
                            .setColor('#00ff00')
                            .setTitle(`📄 Nueva Reseña (#${ticket.id})`)
                            .setDescription(
                                `<:Awards:1299121444076126268> **Información del Soporte**\n` +
                                `**Creador:** <@${user.id}> (${user.username})\n` +
                                `**Mensajes totales:** ${ticket.totalMessages || 'N/A'}\n\n` +
                                `<:Star:1299121447821774928>  **Reseña del Soporte**\n` +
                                `<:BlueStar:1299121440477548666> `.repeat(starRating) + `\n` +
                                `***Comentario de la Reseña:***\n` +
                                `> ${reviewComment}\n\n`
                                // `🔗 [Ver Ticket Completo](tu_enlace_aquí)` // Añade un enlace a más detalles
                            )
                            .setThumbnail(user.displayAvatarURL({ dynamic: true })) // Miniatura del avatar del usuario
                            .setFooter({
                                text: 'Sistema de Tickets de Army Bot® | ¡Gracias por tu feedback!',
                                iconURL: client.user.displayAvatarURL({ dynamic: true }) // Icono del avatar del bot
                            }).setTimestamp();

                        // Enviar la reseña al canal correspondiente
                        await reviewChannel.send({ embeds: [reviewEmbed] });
                        await modalInteraction.reply({
                            content: '🎉 ¡Gracias por tu reseña!',
                            ephemeral: true
                        });
                    }
                });
            }
        });

        collector.on('end', collected => {
            if (collected.size === 0) {
                user.send('⏳ No seleccionaste una calificación a tiempo!');
            }
        });

    } catch (error) {
        console.error('Error solicitando reseña:', error);
    }
}

module.exports = { requestTicketReview };

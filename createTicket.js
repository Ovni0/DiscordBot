const { PermissionsBitField, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Events } = require('discord.js');
const { formatDistanceToNow } = require('date-fns'); // Import der date-fns Bibliothek
const { es } = require('date-fns/locale'); // Import der Spanisch-Lokalisierung
const { loadConfig, saveConfig } = require('./yamlHelper');
const { requestTicketReview } = require('./Reviews');

async function createTicket(interaction, descripcionProblema, selectedValue) {
    const channelName = `${selectedValue}-${interaction.user.username}`;

    const config = loadConfig();

    const nombreRolModerador = '🛠️ | Moderador';
    const rolModerador = interaction.guild.roles.cache.find(r => r.name === nombreRolModerador);

    if (!rolModerador) {
        console.error(`Rol "${nombreRolModerador}" no encontrado. Roles disponibles:`, interaction.guild.roles.cache.map(r => r.name).join(", "));
        return interaction.reply({ content: `Rol "${nombreRolModerador}" no encontrado.`, ephemeral: true });
    }

    const canalExistente = interaction.guild.channels.cache.find(channel =>
        channel.name.startsWith(`${selectedValue}-de-`) &&
        channel.permissionOverwrites.cache.has(interaction.user.id)
    );

    if (canalExistente) {
        return interaction.reply({
            content: 'Ya tienes un ticket abierto. Cierra el ticket existente antes de crear uno nuevo.',
            ephemeral: true
        });
    }

    const canal = await interaction.guild.channels.create({
        name: channelName,
        type: 0, // Text Channel
        permissionOverwrites: [
            {
                id: interaction.guild.roles.everyone.id,
                deny: [PermissionsBitField.Flags.ViewChannel],
            },
            {
                id: interaction.user.id,
                allow: [
                    PermissionsBitField.Flags.ViewChannel,
                    PermissionsBitField.Flags.SendMessages,
                    PermissionsBitField.Flags.ReadMessageHistory,
                ],
            },
            {
                id: rolModerador.id,
                allow: [
                    PermissionsBitField.Flags.ViewChannel,
                    PermissionsBitField.Flags.SendMessages,
                    PermissionsBitField.Flags.ReadMessageHistory,
                ],
            },
        ],
    });

    const ticketObj = {
        user: interaction.user.id,
        description: descripcionProblema,
        channelId: canal.id,
        createdAt: new Date(),
    };

    saveTicketToConfig(ticketObj);

    await interaction.reply({ content: `Tu ticket ha sido creado: ${canal}`, ephemeral: true });

    const now = new Date();

    const getEmbedMessage = (interactionTime) => {
        return new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('🎫 Ticket de Soporte')
            .setDescription(`Hola <@${interaction.user.id}>,\n\n` +
                `Gracias por comunicarte con el equipo de soporte. Un miembro del equipo de moderación estará contigo en breve.\n\n` +
                `**Problema descrito:**\n${descripcionProblema}`)
            .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: '📄 Tipo de Ticket', value: selectedValue, inline: true },
                { name: '🕒 Creado', value: new Date().toLocaleString(), inline: true },
                { name: '💬 Hace', value: formatDistanceToNow(interactionTime, { addSuffix: true, locale: es }), inline: true },
            )
            .setFooter({ text: 'Sistema de Tickets de Army Bot®', iconURL: interaction.client.user.displayAvatarURL({ dynamic: true }) })
            .setTimestamp();
    };

    const botonesInicial = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('atender_ticket')
                .setLabel('📥 Atender')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('cerrar_ticket')
                .setLabel('Cerrar')
                .setStyle(ButtonStyle.Secondary),
        );

    let initialMessage = await canal.send({ embeds: [getEmbedMessage(now)], components: [botonesInicial] });

    const updateEmbed = async () => {
        try {
            const fetchedChannel = await interaction.client.channels.fetch(canal.id).catch(() => null);

            if (!fetchedChannel) {
                console.error(`Error al obtener el canal: Canal ${canal.id} no encontrado`);
                return;
            }

            const fetchedMessage = await fetchedChannel.messages.fetch(initialMessage.id).catch(() => null);
            if (!fetchedMessage) {
                console.error(`Error al obtener el mensaje: Mensaje ${initialMessage.id} no encontrado`);
                return;
            }

            const updatedEmbed = getEmbedMessage(now);
            await fetchedMessage.edit({ embeds: [updatedEmbed] });

        } catch (error) {
            console.error('Error al actualizar el embed:', error);
        }
    };

    const buttonHandler = async (buttonInteraction) => {
        if (!buttonInteraction.isButton()) return;

        try {
            const config = loadConfig();
            console.log('Config cargado:', JSON.stringify(config, null, 2));
            const ticket = config.tickets ? config.tickets.find(t => t.channelId === buttonInteraction.channel.id) : undefined;

            if (!ticket) {
                console.error('Ticket no encontrado para el canal:', buttonInteraction.channel.id);
                if (!buttonInteraction.replied && !buttonInteraction.deferred) {
                    await buttonInteraction.reply({
                        content: 'Hubo un problema al procesar la interacción. Intenta nuevamente más tarde.',
                        ephemeral: true
                    });
                }
                return;
            }

            const nombreRolModerador = '🛠️ | Moderador';
            const rolModerador = buttonInteraction.guild.roles.cache.find(r => r.name === nombreRolModerador);

            if (buttonInteraction.customId === 'atender_ticket') {
                if (!rolModerador || !buttonInteraction.member.roles.cache.has(rolModerador.id)) {
                    if (!buttonInteraction.replied && !buttonInteraction.deferred) {
                        return await buttonInteraction.reply({
                            content: `Solo los Moderadores pueden atender el ticket.`,
                            ephemeral: true
                        });
                    }
                    return;
                }

                ticket.staff = buttonInteraction.user.id;
                saveTicketToConfig(ticket);

                const botonesActualizar = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('atender_ticket')
                            .setLabel('📥 Atender')
                            .setStyle(ButtonStyle.Success)
                            .setDisabled(true),
                        new ButtonBuilder()
                            .setCustomId('desatender_ticket')
                            .setLabel('📤 Desatender')
                            .setStyle(ButtonStyle.Danger),
                        new ButtonBuilder()
                            .setCustomId('cerrar_ticket')
                            .setLabel('Cerrar')
                            .setStyle(ButtonStyle.Secondary),
                    );

// Neu hinzugefügter Code: Interaktionsprüfung und spezielle Protokollierung
                if (buttonInteraction.deferred || buttonInteraction.replied) {
                    console.log(`Interaktion bereits anerkannt: ${buttonInteraction.customId}`);
                    return;
                }

                await buttonInteraction.update({ embeds: [getEmbedMessage(now)], components: [botonesActualizar] })
                    .catch(err => {
                        console.error('Fehler beim Aktualisieren der Interaktion:', err);
                    });
                await buttonInteraction.channel.send({
                    embeds: [new EmbedBuilder().setColor('#0099ff').setTitle('✅ Canal Atendido')
                        .setDescription(`¡Hola hola! <@${buttonInteraction.user.id}> te atenderá en unos instántes!\n\n` +
                            `Sistema de moderación de Army Bot® • ${new Date().toLocaleString()}`)
                    ]
                });
            } else if (buttonInteraction.customId === 'desatender_ticket') {
                if (!rolModerador || ticket.staff !== buttonInteraction.user.id) {
                    if (!buttonInteraction.replied && !buttonInteraction.deferred) {
                        return await buttonInteraction.reply({
                            content: `Solo el <@&1289406543082684457> que atiende el ticket puede desatenderlo.`,
                            ephemeral: true
                        });
                    }
                    return;
                }

                ticket.staff = null;
                saveTicketToConfig(ticket);

                const botonesInicial = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('atender_ticket')
                            .setLabel('📥 Atender')
                            .setStyle(ButtonStyle.Success),
                        new ButtonBuilder()
                            .setCustomId('cerrar_ticket')
                            .setLabel('Cerrar')
                            .setStyle(ButtonStyle.Secondary),
                    );

                await buttonInteraction.update({
                    embeds: [getEmbedMessage(now)],
                    components: [botonesInicial]
                }).catch(err => {
                    console.error('Fehler beim Aktualisieren der Interaktion:', err);
                });
                await buttonInteraction.channel.send({
                    embeds: [new EmbedBuilder().setColor('#ff0000').setTitle('❌ Canal Desatendido')
                        .setDescription(`<@${buttonInteraction.user.id}> ya no está atendiendo este canal.\n\n` +
                            `Sistema de moderación de Army Bot® • ${new Date().toLocaleString()}`)
                    ]
                });
            } else if (buttonInteraction.customId === 'cerrar_ticket') {
                if (buttonInteraction.user.id === interaction.user.id || (rolModerador && buttonInteraction.member.roles.cache.has(rolModerador.id))) {
                    await gatherTicketInfo(ticket, buttonInteraction.client);
                    saveTicketToConfig(ticket, true); // Guardar ticket solo al cerrar

                    await sendTicketLog(ticket, buttonInteraction.client);
                    await requestTicketReview(ticket, buttonInteraction.client);

                    if (!buttonInteraction.deferred) {
                        await buttonInteraction.deferUpdate().catch(() => null);
                    }
                    await buttonInteraction.channel.delete();
                } else {
                    if (!buttonInteraction.replied && !buttonInteraction.deferred) {
                        return await buttonInteraction.reply({
                            content: `Solo el creador del ticket o un Moderador puede cerrar el ticket.`,
                            ephemeral: true
                        });
                    }
                }
            }
        } catch (error) {
            console.error('Error de interacción:', error);
            if (!buttonInteraction.replied && !buttonInteraction.deferred) {
                await buttonInteraction.reply({ content: 'Hubo un problema al procesar la interacción.', ephemeral: true });
            }
        }
    };

    interaction.client.on(Events.InteractionCreate, buttonHandler);

    setInterval(updateEmbed, 60000);

    function saveTicketToConfig(ticket, close = false) {
        const config = loadConfig();

        if (!config.tickets) config.tickets = [];

        const index = config.tickets.findIndex(t => t.channelId === ticket.channelId);

        if (index > -1) {
            if (close) {
                // Eliminar ticket cerrado
                config.tickets.splice(index, 1);
            } else {
                config.tickets[index] = ticket;
            }
        } else if (!close) {
            config.tickets.push(ticket);
        }

        console.log('Guardando configuración:', JSON.stringify(config, null, 2)); // Añadir registro de guardado de configuración
        saveConfig(config);
    }
}

async function gatherTicketInfo(ticket, client) {
    const ticketChannel = await client.channels.fetch(ticket.channelId).catch(() => null);

    if (!ticketChannel) {
        console.error('Canal de ticket no encontrado');
        return;
    }

    const messages = await ticketChannel.messages.fetch();
    const totalMessages = messages.size;

    ticket.totalMessages = totalMessages;
}

async function sendTicketLog(ticket, client) {
    const config = loadConfig();

    const logChannel = await client.channels.fetch(config.logChannelId).catch(() => null);
    if (!logChannel) {
        console.error('Canal de log no encontrado');
        return;
    }

    const user = await client.users.fetch(ticket.user).catch(() => null);
    const staff = ticket.staff ? await client.users.fetch(ticket.staff).catch(() => null) : null;

    const logEmbed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('📜 **Log de Ticket Cerrado**')
        .setDescription(`Ticket cerrado por: ${staff ? `<@${staff.id}>` : 'N/A'}`)
        .addFields(
            { name: 'Usuario', value: user ? `<@${user.id}>` : 'Usuario no encontrado', inline: true },
            { name: 'ID de Usuario', value: String(user?.id || 'N/A'), inline: true },
            { name: 'Descripción', value: ticket.description },
            { name: 'Canal', value: `<#${ticket.channelId}> (${String(ticket.channelId || 'N/A')})`, inline: true },
            { name: 'Creado', value: `<t:${Math.floor(new Date(ticket.createdAt).getTime() / 1000)}:F>`, inline: true },
            { name: 'Cerrado', value: `<t:${Math.floor(new Date(ticket.closedAt).getTime() / 1000)}:F>`, inline: true },
            { name: 'Moderador', value: staff ? `<@${staff.id}>` : 'sin atender' },
            { name: 'Mensajes totales', value: String(ticket.totalMessages || 'N/A'), inline: true },
        )
        .setThumbnail(user ? user.displayAvatarURL({ dynamic: true }) : null)
        .setFooter({
            text: 'Sistema de Tickets de Army Bot®',
            iconURL: client.user.displayAvatarURL({ dynamic: true })
        })
        .setTimestamp();

    await logChannel.send({ embeds: [logEmbed] });
}

module.exports = { createTicket, sendTicketLog };

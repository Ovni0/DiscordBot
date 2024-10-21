const { PermissionsBitField, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Events } = require('discord.js');
const { formatDistanceToNow } = require('date-fns'); // Import der date-fns Bibliothek
const { es } = require('date-fns/locale'); // Import der Spanisch-Lokalisierung

async function createTicket(interaction, descripcionProblema) {
    const selectedValue = interaction.customId;
    const channelName = `${selectedValue}-${interaction.user.username}`;

    const nombreRolModerador = 'Moderador';
    const rolModerador = interaction.guild.roles.cache.find(r => r.name === nombreRolModerador);

    if (!rolModerador) {
        console.error(`Rol "${nombreRolModerador}" no encontrado. Roles disponibles:`, interaction.guild.roles.cache.map(r => r.name).join(", "));
        return interaction.reply({ content: `Rol "${nombreRolModerador}" no encontrado.`, ephemeral: true });
    }

    const canalExistente = interaction.guild.channels.cache.find(channel =>
        channel.name.startsWith(selectedValue) && channel.permissionOverwrites.cache.has(interaction.user.id)
    );

    if (canalExistente) {
        return interaction.reply({ content: 'Ya tienes un ticket abierto. Cierra el ticket existente antes de crear uno nuevo.', ephemeral: true });
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
                    PermissionsBitField.Flags.ReadMessageHistory
                ],
            },
            {
                id: rolModerador.id,
                allow: [
                    PermissionsBitField.Flags.ViewChannel,
                    PermissionsBitField.Flags.SendMessages,
                    PermissionsBitField.Flags.ReadMessageHistory
                ],
            },
        ],
    });

    await interaction.reply({ content: `Tu ticket ha sido creado: ${canal}`, ephemeral: true });

    const now = new Date();

    const getEmbedMessage = (now) => {
        return new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('🎫 Ticket de Soporte')
            .setDescription(`Hola ${interaction.user},\n\n` +
                `Gracias por comunicarte con el equipo de soporte. Un miembro del equipo de moderación estará contigo en breve.\n\n` +
                `**Problema descrito:**\n${descripcionProblema}`)
            .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: '📄 Tipo de Ticket', value: selectedValue, inline: true },
                { name: '🕒 Creado', value: new Date().toLocaleString(), inline: true },
                { name: '💬 Hace', value: `${formatDistanceToNow(now, { addSuffix: true, locale: es })}`, inline: true } // Verbesserte Anzeige
            )
            .setFooter({ text: 'Sistema de Tickets de Army Bot', iconURL: 'https://example.com/footer-icon.png' })
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
                .setStyle(ButtonStyle.Secondary)
        );

    let initialMessage = await canal.send({ embeds: [getEmbedMessage(now)], components: [botonesInicial] });

    // Methode zum Aktualisieren des Embeds
    const updateEmbed = async (channel, initialMessage, now) => {
        const updatedEmbed = getEmbedMessage(now);
        await initialMessage.edit({ embeds: [updatedEmbed] });
    };

    // Initialisieren des Handlers für Interaktionen mit Schaltflächen
    const buttonHandler = async buttonInteraction => {
        if (!buttonInteraction.isButton()) return;

        try {
            if (buttonInteraction.customId === 'atender_ticket') {
                if (!buttonInteraction.member.roles.cache.has(rolModerador.id)) {
                    return await buttonInteraction.reply({ content: `Solo los Moderadores pueden atender el ticket.`, ephemeral: true });
                }

                const embed = new EmbedBuilder()
                    .setColor('#0099ff') // Hochgelb für ein positives Signal
                    .setTitle('✅ Canal Atendido')
                    .setDescription(`¡Hola hola! ${buttonInteraction.user} te atenderá en unos instántes!\n\n` +
                        `Atendiéndolo @${buttonInteraction.user.username} • ${new Date().toLocaleString()}`)

                await buttonInteraction.deferUpdate();

                const botonesActualizados = new ActionRowBuilder()
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
                            .setStyle(ButtonStyle.Secondary)
                    );

                await buttonInteraction.message.edit({ embeds: [getEmbedMessage(new Date())], components: [botonesActualizados] });
                return await buttonInteraction.channel.send({ embeds: [embed] });

            } else if (buttonInteraction.customId === 'desatender_ticket') {
                const embed = new EmbedBuilder()
                    .setColor('#0099ff') // Rot für eine kritischere Nachricht
                    .setTitle('❌ Canal Desatendido')
                    .setDescription(`${buttonInteraction.user} ya no está atendiendo este canal.\n\n` +
                        `Desatendiéndolo @${buttonInteraction.user.username} • ${new Date().toLocaleString()}`)

                const botonesInicial = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('atender_ticket')
                            .setLabel('📥 Atender')
                            .setStyle(ButtonStyle.Success),
                        new ButtonBuilder()
                            .setCustomId('cerrar_ticket')
                            .setLabel('Cerrar')
                            .setStyle(ButtonStyle.Secondary)
                    );

                await buttonInteraction.deferUpdate();
                await buttonInteraction.message.edit({ components: [botonesInicial] });
                return await buttonInteraction.channel.send({ embeds: [embed] });

            } else if (buttonInteraction.customId === 'cerrar_ticket') {
                if (buttonInteraction.user.id === interaction.user.id || buttonInteraction.member.roles.cache.has(rolModerador.id)) {
                    const channel = buttonInteraction.channel;
                    await buttonInteraction.deferUpdate();
                    return await channel.delete();
                } else {
                    return await buttonInteraction.reply({ content: `Solo el creador del ticket o un Moderador puede cerrar el ticket.`, ephemeral: true });
                }
            }
        } catch (error) {
            console.error("Interaktionsfehler:", error);
            if (!buttonInteraction.replied && !buttonInteraction.deferred) {
                await buttonInteraction.reply({ content: "Es gab ein Problem beim Verarbeiten der Interaktion.", ephemeral: true });
            }
        }
    };

    interaction.client.on(Events.InteractionCreate, buttonHandler);

    // Startet ein Intervall zum Aktualisieren des Embeds
    setInterval(() => {
        updateEmbed(canal, initialMessage, new Date());
    }, 60000); // Aktualisiert alle 60 Sekunden
}

module.exports = { createTicket };
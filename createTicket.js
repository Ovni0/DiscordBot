const { PermissionsBitField, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Events } = require('discord.js');
const { formatDistanceToNow } = require('date-fns'); // Import der date-fns Bibliothek
const { es } = require('date-fns/locale'); // Import der Spanisch-Lokalisierung
const { loadConfig, saveConfig } = require('./yamlHelper'); // Import loadConfig und saveConfig

async function createTicket(interaction, descripcionProblema) {
    const selectedValue = interaction.customId;
    const channelName = `${selectedValue}-${interaction.user.username}`;

    const config = loadConfig(); // Load configuration
    if (!config.tickets) config.tickets = [];

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

    config.tickets.push({
        user: interaction.user.id,
        description: descripcionProblema,
        channelId: canal.id,
        createdAt: new Date()
    });
    saveConfig(config); // Save configuration

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
    const updateEmbed = async () => {
        try {
            const updatedEmbed = getEmbedMessage(new Date());
            const fetchedChannel = await interaction.client.channels.fetch(canal.id);
            const fetchedMessage = await fetchedChannel.messages.fetch(initialMessage.id);
            await fetchedMessage.edit({ embeds: [updatedEmbed] });
        } catch (error) {
            console.error("Fehler beim Aktualisieren des Embeds:", error);
        }
    };

    // Initialisieren des Handlers für Interaktionen mit Schaltflächen
    const buttonHandler = async buttonInteraction => {
        if (!buttonInteraction.isButton()) return;

        try {
            if (buttonInteraction.customId === 'atender_ticket') {
                if (!buttonInteraction.member.roles.cache.has(rolModerador.id)) {
                    return await buttonInteraction.reply({ content: `Solo los Moderadores pueden atender el ticket.`, ephemeral: true });
                }

                const config = loadConfig(); // Load configuration
                const ticket = config.tickets.find(t => t.channelId === buttonInteraction.channel.id);
                ticket.staff = buttonInteraction.user.id;
                saveConfig(config); // Save configuration

                const embed = new EmbedBuilder()
                    .setColor('#0099ff') // Hochgelb für ein positives Signal
                    .setTitle('✅ Canal Atendido')
                    .setDescription(`¡Hola hola! ${buttonInteraction.user} te atenderá en unos instántes!\n\n` +
                        `Atendiéndolo @${buttonInteraction.user.username} • ${new Date().toLocaleString()}`)

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

                await buttonInteraction.update({ embeds: [getEmbedMessage(new Date())], components: [botonesActualizados] });
                return await buttonInteraction.channel.send({ embeds: [embed] });

            } else if (buttonInteraction.customId === 'desatender_ticket') {
                const config = loadConfig(); // Load configuration
                const ticket = config.tickets.find(t => t.channelId === buttonInteraction.channel.id);
                ticket.staff = null; // Unassign staff
                saveConfig(config); // Save configuration

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

                await buttonInteraction.update({ components: [botonesInicial] });
                return await buttonInteraction.channel.send({ embeds: [embed] });

            } else if (buttonInteraction.customId === 'cerrar_ticket') {
                if (buttonInteraction.user.id === interaction.user.id || buttonInteraction.member.roles.cache.has(rolModerador.id)) {
                    const config = loadConfig(); // Load configuration
                    const ticketIndex = config.tickets.findIndex(t => t.channelId === buttonInteraction.channel.id);
                    const ticket = config.tickets[ticketIndex];
                    ticket.closedAt = new Date();
                    saveConfig(config); // Save configuration

                    await sendTicketLog(ticket, buttonInteraction.client); // buttonInteraction.client übergeben
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
    setInterval(updateEmbed, 60000); // Aktualisiert alle 60 Sekunden
}

// Funktion zum Senden von Ticket-Logs
async function sendTicketLog(ticket, client) {
    const config = loadConfig();

    const logChannel = await client.channels.fetch(config.logChannelId);
    if (!logChannel) return;

    const user = await client.users.fetch(ticket.user);
    const staff = ticket.staff ? await client.users.fetch(ticket.staff) : null;

    const logEmbed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('📜 **Log de Ticket Cerrado**')
        .setDescription(`Ticket cerrado por: ${staff ? staff.username : 'N/A'}`)
        .addFields(
            { name: 'Usuario', value: user ? user.username : 'Usuario nicht gefunden' },
            { name: 'Descripción', value: ticket.description },
            { name: 'Creado', value: `<t:${Math.floor(new Date(ticket.createdAt).getTime() / 1000)}:F>`, inline: true },
            { name: 'Cerrado', value: `<t:${Math.floor(new Date(ticket.closedAt).getTime() / 1000)}:F>`, inline: true },
            { name: 'Moderador', value: staff ? staff.username : 'sin atender' }
        )
        .setTimestamp();

    await logChannel.send({ embeds: [logEmbed] });
}

module.exports = { createTicket, sendTicketLog };

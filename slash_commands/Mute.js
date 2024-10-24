const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { loadMutes, saveMutes } = require('../yamlHelper'); // Ein korrekter Pfad zu yamlHelper

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mute')
        .setDescription('Silencia a un usuario temporalmente')
        .addUserOption(option =>
            option.setName('usuario')
                .setDescription('El usuario a silenciar')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('duracion')
                .setDescription('Duración del silencio en minutos')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('razon')
                .setDescription('Razón del silencio')
                .setRequired(true)),

    async execute(interaction) {
        const usuario = interaction.options.getUser('usuario');
        const duracion = interaction.options.getInteger('duracion');
        const razon = interaction.options.getString('razon');
        const ejecutor = interaction.user.tag;

        const mutes = loadMutes();
        const memberId = usuario.id;

        // Sicherstellen, dass mutes[memberId] ein Array ist
        if (!Array.isArray(mutes[memberId])) {
            mutes[memberId] = [];
        }

        // Hinzufügen der Stummschaltung zu den Mutes
        mutes[memberId].push({
            duration: duracion,
            reason: razon,
            timestamp: Date.now(),
            ejecutor
        });

        try {
            // Bezorgen Sie sich die Instanz des Rollens und aktuellen Benutzer
            const muteRole = interaction.guild.roles.cache.find(role => role.name === 'Mute');
            if (!muteRole) {
                return interaction.reply({ content: '⚠️ No se encontró el rol de silencio en el servidor.', ephemeral: true });
            }

            const member = interaction.guild.members.cache.get(usuario.id);
            if (!member) {
                return interaction.reply({ content: '⚠️ No se encontró el usuario en el servidor.', ephemeral: true });
            }

            // Hinzufügen der Stummschaltungsrolle
            await member.roles.add(muteRole, `Silenciado por ${duracion} minutos debido a: ${razon}`);

            // Entfernen der Stummschaltungsrolle nach der angegebenen Dauer
            setTimeout(async () => {
                await member.roles.remove(muteRole, 'Silencio completado');
            }, duracion * 60 * 1000);

            // Speichern der Stummschaltungen im YAML-Datei
            saveMutes(mutes);

            // Crear el embed para notificar el silencio
            const muteEmbed = new EmbedBuilder()
                .setColor('#FF0000') // Color rojo para indicar un mute
                .setTitle('🔇 Usuario Silenciado')
                .addFields(
                    { name: '👤 Usuario:', value: `${usuario.tag}` },
                    { name: '⏳ Duración:', value: `${duracion} minutos` },
                    { name: '📋 Razón:', value: `${razon}` },
                    { name: '👮‍♂️ Silenciado por:', value: `${ejecutor}` }
                )
                .setFooter({ text: 'Sistema de Moderación de Army Bot®', iconURL: 'https://example.com/icon.png' })
                .setTimestamp();

            // Responder con el embed en lugar de un mensaje de texto simple
            return interaction.reply({ embeds: [muteEmbed], ephemeral: false });
        } catch (error) {
            console.error('Error al intentar silenciar:', error);
            return interaction.reply({ content: `❌ Ocurrió un error al intentar silenciar al usuario: ${error.message}`, ephemeral: true });
        }
    }
};

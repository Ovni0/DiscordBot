const { SlashCommandBuilder } = require('discord.js');
const { loadWarns, saveWarns } = require('../yamlHelper');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Advierte a un usuario con una razón específica')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('El usuario a advertir')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Razón de la advertencia')
                .setRequired(true)),

    async execute(interaction) {
        const usuario = interaction.options.getUser('user');
        const razon = interaction.options.getString('reason');
        const ejecutor = interaction.user.tag;
        const nombreServidor = interaction.guild.name;

        const warns = loadWarns();
        const memberId = usuario.id;

        // Sicherstellen, dass warns[memberId] ein Array ist
        if (!Array.isArray(warns[memberId])) {
            warns[memberId] = [];
        }

        // Hinzufügen einer neuen Warnung
        warns[memberId].push({
            reason: razon,
            timestamp: Date.now(),
            ejecutor
        });

        try {
            // Senden einer Warnung an den Benutzer
            await usuario.send(
                `⚠️ **Has recibido una advertencia en el servidor ${nombreServidor}**.\n\n` +
                `**Razón:** ${razon}\n` +
                `**Advertido por:** ${ejecutor}\n\n` +
                `Por favor, cumple con las normas del servidor para evitar futuras acciones disciplinarias. ` +
                `Actualmente tienes ${warns[memberId].length} advertencia(s).`
            );

            let responseMessage = `✅ **${usuario.tag}** ha sido advertido.\nRazón: **${razon}**\nActualmente tiene **${warns[memberId].length}** advertencia(s).`;

            // Aktionen basierend auf der Anzahl der Warnungen
            if (warns[memberId].length === 3) {
                // Benutzer für 5 Minuten stummschalten
                const muteRole = interaction.guild.roles.cache.find(role => role.name === 'Mute');
                if (!muteRole) {
                    return interaction.reply({ content: '⚠️ No se encontró el rol de silencio en el servidor.', ephemeral: true });
                }

                await interaction.guild.members.cache.get(usuario.id).roles.add(muteRole, 'Silenciado por 5 minutos debido a 3 advertencias');

                setTimeout(async () => {
                    await interaction.guild.members.cache.get(usuario.id).roles.remove(muteRole, 'Silencio completado');
                }, 5 * 60 * 1000);

                responseMessage += `\n\n**Acción tomada:** Silenciado por 5 minutos debido a 3 advertencias.`;
            } else if (warns[memberId].length === 5) {
                // Benutzer für 7 Tage sperren
                await interaction.guild.members.ban(usuario.id, { days: 7, reason: 'Baneado por 7 días debido a 5 advertencias' });

                responseMessage += `\n\n**Acción tomada:** Baneado por 7 días debido a 5 advertencias.`;
            } else if (warns[memberId].length >= 8) {
                // Benutzer dauerhaft sperren
                await interaction.guild.members.ban(usuario.id, { days: 0, reason: 'Baneado permanentemente debido a 8 o más advertencias' });

                responseMessage += `\n\n**Acción tomada:** Baneado permanentemente debido a 8 o más advertencias.`;
            }

            // Warnungen im YAML-Datei speichern
            saveWarns(warns);

            return interaction.reply({ content: responseMessage, ephemeral: false });
        } catch (error) {
            console.error('Error al intentar advertir:', error);
            return interaction.reply({ content: `❌ Ocurrió un error al intentar advertir al usuario: ${error.message}`, ephemeral: true });
        }
    }
};
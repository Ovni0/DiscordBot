const { SlashCommandBuilder } = require('discord.js');
const { loadKicks, saveKicks } = require('../yamlHelper'); // Ein korrekter Pfad zu yamlHelper

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Expulsa a un usuario del servidor con una razón')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('El usuario a expulsar')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Razón de la expulsión')
                .setRequired(true)),

    async execute(interaction) {
        try {
            // Extraer las opciones proporcionadas por el comando.
            const usuario = interaction.options.getUser('user');
            const razon = interaction.options.getString('reason');
            const ejecutor = interaction.user.tag;  // Usuario que ejecutó el comando
            const nombreServidor = interaction.guild.name;  // Nombre del servidor

            // Validaciones
            if (!usuario) {
                return interaction.reply({ content: '⚠️ No se encontró el usuario.', ephemeral: true });
            }

            const miembro = interaction.guild.members.cache.get(usuario.id);
            if (!miembro) {
                return interaction.reply({ content: '⚠️ No se encontró al miembro en el servidor.', ephemeral: true });
            }

            // Lade die Kicks aus der YAML-Datei
            const kicks = loadKicks();
            const memberId = usuario.id;

            // Sicherstellen, dass kicks[memberId] ein Array ist
            if (!Array.isArray(kicks[memberId])) {
                kicks[memberId] = [];
            }

            // Hinzufügen der Kick-Details zu den Kicks
            kicks[memberId].push({
                reason: razon,
                timestamp: Date.now(),
                ejecutor
            });

            try {
                // Enviar un mensaje directo al usuario antes de expulsarlo
                await usuario.send(
                    `## 🚪 > Has sido expulsado del servidor **${nombreServidor}**.\n\n` +
                    `**Razón de la expulsión:** ${razon}\n` +
                    `**Expulsado por:** ${ejecutor}\n\n` +
                    `Si tienes alguna pregunta o consideras que se trata de un error, ` +
                    `por favor contacta al equipo de soporte.`
                );

                // Realizar la expulsión
                await miembro.kick(razon);

                // Kicks im YAML-Datei speichern
                saveKicks(kicks);

                // Responder al ejecutor del comando
                return interaction.reply({ content: `✅ **${usuario.tag}** ha sido expulsado.\nRazón: **${razon}**`, ephemeral: true });
            } catch (error) {
                console.error('Error al intentar expulsar:', error);
                return interaction.reply({ content: `❌ Ocurrió un error al intentar expulsar al usuario: ${error.message}`, ephemeral: true });
            }
        } catch (error) {
            console.error('Error al intentar expulsar:', error);
            return interaction.reply({ content: `❌ Ocurrió un error al intentar expulsar al usuario: ${error.message}`, ephemeral: true });
        }
    }
};
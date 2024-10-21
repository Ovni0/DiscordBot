const { SlashCommandBuilder } = require('discord.js');
const { loadBans, saveBans } = require('../yamlHelper'); // korrekter Pfad zu yamlHelper

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Banea a un usuario con una razón especificada')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('El usuario a banear')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Razón del baneo')
                .setRequired(false)),

    async execute(interaction) {
        const usuario = interaction.options.getUser('user');
        const razon = interaction.options.getString('reason') || 'No especificada';

        const miembro = interaction.guild.members.cache.get(usuario.id);
        if (!miembro) {
            return interaction.reply({ content: '⚠️ No se encontró al miembro en el servidor.', ephemeral: true });
        }

        try {
            // Berechtigungsprüfung
            if (!interaction.guild.members.me.permissions.has('BAN_MEMBERS')) {
                return interaction.reply({ content: '❌ El bot no tiene permisos para banear miembros.', ephemeral: true });
            }

            await miembro.ban({ reason: razon });

            // Bans in YAML speichern
            const bans = loadBans();
            if (!bans[usuario.id]) {
                bans[usuario.id] = [];
            }
            bans[usuario.id].push({
                reason: razon,
                timestamp: Date.now()
            });
            saveBans(bans);

            console.log('Ban gespeichert:', bans); // Debug-Ausgabe zum Überprüfen des Speichervorgangs

            return interaction.reply({ content: `✅ **${usuario.tag}** ha sido baneado.\nRazón: **${razon}**`, ephemeral: true });
        } catch (error) {
            console.error('Error al intentar banear:', error);
            return interaction.reply({ content: `❌ Ocurrió un error al intentar banear al usuario: ${error.message}`, ephemeral: true });
        }
    }
};
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { loadWarns, loadMutes, loadBans, loadKicks } = require('../yamlHelper'); // Ein korrekter Pfad zu yamlHelper

module.exports = {
    data: new SlashCommandBuilder()
        .setName('info')
        .setDescription('Muestra la información de advertencias de un usuario')
        .addUserOption(option =>
            option.setName('usuario')
                .setDescription('El usuario del que desea obtener información')
                .setRequired(true)),

    async execute(interaction) {
        const usuario = interaction.options.getUser('usuario');
        const warns = loadWarns();
        const mutes = loadMutes();
        const bans = loadBans();
        const kicks = loadKicks();
        const memberId = usuario.id;

        console.log('Warns geladen:', warns); // Debug-Ausgabe zum Überprüfen der geladenen Warnungen
        console.log('Mutes geladen:', mutes); // Debug-Ausgabe zum Überprüfen der geladenen Mutes
        console.log('Bans geladen:', bans); // Debug-Ausgabe zum Überprüfen der geladenen Bans
        console.log('Kicks geladen:', kicks); // Debug-Ausgabe zum Überprüfen der geladenen Kicks

        // Fetch user warns (in memory)
        const userWarns = warns[memberId] || [];

        // Fetch user mutes
        const userMutes = mutes[memberId] || [];

        // Fetch user bans
        const userBans = bans[memberId] || [];

        // Fetch user kicks
        const userKicks = kicks[memberId] || [];

        console.log('User spezifische Warnungen:', userWarns); // Debug-Ausgabe spezifisch für den Nutzer
        console.log('User spezifische Mutes:', userMutes); // Debug-Ausgabe spezifisch für den Nutzer
        console.log('User spezifische Bans:', userBans); // Debug-Ausgabe spezifisch für den Nutzer
        console.log('User spezifische Kicks:', userKicks); // Debug-Ausgabe spezifisch für den Nutzer

        // Create Embed Message
        const embed = new EmbedBuilder()
            .setTitle(`Informacion de ${usuario.tag}`)
            .setColor('#0099ff')
            .addFields(
                { name: 'Advertencias', value: `${userWarns.length}`, inline: true },
                { name: 'Mutes', value: `${userMutes.length}`, inline: true },
                { name: 'Bans', value: `${userBans.length}`, inline: true },
                { name: 'Kicks', value: `${userKicks.length}`, inline: true }
            );

        // Añadir detalles de advertencias si hay advertencias
        if (userWarns.length > 0) {
            const warnDetails = userWarns.map((warn, index) => {
                const date = new Date(warn.timestamp).toLocaleString();
                return `**Advertencia ${index + 1}**: Razón: ${warn.reason}, Advertido por: ${warn.ejecutor || "No definido"}, Fecha: ${date}`;
            }).join('\n\n');

            embed.addFields({ name: 'Detalles de Advertencias', value: warnDetails });
        }

        // Añadir detalles de mutes si hay mutes
        if (userMutes.length > 0) {
            const muteDetails = userMutes.map((mute, index) => {
                const date = new Date(mute.timestamp).toLocaleString();
                return `**Mute ${index + 1}**: Duración: ${mute.duration} minutos, Razón: ${mute.reason}, Advertido por: ${mute.ejecutor || "No definido"}, Fecha: ${date}`;
            }).join('\n\n');

            embed.addFields({ name: 'Detalles de Mutes', value: muteDetails });
        }

        // Añadir detalles de bans si hay bans
        if (userBans.length > 0) {
            const banDetails = userBans.map((ban, index) => {
                const date = new Date(ban.timestamp).toLocaleString();
                return `**Ban ${index + 1}**: Razón: ${ban.reason}, Fecha: ${date}`;
            }).join('\n\n');

            embed.addFields({ name: 'Detalles de Bans', value: banDetails });
        }

        // Añadir detalles de kicks si hay kicks
        if (userKicks.length > 0) {
            const kickDetails = userKicks.map((kick, index) => {
                const date = new Date(kick.timestamp).toLocaleString();
                return `**Kick ${index + 1}**: Razón: ${kick.reason}, Expulsado por: ${kick.ejecutor || "No definido"}, Fecha: ${date}`;
            }).join('\n\n');

            embed.addFields({ name: 'Detalles de Kicks', value: kickDetails });
        }

        embed.setTimestamp()
            .setFooter({ text: 'Informacion de Moderacion', iconURL: interaction.guild.iconURL({ dynamic: true }) });

        return interaction.reply({ embeds: [embed] });
    }
};
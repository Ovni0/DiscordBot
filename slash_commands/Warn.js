const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
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

        // Obtener el avatar del bot
        const botAvatarURL = interaction.client.user.displayAvatarURL();

        const warns = loadWarns();
        const memberId = usuario.id;

        // Asegurarse de que warns[memberId] sea un array
        if (!Array.isArray(warns[memberId])) {
            warns[memberId] = [];
        }

        // Añadir una nueva advertencia
        warns[memberId].push({
            reason: razon,
            timestamp: Date.now(),
            ejecutor
        });

        try {
            // Enviar advertencia al usuario
            const warnEmbed = new EmbedBuilder()
                .setColor('#FF5555') // Un rojo más suave para advertencias
                .setTitle('⚠️ **Advertencia Recibida**')
                .setDescription(`Has recibido una advertencia en **${nombreServidor}**.`)
                .addFields(
                    { name: '📋 Razón:', value: `*${razon}*`, inline: true },
                    { name: '👮‍♂️ Emitida por:', value: `@${ejecutor}`, inline: true },
                    { name: '📅 Fecha:', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false },
                    { name: '⚠️ Advertencias Actuales:', value: `Tienes **${warns[memberId].length}** advertencia(s).`, inline: false }
                )
                .setFooter({ text: 'Sistema de moderación de Army Bot®', iconURL: botAvatarURL })
                .setTimestamp();

            await usuario.send({ embeds: [warnEmbed] });

            // Embed de respuesta en el canal
            const responseEmbed = new EmbedBuilder()
                .setColor('#FFA500') // Color naranja para indicar advertencia
                .setTitle('📋 **Advertencia Ejecutada**')
                .addFields(
                    { name: '👤 Usuario:', value: `<@${usuario.id}> (${usuario.id})`, inline: false },
                    { name: '📋 Razón:', value: `*${razon}*`, inline: false },
                    { name: '👮‍♂️ Advertido por:', value: `<@${interaction.user.id}> (${interaction.user.id})`, inline: false },
                    { name: '⚠️ Total de Advertencias:', value: `${warns[memberId].length}`, inline: false }
                )
                .setFooter({ text: 'Sistema de moderación de Army Bot®', iconURL: botAvatarURL })
                .setTimestamp();

            // Acciones basadas en el número de advertencias
            if (warns[memberId].length === 3) {
                const muteRole = interaction.guild.roles.cache.find(role => role.name === 'Mute');
                if (!muteRole) {
                    return interaction.reply({ content: '⚠️ No se encontró el rol de silencio en el servidor.', ephemeral: true });
                }

                await interaction.guild.members.cache.get(usuario.id).roles.add(muteRole, 'Silenciado por 5 minutos debido a 3 advertencias');
                setTimeout(async () => {
                    await interaction.guild.members.cache.get(usuario.id).roles.remove(muteRole, 'Silencio completado');
                }, 5 * 60 * 1000);

                responseEmbed.addFields({ name: '🔇 Acción tomada:', value: 'Silenciado por 5 minutos debido a 3 advertencias.' });
            } else if (warns[memberId].length === 5) {
                await interaction.guild.members.ban(usuario.id, { days: 7, reason: 'Baneado por 7 días debido a 5 advertencias' });
                responseEmbed.addFields({ name: '⛔ Acción tomada:', value: 'Baneado por 7 días debido a 5 advertencias.' });
            } else if (warns[memberId].length >= 8) {
                await interaction.guild.members.ban(usuario.id, { days: 0, reason: 'Baneado permanentemente debido a 8 o más advertencias' });
                responseEmbed.addFields({ name: '🚫 Acción tomada:', value: 'Baneado permanentemente debido a 8 o más advertencias.' });
            }

            // Guardar advertencias en el archivo YAML
            saveWarns(warns);

            return interaction.reply({ embeds: [responseEmbed], ephemeral: false });
        } catch (error) {
            console.error('Error al intentar advertir:', error);
            return interaction.reply({ content: `❌ Ocurrió un error al intentar advertir al usuario: ${error.message}`, ephemeral: true });
        }
    }
};
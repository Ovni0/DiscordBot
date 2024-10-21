const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unmute')
        .setDescription('Quita el silencio a un usuario')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('El usuario a quitar el silencio')
                .setRequired(true)),

    async execute(interaction) {
        const usuario = interaction.options.getUser('user');

        const miembro = interaction.guild.members.cache.get(usuario.id);
        if (!miembro) {
            return interaction.reply({ content: '⚠️ No se encontró al miembro en el servidor.', ephemeral: true });
        }

        try {
            const muteRole = interaction.guild.roles.cache.find(role => role.name === 'Mute'); // Rollennamen Mute verwenden
            if (!muteRole) return interaction.reply({ content: '⚠️ No se encontró el rol de silencio en el servidor.', ephemeral: true });

            // Berechtigungsprüfung
            if (!interaction.guild.members.me.permissions.has('MANAGE_ROLES')) {
                return interaction.reply({ content: '❌ El bot no tiene permisos para gestionar roles.', ephemeral: true });
            }

            await miembro.roles.remove(muteRole, 'Silencio levantado');

            return interaction.reply({ content: `✅ **${usuario.tag}** ya no está silenciado.`, ephemeral: true });
        } catch (error) {
            console.error('Error al intentar quitar el silencio:', error);
            return interaction.reply({ content: `❌ Ocurrió un error al intentar quitar el silencio al usuario: ${error.message}`, ephemeral: true });
        }
    }
};
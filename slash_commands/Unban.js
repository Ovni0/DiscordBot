const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unban')
        .setDescription('Levanta el baneo a un usuario')
        .addStringOption(option =>
            option.setName('userid')
                .setDescription('El ID del usuario a desbanear')
                .setRequired(true)),

    async execute(interaction) {
        const userId = interaction.options.getString('userid');

        try {
            await interaction.guild.members.unban(userId, `Desbaneado por ${interaction.user.tag}`);
            return interaction.reply({ content: `✅ El usuario con ID **${userId}** ha sido desbaneado.`, ephemeral: true });
        } catch (error) {
            console.error('Error al intentar desbanear:', error);
            return interaction.reply({ content: `❌ Ocurrió un error al intentar desbanear al usuario: ${error.message}`, ephemeral: true });
        }
    }
};
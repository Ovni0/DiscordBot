const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

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
            // Intentar desbanear al usuario
            await interaction.guild.members.unban(userId, `Desbaneado por ${interaction.user.tag}`);

            // Crear embed para la respuesta
            const embed = new EmbedBuilder()
                .setColor('#32CD32') // Verde para indicar éxito
                .setTitle('🚪 Usuario Desbaneado')
                .setDescription(`El usuario con ID **${userId}** ha sido desbaneado del servidor.`)
                .addFields(
                    { name: '👮‍♂️ **Desbaneado por:**', value: interaction.user.tag, inline: true },
                    { name: '📅 **Fecha del desbaneo:**', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
                )
                .setTimestamp()
                .setFooter({ text: 'Sistema de moderación de Army Bot', iconURL: interaction.guild.iconURL() });

            // Responder con el embed
            return interaction.reply({ embeds: [embed], ephemeral: true });

        } catch (error) {
            console.error('Error al intentar desbanear:', error);

            // Crear un embed de error
            const errorEmbed = new EmbedBuilder()
                .setColor('#FF5555') // Rojo para error
                .setTitle('❌ Error al Desbanear')
                .setDescription(`Hubo un problema al intentar desbanear al usuario con ID **${userId}**.`)
                .addFields(
                    { name: '🛠️ **Error:**', value: error.message },
                    { name: '👮‍♂️ **Intentado por:**', value: interaction.user.tag }
                )
                .setTimestamp()
                .setFooter({ text: 'Sistema de moderación de Army Bot', iconURL: interaction.guild.iconURL() });

            // Responder con el embed de error
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
};

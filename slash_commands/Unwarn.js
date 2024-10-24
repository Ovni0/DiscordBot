const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { loadWarns, saveWarns } = require('../yamlHelper');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unwarn')
        .setDescription('Reduce o elimina todas las advertencias de un usuario')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('El usuario del cual reducir una advertencia')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('amount')
                .setDescription('Cantidad de advertencias a reducir, o "clear" para eliminar todas')
                .setRequired(false)),

    async execute(interaction) {
        const usuario = interaction.options.getUser('user');
        const amountOption = interaction.options.getString('amount');
        const warns = loadWarns();
        const memberId = usuario.id;

        // Comprobar si el usuario tiene advertencias registradas
        if (!warns[memberId]) {
            const noWarningsEmbed = new EmbedBuilder()
                .setColor('#FFA500') // Color naranja
                .setTitle('⚠️ Sin Advertencias')
                .setDescription(`**${usuario.tag}** no tiene advertencias registradas.`);
            return interaction.reply({ embeds: [noWarningsEmbed], ephemeral: true });
        }

        let responseEmbed;

        if (amountOption === 'clear') {
            // Elimina todas las advertencias
            delete warns[memberId];
            responseEmbed = new EmbedBuilder()
                .setColor('#00FF00') // Color verde
                .setTitle('✅ Advertencias Eliminadas')
                .setDescription(`Todas las advertencias de **${usuario.tag}** han sido eliminadas.`);
        } else {
            // Reducir el contador de advertencias en la cantidad especificada
            let amount = parseInt(amountOption);

            if (isNaN(amount)) {
                amount = 1; // Si no se especifica cantidad válida, reducir una advertencia por defecto
            }

            warns[memberId] -= amount;

            // Si el contador llega a 0 o es negativo, se elimina el registro
            if (warns[memberId] <= 0) {
                delete warns[memberId];
                responseEmbed = new EmbedBuilder()
                    .setColor('#00FF00') // Color verde
                    .setTitle('✅ Advertencias Eliminadas')
                    .setDescription(`Todas las advertencias de **${usuario.tag}** han sido eliminadas.`);
            } else {
                responseEmbed = new EmbedBuilder()
                    .setColor('#00FF00') // Color verde
                    .setTitle('✅ Advertencias Reducidas')
                    .setDescription(`Advertencias reducidas. **${usuario.tag}** ahora tiene ${warns[memberId]} advertencia(s).`);
            }
        }

        // Guardar advertencias de nuevo en el archivo YAML
        saveWarns(warns);

        try {
            // Notificar al ejecutor del comando
            return interaction.reply({ embeds: [responseEmbed], ephemeral: true });
        } catch (error) {
            console.error('Error al intentar reducir la advertencia:', error);
            const errorEmbed = new EmbedBuilder()
                .setColor('#FF5555') // Color rojo
                .setTitle('❌ Error')
                .setDescription(`Ocurrió un error al intentar reducir la advertencia al usuario: ${error.message}`);
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
};
const { SlashCommandBuilder } = require('discord.js');
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
            return interaction.reply({ content: `⚠️ **${usuario.tag}** no tiene advertencias registradas.`, ephemeral: true });
        }

        let responseMessage;

        if (amountOption === 'clear') {
            // Elimina todas las advertencias
            delete warns[memberId];
            responseMessage = `✅ Todas las advertencias de **${usuario.tag}** han sido eliminadas.`;
        } else {
            // Reducir el contador de advertencias en la cantidad especificada
            let amount = parseInt(amountOption);

            if (isNaN(amount)) {
                amount = 1;  // Si no se especifica cantidad válida, reducir una advertencia por defecto
            }

            warns[memberId] -= amount;

            // Si el contador llega a 0 o es negativo, se elimina el registro
            if (warns[memberId] <= 0) {
                delete warns[memberId];
                responseMessage = `✅ Todas las advertencias de **${usuario.tag}** han sido eliminadas.`;
            } else {
                responseMessage = `✅ Advertencias reducidas. **${usuario.tag}** ahora tiene ${warns[memberId]} advertencia(s).`;
            }
        }

        // Guardar advertencias de nuevo en el archivo YAML
        saveWarns(warns);

        try {
            // Notificar al ejecutor del comando
            return interaction.reply({ content: responseMessage, ephemeral: true });
        } catch (error) {
            console.error('Error al intentar reducir la advertencia:', error);
            return interaction.reply({ content: `❌ Ocurrió un error al intentar reducir la advertencia al usuario: ${error.message}`, ephemeral: true });
        }
    }
};
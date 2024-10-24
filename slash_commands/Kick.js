const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { loadKicks, saveKicks } = require('../yamlHelper'); // Cargar la función de kicks desde el archivo YAML.

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
            const ejecutor = interaction.user.tag; // Usuario que ejecutó el comando
            const nombreServidor = interaction.guild.name; // Nombre del servidor

            // Validaciones
            if (!usuario) {
                return interaction.reply({ content: '⚠️ No se encontró el usuario.', ephemeral: true });
            }

            const miembro = interaction.guild.members.cache.get(usuario.id);
            if (!miembro) {
                return interaction.reply({ content: '⚠️ No se encontró al miembro en el servidor.', ephemeral: true });
            }

            // Cargar los kicks desde el archivo YAML
            const kicks = loadKicks();
            const memberId = usuario.id;

            // Asegurarse de que kicks[memberId] sea un array
            if (!Array.isArray(kicks[memberId])) {
                kicks[memberId] = [];
            }

            // Añadir los detalles del kick
            kicks[memberId].push({
                reason: razon,
                timestamp: Date.now(),
                ejecutor
            });

            try {
                // Crear un embed para enviar un mensaje directo al usuario antes de ser expulsado
                const userEmbed = new EmbedBuilder()
                    .setColor('#FF5555') // Rojo suave pero claro
                    .setTitle('🚪 **Has sido expulsado del servidor**')
                    .setDescription(`Has sido expulsado del servidor **${nombreServidor}**.`)
                    .addFields(
                        { name: '📋 **Razón de la expulsión:**', value: `_${razon}_`, inline: true },
                        { name: '👮‍♂️ **Expulsado por:**', value: `${ejecutor}`, inline: true },
                        { name: '📅 **Fecha de expulsión:**', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false }
                    )
                    .setThumbnail(usuario.displayAvatarURL()) // Imagen del perfil del usuario expulsado
                    .setFooter({ text: 'Sistema de moderación de Army Bot', iconURL: botAvatarURL }); // Icono del bot

                await usuario.send({ embeds: [userEmbed] });

                // Realizar la expulsión
                await miembro.kick(razon);

                // Guardar los kicks en el archivo YAML
                saveKicks(kicks);

                // Obtener el avatar del bot
                const botAvatarURL = interaction.client.user.displayAvatarURL();

                // Responder al ejecutor del comando con un embed no efímero para que todos lo puedan ver
                const responseEmbed = new EmbedBuilder()
                    .setColor('#32CD32') // Verde para éxito
                    .setTitle('✅ **Usuario expulsado con éxito**')
                    .setDescription(`El usuario **${usuario.tag}** ha sido expulsado del servidor.`)
                    .addFields(
                        { name: '👤 **Usuario expulsado:**', value: `${usuario.tag} (ID: ${usuario.id})`, inline: true },
                        { name: '📋 **Razón:**', value: `_${razon}_`, inline: true },
                        { name: '👮‍♂️ **Ejecutado por:**', value: `${ejecutor}`, inline: true },
                        { name: '📅 **Fecha de ejecución:**', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false }
                    )
                    .setThumbnail(usuario.displayAvatarURL()) // Imagen del perfil del usuario expulsado
                    .setTimestamp() // Añadir timestamp de la ejecución
                    .setFooter({ text: 'Sistema de moderación de Army Bot', iconURL: botAvatarURL }); // Icono del bot

                return interaction.reply({ embeds: [responseEmbed] });
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
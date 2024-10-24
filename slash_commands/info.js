const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { loadWarns, saveWarns, loadBans, saveBans } = require('../yamlHelper');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Banea a un usuario por una duración específica con una razón')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('El usuario a banear')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('duration')
                .setDescription('Duración del baneo (por ejemplo, 1)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('unit')
                .setDescription('Unidad de tiempo (segundos, minutos, horas, días)')
                .setRequired(true)
                .addChoices(
                    { name: 'Segundos', value: 'seconds' },
                    { name: 'Minutos', value: 'minutes' },
                    { name: 'Horas', value: 'hours' },
                    { name: 'Días', value: 'days' }
                ))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Razón del baneo')
                .setRequired(true)),

    async execute(interaction) {
        try {
            // Extraer las opciones proporcionadas por el comando.
            const usuario = interaction.options.getUser('user');
            const duracion = interaction.options.getInteger('duration');
            const unidad = interaction.options.getString('unit');
            const razon = interaction.options.getString('reason');
            const ejecutor = interaction.user.tag;  // Usuario que ejecutó el comando
            const nombreServidor = interaction.guild.name;  // Nombre del servidor
            const fechaActual = new Date();

            // Validaciones
            if (!usuario) {
                return interaction.reply({ content: '⚠️ No se encontró el usuario.', ephemeral: true });
            }

            if (isNaN(duracion) || duracion <= 0) {
                return interaction.reply({ content: '⚠️ Por favor, proporciona una duración válida mayor a 0.', ephemeral: true });
            }

            // Convertir la duración a milisegundos según la unidad seleccionada.
            let milisegundos = 0;
            switch (unidad) {
                case 'seconds':
                    milisegundos = duracion * 1000;
                    break;
                case 'minutes':
                    milisegundos = duracion * 60 * 1000;
                    break;
                case 'hours':
                    milisegundos = duracion * 60 * 60 * 1000;
                    break;
                case 'days':
                    milisegundos = duracion * 24 * 60 * 60 * 1000;
                    break;
                default:
                    return interaction.reply({ content: '⚠️ Unidad de tiempo inválida.', ephemeral: true });
            }

            const miembro = interaction.guild.members.cache.get(usuario.id);
            if (!miembro) {
                return interaction.reply({ content: '⚠️ No se encontró al miembro en el servidor.', ephemeral: true });
            }

            // Crear un embed para el mensaje directo al usuario antes de banearlo
            const embed = new EmbedBuilder()
                .setColor('#FF0000') // Color rojo para advertencia y baneo
                .setTitle('🔨 Baneo Recibido')
                .setDescription(`Has sido baneado del servidor **${nombreServidor}**.`)
                .addFields(
                    { name: '📋 Razón:', value: razon },
                    { name: '🕒 Duración del baneo:', value: `${duracion} ${unidad}` },
                    { name: '👮‍♂️ Emitido por:', value: ejecutor },
                    { name: '📅 Fecha:', value: fechaActual.toLocaleString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) },
                )
                .setFooter({ text: 'Sistema de Baneos de Army Bot®', iconURL: interaction.guild.iconURL() });

            try {
                await usuario.send({ embeds: [embed] });
            } catch (error) {
                console.error('Error al enviar mensaje directo:', error);
            }

            // Realizar el baneo
            await miembro.ban({ reason: razon });

            // Guardar el baneo en el archivo Ban.yml
            const bans = loadBans();
            bans[usuario.id] = {
                usuario: usuario.tag,
                duracion,
                unidad,
                razon,
                ejecutor,
                nombreServidor,
                timestamp: Date.now()
            };
            saveBans(bans);

            // Configurar un timeout para desbanear después de la duración especificada
            setTimeout(async () => {
                await interaction.guild.members.unban(usuario.id, 'Baneo temporal completado');
            }, milisegundos);

            // Responder al ejecutor del comando
            return interaction.reply({ content: `✅ **${usuario.tag}** ha sido baneado por **${duracion} ${unidad}**.\nRazón: **${razon}**`, ephemeral: true });
        } catch (error) {
            console.error('Error al intentar banear:', error);
            return interaction.reply({ content: `❌ Ocurrió un error al intentar banear al usuario: ${error.message}`, ephemeral: true });
        }
    }
};
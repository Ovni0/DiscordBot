const { EmbedBuilder } = require('discord.js');

module.exports = {
    sendFarewellMessage: (channel, member) => {
        const farewellEmbed = new EmbedBuilder()
    .setColor('#D32F2F') // Rojo más oscuro para una sensación más solemne
    .setTitle('🥀 Cada vez somos menos...')
    .setDescription(`**${member.user.tag}** ha decidido dejarnos.\nEsperamos que nuestros caminos se crucen de nuevo... 💔`)
    .setImage('https://cdn.discordapp.com/attachments/1087323525028777989/1289094188532498442/Despedida0.jpg?ex=6717dec4&is=67168d44&hm=72dfea80775d1be8b28a30ff5934ba5b167c9e3aa9f068675fc82188e94a90f4&')
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true })) // Añade el avatar del usuario que se va
    .setFooter({ text: `💔 Ahora somos un total de ${channel.guild.memberCount} personas 💔`, iconURL: 'https://cdn.discordapp.com/icons/YOUR_GUILD_ICON.png' }) // Pie con el total de miembros
    .setTimestamp(); // Añade la fecha y hora actuales

channel.send({ embeds: [farewellEmbed] });

    }
};

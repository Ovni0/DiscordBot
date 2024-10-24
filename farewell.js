const { EmbedBuilder } = require('discord.js');

module.exports = {
    sendFarewellMessage: (channel, member) => {
        const farewellEmbed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('🥀 Cada vez somos menos...')
            .setDescription(`**\n${member.user} ha abandonado el servidor.**\nNos vemos...\n🥀`)
            .setImage('https://cdn.discordapp.com/attachments/1087323525028777989/1289094188532498442/Despedida0.jpg?ex=6717dec4&is=67168d44&hm=72dfea80775d1be8b28a30ff5934ba5b167c9e3aa9f068675fc82188e94a90f4&')
            .setFooter({ text: `💔 Ahora somos un total de ${channel.guild.memberCount} personas 💔` });

        channel.send({ embeds: [farewellEmbed] });
    }
};

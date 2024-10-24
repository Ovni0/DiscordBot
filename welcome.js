const { EmbedBuilder } = require('discord.js');

module.exports = {
    sendWelcomeMessage: (channel, member) => {
        const welcomeEmbed = new EmbedBuilder()
            .setColor('##0097ff')
            .setTitle('👋 Bienvenid@ a La Scoret Army')
            .setDescription(`Bienvenid@ ${member.user}, pórtate bien.\n
            
            🚫 Antes que todo, lee el canal <#1289404786642522195> para evitar cualquier conflicto y estar en paz.
            
            👥 Si quieres hablar con gente y pasar un buen rato ve a este canal <#1289406027304800266> .
            
            ❓Si necesitas ayuda en algo, no dudes en consultarla en <#1289414381356187729>  .
            
            🗿 No olvides ir a <#1289414696851472448> para seguir a ElScoret en todas sus cuentas.`)
            .setImage('https://cdn.discordapp.com/attachments/1087323525028777989/1289092940274208809/Bienvenida0.jpg?ex=6717dd9b&is=67168c1b&hm=8836d9d50a111c0917332b1cbc900d31e86b5b7e97e9db3e22598219d99942c5&')
            .setFooter({ text: `❤️ Ahora somos un total de ${channel.guild.memberCount} personas ❤️` });

        channel.send({ embeds: [welcomeEmbed] });
    }
};

const { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const ExtendedClient = require('../../../class/ExtendedClient');
const { log } = require('../../../functions');
const { checkPlayerStatus1 } = require('../../../../../targetchecker');

module.exports = {
    structure: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Replies with pong!'),
    options: {
        cooldown: 5000
    },
    /**
     * @param {ExtendedClient} client 
     * @param {ChatInputCommandInteraction} interaction 
     */
    run: async (client, interaction) => {
        await interaction.deferReply();
        const requiredRoleId = '1310899409701306439';
    
        // Check if the user has the required role
        if (!interaction.member.roles.cache.has(requiredRoleId)) {
            await interaction.editReply({
                ephemeral: true,
                embeds: [
                    new EmbedBuilder()
                        .setTitle('Access Denied.')
                        .setDescription('You do not have permission to use this command.')
                        .setColor('#000000')
                ]
            });
            return;
        }
    
        const usernames = ['xx_arjani', 'eliminatorgaming']; // 'DLC'];
        usernames.forEach(username => {
            if (!username) {
                log(`Received undefined player in checkPlayerStatus1.`, 'err');
            } else {
                log(`Checking status for player: ${username}`, 'info');
            }
        });
    
        const threadStatus0 = await checkPlayerStatus1('eliminatorgaming');
        const threadStatus1 = await checkPlayerStatus1('eliminatorgaming');
        const threadStatus2 = '⚫ Null';
        
        await interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setTitle('Pong.')
                    .setDescription(`System Checklist.`)
                    .addFields(
                        { name: "Discord Client", value: `\`\`\`Ping: ${client.ws.ping}ms.\`\`\`` },
                        { name: "Bot Thread 0", value: `\`\`\`${threadStatus0}\`\`\`` },
                        { name: "Bot Thread 1", value: `\`\`\`${threadStatus1}\`\`\`` },
                        { name: "Bot Thread 2", value: `\`\`\`${threadStatus2}\`\`\`` }
                    )
                    .setColor('#000000')
                    .setFooter({ text: 'Ping below 500ms is normal.' })
            ]
        });
    }
};

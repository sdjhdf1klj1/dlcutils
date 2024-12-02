const { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder, Embed } = require('discord.js');
const ExtendedClient = require('../../../class/ExtendedClient');

module.exports = {
    structure: new SlashCommandBuilder()
        .setName('help')
        .setDescription('View all the possible commands.'),
    options: {
        cooldown: 15000
    },
    run: async (client, interaction) => {
        const fullHelp = new EmbedBuilder()
                            .setTitle('Help Menu')
                            .setDescription('Here\'s a list of all possible commands.')
                            .addFields(
                                { name: '/profile', value: 'View the user profile of the guild user.'},
                                { name: '/ping', value: 'Check your ping delay between the bot\'s host server and your client.'},
                                { name: '/addtarget', value: 'Add a player to the snipelist/locator.'},
                                { name: '/addclan', value: 'Add all members of a clan to the snipelist.'},
                                { name: '/displaylist', value: 'Displays the snipelist/locatorlist.'},
                                { name: '/removetarget', value: 'Remove a player from the snipelist/locator.'},
                                { name: '/removeclan', value: 'Remove all members of a clan from the snipelist/locator.'},
                                { name: '/resetlist', value: 'Reset the entire snipelist/locatorlist.'},
                                { name: '/locator', value: 'Toggle locator notifs.'},
                                { name: '/checktarget', value: 'Check individual snipe target.'},
                                { name: '/checktargets', value: 'Check all snipe targets.'}
                            )
                            .setColor('#000000')
                            .setFooter({ text: 'LOCATED BY DISLOCATION'});
        
        const halfHelp = new EmbedBuilder()
                            .setTitle('Help Menu')
                            .setDescription('Here\'s a list of all possible commands.')
                            .addFields(
                                { name: '/profile', value: 'View the user profile of the guild user.'}
                            )
                            .setColor('#000000')
                            .setFooter({ text: 'LOCATED BY DISLOCATION'});

        await interaction.deferReply({ ephemeral: true })
        const requiredRoleId = '1310899409701306439';

        if (interaction.member.roles.cache.has(requiredRoleId)) {
            await interaction.editReply({
                embeds: [fullHelp]
            });
        } else {
            await interaction.editReply({
                embeds: [halfHelp]
            });
        }
    }
};

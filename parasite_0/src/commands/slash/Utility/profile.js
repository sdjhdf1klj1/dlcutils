const { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const ExtendedClient = require('../../../class/ExtendedClient');
const { time } = require('../../../functions');

module.exports = {
    structure: new SlashCommandBuilder()
        .setName('profile')
        .setDescription('Get a user\'s profile.')
        .addUserOption((opt) =>
            opt.setName('user')
                .setDescription('The user.')
                .setRequired(false)
        ),
    options: {
        cooldown: 5000
    },
    /**
     * @param {ExtendedClient} client 
     * @param {ChatInputCommandInteraction} interaction 
     */
    run: async (client, interaction) => {
        const user = interaction.options.getUser('user') || interaction.user;
        const member = interaction.guild.members.cache.get(user.id);

        await interaction.deferReply();

        if (!member) {
            await interaction.editReply({
                content: 'That user is not on the guild.'
            });
            return;
        };

        const roles = [];
        if (member.roles) member.roles.cache.forEach((role) => {
            if (role.id !== interaction.guild.roles.everyone.id) roles.push(`${role.toString()}`);
        });

        let profileFields = [
            { name: 'Username', value: user.username, inline: false },
            { name: 'Display name', value: member.nickname || user.displayName, inline: false },
            { name: 'ID', value: user.id, inline: false },
            { name: 'Joined Discord', value: `${time(user.createdTimestamp, 'd')} (${time(user.createdTimestamp, 'R')})`, inline: false },
            { name: 'Joined server', value: `${time(member.joinedTimestamp, 'd')} (${time(member.joinedTimestamp, 'R')})`, inline: false },
        ];

        if (member.roles.cache.has('1310899409701306439')) {
            profileFields.push({ name: 'Sniper?', value: '✅', inline: false });
        };
        // if (member.roles.cache.has('1156978006552739934')) {
        //     profileFields.push({ name: 'Clan Status', value: '<@&1156978006552739934>', inline: false });
        //     profileFields.color = '#59DCFF';
        // }
        // if (member.roles.cache.has('1170782736483631127')) {
        //     profileFields.push({ name: 'Clan Status', value: '<@&1170782736483631127>', inline: false });
        //     profileFields.color = '#A93FFF';
        // }
        // if (member.roles.cache.has('1156993851962175559')) {
        //     profileFields.push({ name: 'Special Status', value: '<@&1156993851962175559>', inline: false });
        //     profileFields.color = '#EC91FF';
        // }
        // if (member.roles.cache.has('1156845575887650896')) {
        //     profileFields.push({ name: 'Special Status', value: '<@&1156845575887650896>', inline: false });
        //     profileFields.color = '#FF393E';
        // }
        // if (member.roles.cache.has('1173531741462474843')) {
        //     profileFields.push({ name: 'Special Status', value: '<@&1173531741462474843>', inline: false });
        //     profileFields.color = '#EE36FF';
        // }
        // if (member.roles.cache.has('1156993335240687626')) {
        //     profileFields.push({ name: 'Special Status', value: '<@&1156993335240687626>', inline: false });
        //     profileFields.color = '#FF9942';
        // }
        // if (member.roles.cache.has('1186429059962511450')) {
        //     profileFields.push({ name: 'Special Status', value: '<@&1186429059962511450>', inline: false });
        //     profileFields.color = '#96F8F1';
        // } ill cook this soon.

        const profileEmbed = new EmbedBuilder()
            .setTitle('User info - ' + user.username)
            .setThumbnail(member.displayAvatarURL())
            .setDescription('User Profile')
            .setColor('#000000')
            .addFields(profileFields);

        await interaction.editReply({
            embeds: [
                profileEmbed
            ]
        });
    }
};
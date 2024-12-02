const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const ExtendedClient = require('../../../class/ExtendedClient');
const mongoose = require('mongoose');
const Snipelist = require('../../../schemas/SnipelistSchema');
const { log } = require('../../../functions');

module.exports = {
    structure: new SlashCommandBuilder()
        .setName('resetlist')
        .setDescription('Reset the specified list (snipelist or locator).')
        .addStringOption(option =>
            option.setName('list')
                .setDescription('Specify which list to reset.')
                .setRequired(true)
                .addChoices(
                    { name: 'Snipelist', value: 'snipelist' },
                    { name: 'Locator', value: 'locator' }
                )),
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
                        .setDescription('\`\`\`You do not have permission to use this command.\`\`\`')
                        .setColor('#000000')
                ].map(embed => embed.toJSON()) // Convert EmbedBuilder to JSON
            });
            return;
        }

        const listType = interaction.options.getString('list');

        try {
            if (listType === 'snipelist') {
                // Snipelist logic (MongoDB)
                await mongoose.connect('mongodb://127.0.0.1:27017/', {
                    useNewUrlParser: true,
                    useUnifiedTopology: true,
                });

                // Remove all documents from the Snipelist collection
                await Snipelist.deleteMany({});
                const allTargets = await Snipelist.find({}, 'name');
                await mongoose.connection.close();

                if (allTargets.length === 0) {
                    await interaction.editReply({
                        embeds: [
                            new EmbedBuilder()
                                .setTitle('Snipe list reset.')
                                .setDescription('The snipe list has been reset.')
                                .addFields(
                                    { name: 'Targets', value: '```None.```' }
                                )
                                .setColor('#000000')
                        ]
                    });
                } else {
                    await interaction.editReply({
                        embeds: [
                            new EmbedBuilder()
                                .setTitle('Error')
                                .setDescription(`\`\`\`[DEBUG] Database reset failed. Check console.\`\`\``)
                                .setColor('#000000')
                        ]
                    });
                }
            } else if (listType === 'locator') {
                // Locator list logic (JSON file)
                const filePath = path.join(__dirname, '../../../locatorList.json');

                // Clear the entire locator list
                fs.writeFileSync(filePath, JSON.stringify([], null, 2));

                await interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('Locator List Cleared.')
                            .setDescription('\`\`\`All entries in the locator list have been removed.\`\`\`')
                            .setColor('#000000')
                    ]
                });
            }
        } catch (err) {
            await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle('Error')
                        .setDescription(`\`\`\`[DEBUG] An error occurred. Check console.\`\`\``)
                        .setColor('#000000')
                ]
            });
            log(`${err}`, 'err');
        }
    }
};
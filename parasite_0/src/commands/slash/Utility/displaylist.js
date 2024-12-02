const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const ExtendedClient = require('../../../class/ExtendedClient');
const mongoose = require('mongoose');
const path = require('path');
const Snipelist = require('../../../schemas/SnipelistSchema');
const fs = require('fs');
const { log } = require('../../../functions');

module.exports = {
    structure: new SlashCommandBuilder()
        .setName('displaylist')
        .setDescription('List all targets in snipelist or locator.')
        .addStringOption(option => 
            option.setName('type')
                .setDescription('Type of list to display')
                .setRequired(true)
                .addChoices(
                    { name: 'Snipelist', value: 'snipelist' },
                    { name: 'Locator', value: 'locator' }
                )),
    options: {
        cooldown: 3000 // Lower cooldown as it's just fetching data
    },
    /**
     * @param {ExtendedClient} client 
     * @param {ChatInputCommandInteraction} interaction 
     */
    run: async (client, interaction) => {
        await interaction.deferReply();
        const requiredRoleId = '1310899409701306439';

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

        const listType = interaction.options.getString('type'); // Get the selected option

        try {
            if (listType === 'snipelist') {
                // Logic for snipelist
                await mongoose.connect('mongodb://127.0.0.1:27017/', {
                    useNewUrlParser: true,
                    useUnifiedTopology: true,
                });

                const allTargets = await Snipelist.find({}, 'name');
                const targetNames = allTargets.map(target => target.name);

                await interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle(`List of Targets`)
                            .setDescription(`Displaying the snipelist.`)
                            .addFields(
                                { name: 'Targets', value: `\`\`\`${targetNames.join(' \n') || 'None'}\`\`\``}
                            )
                            .setColor('#000000')
                            .setFooter({ text: 'LOCATED BY DISLOCATION' })
                    ]
                });

                await mongoose.connection.close();
            } else if (listType === 'locator') {
                // Logic for locator
                const locatorFilePath = path.join(__dirname, '../../../../../parasite_2/src/locatorList.json');
                let locatorList;

                try {
                    locatorList = JSON.parse(fs.readFileSync(locatorFilePath, 'utf8'));
                } catch (error) {
                    log(`Error reading locatorList: ${error}`, 'err');
                    await interaction.editReply({
                        embeds: [
                            new EmbedBuilder()
                                .setTitle('Error')
                                .setDescription('\`\`\`Failed to read locator list.\`\`\`')
                                .setColor('#000000')
                        ]
                    });
                    return;
                }

                await interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle(`Locator List`)
                            .setDescription(`Displaying the locator list.`)
                            .addFields(
                                { name: 'Locators', value: `\`\`\`${locatorList.join(' \n') || 'None'}\`\`\``}
                            )
                            .setColor('#000000')
                            .setFooter({ text: 'LOCATED BY DISLOCATION' })
                    ]
                });
            }
        } catch (err) {
            log(`${err}`, 'err');
            await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle('Error')
                        .setDescription(`\`\`\`[DEBUG] An error occurred. Check console.\`\`\``)
                        .setColor('#000000')
                ]
            });
        }
    }
};
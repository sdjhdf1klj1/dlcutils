const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const ExtendedClient = require('../../../class/ExtendedClient');
const mongoose = require('mongoose');
const Snipelist = require('../../../schemas/SnipelistSchema');
const { log } = require('../../../functions');

module.exports = {
    structure: new SlashCommandBuilder()
        .setName('addtarget')
        .setDescription('Add target to snipelist or locator list.')
        .addStringOption(option =>
            option.setName('ign')
                .setDescription('The IGN of the target')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('list')
                .setDescription('Specify whether to add to snipelist or locator')
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
                ]
            });
            return;
        }

        const targetName = interaction.options.getString('ign');
        const listType = interaction.options.getString('list');

        if (listType === 'snipelist') {
            // Existing snipelist logic
            try {
                await mongoose.connect('mongodb://127.0.0.1:27017/', {
                    useNewUrlParser: true,
                    useUnifiedTopology: true,
                });

                const newTarget = new Snipelist({ name: targetName });
                await newTarget.save();

                const allTargets = await Snipelist.find({}, 'name');
                const targetNames = allTargets.map(target => target.name);

                await interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle(`Target added to Snipelist.`)
                            .setDescription(`Added target | **${targetName}**`)
                            .addFields(
                                { name: 'Snipelist Targets', value: `\`\`\`${targetNames.join(' \n') || 'None'}\`\`\`` }
                            )
                            .setColor('#000000')
                    ]
                });
                await mongoose.connection.close();
            } catch (err) {
                // Handle MongoDB errors
                if (err.code === 11000) {
                    await interaction.editReply({
                        embeds: [
                            new EmbedBuilder()
                                .setTitle('Error')
                                .setDescription(`\`\`\`Target already exists in Snipelist.\`\`\``)
                                .setColor('#000000')
                        ]
                    });
                } else {
                    await interaction.editReply({
                        embeds: [
                            new EmbedBuilder()
                                .setTitle('Error')
                                .setDescription(`\`\`\`[DEBUG] An error occurred. Check console.\`\`\``)
                                .setColor('#000000')
                        ]
                    });
                }
                log(`${err}`, 'err');
            }
        } else if (listType === 'locator') {
            // Locator logic: Add target to locatorList.json
            try {
                const filePath = path.join(__dirname, '../../../locatorList.json');
                const locatorList = fs.existsSync(filePath) 
                    ? JSON.parse(fs.readFileSync(filePath, 'utf-8')) 
                    : [];

                if (!locatorList.includes(targetName)) {
                    locatorList.push(targetName);
                    fs.writeFileSync(filePath, JSON.stringify(locatorList, null, 2));
                    
                    await interaction.editReply({
                        embeds: [
                            new EmbedBuilder()
                                .setTitle(`Target added to Locator List.`)
                                .setDescription(`Added target | **${targetName}**`)
                                .addFields(
                                    { name: 'Locator Targets', value: `\`\`\`${locatorList.join(' \n') || 'None'}\`\`\`` }
                                )
                                .setColor('#000000')
                        ]
                    });
                } else {
                    await interaction.editReply({
                        embeds: [
                            new EmbedBuilder()
                                .setTitle('Error')
                                .setDescription(`\`\`\`Target already exists in Locator List.\`\`\``)
                                .setColor('#000000')
                        ]
                    });
                }
            } catch (err) {
                await interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('Error')
                            .setDescription(`\`\`\`[DEBUG] An error occurred while writing to the file.\`\`\``)
                            .setColor('#000000')
                    ]
                });
                log(`${err}`, 'err');
            }
        }
    }
};
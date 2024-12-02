const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const ExtendedClient = require('../../../class/ExtendedClient');
const mongoose = require('mongoose');
const Snipelist = require('../../../schemas/SnipelistSchema');
const { log } = require('../../../functions');

module.exports = {
    structure: new SlashCommandBuilder()
        .setName('removetarget')
        .setDescription('Remove target from snipelist or locator list.')
        .addStringOption(option =>
            option.setName('ign')
                .setDescription('The IGN of the target to remove')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('list')
                .setDescription('Specify whether to remove from snipelist or locator')
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
            // Snipelist logic (MongoDB)
            try {
                await mongoose.connect('mongodb://127.0.0.1:27017/', {
                    useNewUrlParser: true,
                    useUnifiedTopology: true,
                });

                // Find and remove the target from snipelist
                const removedTarget = await Snipelist.findOneAndDelete({ name: targetName });
                const allTargets = await Snipelist.find({}, 'name');
                const targetNames = allTargets.map(target => target.name);

                await mongoose.connection.close();
                if (removedTarget) {
                    await interaction.editReply({
                        embeds: [
                            new EmbedBuilder()
                                .setTitle('Target removed.')
                                .setDescription(`Removed target | **${removedTarget.name}**`)
                                .addFields(
                                    { name: 'Remaining Snipelist Targets', value: `\`\`\`${targetNames.join(' \n') || 'None'}\`\`\`` }
                                )
                                .setColor('#000000')
                        ]
                    });
                } else {
                    await interaction.editReply({
                        embeds: [
                            new EmbedBuilder()
                                .setTitle('Target not found.')
                                .setDescription(`The target **${targetName}** does not exist in the snipelist.`)
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
        } else if (listType === 'locator') {
            // Locator list logic (JSON file)
            try {
                const filePath = path.join(__dirname, '../../../locatorList.json');
                const locatorList = fs.existsSync(filePath) 
                    ? JSON.parse(fs.readFileSync(filePath, 'utf-8')) 
                    : [];

                if (locatorList.includes(targetName)) {
                    // Remove the target from locator list
                    const updatedLocatorList = locatorList.filter(name => name !== targetName);
                    fs.writeFileSync(filePath, JSON.stringify(updatedLocatorList, null, 2));

                    await interaction.editReply({
                        embeds: [
                            new EmbedBuilder()
                                .setTitle('Target removed from Locator List.')
                                .setDescription(`Removed target | **${targetName}**`)
                                .addFields(
                                    { name: 'Remaining Locator Targets', value: `\`\`\`${updatedLocatorList.join(' \n') || 'None'}\`\`\`` }
                                )
                                .setColor('#000000')
                        ]
                    });
                } else {
                    await interaction.editReply({
                        embeds: [
                            new EmbedBuilder()
                                .setTitle('Target not found.')
                                .setDescription(`The target **${targetName}** does not exist in the locator list.`)
                                .setColor('#000000')
                        ]
                    });
                }
            } catch (err) {
                await interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('Error')
                            .setDescription(`\`\`\`[DEBUG] An error occurred while accessing the file.\`\`\``)
                            .setColor('#000000')
                    ]
                });
                log(`${err}`, 'err');
            }
        }
    }
};
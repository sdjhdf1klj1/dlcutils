const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const ExtendedClient = require('../../../class/ExtendedClient');
const mongoose = require('mongoose');
const Snipelist = require('../../../schemas/SnipelistSchema');
const { log } = require('../../../functions');
const https = require('https');

module.exports = {
    structure: new SlashCommandBuilder()
        .setName('addclan')
        .setDescription('Add all members of a clan to the snipelist.')
        .addStringOption(option =>
            option.setName('clanname')
                .setDescription('The name of the clan')
                .setRequired(true)),
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

        const clanName = interaction.options.getString('clanname');

        // Function to fetch data using https
        const fetchClanData = (url) => {
            return new Promise((resolve, reject) => {
                https.get(url, (res) => {
                    let data = '';

                    res.on('data', (chunk) => {
                        data += chunk;
                    });

                    res.on('end', () => {
                        if (res.statusCode === 404) {
                            reject('Clan not found.');
                        } else {
                            try {
                                resolve(JSON.parse(data));
                            } catch (e) {
                                reject(`Failed to parse JSON: ${e.message}`);
                            }
                        }
                    });
                }).on('error', (e) => {
                    reject(`Request error: ${e.message}`);
                });
            });
        };

        try {
            const clanData = await fetchClanData(`https://stats.jartexnetwork.com/api/clans/${clanName}`);

            await mongoose.connect('mongodb://127.0.0.1:27017/', {
                useNewUrlParser: true,
                useUnifiedTopology: true,
            });

            // Add all members to the Snipelist, avoiding duplicates
            const members = clanData.members.map(member => member.user.username);
            const bulkOps = members.map(member => ({
                updateOne: {
                    filter: { name: member },
                    update: { $setOnInsert: { name: member } },
                    upsert: true
                }
            }));

            await Snipelist.bulkWrite(bulkOps);

            const allTargets = await Snipelist.find({}, 'name');
            const targetNames = allTargets.map(target => target.name);

            await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle(`Clan Members Added.`)
                        .setDescription(`Added all members of **${clanName}** to the snipelist.`)
                        .addFields(
                            { name: 'Targets', value: `\`\`\`${targetNames.join(' \n') || 'None'}\`\`\`` }
                        )
                        .setColor('#000000')
                ]
            });
            await mongoose.connection.close();
        } catch (err) {
            if (err === 'Clan not found.') {
                await interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('Clan Not Found.')
                            .setDescription(`The clan **${clanName}** does not exist or could not be found.`)
                            .setColor('#000000')
                    ]
                });
            } else {
                // Handle other errors
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
    }
};
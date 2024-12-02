const { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const ExtendedClient = require('../../../class/ExtendedClient');
const { spectate, checkPlayerStatus0 } = require('../../../../../targetchecker');
const { log } = require('../../../functions');

module.exports = {
    structure: new SlashCommandBuilder()
        .setName('spectate')
        .setDescription('Spectates a player and relays relevant data.')
        .addStringOption(option =>
            option.setName('ign')
                .setDescription('The IGN of the target')
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

        try {
            // Check if the player is online before spectating
            const isOnline = await checkPlayerStatus0(targetName);
            if (!isOnline) {
                await interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('Player Offline')
                            .setDescription(`\`\`\`${targetName} is not online, hence cannot be spectated.\`\`\``)
                            .setColor('#000000') // Color for error
                            .setFooter({ text: 'LOCATED BY DISLOCATION' })
                    ]
                });
                return;
            }

            // If the player is online, proceed to spectate
            const data = await spectate(targetName);
            
            // Check for specific error scenario
            if (data && data.error) {
                await interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('Spectating Error')
                            .setDescription(`\`\`\`${data.error}\`\`\``)
                            .setColor('#000000') // Red color for error
                            .setFooter({ text: 'LOCATED BY DISLOCATION' })
                    ]
                });
                return;
            }

            // If valid data is returned
            if (data && data.server && data.players.length > 0) {
                // Format players with their nick status
                const playersInfo = data.players.map(player => {
                    return `${player.name} - ${player.status}`;
                }).join('\n');

                await interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('Spectating Player')
                            .setDescription(`Spectating **${targetName}** and relaying data:`)
                            .addFields(
                                { name: "Server", value: `\`\`\`${data.server}\`\`\`` },
                                { name: "Players", value: `\`\`\`${playersInfo || 'No players found.'}\`\`\`` }
                            )
                            .setColor('#000000') // You can choose a color for success
                            .setFooter({ text: 'LOCATED BY DISLOCATION' })
                    ]
                });
            } else {
                // Handle the case where no valid data was returned
                await interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('No Data Found')
                            .setDescription(`\`\`\`No relevant data could be found for **${targetName}**.\`\`\``)
                            .setColor('#000000') // Choose a color for an error
                            .setFooter({ text: 'LOCATED BY DISLOCATION' })
                    ]
                });
            }
        } catch (error) {
            log(`Error during spectating: ${error}`, "err");
            await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle('Error Occurred')
                        .setDescription('\`\`\`[DEBUG] See console.\`\`\`')
                        .setColor('#000000') // Color for error
                        .setFooter({ text: 'LOCATED BY DISLOCATION' })
                ]
            });
        }
    }
};
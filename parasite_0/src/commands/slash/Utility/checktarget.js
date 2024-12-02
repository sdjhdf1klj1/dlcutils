const { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const ExtendedClient = require('../../../class/ExtendedClient');
const { log } = require('../../../functions');
const { checkPlayerStatus1 } = require('../../../../../targetchecker');

// Create a Map to store timestamps of command usage per guild
const cooldowns = new Map();
// Flag to indicate whether startChecks is currently running
let isChecking = false;

module.exports = {
  structure: new SlashCommandBuilder()
    .setName('checktarget')
    .setDescription('Check a given singular snipe target.')
    .addStringOption(option =>
        option.setName('ign')
            .setDescription('The IGN of the target')
            .setRequired(true)),
  options: {
    cooldown: 10000 // Cooldown in milliseconds (10 seconds in this case)
  },
  /**
   * @param {ExtendedClient} client 
   * @param {ChatInputCommandInteraction} interaction 
   */
  run: async (client, interaction) => {
    await interaction.deferReply();
    const requiredRoleId = '1310899409701306439';
    const targetName = interaction.options.getString('ign');

    log(`Received target name: ${targetName}`, 'info');

    // Check if user has the required role
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

    // ... [rest of the cooldown logic]

    try {
        if (typeof targetName !== 'string' || targetName.trim() === '') {
            throw new Error('Invalid target name provided.');
        }

        // Call checkPlayerStatus1 function and wait for it to complete
        const status = await checkPlayerStatus1(targetName);
        await interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setTitle('Checked Individual Target')
                    .setDescription('Snipe target status update.')
                    .addFields(
                        { name: 'Status', value: `\`\`\`${targetName} → ${status}\`\`\`` }
                    )
                    .setColor('#000000')
            ]
        });
    } catch (error) {
        log(`Error executing checkPlayerStatus1: ${error}`, "err");
        await interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setTitle('Error')
                    .setDescription('\`\`\`[DEBUG] An error occurred. Check console.\`\`\`')
                    .setColor('#000000')
            ]
        });
    } finally {
        // Mark the function as completed
        isChecking = false;
    }
  },
};

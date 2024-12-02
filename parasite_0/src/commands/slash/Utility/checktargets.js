const { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const ExtendedClient = require('../../../class/ExtendedClient');
const { startChecks } = require('../../../../../targetchecker');
const { log } = require('../../../functions');

// Create a Map to store timestamps of command usage per guild
const cooldowns = new Map();
// Flag to indicate whether startChecks is currently running
let isChecking = false;

module.exports = {
  structure: new SlashCommandBuilder()
    .setName('checktargets')
    .setDescription('Check all snipe targets.'),
  options: {
    cooldown: 30000 // Cooldown in milliseconds (30 seconds in this case)
  },
  /**
   * @param {ExtendedClient} client 
   * @param {ChatInputCommandInteraction} interaction 
   */
  run: async (client, interaction) => {
    await interaction.deferReply();
    const requiredRoleId = '1310899409701306439';

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
    
    const { guildId } = interaction;
    const cooldownDuration = module.exports.options.cooldown;

    // Check if command is on cooldown for this guild
    if (cooldowns.has(guildId)) {
      const lastTime = cooldowns.get(guildId);
      const currentTime = Date.now();
      const difference = currentTime - lastTime;
      if (difference < cooldownDuration) {
        const cooldownEmbed = new EmbedBuilder()
          .setTitle('Cooldown')
          .setDescription(`This command is on cooldown. Please wait ${(cooldownDuration - difference) / 1000} seconds.`)
          .setColor('#000000');
        
        await interaction.editReply({ embeds: [cooldownEmbed] });
        return;
      }
    }

    // Check if startChecks is already running
    if (isChecking) {
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setTitle('Already Checking')
            .setDescription('\`\`\`The check process is currently running. Please wait until it is finished.\`\`\`')
            .setColor('#000000')
        ]
      });
      return;
    }

    // Mark the function as running
    isChecking = true;
    cooldowns.set(guildId, Date.now());

    try {
      // Call startChecks function and wait for it to complete
      log(`Starting checks for all targets...`, 'info');
      await startChecks(client);
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setTitle('Snipelist')
            .setDescription('Snipe target status update.')
            .addFields(
              { name: 'Status', value: '```🟢 Checks started.```' }
            )
            .setColor('#000000')
        ]
      });
    } catch (error) {
      log(`Error executing startChecks: ${error}`, "err");
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
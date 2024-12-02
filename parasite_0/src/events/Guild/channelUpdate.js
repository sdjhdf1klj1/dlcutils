const { VoiceChannel } = require('discord.js');
const { log } = require('../../functions');

module.exports = {
    event: "channelUpdate",
    /**
     *
     * @param {ExtendedClient} client
     * @param {import('discord.js').Interaction} interaction
     * @returns
     */
    run: async (client, interaction) => {
        const oldChannel = interaction.old;
        const newChannel = interaction.new;
        
        // Check if the channel update is related to a voice channel
        if (!(oldChannel instanceof VoiceChannel) || !(newChannel instanceof VoiceChannel)) return;

        // Check if the user joined the "Grind VC" voice channel
        if (newChannel.name === "➕ Grind VC" && newChannel.members.size > oldChannel.members.size) {
            // Generate a unique 3-digit ID
            const id = generateUniqueId(); // ! doesnt work atm ill fix later !

            try {
                // Create the new grind vc.
                const createdChannel = await interaction.guild.channels.create(`VC-${id}`, {
                    type: 'voice',
                    parent: newChannel.parent, // Assuming "Create VC" is in the same category
                });

                // Move the user to the newly created voice channel
                const member = newChannel.members.first(); // Assuming only one member joined
                if (member) {
                    await member.voice.setChannel(createdChannel);
                }
            } catch (error) {
                log(`Error creating or moving to the new voice channel: ${error}`, 'err');
            }
        }
        // Check if the user joined the "General VC" voice channel
        if (newChannel.name === "➕ General VC" && newChannel.members.size > oldChannel.members.size) {
            // Generate a unique 3-digit ID
            const id = generateUniqueId();

            try {
                // Create the new general vc.
                const createdChannel = await interaction.guild.channels.create(`General-${id}`, {
                    type: 'voice',
                    parent: newChannel.parent, // Assuming "Create VC" is in the same category
                });

                // Move the user to the newly created voice channel
                const member = newChannel.members.first(); // Assuming only one member joined
                if (member) {
                    await member.voice.setChannel(createdChannel);
                }
            } catch (error) {
                log(`Error creating or moving to the new voice channel: ${error}`, 'err');
            }
        }
    }
}

// Function to generate a unique 3-digit ID
function generateUniqueId() {
    return Math.floor(100 + Math.random() * 900);
}
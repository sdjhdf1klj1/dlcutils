const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const ExtendedClient = require('../../../class/ExtendedClient');
const { log } = require('../../../functions');

// Paths to the JSON files
const statusFilePath = path.join(__dirname, '../../../locatorStatus.json');
const locatorListPath = path.join(__dirname, '../../../locatorList.json');

module.exports = {
    structure: new SlashCommandBuilder()
        .setName('locator')
        .setDescription('Toggles locator notifications.'),
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

        // Function to read the target list from locatorList.json
        function loadLocatorList() {
            if (fs.existsSync(locatorListPath)) {
                const data = fs.readFileSync(locatorListPath, 'utf-8');
                return JSON.parse(data); // Returns the array directly
            }
            return [];
        }

        // Read the saved statuses from the JSON file
        function loadSavedStatuses() {
            if (fs.existsSync(statusFilePath)) {
                return JSON.parse(fs.readFileSync(statusFilePath, 'utf-8'));
            }
            return {};
        }

        // Save the current statuses to the JSON file
        function saveStatuses(statuses) {
            fs.writeFileSync(statusFilePath, JSON.stringify(statuses, null, 2), 'utf-8');
        }

        // Function to get player data from the API
        async function getPlayerInformation(playerIGN) {
            const profileApiUrl = `https://stats.jartexnetwork.com/api/profile/${playerIGN}`;
            try {
                const response = await axios.get(profileApiUrl);
                return response.data;
            } catch (error) {
                log(`${error}`, 'err');
                return null;
            }
        }

        // Format last seen time to a human-readable string
        function formatLastSeen(lastSeenTimestamp) {
            const currentTime = Date.now();
            const timeDifference = currentTime - lastSeenTimestamp;
            const timeDifferenceSeconds = timeDifference / 1000;

            if (timeDifferenceSeconds < 60) {
                return `${Math.floor(timeDifferenceSeconds)} seconds ago`;
            } else if (timeDifferenceSeconds < 3600) {
                return `${Math.floor(timeDifferenceSeconds / 60)} minutes ago`;
            } else if (timeDifferenceSeconds < 86400) {
                return `${Math.floor(timeDifferenceSeconds / 3600)} hours ago`;
            } else {
                return `${Math.floor(timeDifferenceSeconds / 86400)} days ago`;
            }
        }

        // Determine player status based on last seen timestamp
        function getPlayerStatus(lastSeenTimestamp) {
            const currentTime = Date.now();
            const timeDifference = currentTime - lastSeenTimestamp;
            const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds
            const fifteenMinutes = 15 * 60 * 1000; // 15 minutes in milliseconds

            if (timeDifference <= fiveMinutes) {
                return '🟢 Online';
            } else if (timeDifference <= fifteenMinutes) {
                return '🟡 May have logged on recently';
            } else {
                return `🔴 Last Seen: ${formatLastSeen(lastSeenTimestamp)}`;
            }
        }

        // Check and update player statuses, send/embed if changes
        async function checkPlayerStatus(channel) {
            const savedStatuses = loadSavedStatuses(); // Load current statuses from JSON
            const newStatuses = {}; // Object to hold new statuses
            let statusChanged = false; // Track if any status changes

            const embed = new EmbedBuilder()
                .setTitle('Locator Update')
                .setColor('#000000')
                .setDescription('Auto-updating list of locator targets. (Used to track players based on account status API)')
                .setFooter({ text: 'LOCATED BY DISLOCATION' })
                .setTimestamp();

            let onlinePlayers = false;

            const playerIGNs = loadLocatorList(); // Load the target list from JSON

            for (const playerIGN of playerIGNs) {
                const playerData = await getPlayerInformation(playerIGN);

                if (playerData) {
                    const lastSeenTimestamp = playerData.lastSeen;
                    const status = getPlayerStatus(lastSeenTimestamp);

                    // If the status has changed from what is saved, mark it as changed
                    if (savedStatuses[playerIGN] !== status) {
                        newStatuses[playerIGN] = status;
                        statusChanged = true;
                    } else {
                        newStatuses[playerIGN] = savedStatuses[playerIGN]; // Preserve old status
                    }

                    // Add only online or recently logged-in players to the embed
                    if (status.startsWith('🟢') || status.startsWith('🟡')) { 
                        embed.addFields({ name: playerIGN, value: `\`\`\`${status}\`\`\``, inline: true });
                        onlinePlayers = true;
                    }
                }
            }

            // If statuses changed, update the JSON file and embed message
            if (statusChanged) {
                saveStatuses(newStatuses); // Save updated statuses to JSON
                if (onlinePlayers) {
                    const readOnlyChannel = client.channels.cache.get('1310899266969145375');
                    if (readOnlyChannel) {
                        await readOnlyChannel.messages.fetch().then(messages => {
                            readOnlyChannel.bulkDelete(messages); // Clear previous messages
                        });
                        await readOnlyChannel.send({
                            // content: '<@&1279050916850438235>', // Pings the locator role
                            embeds: [embed]
                        });
                    }
                }
            }
        }

        // Toggle logic: Start or stop tracking based on whether it's already running
        if (client.checkInterval) {
            // If tracking is active, stop it
            clearInterval(client.checkInterval);
            client.checkInterval = null;

            const stopEmbed = new EmbedBuilder()
                .setTitle('Locator')
                .setDescription('Notifications to update DLC on whether targets are online or not.')
                .addFields(
                    { name: 'Status', value: '```🔴 Toggled Off.```' }
                )
                .setFooter({ text: 'LOCATED BY DISLOCATION' })
                .setColor('#000000');

            await interaction.editReply({ embeds: [stopEmbed] });
            log("Locator toggled off.", "done");
        } else {
            // If tracking is not active, start it
            const startEmbed = new EmbedBuilder()
                .setTitle('Locator')
                .setDescription('Notifications to update DLC on whether targets are online or not.')
                .addFields(
                    { name: 'Status', value: '```🟢 Toggled On.```' }
                )
                .setFooter({ text: 'LOCATED BY DISLOCATION' })
                .setColor('#000000');

            await interaction.editReply({ embeds: [startEmbed] });
            log("Locator toggled on.", "done");

            // Initial check and JSON saving
            await checkPlayerStatus(interaction.channel);

            // Set an interval to check player status every 10 seconds
            client.checkInterval = setInterval(() => checkPlayerStatus(interaction.channel), 10 * 1000);
        }
    }
};
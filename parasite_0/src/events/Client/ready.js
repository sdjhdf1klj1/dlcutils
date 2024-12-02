const { EmbedBuilder } = require('discord.js');
const { log } = require("../../functions");
const ExtendedClient = require('../../class/ExtendedClient');
const https = require('https');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Define the path to the JSON files
const filePath = path.join(__dirname, 'previousTrophyCount.json');
const ws_filePath = path.join(__dirname, 'WS_data.json');
// Define an array of clan information
const clans = [
    { name: "bhoppers", updateChannel: '1310899089226858536' },
    { name: "encrypt", updateChannel: '1310899070797090826' }
    // Add more clans here as needed
];

const ws_UpdateChannel = '1310899039033753660';

const apiUrl = 'https://stats.jartexnetwork.com/api/leaderboards';
const params = {
  type: 'BEDWARS',
  stat: 'HIGHEST_WIN_STREAK',
  interval: 'WEEKLY',
  offset: 0,
  limit: 10
};

const modes = ['SOLO', 'DOUBLES', 'QUAD']; // Array of modes to track

let previousData = {
    SOLO: [],
    DOUBLES: [],
    QUAD: []
};

// Function to load data from a JSON file
function loadJsonData(filePath) {
    if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    }
    return {};
}

// Function to save data to a JSON file
function saveJsonData(filePath, data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

module.exports = {
    event: 'ready',
    once: true,
    /**
     * 
     * @param {ExtendedClient} _ 
     * @param {import('discord.js').Client<true>} client 
     * @returns 
     */
    run: async (_, client) => {
        try {
            // Function to make HTTPS GET request
            function httpsGet(url) {
                return new Promise((resolve, reject) => {
                    https.get(url, (res) => {
                        let data = '';
                        res.on('data', chunk => data += chunk);
                        res.on('end', () => resolve(JSON.parse(data)));
                    }).on('error', (e) => reject(e));
                });
            }

            // Function to fetch data for a clan
            async function getTrophyData(clan) {
                try {
                    const url = `https://stats.jartexnetwork.com/api/clans/${clan.name}`;
                    const data = await httpsGet(url);

                    // Load existing data
                    let clanData = loadJsonData(filePath);

                    // Calculate trophy difference
                    const previousTrophies = clanData[clan.name] || 0;
                    const currentTrophies = data.currentTrophies;
                    const trophyDifference = currentTrophies - previousTrophies;

                    // Only update if there is a difference and it's not 0
                    if (trophyDifference !== 0 && !(previousTrophies === 0 && currentTrophies === 0)) {
                        const formattedDifference = trophyDifference >= 0 ? `🔺 +${trophyDifference}` : `🔻 ${trophyDifference}`;

                        // Send an embed to the channel
                        const updateEmbed = new EmbedBuilder()
                            .setTitle(`Clan Trophies Update`)
                            .setDescription(`**${data.name}** [${data.tag}]`)
                            .addFields(
                                { name: 'Trophies', value: `\`\`\`${currentTrophies}\`\`\`` },
                                { name: 'Difference', value: `\`\`\`${formattedDifference}\`\`\`` }
                            )
                            .setFooter({ text: 'LOCATED BY DISLOCATION' });

                        if (trophyDifference >= 0) {
                            updateEmbed.setColor('#77DD77'); // pastel green
                        } else {
                            updateEmbed.setColor('#FF6961'); // pastel red
                        };

                        const channel = client.channels.cache.get(clan.updateChannel);
                        if (channel) {
                            await channel.send({
                                embeds: [updateEmbed]
                            });
                        }

                        // Update the clan data and save it to the JSON file
                        clanData[clan.name] = currentTrophies;
                        saveJsonData(filePath, clanData);
                    }
                } catch (error) {
                    log(`Error fetching clan information for ${clan.name}: ${error}`, 'err');
                }
            }

            // Function to fetch all trophy values on startup
            async function initializeClanData() {
                try {
                    // Load existing clan data
                    let clanData = loadJsonData(filePath);

                    // Use Promise.all to fetch data for all clans simultaneously
                    await Promise.all(clans.map(async (clan) => {
                        const url = `https://stats.jartexnetwork.com/api/clans/${clan.name}`;
                        const data = await httpsGet(url);

                        // Save the current trophy count to clanData
                        clanData[clan.name] = data.currentTrophies;
                    }));

                    // Save the initialized clan data to the JSON file
                    saveJsonData(filePath, clanData);
                    log("Initialized trophy data for all clans.", "info");
                } catch (error) {
                    log(`Error initializing clan data: ${error}`, 'err');
                }
            }
            
            function compareWinstreakData(data, mode) {
                if (data && data.entries && Array.isArray(data.entries)) {
                    const newData = data.entries.map((item) => ({ id: item.id, value: parseInt(item.value) }));
                    
                    if (previousData[mode].length === 0) {
                        previousData[mode] = newData;
                    } else {
                        const updatedData = newData.map((item) => {
                            const previousItem = previousData[mode].find((prevItem) => prevItem.id === item.id);
                            if (previousItem) {
                                if (item.value > previousItem.value) {
                                    const message = `Player ${item.id}'s winstreak in ${mode} has gone up from ${previousItem.value} → ${item.value} | ${params.interval}`;
                                    const wsEmbed = new EmbedBuilder()
                                        .setTitle(`Winstreak Update - ${mode}`)
                                        .setDescription(`A player has gained a winstreak.`)
                                        .addFields(
                                            { name: 'Player', value: `\`\`\`${item.id}\`\`\``},
                                            { name: 'Change', value: `\`\`\`${previousItem.value} → ${item.value}\`\`\`` },
                                            { name: 'Mode', value: `\`\`\`${mode}\`\`\`` },
                                            { name: 'Interval', value: `\`\`\`${params.interval}\`\`\`` }
                                        )
                                        .setColor('#000000')
                                        .setFooter({ text: 'LOCATED BY DISLOCATION' });
            
                                    log(message, 'info');
                                    
                                    const channel = client.channels.cache.get(ws_UpdateChannel);
                                    if (channel) {
                                        channel.send({ embeds: [wsEmbed] });
                                    }
                                }
                                return item;
                            } else {
                                return item;
                            }
                        });
                        previousData[mode] = updatedData;
                    }
                } else {
                    log('API response data is not in the expected format', "err");
                }
            }
            
            async function getWinstreakData() {
                try {
                    for (const mode of modes) {
                        const response = await axios.get(apiUrl, { params: { ...params, mode } });
                        const data = response.data;
                        
                        // Save the current data to a JSON file for the specific mode
                        fs.writeFileSync(`${ws_filePath}_${mode}.json`, JSON.stringify(data, null, 2));
                        // log(`Tracker data written to tracker_${mode}.json`, "info"); // DEBUG
                        
                        // Compare the winstreak data for this mode
                        compareWinstreakData(data, mode);
                    }
                } catch (error) {
                    log(`${error}`, 'err');
                }
            };

            setInterval(() => getWinstreakData(), 300000); // Fetch data every 5 minutes
            log("Winstreak Tracker Initialized.", "info");

            // Fetch initial trophy data on startup
            await initializeClanData();
            log("Trophy data fetching initiated.", "info");

            // Fetch trophy data for clans periodically
            setInterval(() => {
                clans.forEach(clan => {
                    getTrophyData(clan);
                });
            }, 120000); // Fetch every 2 minutes

        } catch (error) {
            log(`Error in ready event: ${error}`, 'err');
        }
    },
};

const mineflayer = require('mineflayer');
const { log } = require("./functions");

const serverAddress = 'proxy001.jartexsys.net';
const serverPort = 25565;
const c_username = 'eliminatorgaming';
const c_password = 'LeakMyPass6781';


const { EmbedBuilder } = require('discord.js');
const mongoose = require('mongoose');
const fs = require('fs');

const Snipelist = require('./schemas/SnipelistSchema');

const statusMapFile = 'status-map.json'; // JSON file to store statusMap data


let bot;
let initialized = false;

// Object to store Bedwars server and player data
let bedwarsData = {
  server: '',
  players: []
};

async function createBot() {
  bot = mineflayer.createBot({
    host: serverAddress,
    port: serverPort,
    username: c_username,
    version: '1.8.9',
    logErrors: true
  });

  bot.once('spawn', () => {
    log('Minecraft Client initialized.', 'done');
    bot.chat('/server bedwars');
    initialized = true;
  });

  bot.once('chat', (message) => {
    if (message.includes('session login')) {
      log('Session login detected.', 'info');
    } else {
      bot.chat('/login ' + c_password);
      setTimeout(() => {
        log('Logged into Jartex with username: ' + c_username, 'done');
      }, 1200);
    }
  });

  bot.on('error', (error) => {
    log(`Bot encountered an error: ${error}. Reconnecting in 10 seconds...`, 'error');
    setTimeout(() => {
      createBot(); // Recreate and reconnect the bot
    }, 10000);
  });

  // Capture chat messages and log only those that start with '[CHAT] JartexNetwork: You are connected to'
  bot.on('chat', (username, message) => {
    if (message.startsWith('You are connected to')) {
      log(`${message}`, "info");
    }
  });
}

async function reconnectBot() {
  setTimeout(() => {
    log("Reconnecting...", "info")
    bot.quit()
  }, 5000);
  createBot();
};

// Function to check player status using tab completion logic. for parasite1
async function checkPlayerStatus0(player) {
  if (!player || typeof player !== 'string') {
    log(`Received invalid player in checkPlayerStatus0: ${player}`, 'warn');
    return { isOnline: false, isBot: false }; // Return both values
  }

  const partialUsername = player.slice(0, -1);
  let isOnline = false;

  try {
    for (let attempt = 0; attempt < 3; attempt++) {
      const matches = await bot.tabComplete(`/f add ${partialUsername}`, false, false, 3000);
      if (matches.length > 0 && matches[0].startsWith(player)) {
        isOnline = true;
        break;
      }
    }
  } catch (err) {
    log(`Error in tab completion: ${err}`, 'err');
    isOnline = false;
    // reconnectBot();
  }

  return isOnline;
}

let retried = false;
async function spectate(player) {
  const checkBWConnection = (message) => {
    return message.includes("You are connected to BW") && !message.includes("BWLOBBY");
  };

  const checkTBConnection = (message) => {
    return message.includes("You are connected to TB") && !message.includes("TBLOBBY");
  };

  const retrySpectate = () => {
    setTimeout(() => {
      bot.chat(`/spectate ${player}`);
    }, 500); // Retry after 500ms
    retried = true;
    return;
  };

  if (!initialized) {
    setTimeout(() => {
      try {
        bot.chat(`/spectate ${player}`);
      } catch (err) {
        log(`${err}`, "err");
      }
    }, 500);
  } else {
    return new Promise((resolve, reject) => {
      try {
        bot.chat(`/spectate ${player}`);

        const chatListener = async (username, message) => {
          // Check for the specific error message that starts with "(!) The player "
          if (message.startsWith("(!) The player ")) {
            log('Player cannot be spectated. Skipping checks.', 'warn');
            // Resolve the promise with an error object
            resolve({ error: 'Player cannot be spectated.' });
            // Remove chat listener to avoid duplication
            bot.off('chat', chatListener);
            return;
          }

          // Check for TB server connection
          if (checkTBConnection(message)) {
            const serverName = message.match(/TB[\w-]+/)[0];
            bedwarsData.server = serverName;
            log(`Connected to TB server: ${serverName}`, 'info');

            // Simulate window open event listener (you can adjust this to your needs)
            log('Window opened for TB game.', 'info');

            setTimeout(() => {
              log('Window closed for TB game.', 'info');
              bot.chat('/leave');
              log('Performed /leave command.', 'info');
            }, 500); // Simulate a delay for the window close

            resolve({ error: 'Player is in a TB game.' });
            // Remove chat listener after handling
            bot.off('chat', chatListener);
            return;
          }

          // Normal Bedwars server connection check
          if (checkBWConnection(message)) {
            // Save the Bedwars server name
            const serverName = message.match(/BW[\w-]+/)[0];
            bedwarsData.server = serverName;
            log(`Connected to Bedwars server: ${serverName}`, 'info');

            // Get all players in the server
            bedwarsData.players = Object.keys(bot.players).filter(playerName => playerName !== 'linking128');
            log(`Players in the server: ${bedwarsData.players.join(', ')}`, 'info');

            // Perform /leave after collecting necessary data with a delay
            setTimeout(() => {
              bot.chat('/leave');
              log('Performed /leave command.', 'info');
            }, 500); // Wait 500ms before leaving

            // Create an object to store player nick status
            const playerNickStatus = {};

            // After leaving, perform nick checks
            setTimeout(async () => {
              for (const player of bedwarsData.players) {
                try {
                  const isOnline = await checkPlayerStatus0(player);
                  playerNickStatus[player] = isOnline ? 'not nicked' : 'nicked';
                  log(`Player ${player} is ${playerNickStatus[player]}`, 'info');
                } catch (err) {
                  log(`Error checking status of player ${player}: ${err}`, 'error');
                }
              }

              // Add the player nick status information to the bedwarsData object
              bedwarsData.players = bedwarsData.players.map(player => ({
                name: player,
                status: playerNickStatus[player]
              }));

              // Resolve the promise with bedwarsData
              resolve(bedwarsData);
            }, 500); // Wait a bit after leaving before checking nicks

            // Remove the chat listener to avoid duplication
            bot.off('chat', chatListener);
          } else {
            if (!retried) {
              log('Did not detect Bedwars connection. Retrying...', 'warn');
              retrySpectate();
            } else {
              resolve({ error: 'Player cannot be spectated. They are probably not in a bedwars game.' });
              retried = true;
              return;
            }
          }
        };

        // Set the chat listener
        bot.on('chat', chatListener);
      } catch (err) {
        log(`${err}`, 'err');
        // reconnectBot();
      }
    });
  }
}

try {
  createBot();
} catch (err) {
  log(`${err}`, 'err');
  // reconnectBot();
}

function saveStatusMap(statusMap) {
  fs.writeFile(statusMapFile, JSON.stringify(statusMap), (err) => {
    if (err) {
      log(`Error saving statusMap: ${err}`, 'err');
    }
  });
}

function loadStatusMap() {
  try {
    const data = fs.readFileSync(statusMapFile, 'utf8');
    if (data.trim() === '') {
      log('statusMap file is empty.', 'warn');
      return {}; // Provide a default value if the file is empty
    }
    return JSON.parse(data);
  } catch (err) {
    log(`Error reading statusMap: ${err}`, 'err');
    return {}; // Provide a default value in case of an error
  }
}

function createProgressBar(checked, total, barLength = 20) {
  const progress = checked / total;
  const filledBars = Math.round(progress * barLength);
  const emptyBars = barLength - filledBars;
  const bar = '█'.repeat(filledBars) + '░'.repeat(emptyBars);
  const percentage = Math.round(progress * 100);
  return `${bar} ${percentage}%`;
}

// for parasite0
async function checkPlayerStatus1(player) {
  // Validate the player input
  if (!player || typeof player !== 'string') {
      log(`Received invalid player in checkPlayerStatus1: ${player}`, "err");
      return '🔴 Offline'; // Return default value for invalid input
  }

  const partialUsername = player.slice(0, -1); // Remove the last character from the username
  let isOnline = false;

  try {
      // Attempt to tab complete 3 times
      for (let attempt = 0; attempt < 3; attempt++) {
          const matches = await bot.tabComplete(`/f add ${partialUsername}`, false, false, 3000);
          log(`Attempt ${attempt + 1}: Matches found: ${matches.length}`, "done");

          if (matches.length > 0 && matches[0].startsWith(player)) {
              isOnline = true;
              log(`Player ${player} is online.`, "info");
              break;
          }
      }
  } catch (err) {
      log(`Error in tab completion: ${err}`, 'err'); // Log the error
      isOnline = false;
  }

  return isOnline ? '🟢 Online' : '🔴 Offline';
}

async function startChecks(client) {
  try {
    mongoose.connect('mongodb://127.0.0.1:27017/', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    mongoose.connection.once('open', async () => {
      try {
        log('Connected to MongoDB.', 'done');

        const allTargets = await Snipelist.find({}, 'name');
        const targetNames = allTargets.map(target => target.name); // Ensure this returns an array of strings

        log(`Fetched targets: ${JSON.stringify(allTargets)}`, 'info');
        log(`Extracted target names: ${JSON.stringify(targetNames)}`, 'info'); // Log extracted names

        mongoose.connection.close();

        const chunkedTargets = targetNames.reduce((resultArray, item, index) => {
          const chunkIndex = Math.floor(index / 400);

          if (!resultArray[chunkIndex]) {
            resultArray[chunkIndex] = [];
          }

          resultArray[chunkIndex].push(item);
          return resultArray;
        }, []);

        setTimeout(async () => {
          const statusMap = loadStatusMap();

          log('Checking snipe targets...', 'info');
          for (const chunk of chunkedTargets) {
            const readOnlyChannel = client.channels.cache.get('1310898927553220649');
            const chunkEmbed = new EmbedBuilder();
            chunkEmbed.setTitle('Snipe Targets Status');
            chunkEmbed.setDescription('Checking status of snipe targets...');
            chunkEmbed.setFooter({ text: 'LOCATED BY DISLOCATION' });
            chunkEmbed.setColor('#000000');
            chunkEmbed.setTimestamp();

            let totalChecked = 0;

            if (readOnlyChannel) {
              await readOnlyChannel.messages.fetch().then(messages => {
                readOnlyChannel.bulkDelete(messages);
              });
            }
            const readOnlyMessageRef = await readOnlyChannel.send({ embeds: [chunkEmbed] });

            let playersText = '';
            for (let index = 0; index < chunk.length; index++) {
              const player = chunk[index];

              // Validate player name
              if (typeof player !== 'string') {
                log(`Received invalid player: ${JSON.stringify(player)}`, 'err');
                continue; // Skip if player is not a string
              }

              log(`Checking ${player}...`, 'info');

              const status = await checkPlayerStatus1(player); // Pass only the player name
              statusMap[player] = status;
              saveStatusMap(statusMap);

              totalChecked++;
              const progressBar = createProgressBar(totalChecked, chunk.length);

              playersText += `\`\`\`${player} → ${statusMap[player]}\n\`\`\`` || '```Status check failed.```\n';
              chunkEmbed.setDescription(`Checking online status of snipe targets...\n\n${progressBar}`);

              if ((index + 1) % 16 === 0 || index === chunk.length - 1) {
                chunkEmbed.addFields({ name: '⌘', value: playersText, inline: true });
                playersText = ''; // Reset text for the next group
              }
              await readOnlyMessageRef.edit({ embeds: [chunkEmbed] });
            }

            log('Check sequence completed.', 'done');

            // Remove progress bar before sending the final embed
            chunkEmbed.setDescription('Snipe targets status check completed.');

            if (readOnlyMessageRef) {
              await readOnlyMessageRef.edit({ embeds: [chunkEmbed] });
            } else {
              if (readOnlyChannel) {
                await readOnlyChannel.send({ embeds: [chunkEmbed] })
                  .then(message => {
                    readOnlyMessageRef = message; // Update the reference to the new message
                  })
                  .catch(error => {
                    log(`Error sending message: ${error}`, 'err');
                  });
              } else {
                log('ReadOnly channel not found.', 'err');
              }
            }
          }
        });
      } catch (error) {
        log(`${error}`, "err");
        reconnectBot();
      }
    });
  } catch (error) {
    log(`${error}`, "err");
    reconnectBot();
  }
}

console.log("targetchecker active");
module.exports = { 
  spectate,
  checkPlayerStatus0,
  checkPlayerStatus1,
  startChecks
};
const mineflayer = require('mineflayer');
const fs = require('fs');

// Load the locator list from locatorlist.json
const locatorList = JSON.parse(fs.readFileSync('locatorlist.json', 'utf8'));

// Array of bot accounts with target slot information
const botAccounts = [
  { username: 'aemoura714', password: 'password123', targetSlot: 12 },
  { username: 'rahjmia67', password: 'Password123', targetSlot: 13 },
  { username: 'cambora6621', password: 'Password123', targetSlot: 14 }
];

// Function to create and manage a bot
function createBot(account) {
  const bot = mineflayer.createBot({
    host: 'proxy001.jartexsys.net', // Server IP
    username: account.username,
    password: account.password,
    version: false // Automatically detect the version
  });

  bot.on('spawn', () => {
    console.log(`${account.username} has spawned`);

    // Send the login command
    bot.chat('/login Password123');

      // Switch to hotbar slot 8 and right-click to open the window
      bot.setQuickBarSlot(8);
      bot.activateItem();

      // Wait a moment to ensure the window opens
      setTimeout(() => {
        if (bot.currentWindow) {
          const window = bot.currentWindow;

          // Find and log the slot number of the gold_block
          const targetSlot = account.targetSlot;
          const goldBlock = window.slots[targetSlot];

          if (goldBlock && goldBlock.name === 'gold_block') {
            console.log(`${account.username}: Found gold_block in slot ${targetSlot}. Moving to hotbar slot 2.`);

            // Move the gold block to hotbar slot 2
            bot.transfer({
              window: window,
              itemType: goldBlock.type,
              metadata: goldBlock.metadata,
              count: goldBlock.count,
              sourceStart: goldBlock.slot,
              sourceEnd: goldBlock.slot + 1,
              destStart: 2, // Hotbar slot 2
              destEnd: 3
            }, (err) => {
              if (err) {
                console.error(`${account.username}: Failed to move gold_block -`, err);
              } else {
                console.log(`${account.username}: Successfully moved gold_block to hotbar slot 2.`);
                console.log(`${account.username}: Lobby connection established`);
              }

              // Start checking for players after establishing the connection
              startCheckingForPlayers(bot, account.username);
            });
          } else {
            console.log(`${account.username}: The target slot ${targetSlot} does not contain a gold_block.`);
          }
        } else {
          console.log(`${account.username}: No window is currently open.`);
        }
      }, 3000); // Delay to ensure the window has time to open
  });

  bot.on('end', () => {
    // console.log(`${account.username} has been disconnected. Reconnecting...`);
    setTimeout(() => createBot(account), 5000); // Reconnect after 5 seconds
  });

  bot.on('error', (err) => {
    console.error(`Error for ${account.username}:`, err);
  });
}

// Function to start checking for players from the locator list
function startCheckingForPlayers(bot, username) {
  setInterval(() => {
    locatorList.forEach((playerName) => {
      if (bot.players[playerName]) {
        console.log(`${username}: Player ${playerName} is ONLINE`);
      }
    });
  }, 5000); // Check every 5 seconds
}

// Create a bot for each account
botAccounts.forEach(createBot);
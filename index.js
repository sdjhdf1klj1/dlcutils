const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const { spawn } = require('child_process');
const path = require('path');
require('dotenv').config();
const { log } = require("./functions");

// Create a new Discord client
const client = new Client({ 
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
    presence: {
        activities: [{
            name: 'DLC',
            type: 4,
            state: 'DOG BELOW ME'
        }]
    }
});

let bot0Process;
let bot1Process;

client.once('ready', () => {
    log(`Logged in as ${client.user.tag}!`, 'done');
});

client.on('messageCreate', async message => {
    // Ignore messages from bots and DMs
    if (message.author.bot || !message.guild) return;

    // Command prefix
    const prefix = '!';

    // Check if the message starts with the prefix
    if (!message.content.startsWith(prefix)) return;

    // Extract command and arguments
    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === 'root') {

        const requiredRoleId = '1310897863886245898'; // bot admin role
        
        if (!message.member.roles.cache.has(requiredRoleId)) {
            await message.reply({
                ephemeral: true,
                embeds: [
                    new EmbedBuilder()
                        .setTitle('Access Denied.')
                        .setDescription('You do not have permission to use this command.')
                        .setColor('#000000')
                ].map(embed => embed.toJSON()) // Convert EmbedBuilder to JSON
            });
            return;
        }
        
        const action = args[0]; // Assuming the action is provided as the first argument

        try {
            if (action === 'start') {
                const initializingMessage = await message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('ROOT')
                            .setDescription('```🟡 Threads are initializing...```')
                            .setColor('#000000')
                            .setFooter({ text: 'Wait a bit before using the command again to avoid errors.' })
                    ]
                });
                
                let bot0started = false;
                let bot1started = false;

                if (!bot0Process && !bot1Process) {
                    // Start (parasite_0)
                    bot0Process = spawn('node', ['index.js'], { cwd: path.join(__dirname, '/parasite_0/src') });
                    log("spawning bot0", 'info');

                    bot0started = true;

                    bot0Process.on('error', (err) => {
                        log(`Bot 0 failed to start: ${err.message}`, 'err');
                    });

                    bot0Process.stdout.on('data', (data) => {
                        log(`Bot 0: ${data}`);
                    });

                    bot0Process.stderr.on('data', (data) => {
                        log(`Bot 0 error: ${data}`, 'err');
                    });

                    bot0Process.on('close', (code) => {
                        log(`Bot 0 process exited with code ${code}`, 'warn');
                        bot0Process = null;
                    });

                    setTimeout(async() => {
                        log("Waiting for 5 seconds before starting next thread...", "info");
                        
                        // Start (parasite_1)
                        bot1Process = spawn('node', ['index.js'], { cwd: path.join(__dirname, '/parasite_1/src') });
                        log("spawning bot1", 'info');

                        bot1started = true;

                        bot1Process.on('error', (err) => {
                            log(`Bot 1 failed to start: ${err.message}`, 'err');
                        });

                        bot1Process.stdout.on('data', (data) => {
                            log(`Bot 1: ${data}`);
                        });

                        bot1Process.stderr.on('data', (data) => {
                            log(`Bot 1 error: ${data}`, 'err');
                        });

                        bot1Process.on('close', (code) => {
                            log(`Bot 1 process exited with code ${code}`, 'warn');
                            bot1Process = null;
                        });

                        // After starting bot1, edit the initializing message
                        await initializingMessage.edit({
                            embeds: [
                                new EmbedBuilder()
                                    .setTitle('ROOT')
                                    .setDescription('```🟢 Threads initialized.```')
                                    .setColor('#000000')
                            ]
                        });

                    }, 5000);
                } else {
                    await message.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setTitle('ROOT')
                                .setDescription('```🟢 Threads already initialized.```')
                                .setColor('#000000')
                        ]
                    });
                }
            } else if (action === 'stop') {
                if (bot0Process) {
                    bot0Process.kill();
                    bot0Process = null;
                }

                if (bot1Process) {
                    bot1Process.kill();
                    bot1Process = null;
                }

                await message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('ROOT')
                            .setDescription('```🔴 Threads halted.```')
                            .setColor('#000000')
                            .setFooter({ text: 'Wait a bit before using the command again to avoid errors.' })
                    ]
                });
            } else {
                await message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('ROOT')
                            .setDescription('```Invalid action. Use "start" or "stop".```')
                            .setColor('#000000')
                            .setFooter({ text: 'Wait a bit before using the command again to avoid errors.' })
                    ]
                });
            }
        } catch (err) {
            log(`[FATAL] Error occurred in root: ${err}`, 'err');
            await message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle('ROOT')
                        .setDescription('```[DEBUG] Error occurred. Check console.```')
                        .setColor('#000000')
                        .setFooter({ text: 'Wait a bit before using the command again to avoid errors.' })
                ]
            });
        }
    }
});

// Login the bot
client.login(process.env.CLIENT_TOKEN);
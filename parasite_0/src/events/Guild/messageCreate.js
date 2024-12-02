const { Message } = require("discord.js");
const config = require("../../config");
const { log } = require("../../functions");
const ExtendedClient = require("../../class/ExtendedClient");

const cooldown = new Map();
const exemptedRoles = ['1258918301644361900', '1258920043228565524']; // , 'ROLE_ID_2']; // Replace with your role IDs

module.exports = {
    event: "messageCreate",
    /**
     *
     * @param {ExtendedClient} client
     * @param {Message<true>} message
     * @returns
     */
    run: async (client, message) => {
        // Check if the message author has any of the exempted roles
        const authorHasExemptedRole = message.member && message.member.roles.cache.some(role => exemptedRoles.includes(role.id));
        
        if (authorHasExemptedRole) {
            return; // Exit the function if the author is exempted
        }

        // Existing cooldown logic
        if (message.content.includes('@everyone')) {
            if (cooldown.has(message.author.id)) {
                const lastSent = cooldown.get(message.author.id);
                const timeDiff = Date.now() - lastSent;
                const cooldownTime = 5000; // Cooldown time in milliseconds (5 seconds in this case)

                if (timeDiff < cooldownTime) {
                    return;
                }
            }

            message.reply('nice try lil bro.');
            cooldown.set(message.author.id, Date.now());
            setTimeout(() => {
                cooldown.delete(message.author.id);
            }, 1000);
        }
    },
};
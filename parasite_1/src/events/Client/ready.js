const { EmbedBuilder } = require('discord.js');
const { log } = require("../../functions");
const ExtendedClient = require('../../class/ExtendedClient');
const https = require('https');
const fs = require('fs');
const path = require('path');

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
            // later...
        } catch (error) {
            log(`Error in ready event: ${error}`, 'err');
        }
    },
};

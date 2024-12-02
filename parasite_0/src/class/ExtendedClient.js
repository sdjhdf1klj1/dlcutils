const { Client, Partials, Collection, GatewayIntentBits } = require("discord.js");
const config = require('../config');
const commands = require("../handlers/commands");
const events = require("../handlers/events");
const deploy = require("../handlers/deploy");
const mongoose = require("../handlers/mongoose");

module.exports = class extends Client {
    collection = {
        interactioncommands: new Collection(),
        prefixcommands: new Collection(),
        aliases: new Collection(),
    };
    applicationcommandsArray = [];

    constructor() {
        super({
            intents: [Object.keys(GatewayIntentBits)],
            partials: [Object.keys(Partials)],
            presence: {
                activities: [{
                    name: 'DLC',
                    type: 4,
                    state: 'LOCATED BY DISLOCATION'
                }]
            }
        });
    };

    start = async () => {
        commands(this);
        events(this);

        if (config.handler.mongodb.toggle) mongoose();

        await this.login("MTI1ODkzNTYyMDE2ODk3NDMzNw.GF8eKj.e_CqJgE999Ho33ay8T3H8oBo4-aU-rNO_8yrHw" || config.client.token);

        if (config.handler.deploy) deploy(this, config);
    };
};
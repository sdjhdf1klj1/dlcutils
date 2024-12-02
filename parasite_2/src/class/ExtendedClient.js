const { Client, Partials, Collection, GatewayIntentBits } = require("discord.js");
const config = require('../config');
const commands = require("../handlers/commands");
const events = require("../handlers/events");
const deploy = require("../handlers/deploy");

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
                    state: 'DOG ABOVE ME'
                }]
            }
        });
    };

    start = async () => {
        commands(this);
        events(this);

        await this.login("MTI5OTI0MDU0OTM5NTQ2ODM1MA.GIuURy.G8nJlc7KmX-KfUQrwScMLzfpFtgpaepKAiy7yo" || config.client.token);

        if (config.handler.deploy) deploy(this, config);
    };
};
module.exports = {
    client: {
        token: "Your Bot token (USE .env FOR SAFETY)",
        id: "Your Bot ID (USE .env FOR SAFETY)",
    },
    handler: {
        prefix: "?",
        deploy: true,
        commands: {
            prefix: false,
            slash: true,
            user: true,
            message: true,
        },
        mongodb: {
            enabled: false,
            uri: "Your MongoDB URI string (USE .env FOR SAFETY)"
        },
    },
    users: {
        developers: ["765840607699533834", "1265378524726824991"],
    },
    development: { 
        enabled: false,
        guild: "Enter your guild ID here or you can use .env",
    }, 
    messageSettings: {
        developerMessage: "You are not authorized to use this command nigga.",
        cooldownMessage: "Slow down nigga. You're too fast to use this command.",
        globalCooldownMessage: "Slow down nigga. This command is on a global cooldown.",
        notHasPermissionMessage: "You do not have the permission to use this command nigga.",
        notHasPermissionComponent: "You do not have the permission to use this component nigga.",
        missingDevIDsMessage: "This is a developer only command, Access Denied."
    }
};

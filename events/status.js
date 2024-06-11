const client = require('../index')
const { ActivityType } = require("discord.js");

client.on("ready", () => {
    const messages = [
        `👥${client.users.cache.size} USUÁRIOS`,
        `❤ BLACK NETWORK`
    ]

    var position = 0;

    setInterval(() => client.user.setPresence({
        activities: [{
            name: `${messages[position++ % messages.length]}`,
            type: ActivityType.Watching,
            url: 'https://www.youtube.com/watch?v=a3DxVqMwUAQ'
        }]
    }), 1000 * 10);

    client.user.setStatus("online");
});
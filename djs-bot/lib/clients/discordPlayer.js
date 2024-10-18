const { Player, QueryType } = require('discord-player');

module.exports = (client) => {
    // Initialize discord-player
    const player = new Player(client, {
        ytdlOptions: {
            quality: 'highestaudio',
            highWaterMark: 1 << 25
        }
    });

    // Event listeners for the player
    player.on('error', (queue, error) => {
        client.error(`Player Error: ${error.message}`);
    });

    player.on('connectionError', (queue, error) => {
        client.error(`Connection Error: ${error.message}`);
    });

    return {
        player
    };
};

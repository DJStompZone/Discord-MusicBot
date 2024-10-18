/**
 * Get the discord-player instance
 * @param {import("../lib/Bot")} client
 */
module.exports = async (client) => {
    return client.manager.Engine.player;
};

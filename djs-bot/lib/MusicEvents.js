"use strict";

const colors = require("colors");
const { getClient } = require("../bot");
const { Player } = require('discord-player');

const socket = require("../api/v1/dist/ws/eventsHandler");
const {
	updateControlMessage,
	updateNowPlaying,
	runIfNotControlChannel,
} = require("../util/controlChannel");
const { trackStartedEmbed } = require("../util/embeds");

// entries in this map should be removed when bot disconnected from vc
const progressUpdater = new Map();

function stopProgressUpdater(guildId) {
    const prevInterval = progressUpdater.get(guildId);

    if (prevInterval) {
        clearInterval(prevInterval);
        progressUpdater.delete(guildId);
    }
}

function updateProgress(queue, track) {
    const guildId = queue.guild.id;

    stopProgressUpdater(guildId);

    progressUpdater.set(
        guildId,
        setInterval(() => {
            if (!queue.connection || queue.connection.paused) return;

            const currentPosition = queue.getPlayerTimestamp().current;

            socket.handleProgressUpdate({
                guildId: guildId,
                position: currentPosition,
            });
        }, 1000)
    );
}


function handleVoiceStateUpdate(oldState, newState) {
	// This is no longer needed, discord-player handles this directly
	console.warn("Voice state update event is deprecated");
	return;
}

/**
 * Handles the 'trackStart' discord-player event 
 * @param {import('discord-player').Queue} queue
 */
function handleStop(queue) {
    stopProgressUpdater(queue.guild.id);
    socket.handleStop({ guildId: queue.guild.id });
}

/**
 * Handles the 'trackStart' discord-player event 
 * @param {import('discord-player').Queue} queue
 */
function handleQueueUpdate(queue) {
    socket.handleQueueUpdate({ guildId: queue.guild.id, queue });
}

/**
 * Sends the track history to the appropriate channel if the history exists.
 *
 * @param {import('discord-player').Queue} queue
 * @param {import('discord-player').Track} track
 */
function sendTrackHistory(queue, track) {
    const history = queue.history;
    if (!history) return;

    runIfNotControlChannel(queue, () => {
        const client = getClient();

        client.channels.cache
            .get(queue.metadata.channel.id)
            ?.send({
                embeds: [trackStartedEmbed({ track, queue, title: 'Played track' })],
            })
            .catch(client.warn);
    });
}

/**
 * Handles the 'trackStart' discord-player event 
 * @param {import('discord-player').Queue} queue
 * @param {import('discord-player').Track} track
 */
function handleTrackStart(queue, track) {
    const client = getClient();

    const playedTracks = client.playedTracks;

    if (playedTracks.length >= 25) playedTracks.shift();

    if (!playedTracks.includes(track)) playedTracks.push(track);

    updateNowPlaying(queue, track);
    updateControlMessage(queue.guild.id, track);
    sendTrackHistory(queue, track);

    socket.handleTrackStart({ queue, track });
    socket.handlePause({ guildId: queue.guild.id, state: queue.connection.paused });
    handleQueueUpdate(queue);

    updateProgress(queue, track);

    client.warn(`Player: ${queue.guild.id} | Track has started playing [${track.title}]`);
}

/**
 * Handles the 'pause' discord-player event
 * @param {import('discord-player').Queue} queue
 */
function handlePause(queue) {
    socket.handlePause({ guildId: queue.guild.id, state: queue.connection.paused });
}


module.exports = {
    handleTrackStart,
    handleQueueUpdate,
    handleStop,
    updateProgress,
    stopProgressUpdater,
    handleVoiceStateUpdate,
    handlePause,
};

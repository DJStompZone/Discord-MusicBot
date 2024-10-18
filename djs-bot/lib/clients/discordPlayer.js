require('dotenv').config();

const { Player, QueryType } = require('discord-player');
const { YoutubeiExtractor } = require('discord-player-youtubei');



const {
    SpotifyExtractor,
    AppleMusicExtractor,
    SoundCloudExtractor,
    AttachmentExtractor
} = require('@discord-player/extractor');

module.exports = (client) => {
    // Initialize discord-player

    const player = new Player(client, {
        ytdlOptions: {
            requestOptions: {
                headers: {
                    cookie: client?.ytcookies ?? ''
                }
            }
        }
    });

    // Register the Youtube extractor
    player.extractors.register(YoutubeiExtractor, {
        authentication: process.env.YOUTUBE_AUTH,
    });
    console.log('YouTubeI extractor registered with cookies!');

    // Register the Soundcloud extractor
    player.extractors.register(SoundCloudExtractor);
    console.log('SoundCloud extractor registered!');

    // Register the Spotify extractor
    player.extractors.register(SpotifyExtractor);
    console.log('Spotify extractor registered!');

    // Register the Apple Music extractor
    player.extractors.register(AppleMusicExtractor);
    console.log('Apple Music extractor registered!');

    // Register the AttachmentExtractor
    player.extractors.register(AttachmentExtractor);
    console.log('Attachment extractor registered!');

    player.events.on('audioTrackAdd', (queue, song) => {
        queue.metadata.channel.send(`🎶 | Song **${song.title}** added to the queue!`);
    });

    player.events.on('playerStart', (queue, track) => {
        queue.metadata.channel.send(`▶ | Started playing: **${track.title}**!`);
    });

    player.events.on('audioTracksAdd', (queue, track) => {
        queue.metadata.channel.send(`🎶 | Tracks have been queued!`);
    });

    player.events.on('disconnect', queue => {
        queue.metadata.channel.send('❌ | I was manually disconnected from the voice channel, clearing queue!');
    });

    player.events.on('emptyChannel', queue => {
        queue.metadata.channel.send('❌ | Nobody is in the voice channel, leaving...');
    });

    player.events.on('emptyQueue', queue => {
        queue.metadata.channel.send('✅ | Queue finished!');
        // Delete queue and disconnect from voice channel
        queue.delete();
    });

    player.events.on('error', (queue, error) => {
        console.log(`[${queue.guild.name}] Error emitted from the connection: ${error.message}`);
    });

    // For debugging
    player.events.on('debug', async (message) => {
        console.log(`General player debug event: ${message}`);
    });

    player.events.on('playerError', (queue, error) => {
        console.log(`Player error event: ${error.message}`);
        console.log(error);
    });


    player.events.on('connectionError', (queue, error) => {
        console.error(`Connection Error in ${queue.guild.name}: ${error.message}`);
        queue.metadata.channel.send(`❌ | Connection error: ${error.message}`);
    });


    return {
        player
    };
};

import { Client as DJSClient } from 'discord.js';
import { Client as ErisClient } from 'eris';
import { EventsToTrack, LibType, ErrorCodes, ApiEndpoints } from '../utils/types';

/**
 * @class DiscordAnalytics
 * @description The main class for the DiscordAnalytics library.
 * @param {DJSClient | ErisClient} client The Discord client to track.
 * @param {LibType} type The type of client to track.
 * @param {EventsToTrack} eventsToTrack The events to track.
 * @example
 * const DiscordAnalytics, { LibType } = require('discord-analytics');
 * const { Client } = require('discord.js');
 * const client = new Client();
 * const da = new DiscordAnalytics(client, LibType.DJS, {
 *   trackInteractions: true,
 *   trackMessageCreate: true,
 *   trackMessageDelete: true,
 *   trackGuildDelete: true,
 *   trackGuildCreate: true,
 *   trackUserCount: true
 * }, "YOUR_API_TOKEN");
 * client.on('ready', () => {
 *   da.trackEvents();
 * });
 * client.login('token');
 */
export default class DiscordAnalytics {
  private readonly _client: DJSClient | ErisClient;
  private _eventsToTrack: EventsToTrack;
  private _apiToken: string;

  constructor(client: DJSClient | ErisClient, type: LibType, eventsToTrack: EventsToTrack, apiToken: string) {
    if (type === LibType.DJS && client instanceof DJSClient) this._client = client;
    if (type === LibType.ERIS && client instanceof ErisClient) this._client = client;
    else throw new Error(ErrorCodes.INVALID_CLIENT_TYPE);

    this._eventsToTrack = eventsToTrack;
    this._apiToken = apiToken;
  }

  /**
   * @description The client to track.
   * @type {DJSClient | ErisClient}
   * @readonly
   */
  public get client(): DJSClient | ErisClient {
      return this._client;
  }

  /**
   * @description Track the events specified in the constructor options.
   * @returns {void}
   */
  public trackEvents(): void {
    if (this._client instanceof DJSClient) {
      if (!this._client.isReady()) throw new Error(ErrorCodes.CLIENT_NOT_READY);
      else this.trackDJSEvents();
    }
    else if (this._client instanceof ErisClient) {
      if (!this._client.ready) throw new Error(ErrorCodes.CLIENT_NOT_READY);
      else this.trackErisEvents();
    }
    else throw new Error(ErrorCodes.INVALID_CLIENT_TYPE);
  }

  private trackDJSEvents(): void {
    if (this._client instanceof DJSClient) {
      const client = this._client as DJSClient;
      if (this._eventsToTrack.trackInteractions) {
        client.on('interactionCreate', (interaction) => {
          fetch(`${ApiEndpoints.BASE_URL}${ApiEndpoints.TRACK_URL}${ApiEndpoints.ROUTES.INTERACTIONS}`, {
            method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': this._apiToken
              },
              body: JSON.stringify({
                type: interaction.type,
                userLocale: this._eventsToTrack.trackUserLanguage ? interaction.locale : null,
                guildLocale: this._eventsToTrack.trackGuildsLocale ? interaction.guild.preferredLocale : null,
                includedInfos: {
                  userCount: this._eventsToTrack.trackUserCount ? client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0) : null,
                  guildCount: this._eventsToTrack.trackGuilds ? client.guilds.cache.size : null
                }
              })
          }).then(r => {
            if (r.status !== 200) throw new Error(ErrorCodes.INVALID_RESPONSE);
          });
        });
      }
      if (this._eventsToTrack.trackGuilds) {
        client.on("guildCreate", (guild) => {
          fetch(`${ApiEndpoints.BASE_URL}${ApiEndpoints.TRACK_URL}${ApiEndpoints.ROUTES.GUILDS}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': this._apiToken
            },
            body: JSON.stringify({
              guildLocale: this._eventsToTrack.trackGuildsLocale ? guild.preferredLocale : null,
              includedInfos: {
                userCount: this._eventsToTrack.trackUserCount ? client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0) : null,
                guildCount: this._eventsToTrack.trackGuilds ? client.guilds.cache.size : null
              }
            })
          }).then(r => {
            if (r.status !== 200) throw new Error(ErrorCodes.INVALID_RESPONSE);
          });
        })

        client.on("guildDelete", (guild) => {
          fetch(`${ApiEndpoints.BASE_URL}${ApiEndpoints.TRACK_URL}${ApiEndpoints.ROUTES.GUILDS}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': this._apiToken
            },
            body: JSON.stringify({
              guildLocale: this._eventsToTrack.trackGuildsLocale ? guild.preferredLocale : null,
              includedInfos: {
                userCount: this._eventsToTrack.trackUserCount ? client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0) : null,
                guildCount: this._eventsToTrack.trackGuilds ? client.guilds.cache.size : null
              }
            })
          }).then(r => {
            if (r.status !== 200) throw new Error(ErrorCodes.INVALID_RESPONSE);
          });
        })
      }
    }
  }

  private trackErisEvents(): void {
    console.log('Eris events are not yet supported.');
  }
}
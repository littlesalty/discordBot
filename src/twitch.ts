import { ApiClient, HelixClip } from 'twitch';
import { StaticAuthProvider } from 'twitch-auth';
import { env } from './config';
import { daxios } from './daxios';

type TwitchToken = {
    access_token: string,
    expires_in: number,
    token_type: 'bearer'
}

type TwitchClipFilters = {
    startDate?: string,
    endDate?: string,
    limit?: number
}

export class TwitchService {
    accessToken?: string
    clientId: string
    apiClient?: ApiClient
    constructor() {
        this.clientId = env?.TWITCH_CLIENT_ID ?? '';
        this.createOrUpdateApiClient()
    }
    /**
     * Gets new twitch token
     * @returns Promise of TwitchToken Object
     */
    createOrUpdateToken = async (): Promise<void> => {
        console.log("creating or updating twitch api token")

        const url = "https://id.twitch.tv/oauth2/token"
        const body = {
            client_id: env?.TWITCH_CLIENT_ID,
            client_secret: env?.TWITCH_API_SECRET,
            grant_type: 'client_credentials'
        }

        const request = await daxios.post<TwitchToken>(url, body, { headers: { "Content-Type": " application/json" } })

        this.accessToken = request.data.access_token
    }

    createOrUpdateApiClient = async () => {
        await this.createOrUpdateToken()
        console.log("creating or updating twitch api client")

        const authProvider = new StaticAuthProvider(this.clientId, this.accessToken);
        this.apiClient = new ApiClient({ authProvider });
    }
    /**
     * Get twitch clips from the api client (defaults to the last 20 clips)
     * @param filters can contain startDate (ISOString), endDate(ISOString) and limit.
     */
    getTwitchClips = async (filters?: TwitchClipFilters): Promise<Array<HelixClip>> => {
        const broadcasterId = env?.BROADCASTER_ID ?? ''
        let data: Array<HelixClip> | undefined = []
        try {
            const result = await this.apiClient?.helix.clips.getClipsForBroadcaster(broadcasterId, filters)
            data = result?.data

        }
        catch (err) {
            console.error("error whilte getting twitch clips", err)

            this.createOrUpdateApiClient()
            const result = await this.apiClient?.helix.clips.getClipsForBroadcaster(broadcasterId, filters)
            data = result?.data
        }
        return data ?? []
    }
}
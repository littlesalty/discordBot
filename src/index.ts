import { DiscordService } from "./discord"
import { TwitchService } from "./twitch"

const twitchService = new TwitchService()
const discordService = new DiscordService(twitchService)
discordService.startDiscordBot()

import { Channel, Client, Guild, Intents, Message, TextBasedChannels } from "discord.js"
import { env } from "./config"
import { doIfCanReply } from "./no-spam"
import { TwitchService } from "./twitch"
import { getStartOfToday, setIntervalAndExecute } from "./utils/common"

interface IDiscordService {
    discordClient: Client
    twitchService: TwitchService
    defaultChannelId?: string
}

const CLIPS_FETCH_INTERVAL_MS = 60_000

export class DiscordService implements IDiscordService {
    discordClient: Client
    twitchService: TwitchService
    guilds?: Array<Guild>
    mainGuild: Guild
    defaultChannelId?: string

    constructor(twitchService: TwitchService, defaultChannelId?: string) {
        this.discordClient = new Client({ intents: [Intents.FLAGS.DIRECT_MESSAGES, Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] })
        this.twitchService = twitchService
        this.defaultChannelId = defaultChannelId
        this.initialDiscordBotConfig()
    }

    /**
     * Set initial event listeners in discord bot
     */
    initialDiscordBotConfig() {
        this.discordClient.once('ready', () => {
            console.log("Bot Online!")
            this.guilds = this.guilds ?? this.discordClient.guilds.cache.map(g => {
                if (g.id === env.DISCORD_DEFAULT_GUILD_ID) { this.mainGuild = g }
                return g
            })

            this.pollForTwitchClipsAndUpdateChannel()
        })

        this.discordClient.on('messageCreate', message => {
            const content = message.content.toLowerCase()
            console.log("This is the messageCreate", message.content)
            if (content === "!refresh") {
                this.twitchService.getTwitchClips()
            }
            replyToMessage(message)
        })
        this.startDiscordBot()
    }

    /**
     * Makes the bot go online
     */
    async startDiscordBot() {
        const discordKey = env.DISCORD_BOT_KEY
        this.discordClient.login(discordKey)
    }

    /**
     * Writes a message to a specific channel
     * @param channelId channel to write the message to
     */

    writeMessageToChannel(channel: TextBasedChannels, message: string) {
        console.log("sending message to channel ", message)
        channel.send(message)
    }

    pollForTwitchClipsAndUpdateChannel() {
        setIntervalAndExecute(async () => {
            const clipsChannel = this.mainGuild?.channels.cache.find(c => {
                // the text channel must be named "clips"
                return c.name === "clips"
            })

            console.assert(clipsChannel, "didn't found a clip channel!")

            if (clipsChannel?.isText()) {
                const latestMessages = await clipsChannel.messages.fetch({ limit: 1 })
                const lastMessage = latestMessages.first()
                const latestMessageDate = lastMessage?.createdAt
                const startOfDay = getStartOfToday()
                // if there is at least one message in the channel, fetch clips only from today
                const startDate = latestMessageDate ? startOfDay : undefined
                const latestClips = await this.twitchService.getTwitchClips({ startDate: startDate?.toISOString() })
                console.log("fetching new Twitch Clips")

                if (latestClips.length == 0) return

                if (lastMessage) {
                    latestClips.filter(clip => {
                        return (lastMessage.createdAt < clip.creationDate)
                    }).forEach(clip => {
                        const message = `NEW CLIP! ${clip.title} - ${clip.url}`
                        this.writeMessageToChannel(clipsChannel, message)

                    })
                } else {
                    // There is no message in the channel, start populating the channel with the 20 most popular clips of twitch

                    latestClips.forEach(clip => {
                        const message = `NEW CLIP! ${clip.title} - ${clip.url}`
                        this.writeMessageToChannel(clipsChannel, message)

                    })
                }
            }
        }, CLIPS_FETCH_INTERVAL_MS)
    }
}

function replyToMessage(messageReceived: Message<boolean>) {
    const content = messageReceived.content.toLocaleLowerCase()
    if (content === "!options") {
        const botFormattedOptionsReply = getBotOptionsAndReplies()
        messageReceived.channel.send(botFormattedOptionsReply)
        return
    }

    const replyText = botOptionsAndReplies.get(content)
    if (replyText) {
        doIfCanReply(messageReceived.author, () => messageReceived.channel.send(replyText))
    }
}

function getBotOptionsAndReplies(): string {
    const options = Array.from(botOptionsAndReplies.keys())
    const replies = Array.from(botOptionsAndReplies.values())
    let formattedReply = ""
    options.forEach((option, index) => {
        formattedReply += `**Option:** *${option}* --> **Reply:** *${replies[index]}*`
        formattedReply += "\n"
    })

    return formattedReply
}

const botOptionsAndReplies = new Map([
    ['hola', 'hola chavales'],
    ['sergi es noob', 'efectivament'],
    ['vamos valorant', 'venga va'],
    ['quiero un chupito', 'preparando una mulata cachonda!'],
    ['quiero una absenta', 'Xavi... no tuviste suficiente?'],
    ['josep no es un troll', 'NICE MEME'],
    ['toni vienes valorant?', 'voy a estudiar'],
    ['que te parece toni?', 'INJUGABLE'],
    ['quiero una pizza', 'marchando una diabla sin guindilla'],
    ['report', 'Diego estás reportado 📝'],
    ['rocket?', '🏎️🚀⚽']
])
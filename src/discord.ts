import { Channel, Client, Guild, Intents, Message, TextBasedChannels } from "discord.js"
import { env } from "./config"
import { TwitchService } from "./twitch"

interface IDiscordService {
    discordClient: Client
    twitchService: TwitchService
    defaultChannelId?: string
}


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
            console.log("time!", this.guilds)
            setInterval(() => {

                if (this.mainGuild) {
                    const clipsChannel = this.mainGuild.channels.cache.find(c => {
                        return c.name === "clips"
                    })
                    console.assert(clipsChannel, "didn't found a clip channel!")
                    if (clipsChannel?.isText()) {
                        this.writeMessageToChannel(clipsChannel, "hello")
                    }

                }

            }, 15_000)
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
        const discordKey = env?.DISCORD_BOT_KEY
        this.discordClient.login(discordKey)
    }

    /**
     * Writes a message to a specific channel
     * @param channelId channel to write the message to
     */

    writeMessageToChannel(channel: TextBasedChannels, message: string) {
        channel.send(message)
    }
    writeMissingTwitchClips(channel: TextBasedChannels, ) {
        const lastMessage = channel.lastMessage
        if (lastMessage) {
            console.log("last message", channel.lastMessage)
        }
    }

    pollTwitchClipsAndUpdateChannel(){
        
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
        messageReceived.channel.send(replyText)
        console.log("author: ", messageReceived.author)
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
    ['quiero una pizza', 'marchando una diabla sin guindilla']
])
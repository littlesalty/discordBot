import {
  Channel,
  Client,
  Collection,
  Guild,
  Intents,
  Message,
  TextBasedChannels,
  ThreadChannel,
} from "discord.js"
import { HelixClip } from "twitch/lib"
import { env } from "./config"
import { TwitchService } from "./twitch"
import { getStartOfToday, setIntervalAndExecute } from "./utils/common"
import { doIfCanReply } from "./utils/no-spam"
interface IDiscordService {
  discordClient: Client
  twitchService: TwitchService
  defaultChannelId?: string
}

const CLIPS_FETCH_INTERVAL_MS = 60_000
const TITLE_LINE_START = "title:"
const ID_LINE_START = "clip_id:"
const DATE_LINE_START = "created_at:"

export class DiscordService implements IDiscordService {
  discordClient: Client
  twitchService: TwitchService
  guilds?: Array<Guild>
  mainGuild: Guild
  defaultChannelId?: string

  constructor(twitchService: TwitchService, defaultChannelId?: string) {
    this.discordClient = new Client({
      intents: [
        Intents.FLAGS.DIRECT_MESSAGES,
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
      ],
    })
    this.twitchService = twitchService
    this.defaultChannelId = defaultChannelId
    this.initialDiscordBotConfig()
  }

  /**
   * Set initial event listeners in discord bot
   */
  initialDiscordBotConfig() {
    this.discordClient.once("ready", () => {
      console.log("Bot Online!")
      this.guilds =
        this.guilds ??
        this.discordClient.guilds.cache.map((g) => {
          if (g.id === env.DISCORD_DEFAULT_GUILD_ID) {
            this.mainGuild = g
          }
          return g
        })

      this.pollForTwitchClipsAndUpdateChannel()
    })

    this.discordClient.on("messageCreate", (message) => {
      const content = message.content.toLowerCase()
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
   * @param channel channel to write the message to
   * @param message message to write
   */
  writeMessageToChannel(channel: TextBasedChannels, message: string) {
    channel.send(message)
  }
  /**
   * Edits a message
   * @param message
   * @param newText
   */
  editMessageInChannel(message: Message<boolean>, newText: string) {
    message.edit(newText)
  }

  /**
   * Poll for twitch clips and update the clip's channel in the discord server if there are new clips
   */
  pollForTwitchClipsAndUpdateChannel() {
    setIntervalAndExecute(async () => {
      const clipsChannel = this.mainGuild?.channels.cache.find((c) => {
        // the text channel must be named "clips"
        return c.name === "clips"
      })

      console.assert(clipsChannel, "didn't found a clip channel!")

      if (clipsChannel?.isText()) {
        const latestMessages = await clipsChannel.messages.fetch({ limit: 10 })
        const lastMessage = latestMessages.first()
        const startOfDay = getStartOfToday()

        if (lastMessage) {
          // if there is at least one message in the channel, fetch clips only from today
          const latestClips = await this.twitchService.getTwitchClips({
            startDate: startOfDay.toISOString(),
          })
          console.log("fetching new Twitch Clips")
          latestClips.forEach((clip) => {
            this.maybeAddOrEditClipInChat(
              clip,
              latestMessages,
              lastMessage,
              clipsChannel
            )
          })
        } else {
          // There is no message in the channel, start populating the channel with the 20 most popular clips of twitch
          const mostPopularClips = await this.twitchService.getTwitchClips()

          mostPopularClips.forEach((clip) => {
            const message = getClipMessageForChat(clip)
            this.writeMessageToChannel(clipsChannel, message)
          })
        }
      }
    }, CLIPS_FETCH_INTERVAL_MS)
  }

  maybeAddOrEditClipInChat(
    clip: HelixClip,
    latestMessages: Collection<string, Message<boolean>>,
    lastMessage: Message<boolean>,
    discordChannel: ThreadChannel
  ) {
    const now = new Date()
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60000)
    const fifteenMinutesFromNow = new Date(now.getTime() + 15 * 60000)
    const clipMessageInChat = getClipMessageFromChat(clip, latestMessages)
    const clipIsPresentInTheClipsChat = !!clipMessageInChat
    const clipIsOld = fiveMinutesFromNow > fifteenMinutesFromNow
    if (clipIsOld) {
      // clip is old and it is not in chat, it isn't not worth taking into account
      if (!clipIsPresentInTheClipsChat) {
        return
      }
      // clip is old and is present in chat, we may have to edit it's text
      editClipMessage(clip, clipMessageInChat)
      return
    } else {
      // clip is new and it is not in chat, add it to the channel
      if (!clipIsPresentInTheClipsChat) {
        const messageString = getClipMessageForChat(clip)
        this.writeMessageToChannel(discordChannel, messageString)
        return
      }
      // clip is new and is present in chat, we may have to edit it's text
      editClipMessage(clip, clipMessageInChat)
    }
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
    doIfCanReply(messageReceived.author, () =>
      messageReceived.channel.send(replyText)
    )
  }
}

// checks if Clip is present in clips chat and return it's message
function getClipMessageFromChat(
  clip: HelixClip,
  messages: Collection<string, Message<boolean>>
) {
  for (const [_id, message] of messages) {
    const [clipIdInMessage, _clipTitleInMessage] = getClipIdAndTitleFromMessage(
      clip,
      message
    )
    const hasSameClipId = clipIdInMessage === clip.id
    if (hasSameClipId) {
      return message
    }
  }

  return undefined
}

function editClipMessage(clip: HelixClip, clipMessage: Message<boolean>) {
  const [_clipIdInMessage, clipTitleInMessage] = getClipIdAndTitleFromMessage(
    clip,
    clipMessage
  )
  const hasSameTitle = clipTitleInMessage === clip.title
  if (!hasSameTitle) {
    const newClipMessageInChat = getClipMessageForChat(clip)
    clipMessage.edit(newClipMessageInChat)
  }
  return
}

function getClipIdAndTitleFromMessage(
  _clip: HelixClip,
  message: Message<boolean>
) {
  const subsString = message.content.split("\n")
  const titleLine = subsString.find((line) => line.startsWith(TITLE_LINE_START))
  const clipIdLine = subsString.find((line) => line.startsWith(ID_LINE_START))
  // There is no clip id in this message, ignore it
  if (!clipIdLine || !titleLine) {
    return ["", ""]
  }

  const clipTitleInMessage = titleLine.split("title:")[1].trim()
  const clipIdInMessage = clipIdLine.split("clip_id:")[1].trim()

  return [clipIdInMessage, clipTitleInMessage]
}

function getClipMessageForChat(clip: HelixClip): string {
  // `NEW CLIP!\ntitle: clip title is this one \nlink: clip url is this one \nclip_id: clip id, \ncreated_by: creator name`
  return `NEW CLIP!\ntitle: ${clip.title} \nlink: ${clip.url} \nclip_id: ${
    clip.id
  } \ncreated_by: ${
    clip.creatorDisplayName
  } \ncreated_at: ${clip.creationDate.toISOString()}`
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
  ["hola", "hola chavales"],
  ["sergi es noob", "efectivament"],
  ["vamos valorant", "venga va"],
  ["quiero un chupito", "preparando una mulata cachonda!"],
  ["quiero una absenta", "Xavi... no tuviste suficiente?"],
  ["josep no es un troll", "NICE MEME"],
  ["toni vienes valorant?", "voy a estudiar"],
  ["que te parece toni?", "INJUGABLE"],
  ["quiero una pizza", "marchando una diabla sin guindilla"],
  ["report", "Diego estás reportado 📝"],
  ["rocket?", "🏎️🚀⚽"],
  ["vamos tft?", "voy yordles"],
  ["me voy a dormir", "a tu puta casa"],
])

import { Client, Intents, Message } from "discord.js"
import { envs } from "./config"
console.log("hello from discord bot! 👻")
const discordKey = envs?.DISCORD_BOT_KEY

const discordClient = new Client({ intents: [Intents.FLAGS.DIRECT_MESSAGES, Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] })


discordClient.once('ready', () => {
    console.log("Bot Online!")
})
discordClient.on('messageCreate', message => {
    console.log("This is the messageCreate", message.content)
    const content = message.content
    switch (content) {
        case 'hola':
            return sendResponseMessage(message, 'hola chavales')
        case 'sergi es noob':
            return sendResponseMessage(message, 'efectivament')
        case 'vamos valorant':
            return sendResponseMessage(message, 'venga va')
        default:
            return
    }

})
discordClient.login(discordKey)


function sendResponseMessage(messageReceived: Message<boolean>, response: string) {
    messageReceived.channel.send(response)
    //messageReceived.reply

}
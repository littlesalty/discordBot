import {
	createAudioPlayer,
	createAudioResource,
	getVoiceConnection,
	joinVoiceChannel,
} from "@discordjs/voice"
import {
	ClientVoiceManager,
	Message,
	StageChannel,
	VoiceChannel,
} from "discord.js"
import { join } from "path"

export const audioPlayer = createAudioPlayer()
export const playAudio = (message: Message<boolean>) => {
	console.log("suuuu!")
	const channel = message.member?.voice?.channel

	if (!channel) {
		message.reply("bro, you are not in a channel")
		return
	}

	if (channel.isVoice()) {
		const connection = joinVoiceChannel({
			channelId: channel.id,
			guildId: channel.guild.id,
			adapterCreator: channel.guild.voiceAdapterCreator,
		})
		setTimeout(() => {
			// Subscribe the connection to the audio player (will play audio on the voice connection)
			const subscription = connection.subscribe(audioPlayer)

			// subscription could be undefined if the connection is destroyed!
			if (subscription) {
				const resource = createAudioResource(
					join(__dirname, "audios/a.mp3")
				)
				audioPlayer.play(resource)
				// Unsubscribe after 5 seconds (stop playing audio on the voice connection)
				setTimeout(() => {
					subscription.unsubscribe()
					connection.destroy()
				}, 10_000)
			}
		}, 2_000)
	}
}

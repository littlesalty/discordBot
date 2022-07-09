import {
	createAudioPlayer,
	createAudioResource,
	joinVoiceChannel,
} from "@discordjs/voice"
import { Message } from "discord.js"
import { join } from "path"

const audioClipMapper = [
	"joseeep_version_corta",
	"josep_ezreal_no_se_juega_asi",
	"y_me_mata_sergi",
	"que_no_tengo_balas",
	"y_me_mataaaa",
]
const NUMBER_OF_AUDIO_FILES = audioClipMapper.length
export const audioPlayer = createAudioPlayer()
export const playAudio = (message: Message<boolean>) => {
	const channel = message.member?.voice?.channel
	let audioToPlay = 1
	try {
		const splittedMessage = message.content.split(" ")
		const audioValue = splittedMessage[1]
		if (audioValue) {
			audioToPlay = Math.min(parseInt(audioValue), NUMBER_OF_AUDIO_FILES)
		}
	} catch {
		audioToPlay = 1
	}

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

		// Subscribe the connection to the audio player (will play audio on the voice connection)
		const subscription = connection.subscribe(audioPlayer)

		// subscription could be undefined if the connection is destroyed!
		if (subscription) {
			const resourceDir = mapAudioIdToPath(audioToPlay)
			const resource = createAudioResource(
				join(__dirname, `audios/${resourceDir}.mp3`)
			)
			audioPlayer.play(resource)
			// Unsubscribe after 5 seconds (stop playing audio on the voice connection)
			// setTimeout(() => {
			// 	audioPlayer.i
			// 	subscription.unsubscribe()
			// }, 10_000)
		}
	}
}

export const audioListMessage = () => {
	const formattedList = audioClipMapper
		.map(
			(audioName, index) =>
				`${index + 1}: ${audioName.replaceAll("_", " ")}`
		)
		.join("\n")

	return formattedList
}

const DEFAULT_PATH = audioClipMapper[0]
const mapAudioIdToPath = (clipId: number) => {
	return audioClipMapper[clipId - 1] ?? DEFAULT_PATH
}

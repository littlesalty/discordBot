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
	"omg_diego_que_has_hecho",
	"diego_recuerdame_por_que_estoy_haciendo_duoq_contigo",
	"es_una_baiteda_que_no_sabeis",
	"puto_diego_es_un_puto_troll_que_flipas_me_cago_en",
	"matadlo_rapido_que_se_ha_reconectado",
	"no_se_cuanto_le_falta_a_la_ulti_de_karthus",
	"nooo_es_que_me_hacia_bodyblock_un_minion_de_mierda",
	"josep_usa_brillo_auto_algo",
	"que_si_que_lo_sabe_callate_tonto",
	"yo_voy_con_la_tarta_en_la_mano",
	"wait_diego_era_tu_puta_ulti",
	"y_el_naranja_que_no_hace_nada",
	"naranja",
	"estamos_muy_jodidos_porque_el_naranja_no_ha_hecho_nada",
	"venga_sergi_segundo_intento_sergi",
	"ya_me_joderia_que_este_sea_mi_premade",
	"wait_wait_wait_que_hago_yo_aqui",
	"me_estan_atacando_y_el_naranja_no_esta_haciendo_ni_mierda",
	"me_esta_dando_sergi_por_detras",
	"el_mejor_mapa_de_la_historia",
	"que_no_te_necesito_sergi",
	"autopase_de_diego",
	"yo_estoy_detras",
	"diego_hablando_respetuosamente_con_un_guiri",
	"el_microbio_asesino",
	"tengo_2_tengo_3_tengo_4_tengo_5",
	"baitedos_chavales_yo_me_voy_por_aqui", // maybe borrar
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

import dotenv from "dotenv"
import path from "path";
const result = dotenv.config({
    path: path.join(__dirname, "..", "secrets.env")
});

type EnvKeys = {
    DISCORD_BOT_KEY: string
    DISCORD_BOT_CLIENT_ID: string
    DISCORD_DEFAULT_GUILD_ID: string
    TWITCH_CLIENT_ID: string
    TWITCH_API_SECRET: string
    BROADCASTER_ID: string
}
type UnsafeEnvKeys = Partial<EnvKeys>

if (result.error) {
    console.error(result.error)
    throw result.error
}

const unsafeEnvs = {
    DISCORD_BOT_KEY: result?.parsed?.DISCORD_BOT_KEY,
    DISCORD_BOT_CLIENT_ID: result?.parsed?.DISCORD_BOT_CLIENT_ID,
    DISCORD_DEFAULT_GUILD_ID: result?.parsed?.DISCORD_DEFAULT_GUILD_ID,
    TWITCH_CLIENT_ID: result?.parsed?.TWITCH_CLIENT_ID,
    TWITCH_API_SECRET: result?.parsed?.TWITCH_API_SECRET,
    BROADCASTER_ID: result?.parsed?.BROADCASTER_ID
} as UnsafeEnvKeys



export const env = checkForMissingEnvVars(unsafeEnvs)

function checkForMissingEnvVars(envVars: UnsafeEnvKeys): EnvKeys {
    const missingEnvVars: Array<string> = []
    Object.keys(envVars).some((envVarKey, index, array) => {
        const envVar = envVars[envVarKey as keyof UnsafeEnvKeys]
        if (!envVar) {
            console.error(`${envVarKey} is not set as an environment variable`)
            missingEnvVars.push(envVarKey)
        }

        if (index == array.length - 1 && missingEnvVars.length > 0) {
            throw new Error(`Some env vars are missing: ${missingEnvVars}`)
        }
    })

    return envVars as EnvKeys
}


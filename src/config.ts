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

const unsafeEnvs = result?.parsed as UnsafeEnvKeys

export const env = checkForMissingEnvVars(unsafeEnvs)

function checkForMissingEnvVars(envVars: UnsafeEnvKeys | undefined): EnvKeys {
    const invalidArguments = (errorMessage?: string): never => { throw new Error(`Some env vars are missing: ${errorMessage}`) }
    const safeEnvVars = envVars ?? invalidArguments()

    const missingEnvVars: Array<string> = []
    Object.keys(safeEnvVars).forEach((envVarKey, index, array) => {
        const envVar = safeEnvVars[envVarKey as keyof UnsafeEnvKeys]
        if (!envVar) {
            console.error(`${envVarKey} is not set as an environment variable`)
            missingEnvVars.push(envVarKey)
        }

        if (index == array.length - 1 && missingEnvVars.length > 0) {
            invalidArguments(missingEnvVars.join(", "))
        }
    })

    return envVars as EnvKeys
}


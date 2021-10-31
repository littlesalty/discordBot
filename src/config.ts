import dotenv from "dotenv"
import path from "path";
const result = dotenv.config({
    path: path.join(__dirname, "..", "secrets", "secrets.env")
});

if (result.error) {
    console.error(result.error)
    throw result.error
}

export const { parsed: envs } = result;


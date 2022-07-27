import { readdirSync } from "fs"

export function setIntervalAndExecute(fn: () => void, timeInterval: number) {
	fn()
	return setInterval(fn, timeInterval)
}

export function getStartOfToday() {
	const now = new Date()

	const day = now.getDate()
	const month = now.getMonth() + 1
	const year = now.getFullYear()

	return new Date(`${month}/${day}/${year}`)
}

export const getListOfFiles = (dir: string): Array<string> => {
	const files = readdirSync(dir)
	for (const file of files) {
		console.log(file)
	}

	return files
}

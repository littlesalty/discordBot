import { User } from "discord.js"

const minutes = (number: number) => number * 60 * 1000

const TIMEOUT_BETWEEN_REPLIES = minutes(5)
let lastUser: User | null = null
let timeoutHandle: number = -1

const canWeReplyTo = ({ id }: User) => lastUser?.id != id
const scheduleClearUserTimeout = () => {
  if (timeoutHandle !== -1) {
    clearTimeout(timeoutHandle)
  }
  timeoutHandle = setTimeout(
    () => (lastUser = null),
    TIMEOUT_BETWEEN_REPLIES
  ) as unknown as number
}

export const doIfCanReply = <T>(user: User, action: () => T) => {
  if (canWeReplyTo(user)) {
    scheduleClearUserTimeout()
    return action()
  }

  return null
}

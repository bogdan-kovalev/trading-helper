export function logUpdate(msg: string) {
  process.stdout.clearLine(0)
  process.stdout.cursorTo(0)
  process.stdout.write(msg)
}

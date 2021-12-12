import queueConfig from '@/queue.config.json'

export function assert(condition: any, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

export function checkIfServerValid(input: string | number): boolean {
  return (input in queueConfig.servers)
}
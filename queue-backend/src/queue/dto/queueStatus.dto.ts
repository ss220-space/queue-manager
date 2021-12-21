
export type QueueStatusDto = QueuePassed | QueuePosition | NonQueued

export class NonQueued {
  status = 'not-queued'
}

export class QueuePassed {
  connection_url: string
}

export class QueuePosition {
  position: number
  total: number
}
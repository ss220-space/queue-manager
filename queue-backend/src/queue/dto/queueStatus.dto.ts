
export type ServerPort = string

export type ServerQueueStatus =
  {
    serverPort: ServerPort
    position: number
    total: number
  }[]

export type ServerPassUpdate = ServerPort[]


import PromiseSocket from 'promise-socket'
import net from 'net'

export type TopicRequest = {
  ip: string,
  port: number,
  topic: string
}

const HEADER_PREFIX = [0x00, 0x83]
const PADDING = [0x00, 0x00, 0x00, 0x00, 0x00]
const NUL = [0x00]

const RESPONSE_LENGTH_SIZE = 2
const RESPONSE_TYPE_SIZE = 1

enum ResponseDataType {
  NulOrUnsupported = 0x00,
  Float32 = 0x2a,
  String = 0x06
}

/**
 * Write BYOND topic request in format
 * [ HEADER, PAYLOAD_LENGTH, PADDING, PAYLOAD, NUL ]
 * HEADER = 0x00, 0x83
 * PAYLOAD_LENGTH = length of topic string in bytes
 * PADDING = 0x00, 0x00, 0x00, 0x00, 0x00
 * PAYLOAD = bytes of topic string with leading ?
 * NUL = 0x00
 *
 * EX: [0x00 0x83 0x00 0x0B 0x00 0x00 0x00 0x00 0x00 ? p i n g 0x00]
 * @param socket Write into
 * @param topic Topic name
 */
async function writeRequest(socket: PromiseSocket<net.Socket>, topic: string) {
  let parameters = topic;
  if (parameters.charAt(0) !== '?') parameters = `'?${parameters}`;

  const header = Buffer.from(HEADER_PREFIX)

  const payload = Buffer.from(parameters, 'utf-8')

  const length = Buffer.alloc(2);
  length.writeUInt16BE(payload.length + PADDING.length + NUL.length)
  const padding = Buffer.from(PADDING)
  const nul = Buffer.from(NUL)

  await socket.write(
    Buffer.concat([
      header,
      length,
      padding,
      payload,
      nul,
    ]),
  )
}


/**
 * Reads BYOND response in format
 * [ HEADER, SIZE, TYPE, PAYLOAD ]
 * HEADER = 0x00, 0x83
 * SIZE = unsigned BE short containing size of TYPE + PAYLOAD
 * TYPE = 0x00: Nul or unsupported | 0x2A: float in BE | 0x06: nul-terminated string
 * PAYLOAD = data according to type
 *
 * EX: [0x00 0x83 0x00 0x05 0x2A 0x00 0x00 0x29 0x43]
 * @param socket read from
 */
async function readResponse(socket: PromiseSocket<net.Socket>): Promise<string | number | null> {
  const header = await socket.read(HEADER_PREFIX.length + RESPONSE_LENGTH_SIZE + RESPONSE_TYPE_SIZE) as Buffer

  if (header.readUInt8(0) != HEADER_PREFIX[0] || header.readUInt8(1) != HEADER_PREFIX[1]) {
    throw Error('Unexpected header prefix')
  }

  const payloadSize = header.readUInt16BE(2) - RESPONSE_TYPE_SIZE

  const type: ResponseDataType = header.readUInt8(4)

  switch (type) {
    case ResponseDataType.NulOrUnsupported:
      return null;
    case ResponseDataType.Float32: {
      if (payloadSize != 4) throw Error('Unexpected size for float')

      const data = await socket.read(payloadSize) as Buffer
      return data.readFloatBE()
    }
    case ResponseDataType.String: {
      const data = await socket.read(payloadSize) as Buffer
      return data.toString('utf8', 0, payloadSize - NUL.length)
    }
  }
}

/**
 * Perform BYOND topic request and return response
 * @param request ip, port, topic name to fetch
 * @param timeout Communication timeout
 */
export default async function fetchByondTopic(request: TopicRequest, timeout = 2000): Promise<string | number | null> {
  const socket = new PromiseSocket(new net.Socket({
    readable: true,
    writable: true,
  }));

  socket.setTimeout(timeout)

  await socket.connect({
    host: request.ip,
    port: request.port,
    family: 4,
  })

  await writeRequest(socket, request.topic)
  const response = await readResponse(socket)
  socket.destroy()
  return response
}
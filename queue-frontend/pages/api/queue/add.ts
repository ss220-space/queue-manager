import redis from '@/lib/redis'
import { checkIfServerValid } from '@/lib/utils'
import type { NextApiRequest, NextApiResponse } from 'next'


export default async function add(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const {
    body: { server_port },
    method,
  } = req

  if (!server_port) {
    res.status(400).json({
      error: 'Argument "server_port" is required',
    })
  } else if (checkIfServerValid(server_port)) {
    const newEntry = {
      ip: req.socket.remoteAddress!.split(':').pop()
    }

    if(await redis.sadd(`byond_queue_${server_port}_set`, JSON.stringify(newEntry))) {
      await redis.rpush(`byond_queue_${server_port}`, JSON.stringify(newEntry))
    } else {
      return res.status(400).json({
        error: 'User already in queue',
      })
    }

    res.status(200).json({
      body: 'success',
    })
    
  } else {
    res.status(400).json({
      error: 'Argument "server_port" is not valid',
    })
  }
}
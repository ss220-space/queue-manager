import Redis from 'ioredis'
import { assert } from './utils'

assert(process.env.REDIS_URL, "You must provide the REDIS_URL env variable")

const redis = new Redis(process.env.REDIS_URL)

export default redis
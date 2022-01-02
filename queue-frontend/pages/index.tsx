import ServerCard from '@/src/ServerCard/ServerCard'
import type { InferGetServerSidePropsType } from 'next'
import Head from 'next/head'
import { useEffect, useState } from 'react'
import { Col, Container, Row } from 'react-bootstrap'
import { Queue, Server } from '../src/ServerCard/ServerCard'
import { EventSourcePolyfill } from 'event-source-polyfill'
import { CommonNavBar } from '../src/CommonNavBar/CommonNavBar'
import { AdminFlag, hasFlag } from '../src/adminFlag.enum'

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL

export type ServerPort = string

export type ServerQueueStatus =
  {
    serverPort: ServerPort
    position: number
    total: number
  }[]

export type ServerPassUpdate = ServerPort[]

export type UserProfile = {
  ckey: string
  adminFlags: number
  hasActiveBan: boolean
}


export async function getStaticProps() {
  const res = await fetch(`${backendUrl}/api/v1/servers/status`, {
    cache: 'no-cache',
  })
  const servers: Server[] = await res.json()

  return {
    props: {
      initialServers: servers,
    },
    revalidate: 10, // In seconds
  }
}

function getBackendData(
  url: string,
  token: string,
): Promise<Response> {
  return fetch(
    `${backendUrl}${url}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'pragma': 'no-cache',
        'cache-control': 'no-cache',
      }
    }
  )
}

async function fetchQueueState(token:string): Promise<Queue> {
  const queueData = await getBackendData('/api/v1/queue/status', token);
  const passData = await getBackendData('/api/v1/pass', token);
  const queueStatus: ServerQueueStatus = await queueData.json()


  const newQueue: Queue = {}
  for (const qs of queueStatus) {
    newQueue[qs.serverPort] = {
      ...qs,
      hasPass: false
    }
  }

  const passStatus: ServerPassUpdate = await passData.json()
  for (const port of passStatus) {
    newQueue[port] = {
      hasPass: true
    }
  }
  return newQueue
}

function Home({ initialServers }: InferGetServerSidePropsType<typeof getStaticProps>) {
  const [token, setToken] = useState('');
  const [servers, setServers] = useState<Server[]>(initialServers)
  const [queue, setQueue] = useState<Queue>()
  const [profile, setProfile] = useState<UserProfile>()

  useEffect(() => {
    setToken(window.location.hash.split('#token=').pop()!)
  }, [])

  useEffect(() => {
    if (token == '') return

    const load = async () => {
      setQueue(await fetchQueueState(token))
    }
    load()

    const eventSource = new EventSourcePolyfill (
      `${backendUrl}/api/v1/servers/status-events`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'pragma': 'no-cache',
          'cache-control': 'no-cache',
        }
      }

    );
    eventSource.addEventListener('StatusEvent', ({ data }: any) => {
      setServers(JSON.parse(data))
    })
    eventSource.addEventListener('QueueEvent', ({ data }: any) => {
      console.log(data)

      setQueue((queue) => {
        const update: ServerQueueStatus = JSON.parse(data)
        const newQueue: Queue = { ...queue }
        for (const key of Object.keys(newQueue)) {
          if (!newQueue[key].hasPass) {
            delete newQueue[key]
          }
        }
        for (const qs of update) {
          newQueue[qs.serverPort] = {
            ...qs,
            hasPass: false
          }
        }

        return newQueue
      })
    })
    eventSource.addEventListener('PassEvent', ({ data }: any) => {
      console.log(data)
      setQueue((queue) => {
        const update: ServerPassUpdate = JSON.parse(data)
        const newQueue: Queue = {...queue}
        for (const port of Object.keys(newQueue)) {
          newQueue[port].hasPass = false
        }
        for (const port of update) {
          newQueue[port] = {
            hasPass: true
          }
        }

        return newQueue
      });
    })
    eventSource.onerror = (event => {
      console.log(event)
    })
  }, [token])

  useEffect(() => {
    if (token == '') return

    const load = async () => {
      const profileData = await getBackendData('/api/v1/auth/profile', token);
      setProfile(await profileData.json())
    }
    load()
  }, [token]);

  return (
    <Container fluid>
      <Head>
        <title>SS220</title>
        <meta name="description" content="SS220 Queue Engine" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <CommonNavBar isAdmin={profile != null && hasFlag(profile, AdminFlag.R_ADMIN) && hasFlag(profile, AdminFlag.R_SERVER)} token={token}/>

      <Container fluid>
        <Row xs={1} md={2} lg={3}>
          {servers.map(server => (
            <Col className='p-3' key={server.name}>
              { ServerCard(server, token, queue != null, queue?.[server.port]) }
            </Col>
          ))}
        </Row>
      </Container>
    </Container>
  )
}

export default Home
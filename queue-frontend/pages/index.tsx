import ServerCard from '@/src/ServerCard/ServerCard'
import type { InferGetServerSidePropsType } from 'next'
import Head from 'next/head'
import { MutableRefObject, useEffect, useRef, useState } from 'react'
import { Col, Container, Row, Toast, ToastContainer } from 'react-bootstrap'
import { Queue, Server } from '../src/ServerCard/ServerCard'
import { EventSourcePolyfill } from 'event-source-polyfill'
import { CommonNavBar } from '../src/CommonNavBar/CommonNavBar'
import { AdminFlag, hasFlag } from '../src/adminFlag.enum'
import { BanModal } from '@/src/BanModal/BanModal'
import { backendUrl, requestBackendData } from '../src/utils'
import moment from 'moment'
import { Set } from 'immutable'

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
      renderDate: Date.now()
    },
    revalidate: 10, // In seconds
  }
}


async function fetchQueueState(token:string, passes: MutableRefObject<Set<string>>): Promise<Queue> {
  const queueData = await requestBackendData('/api/v1/queue/status', token);
  const passData = await requestBackendData('/api/v1/pass', token);
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

  passes.current = Set<string>(passStatus)
  return newQueue
}


type NewPassEvent = {
  time: Date,
  serverPort: string
  show: boolean
}

function PassToasts(
  servers: Server[],
  passEvents: NewPassEvent[],
  dropEvent: (e: NewPassEvent) => void
) {
  return <ToastContainer className="p-3" position="top-end" style={{zIndex:1}}>
    {
      passEvents?.map((event) => (
        <Toast key={`${event.time}`} onClose={() => { dropEvent(event) }} delay={10000} autohide>
          <Toast.Header>
            <strong className="me-auto">{servers.find((server) => server.port == event.serverPort)?.name}</strong>
            <small>{moment(event.time).fromNow()}</small>
          </Toast.Header>
          <Toast.Body>Получен доступ</Toast.Body>
        </Toast>
      ))
    }
  </ToastContainer>
}

function Home({ initialServers, renderDate }: InferGetServerSidePropsType<typeof getStaticProps>) {
  const [token, setToken] = useState('');
  const [servers, setServers] = useState<Server[]>(initialServers)
  const [queue, setQueue] = useState<Queue>()
  const [profile, setProfile] = useState<UserProfile>()
  const [passEvents, setPassEvents] = useState<NewPassEvent[]>([])
  const prevPasses = useRef(Set<string>())

  useEffect(() => {
    setToken(window.location.hash.split('#token=').pop()!)
  }, [])

  useEffect(() => {
    if (renderDate > Date.now() - 10 * 1000) return
    const load = async () => {
      const res = await fetch(`${backendUrl}/api/v1/servers/status`, {
        cache: 'no-cache',
      })
      setServers(await res.json())
    }
    load()
  }, [renderDate])

  useEffect(() => {
    if (token == '') return

    const load = async () => {
      setQueue(await fetchQueueState(token, prevPasses))
    }
    load()

    const audio = new Audio("bikehorn.mp3")

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
      const update: ServerPassUpdate = JSON.parse(data)
      setQueue((queue) => {
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

      for (const port of update) {
        if (!prevPasses.current.has(port)) {
          audio.play()
          setPassEvents(
            (events) =>
              [
                ...events,
                {
                  time: new Date(),
                  serverPort: port,
                  show: false
                }
              ]
          )
        }
      }
      prevPasses.current = Set(update)
    })
    eventSource.onerror = (event => {
      console.log(event)
    })

    return () => {
      eventSource.close()
    }
  }, [token])

  useEffect(() => {
    if (token == '') return

    const load = async () => {
      const profileData = await requestBackendData('/api/v1/auth/profile', token);
      setProfile(await profileData.json())
    }
    load()
  }, [token]);

  return (
    <Container className="p-0" fluid>
      <Head>
        <title>SS220</title>
        <meta name="description" content="SS220 Queue Engine" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <CommonNavBar isAdmin={profile != null && hasFlag(profile, AdminFlag.R_ADMIN) && hasFlag(profile, AdminFlag.R_SERVER)} token={token}/>

      {
        PassToasts(
          servers,
          passEvents,
          (event) => {
            setPassEvents((events) => events.filter((e) => e !== event))
          }
        )
      }

      { BanModal({ token, profile }) }

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
import ServerCard from '@/src/ServerCard/ServerCard'
import type { NextPage, InferGetServerSidePropsType } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { Button, Card, Col, Container, Row, Stack } from 'react-bootstrap'
import styles from '../styles/Home.module.css'
import { Server } from '../src/ServerCard/ServerCard'
import EventSource from 'eventsource'
import { Queue } from '../src/ServerCard/ServerCard'


export type ServerPort = string

export type ServerQueueStatus =
  {
    serverPort: ServerPort
    position: number
    total: number
  }[]

export type ServerPassUpdate = ServerPort[]



export async function getStaticProps() {
  const res = await fetch(`http://localhost:3000/api/v1/servers/status`, {
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


async function fetchQueueState(token:string): Promise<Queue> {
  const queueData = await fetch(
    'http://localhost:3000/api/v1/queue/status',
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  )
  const passData = await fetch(
    'http://localhost:3000/api/v1/pass',
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  )

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
  const [queue, setQueue] = useState<Queue>({})

  useEffect(() => {
    setToken(window.location.hash.split('#token=').pop()!)
  }, [])

  useEffect(() => {
    if (token == '') return

    const load = async () => {
      setQueue(await fetchQueueState(token))
    }
    load()

    const eventSource = new EventSource(
      'http://localhost:3000/api/v1/servers/status-events',
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }

    );
    eventSource.addEventListener('StatusEvent', ({ data }) => {
      setServers(JSON.parse(data))
    })
    eventSource.addEventListener('QueueEvent', ({ data }) => {
      console.log(data)
      console.log(queue)
      const update: ServerQueueStatus = JSON.parse(data)
      const newQueue: Queue = { ...queue }
      for (const qs of update) {
        newQueue[qs.serverPort] = {
          ...qs,
          hasPass: false
        }
      }

      console.log(newQueue)
      setQueue(newQueue)
    })
    eventSource.addEventListener('PassEvent', ({ data }) => {
      console.log(data)
      const update: ServerPassUpdate = JSON.parse(data)
      const newQueue: Queue = { ...queue }
      for (const port of Object.keys(newQueue)) {
        newQueue[port].hasPass = false
      }
      for (const port of update) {
        newQueue[port] = {
          hasPass: true
        }
      }
      console.log(newQueue)
      setQueue(newQueue)
    })
    eventSource.onerror = (event => {
      console.log(event)
    })
  }, [token])

  return (
    <Container fluid>
      <Head>
        <title>SS220</title>
        <meta name="description" content="SS220 Queue Engine" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Container fluid>
        <Row xs={1} md={2} lg={3}>
          {servers.map(server => (
            <Col className='p-3' key={server.name}>
              { ServerCard(server, token, queue[server.port]) }
            </Col>
          ))}
        </Row>
      </Container>
    </Container>
  )
}

export default Home
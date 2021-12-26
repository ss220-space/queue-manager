import ServerCard from '@/src/ServerCard/ServerCard'
import type { NextPage, InferGetServerSidePropsType } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { Button, Card, Col, Container, Row, Stack } from 'react-bootstrap'
import styles from '../styles/Home.module.css'
import { Server } from '../src/ServerCard/ServerCard'

export type QueueStatusDto = QueuePassed | QueuePosition | NonQueued

export interface NonQueued {
  status: "not-queued"
}

export interface QueuePassed {
  connection_url: string
}

export interface QueuePosition {
  position: number
  total: number
}

export async function getStaticProps() {
  const res = await fetch(`http://game.ss220.space:3000/api/v1/servers/status`, {
    cache: 'no-cache',
  })
  const servers: Server[] = await res.json()

  return {
    props: {
      servers,
    },
    revalidate: 10, // In seconds
  }
}

function Home({ servers }: InferGetServerSidePropsType<typeof getStaticProps>) {
  const [token, setToken] = useState('');
  //const [queueStatus, setQueueStatus] = useState('');

  useEffect(() => {
    setToken(window.location.hash.split('#token=').pop()!)
  }, [])

  // useEffect(() => {
  //   const interval = setInterval(async () =>{
  //     const response = await fetch(`http://game.ss220.space:3000/api/queue/status/7720?time=${Date.now()}`, {
  //       headers: {
  //         'Content-Type': 'application/json',
  //         'Authorization': `Bearer ${token}`,
  //       },
  //       cache: 'no-cache',
  //     });
  //     const status = await response.text();
  //     setQueueStatus(status);
  //   }, 1000)
  //   return function cleanup() {
  //     clearInterval(interval)
  //   };
  // }, [token])

  let joinedQueueStatus: string;

  const handleJoinQueue = async () => {
    const data = {
      "server_port": "7720"
    }
    const response = await fetch("http://game.ss220.space:3000/api/queue/add", {
      method: 'POST', // *GET, POST, PUT, DELETE, etc.
      //mode: 'same-origin', // no-cors, *cors, same-origin
      cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
      //credentials: 'same-origin', // include, *same-origin, omit
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      //redirect: 'follow', // manual, *follow, error
      //referrerPolicy: 'no-referrer', // no-referrer, *client
      body: JSON.stringify(data), // body data type must match "Content-Type" header
    });
    console.log(response)
    if (response.ok) {
      joinedQueueStatus = "Joined successful!"
    } else {
      const parsed = await response.json()
      console.log(parsed)
      joinedQueueStatus = parsed.message || "Error"
    }
  }

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
              { ServerCard(server) }
            </Col>
          ))}
        </Row>
      </Container>
    </Container>
  )
}

export default Home
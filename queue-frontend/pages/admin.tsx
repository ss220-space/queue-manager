import { InferGetServerSidePropsType } from 'next'
import { useEffect, useState } from 'react'
import { Server } from '../src/ServerCard/ServerCard'
import { EventSourcePolyfill } from 'event-source-polyfill'
import { Col, Container, Row, Tab, Table, Tabs } from 'react-bootstrap'
import Head from 'next/head'
import { CommonNavBar } from '../src/CommonNavBar/CommonNavBar'

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL

type QueuesState = {
  [serverPort: string]: {
    players: string[]
  }
}


type PlayerData = {
  ckey: string,
  pass: boolean,
  new: boolean,
  playing: boolean
}

export type PlayersUpdate = {
  players: PlayerData[]
  serverPort: string
}

export type PlayerLists = {
  [serverPort: string]: {
    players: PlayerData[]
  }
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


function QueueTable({ queue }: { queue: { players: string[] } }) {
  return (
    <Col>
      <h2>
        Очередь
      </h2>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>#</th>
            <th>ckey</th>
          </tr>
        </thead>
        <tbody>
        {
          queue && queue.players.map((value, index) => (
            <tr key={index}>
              <td>{index + 1}</td>
              <td>{value}</td>
            </tr>
          ))
        }
        </tbody>
      </Table>
    </Col>
  )
}

type PlayerListProps = {
  playerList: { players: PlayerData[] }
}
function PlayerList({playerList}: PlayerListProps) {
  return (
    <Col>
      <h2>
        Игроки
      </h2>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>#</th>
            <th>ckey</th>
            <th>В игре</th>
            <th>Пропуск</th>
            <th>Ожидание подключения</th>
          </tr>
        </thead>
        <tbody>
        {
          playerList && playerList.players.map((value, index) => (
            <tr key={index}>
              <td>{index + 1}</td>
              <td>{value.ckey}</td>
              <td>{value.playing ? "✔️" : "❌"}</td>
              <td>{value.pass ? "✔️" : "❌"}</td>
              <td>{value.new ? "✔️" : "❌"}</td>
            </tr>
          ))
        }
        </tbody>

      </Table>
    </Col>
  )
}

function Admin({ initialServers: servers }: InferGetServerSidePropsType<typeof getStaticProps>) {
  const [token, setToken] = useState('');

  const [queuesState, setQueuesState] = useState<QueuesState>({})
  const [playerLists, setPlayerLists] = useState<PlayerLists>({})

  useEffect(() => { setToken(window.location.hash.split('#token=').pop()!) }, [])

  useEffect(() => {
    if (token == '') return

    const eventSource = new EventSourcePolyfill(
      `${backendUrl}/api/v1/admin/events`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'pragma': 'no-cache',
          'cache-control': 'no-cache',
        }
      }
    )

    eventSource.addEventListener("AdminQueuesUpdateEvent", ({data}: any) => {
      console.log(data)
      const queues: QueuesState = JSON.parse(data);
      setQueuesState(queues)
    })

    eventSource.addEventListener("AdminPlayersUpdateEvent", ({data}: any) => {
      console.log(data)
      const playerUpdate: PlayersUpdate = JSON.parse(data)
      setPlayerLists((playerLists) => {
        const newLists = {
          ...playerLists,
        }
        newLists[playerUpdate.serverPort] = { players: playerUpdate.players }
        return newLists
      })
    });

    eventSource.addEventListener("StatusEvent", (event) => {
      console.log(event)
    })

    eventSource.onmessage = (event) => {
      console.log(event)
    }

    eventSource.onerror = (event) => {
      console.log(event)
    }
  }, [token])



  return (
    <Container fluid>
      <Head>
        <title>SS220</title>
        <meta name="description" content="SS220 Queue Engine Admin" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <CommonNavBar isAdmin={true} token={token}/>

      <Tabs>

        {servers.filter(server => server.queued).map(server => (
          <Tab title={server.name} key={server.port} eventKey={server.port}>
            <Container>
              <Row>
                <QueueTable queue={queuesState[server.port]}/>
                <PlayerList playerList={playerLists[server.port]}/>
              </Row>
            </Container>
          </Tab>
        ))}
      </Tabs>
    </Container>
  )
}


export default Admin
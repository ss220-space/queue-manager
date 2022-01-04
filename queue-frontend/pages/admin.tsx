import { InferGetServerSidePropsType } from 'next'
import { useEffect, useState } from 'react'
import { Server } from '../src/ServerCard/ServerCard'
import { EventSourcePolyfill } from 'event-source-polyfill'
import { Button, Col, Container, Modal, Nav, Row, Tab, Table } from 'react-bootstrap'
import Head from 'next/head'
import { CommonNavBar } from '../src/CommonNavBar/CommonNavBar'
import { requestBackendData } from '../src/utils'

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
      <Table striped bordered hover variant="dark">
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
  revokePass: (ckey: string) => void
}

function stateIcon(state: boolean) {
  if (state)
    return <i className="bi bi-check-circle state-icon"/>
  else
    return <i className="bi bi-x-circle state-icon"/>
}

function PlayerList({playerList, revokePass}: PlayerListProps) {
  return (
    <Col>
      <h2>
        Игроки
      </h2>
      <Table striped bordered hover variant="dark">
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
              <td>{stateIcon(value.playing)}</td>
              <td><Button disabled={!value.pass} className="p-0 px-1" onClick={() => revokePass(value.ckey)}>{stateIcon(value.pass)}</Button></td>
              <td>{stateIcon(value.new)}</td>
            </tr>
          ))
        }
        </tbody>

      </Table>
    </Col>
  )
}


type ConfirmDialogState = {
  title: string
  message: string
  onConfirm: () => void
}

function ConfirmDialog(state: ConfirmDialogState | null, onClose: () => void) {
  return (
    <Modal show={state != null} onHide={onClose}>
      <Modal.Header closeButton>
        <Modal.Title>{state?.title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>{state?.message}</Modal.Body>
      <Modal.Footer>

        <Button variant="primary" onClick={() => {
          state?.onConfirm()
          onClose()
        }}>
          Выполнить
        </Button>
        <Button variant="secondary" onClick={onClose}>
          Отмена
        </Button>
      </Modal.Footer>
    </Modal>
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

  const queuedSevers = servers.filter((server) => server.queued)

  const [confirmState, setConfirmState] = useState<ConfirmDialogState | null>(null)

  return (
    <Container className="p-0" fluid>
      <Head>
        <title>SS220</title>
        <meta name="description" content="SS220 Queue Engine Admin" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <CommonNavBar isAdmin={true} token={token}/>

      {
        ConfirmDialog(confirmState, () => { setConfirmState(null) })
      }
      <Container fluid className="p-3">
        <Tab.Container defaultActiveKey={queuedSevers[0].port}>
          <Row>
            <Col sm={3}>
              <Nav variant="pills" className="flex-column">
                {
                  queuedSevers.map(server => <Nav.Link eventKey={server.port} key={server.port}>{server.name}</Nav.Link>)
                }
              </Nav>
            </Col>
            <Col sm={9}>
              <Tab.Content>
                {
                  queuedSevers.map(server => (
                    <Tab.Pane eventKey={server.port} key={server.port}>
                      <Container className="admin-tab p-3">
                        <Row>
                          <QueueTable queue={queuesState[server.port]}/>
                          <PlayerList
                            playerList={playerLists[server.port]}
                            revokePass={(ckey) => {
                              setConfirmState(
                                {
                                  title: "Отменить пропуск",
                                  message: `Отменить пропуск у игрока ${ckey} на сервер ${server.name}`,
                                  onConfirm: () => {
                                    requestBackendData(`/api/v1/pass/${ckey}/${server.port}`, token, 'DELETE')
                                  }
                                }
                              )
                            }}
                          />
                        </Row>
                      </Container>
                    </Tab.Pane>
                  ))
                }
              </Tab.Content>
            </Col>
          </Row>
        </Tab.Container>
      </Container>
    </Container>
  )
}


export default Admin
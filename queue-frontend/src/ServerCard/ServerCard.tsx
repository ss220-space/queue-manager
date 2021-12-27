import * as React from 'react';
import { Button, Card, Col, Container, Row, Stack } from 'react-bootstrap'
import Link from 'next/link'

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL

export const DescItem = (title: string, data: string) => {
  return (
    <Stack>
      <h6>
        {title}
      </h6>
      <h3>
        {data}
      </h3>
    </Stack>
  )
}

export type Server = {
  name: string;
  desc: string;
  connection_address: string;
  port: string;
  queued: string;
  status?: {
    mode: string;
    roundtime: string;
    mapname: string;
    respawn: boolean;
    enter: boolean;
    listed: boolean;
    slots: {
      max: number;
      occupied: number;
    };
    queueSize: number
  }
}

export type Queue = {
  [serverPort: string]: ServerQueue
}

export type ServerQueue = {
  position?: number,
  total?: number,
  hasPass: boolean
}



export default function ServerCard(server: Server, token: string, queue?: ServerQueue) {
  async function handleClick() {
    if (server.queued && !queue?.hasPass) {
      const data = {
        'serverPort': `${server.port}`
      }
      let action: string
      if (queue != null) {
        action = `${backendUrl}/api/v1/queue/remove`
      } else {
        action = `${backendUrl}/api/v1/queue/add`
      }

      const response = await fetch(action, {
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
    } else {
      const redirectLink = document.createElement('a')
      redirectLink.href = `byond://${server.connection_address}:${server.port}`
      redirectLink.click()
      window.location.href = 'byond://winset?command=.quit'
      // window.location.href= `byond://${server.connection_address}:${server.port}`
    }
  }

  function playButton() {
    if (queue) {
      if (queue.hasPass) {
        return (
          <Button onClick={handleClick} variant="success">Подключиться</Button>
        )
      }
      if (queue.position != null) {
        return (
          <Button onClick={handleClick} variant="primary">{`В очереди (${queue.position+1} из ${queue.total})`}</Button>
        )
      }
    }
    return (
      <Button onClick={handleClick} variant="primary">Играть</Button>
    )
  }



  return (
    <Card>
      <Card.Body>
        <Card.Title>{server.name}</Card.Title>
        <Container>
          <Row>
            <Col>
              {DescItem("Слотов", `${server.status?.slots?.occupied || 0} / ${server.status?.slots?.max || '∞'}`)}
            </Col>
            {
              server.queued && <Col>
                {DescItem("Очередь", `${queue?.total || server.status?.queueSize || 0}`)}
              </Col>
            }
          </Row>
          <Row>
            <Col>
              {DescItem("Время раунда", server.status?.roundtime || '—')}
            </Col>
            <Col>
              {DescItem("Статус", "Идёт игра")}
            </Col>
          </Row>

        </Container>
        <div className="d-grid col-6 mx-auto">
          {playButton()}
        </div>
      </Card.Body>
    </Card>
  )
}
import { useState } from 'react'
import { Button, Card, Col, Container, Row, Stack, Placeholder, Badge } from 'react-bootstrap'
import { Fragment, ReactElement } from 'react';

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL

const DescItemContent = (data: ReactElement | string) => {
  return (
    <p className="fs-3 fw-bold mb-0">
      {data}
    </p>
  )
}

export const DescItem = (title: string, data: ReactElement | string | undefined | null ) => {
  return (
    <Stack className='mt-3'>
      <p className="fs-6 text-muted fw-normal mb-0">
        {title}
      </p>
      { data ?
        DescItemContent(data) :
        <Placeholder as="p" size="lg" animation="glow" className="m-0"> 
          <Placeholder xs={10} className="my-1 py-3"/>
        </Placeholder>
      }
    </Stack>
  )
}

export enum TickerState {
  Startup = 0,
  Pregame = 1,
  SettingUp = 2,
  Playing = 3,
  Finished = 4,
}

export type Server = {
  name: string;
  desc: string;
  connection_address: string;
  port: string;
  queued: boolean;
  whitelisted: boolean;
  order: number;
  status?: {
    ticker_state: number | string | undefined;
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
    queueSize: number;
    date: string;
  }
}

export type ServersStatus = {
  servers: Server[]
  now: number
}

export type Queue = {
  [serverPort: string]: ServerQueue
}

export type ServerQueue = {
  position?: number,
  total?: number,
  hasPass: boolean
}

const getTickerStateString = (tickerState: number | string | undefined) => {
  const state: TickerState = Number(tickerState)
  switch (state) {
    case TickerState.Startup: return 'Загрузка';
    case TickerState.Pregame: return 'Лобби';
    case TickerState.SettingUp: return 'Подготовка';
    case TickerState.Playing: return 'Идёт игра';
    case TickerState.Finished: return 'Окончание';
  }
}

export default function ServerCard(server: Server, serverNow: number, token: string, queueLoaded: boolean, queue?: ServerQueue) {
  const isStale: boolean = !server.status || Date.parse(server.status.date) < (serverNow - 60 * 1000)

  async function handleClick() {
    if (server.queued && !queue?.hasPass) {
      const data = {
        'serverPort': `${server.port}`
      }
      let action: string
      if (queue != null && queue.position != null) {
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

  function playButton(className: string) {
    if (queue) {
      if (queue.hasPass) {
        return (
          <Button onClick={handleClick} variant="success" className={className}>Подключиться</Button>
        )
      }
      if (queue.position != null) {
        return (
          <Button onClick={handleClick} className={className} variant="primary">
            {"В очереди "}
            <Badge bg="success">{queue.position+1}</Badge>
          </Button>
        )
      }
    }
    return (
      <Button disabled={server.queued && (!queueLoaded || isStale)} className={className} onClick={handleClick} variant="primary">Играть</Button>
    )
  }

  return (
    <Card>
      <Card.Body className="p-1">
        <Container>
          <Card.Title className="h5 fw-normal mb-0 mt-3">{server.name}</Card.Title>
          <Row>
            <Col>
              {
                DescItem("Слотов",
                  <Fragment>
                    {server.status?.slots?.occupied || 0}
                    <span className="fw-normal">&nbsp;/&nbsp;</span>
                    {server.status?.slots?.max || <i className="bi bi-infinity"/>}
                  </Fragment>
                )
              }
            </Col>
            {
              server.queued && <Col>
                {DescItem("Очередь", `${queue?.total || server.status?.queueSize || 0}`)}
              </Col>
            }
          </Row>
          <Row>
            <Col>
              {DescItem("Время раунда", isStale ? null : server.status?.roundtime)}
            </Col>
            <Col>
              {DescItem("Статус", !isStale ? getTickerStateString(server.status?.ticker_state!) : null)}
            </Col>
          </Row>

        </Container>
        <Container className="col-6 mx-auto m-4 mt-3">
          {playButton("col-12")}
        </Container>
      </Card.Body>
    </Card>
  )
}
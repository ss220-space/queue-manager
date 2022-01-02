import * as React from 'react';
import { Button, Card, Col, Container, Row, Stack } from 'react-bootstrap'
import { Fragment, ReactElement } from 'react';

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL

export const DescItem = (title: string, data: ReactElement | string) => {
  return (
    <Stack className='mt-3'>
      <p className="fs-6 text-muted fw-normal mb-0">
        {title}
      </p>
      <p className="fs-3 fw-bold mb-0">
        {data}
      </p>
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
  status?: {
    ticker_state: TickerState;
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

const getTickerStateString = (tickerState: TickerState) => {
  switch (tickerState) {
    case TickerState.Startup: return 'Инициализация';
    case TickerState.Pregame: return 'Лобби';
    case TickerState.SettingUp: return 'Подготовка';
    case TickerState.Playing: return 'Идёт игра';
    case TickerState.Finished: return 'Завершение';
  }
}

export default function ServerCard(server: Server, token: string, queueLoaded: boolean, queue?: ServerQueue) {
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
      <Button disabled={server.queued && !queueLoaded} onClick={handleClick} variant="primary">Играть</Button>
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
              {DescItem("Время раунда", server.status?.roundtime || '??')}
            </Col>
            <Col>
              {DescItem("Статус", server.status?.ticker_state ? getTickerStateString(server.status.ticker_state) : '??')}
            </Col>
          </Row>

        </Container>
        <div className="d-grid col-6 mx-auto m-4 mt-3">
          {playButton()}
        </div>
      </Card.Body>
    </Card>
  )
}
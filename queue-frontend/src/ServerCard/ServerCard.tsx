import * as React from 'react';
import { Button, Card, Col, Container, Row, Stack } from 'react-bootstrap'

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
  }
  
  
}

export default function ServerCard(server: Server) {
  return (
    <Card>
      <Card.Body>
        <Card.Title>{server.name}</Card.Title>
        <Container>
          <Row>
            <Col>
              {DescItem("Слотов", `${server.status?.slots.occupied || 0} / ${server.status?.slots.max || '∞'}`)}
            </Col>
            <Col>
              {DescItem("Очередь", "8")}
            </Col>
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
          <Button variant="primary">Играть</Button>
        </div>
      </Card.Body>
    </Card>
  )
}
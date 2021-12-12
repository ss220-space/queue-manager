import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsResponse,
} from '@nestjs/websockets';
// import { from, Observable } from 'rxjs';
// import { map } from 'rxjs/operators';
import { Server } from 'ws';
import { Logger } from '@nestjs/common';
import { Socket } from 'net';

@WebSocketGateway(8080)
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('AppGateway');

  @SubscribeMessage('events')
  handleEvent(@MessageBody() data: unknown, @ConnectedSocket() client: Socket): WsResponse<unknown> {
    const event = 'events';
    return { event, data };
  }

  @SubscribeMessage('msgToServer')
 handleMessage(client: any, payload: string): void {
  this.server.emit('msgToClient', payload);
 }

 afterInit(server: Server) {
  this.logger.log('Init');
 }

 handleDisconnect(client: any) {
  this.logger.log(`Client disconnected: ${client}`);
 }

 handleConnection(client: any, ...args: any[]) {
  // this.server.emit('events', JSON.stringify({
  //   "hello": "world"
  // }));
  console.log(typeof client)
  client.emit("connected", "successful")
  setTimeout(() => {
    client.emit('MY_EVENT', 'some value');
  }, 1000)
  this.logger.log(`Client connected: ${client}`);
 }
}
import { Injectable } from '@nestjs/common';
import { Subject } from 'rxjs';
import { IptablesEventMessageDto } from './iptablesEvents.gateway';
import { IpLinkService } from '../ipLink/ipLink.service'
import { PassService } from '../pass/pass.service'
import { OnEvent } from '@nestjs/event-emitter'
import { InternalEvent } from '../common/enums/internalEvent.enum'

@Injectable()
export class IptablesEventsService {
  constructor(
    private readonly ipLinkService: IpLinkService,
    private readonly passService: PassService,
  ) {
    this.eventsSubject = new Subject();
  }

  eventsSubject: Subject<IptablesEventMessageDto>;


  async getIpPasses(serverPort: string): Promise<string[]> {
    const serverCkeys = await this.passService.getServerPasses(serverPort)
    const ips = serverCkeys.map(async (ckey) => await this.ipLinkService.getIp(ckey))
    return (await Promise.all(ips)).flat()
  }

  @OnEvent(InternalEvent.PassAdded, {promisify:true})
  async handlePassAdded({ckey, serverPort}): Promise<void> {
    const ips = await this.ipLinkService.getIp(ckey)
    ips.forEach((ip) => this.onAddedPass(ip, parseInt(serverPort)))
  }

  @OnEvent(InternalEvent.PassRemoved, {promisify:true})
  async handlePassRemoved({ckey, serverPort}): Promise<void> {
    const ips = await this.ipLinkService.getIp(ckey)
    ips.forEach((ip) => this.onRemovedPass(ip, parseInt(serverPort)))
  }

  onAddedPass(playerIp: string, targetPort: number): void {
    const message = new IptablesEventMessageDto()
    message.action = 'ALLOW'
    message.inbound_address = playerIp
    message.target_port = targetPort
    this.eventsSubject.next(message)
  }

  onRemovedPass(playerIp: string, targetPort: number): void {
    const message = new IptablesEventMessageDto()
    message.action = 'REVOKE'
    message.inbound_address = playerIp
    message.target_port = targetPort
    this.eventsSubject.next(message)
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { Subject } from 'rxjs';
import { IptablesEventMessageDto } from './iptablesEvents.gateway';
import { IpLinkService } from '../ipLink/ipLink.service'
import { PassService } from '../pass/pass.service'
import { OnEvent } from '@nestjs/event-emitter'
import { InternalEvent } from '../common/enums/internalEvent.enum'
import { IpChangeEvent } from '../common/events/ip-change.event'

@Injectable()
export class IptablesEventsService {
  constructor(
    private readonly ipLinkService: IpLinkService,
    private readonly passService: PassService,
  ) {
    this.eventsSubject = new Subject();
  }

  eventsSubject: Subject<IptablesEventMessageDto>;
  private readonly logger = new Logger(IptablesEventsService.name)


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

  @OnEvent(InternalEvent.IpChanged, {promisify:true})
  async handleIpChanged({ckey, newIp, oldIp}: IpChangeEvent): Promise<void> {
    const passes = await this.passService.getPassesByCkey(ckey)
    if (passes.length == 0) return
    this.logger.debug(`[${ckey}] ip change ${oldIp} -> ${newIp} with active passes: ${passes}`)
    for (const port of passes) {
      this.onRemovedPass(oldIp, parseInt(port))
      this.onAddedPass(newIp, parseInt(port))
    }
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

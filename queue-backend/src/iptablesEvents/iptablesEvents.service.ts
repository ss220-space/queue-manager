import { Injectable, Logger } from '@nestjs/common';
import { Subject } from 'rxjs';
import { IptablesEventMessageDto } from './iptablesEvents.gateway';
import { IpLinkService } from '../ipLink/ipLink.service'
import { PassService } from '../pass/pass.service'
import { OnEvent } from '@nestjs/event-emitter'
import { InternalEvent } from '../common/enums/internalEvent.enum'
import { IpChangeEvent } from '../common/events/ip-change.event'

type ServerIpPasses = {
  [ip: string]: string[]
}

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

  private ipPasses: {
    [serverPort: string]: ServerIpPasses
  } = {}

  private async provideIpPassesFor(serverPort: string): Promise<ServerIpPasses> {
    const present = this.ipPasses[serverPort]
    if (present) return present

    const serverCkeys = await this.passService.getServerPasses(serverPort)
    const serverIpPasses = {}
    for (const ckey of serverCkeys) {
      for (const ip of await this.ipLinkService.getIp(ckey)) {
        if (serverIpPasses[ip]) {
          serverIpPasses[ip].push(ckey)
        } else {
          serverIpPasses[ip] = [ckey]
        }
      }
    }
    this.ipPasses[serverPort] = serverIpPasses
    return serverIpPasses
  }

  async getIpPasses(serverPort: string): Promise<string[]> {
    const passes = await this.provideIpPassesFor(serverPort)
    this.logger.log(passes)
    return Object.keys(passes)
  }

  @OnEvent(InternalEvent.PassAdded, {promisify:true})
  async handlePassAdded({ckey, serverPort}): Promise<void> {
    const ips = await this.ipLinkService.getIp(ckey)
    for (const ip of ips) {
      await this.onAddCkeyPass(ckey, ip, serverPort)
    }
  }

  @OnEvent(InternalEvent.PassRemoved, {promisify:true})
  async handlePassRemoved({ckey, serverPort}): Promise<void> {
    const ips = await this.ipLinkService.getIp(ckey)
    for (const ip of ips) {
      await this.onRemoveCkeyPass(ckey, ip, serverPort)
    }
  }

  @OnEvent(InternalEvent.IpChanged, {promisify:true})
  async handleIpChanged({ckey, newIp, oldIp}: IpChangeEvent): Promise<void> {
    const passes = await this.passService.getPassesByCkey(ckey)
    if (passes.length == 0) return
    this.logger.debug(`[${ckey}] ip change ${oldIp} -> ${newIp} with active passes: ${passes}`)
    for (const port of passes) {
      await this.onRemoveCkeyPass(ckey, oldIp, port)
      await this.onAddCkeyPass(ckey, newIp, port)
    }
  }

  private async onRemoveCkeyPass(ckey: string, ip: string, serverPort: string) {
    const serverIpPasses = await this.provideIpPassesFor(serverPort)
    const updatedPasses = serverIpPasses[ip]?.filter((passCkey) => passCkey !== ckey)
    if (updatedPasses.length == 0) {
      delete serverIpPasses[ip]
      this.onRemovedPass(ip, parseInt(serverPort))
    } else {
      serverIpPasses[ip] = updatedPasses
    }
    this.logger.debug(serverIpPasses)
  }

  private async onAddCkeyPass(ckey: string, ip: string, serverPort: string) {
    const serverIpPasses = await this.provideIpPassesFor(serverPort)
    if (serverIpPasses[ip] != null) {
      serverIpPasses[ip].push(ckey)
    } else {
      serverIpPasses[ip] = [ckey]
    }
    this.onAddedPass(ip, parseInt(serverPort))
    this.logger.debug(serverIpPasses)
  }

  private onAddedPass(playerIp: string, targetPort: number): void {
    const message = new IptablesEventMessageDto()
    message.action = 'ALLOW'
    message.inbound_address = playerIp
    message.target_port = targetPort
    this.eventsSubject.next(message)
  }

  private onRemovedPass(playerIp: string, targetPort: number): void {
    const message = new IptablesEventMessageDto()
    message.action = 'REVOKE'
    message.inbound_address = playerIp
    message.target_port = targetPort
    this.eventsSubject.next(message)
  }
}

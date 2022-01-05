import { IsIP, IsNotEmpty, Validate } from 'class-validator';
import { CkeyRule } from '../../common/validator/ckey.validator'

export class LobbyConnectDto {

  @IsNotEmpty()
  @Validate(CkeyRule)
  'ckey': string

  @IsNotEmpty()
  'targetServer': string

  @IsIP()
  @IsNotEmpty()
  'ip': string
}

export type LobbyConnectResponse = {
  redirect?: string
  token?: string
}
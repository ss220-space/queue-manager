import { ServerExistsRule } from '@/src/common/validator/serverExist.validator';
import { IsNotEmpty, IsPort, Validate } from 'class-validator';

export class QueueRequestDto {
  @IsPort()
  @IsNotEmpty()
  @Validate(ServerExistsRule)
  'server_port': string;
}
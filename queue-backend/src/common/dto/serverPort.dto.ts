import { ServerExistsRule } from '@/src/common/validator/serverExist.validator';
import { IsNotEmpty, IsPort, Validate } from 'class-validator';

export class ServerPortDto {
  @IsPort()
  @IsNotEmpty()
  @Validate(ServerExistsRule)
  serverPort: string;
}

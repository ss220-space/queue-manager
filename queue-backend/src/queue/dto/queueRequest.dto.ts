import { IsNotEmpty, IsPort, Validate, ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';
import queueConfig from '@/queue.config.json'

@ValidatorConstraint({ name: 'ServerExistsRule', async: true })
export class ServerExistsRule implements ValidatorConstraintInterface {
  async validate(value: string): Promise<boolean> {
    return (value in queueConfig.servers)
  }

  defaultMessage(args: ValidationArguments): string {
    return `Server ${args.value} doesn't exists`;
  }
}

export class QueueRequestDto {
  @IsPort()
  @IsNotEmpty()
  @Validate(ServerExistsRule)
  "server_port": string;
}
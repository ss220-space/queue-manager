import { ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';
import { servers } from '@/queue.config.json'

@ValidatorConstraint({ name: 'ServerExistsRule', async: true })
export class ServerExistsRule implements ValidatorConstraintInterface {
  async validate(value: string): Promise<boolean> {
    return (value in servers)
  }

  defaultMessage(args: ValidationArguments): string {
    return `Server ${args.value} doesn't exists`;
  }
}
import { ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';
import { ckeySanitize } from '../utils';

@ValidatorConstraint({ name: 'CkeyRule', async: true })
export class CkeyRule implements ValidatorConstraintInterface {
  async validate(value: string): Promise<boolean> {
    return (value === ckeySanitize(value))
  }

  defaultMessage(args: ValidationArguments): string {
    return `Provided ckey ${args.value} is not valid. Transform it.`;
  }
}
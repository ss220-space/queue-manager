import { CkeyRule } from '@/src/common/validator/ckey.validator';
import { IsNotEmpty, IsString, Validate } from 'class-validator';

export class CkeyDto {
  @IsString()
  @IsNotEmpty()
  @Validate(CkeyRule)
  'ckey': string;
}
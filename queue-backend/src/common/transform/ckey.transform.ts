import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import { ckeySanitize } from '../utils';

@Injectable()
export class CkeyTransformPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    return ckeySanitize(value);
  }
}

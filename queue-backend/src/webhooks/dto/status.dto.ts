import { IsNotEmpty, IsNumber } from 'class-validator';

export class StatusDto {
  @IsNumber()
  @IsNotEmpty()
  'max_slots': number;

  @IsNumber()
  @IsNotEmpty()
  'occupied_slots': number;
}
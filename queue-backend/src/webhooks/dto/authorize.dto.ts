import { IsNotEmpty } from "class-validator";

export class AuthorizeDto {

  @IsNotEmpty()
  ckey: string // User ckey from byond
}
export class JwtPayloadDto {
  sub: string
  roles?: number
  donor?: number
  ban: boolean
}
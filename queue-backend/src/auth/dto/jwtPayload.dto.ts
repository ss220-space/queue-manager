export class JwtPayloadDto {
  sub: string
  roles?: number
  donor?: number
  wl?: number[]
  ban: boolean
}
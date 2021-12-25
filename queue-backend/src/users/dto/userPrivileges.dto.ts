import { AdminRank } from '@/src/common/enums/adminRank.enum';
import { IsEnum, IsNotEmpty, IsNumber, Max, Min } from 'class-validator';

export class UserPrivilegesDto {
  @IsNotEmpty()
  ckey: string // User ckey from byond

  @IsEnum(AdminRank)
  adminRank?: keyof typeof AdminRank

  @IsNumber()
  @Min(0)
  @Max((2 << 16) - 1 )
  adminFlags?: number

  @IsNumber()
  @Min(0)
  @Max(4)
  donatorTier?: number
}
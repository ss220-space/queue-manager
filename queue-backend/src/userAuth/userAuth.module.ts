import { Module } from "@nestjs/common";
import { UserAuthService } from "./userAuth.service";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtStrategy } from "./jwt.strategy";


@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_KEY'),
      }),
      inject: [ConfigService],
    })
  ],
  providers: [UserAuthService, JwtStrategy],
  exports: [UserAuthService]
})
export class UserAuthModule {}

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ENVIRONMENT } from 'src/helpers/configs/environment';
import { PasswordService } from 'src/helpers/password.service';
import { AuthController } from './auth.controller';
import { User } from './auth.model';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    JwtModule.register({
      secret: ENVIRONMENT.SECRET_KEY,
      signOptions: {
        expiresIn: ENVIRONMENT.EXPIRES_TIME,
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, PasswordService, JwtStrategy],
})
export class AuthModule {}

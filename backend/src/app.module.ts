import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ENVIRONMENT } from './helpers/configs/environment';
import { McuModule } from './mcu/mcu.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: ENVIRONMENT.DATABASE_URL,
      autoLoadEntities: true,
      synchronize: false,
      ssl: ENVIRONMENT.DATABASE_SSL
        ? { rejectUnauthorized: false }
        : false,
    }),
    AuthModule,
    McuModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PasswordService } from 'src/helpers/password.service';
import { McuController } from './mcu.controller';
import { Mcu } from './mcu.model';
import { McuService } from './mcu.service';

@Module({
  imports: [TypeOrmModule.forFeature([Mcu])],
  controllers: [McuController],
  providers: [McuService, PasswordService],
})
export class McuModule {}

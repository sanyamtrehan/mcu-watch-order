import { Test, TestingModule } from '@nestjs/testing';
import { McuController } from './mcu.controller';
import { McuService } from './mcu.service';

describe('McuController', () => {
  let controller: McuController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [McuController],
      providers: [
        {
          provide: McuService,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<McuController>(McuController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

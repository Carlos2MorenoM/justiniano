import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

const mockAppService = {
  getMlStatus: jest.fn(() =>
    Promise.resolve({
      bff_status: 'ok',
      ml_response: { status: 'ok', service: 'backend-ml' },
    }),
  ),
};

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: mockAppService,
        },
      ],
    }).compile();

    appController = module.get<AppController>(AppController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getMlStatus', () => {
    it('should return a status object from the service', async () => {
      const result = await appController.getMlStatus();

      expect(result.bff_status).toBe('ok');
      expect(mockAppService.getMlStatus).toHaveBeenCalledTimes(1);
    });
  });
});

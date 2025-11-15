import { Test, TestingModule } from '@nestjs/testing';
import { AppService } from './app.service';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of, throwError } from 'rxjs';

describe('AppService', () => {
  let appService: AppService;
  let httpService: HttpService;

  const mockHttpService = {
    get: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('http://fake-url:8000'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppService,
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    appService = module.get<AppService>(AppService);
    httpService = module.get<HttpService>(HttpService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(appService).toBeDefined();
  });

  describe('getMlStatus (Happy Path)', () => {
    it('should return a successful status', async () => {
      const mockFastApiResponse = { status: 'ok', service: 'backend-ml' };
      const expectedResponse = {
        bff_status: 'ok',
        ml_response: mockFastApiResponse,
      };

      mockHttpService.get.mockReturnValue(of({ data: mockFastApiResponse }));

      const result = await appService.getMlStatus();

      expect(result).toEqual(expectedResponse);
      expect(mockHttpService.get).toHaveBeenCalledWith(
        'http://fake-url:8000/status',
      );
    });
  });

  describe('getMlStatus (Sad Path)', () => {
    it('should return an error status when HttpService fails', async () => {
      const mockError = { message: 'Network Error' };
      const expectedResponse = {
        bff_status: 'error',
        message: 'Cannot connect ML service',
        error: mockError.message,
      };

      mockHttpService.get.mockReturnValue(
        throwError(() => ({ message: mockError.message })),
      );

      const result = await appService.getMlStatus();

      expect(result).toEqual(expectedResponse);
      expect(mockHttpService.get).toHaveBeenCalledWith(
        'http://fake-url:8000/status',
      );
    });
  });
});
import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class AppService {
  private mlServiceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.mlServiceUrl = this.configService.get<string>(
      'FASTAPI_ML_URL',
      'http://backend-ml:8000',
    );
  }

  async getMlStatus() {
    try {
      const response = await lastValueFrom(
        this.httpService.get(`${this.mlServiceUrl}/status`),
      );

      return {
        bff_status: 'ok',
        ml_response: response.data as unknown,
      };
    } catch (error: unknown) {
      return {
        bff_status: 'error',
        message: 'Cannot connect ML service',
        error: (error as Error).message,
      };
    }
  }
}

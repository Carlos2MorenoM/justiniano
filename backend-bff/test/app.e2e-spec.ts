import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request = require('supertest');
import { AppModule } from './../src/app.module';
import { AppService } from './../src/app.service';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  const expectedMlStatusResponse = {
    bff_status: 'ok',
    ml_response: { status: 'OK', service: 'backend-ml' },
  };

  const mockAppService = {
    getMlStatus: () => expectedMlStatusResponse,
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(AppService)
      .useValue(mockAppService)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ml-status (GET)', () => {
    return request(app.getHttpServer())
      .get('/ml-status')
      .expect(200)
      .expect(expectedMlStatusResponse);
  });
});
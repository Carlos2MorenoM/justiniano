import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  private mlServiceUrl: string;

  constructor(
    private readonly appService: AppService) {}

  @Get('ml-status')
  async getMlStatus() {
    return this.appService.getMlStatus();
  }
}

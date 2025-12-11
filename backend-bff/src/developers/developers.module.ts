import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { DevelopersController } from './developers.controller';
import { DevelopersService } from './developers.service';

@Module({
    imports: [HttpModule],
    controllers: [DevelopersController],
    providers: [DevelopersService],
})
export class DevelopersModule { }
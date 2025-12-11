import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DevelopersService } from './developers.service';
import { GenerateSdkDto } from './dto/generate-sdk.dto';

@ApiTags('developers')
@Controller('developers')
export class DevelopersController {
    constructor(private readonly developersService: DevelopersService) { }

    @Post('generate-sdk')
    @ApiOperation({
        summary: 'Generate an API Client SDK using AI',
        description:
            'Uses GenAI (Llama 3 via Groq) to read the internal OpenAPI spec and generate a ready-to-use client library in the requested language.',
    })
    @ApiResponse({ status: 201, description: 'SDK generated successfully.' })
    async generateSdk(@Body() dto: GenerateSdkDto) {
        return this.developersService.generateSdk(dto);
    }
}
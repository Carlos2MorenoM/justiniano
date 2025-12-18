import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { GenerateSdkDto } from './dto/generate-sdk.dto';

interface GroqResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

interface AxiosErrorLike {
  response?: {
    data?: unknown;
  };
  message: string;
}

@Injectable()
export class DevelopersService {
  private readonly logger = new Logger(DevelopersService.name);
  private readonly groqApiUrl =
    'https://api.groq.com/openai/v1/chat/completions';

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Generates a client SDK for the specified language using Groq (LLM).
   * It fetches the current OpenAPI JSON spec from the running application context.
   *
   * @param dto - Contains the target language (python | node)
   * @returns The generated source code for the SDK
   */
  async generateSdk(dto: GenerateSdkDto): Promise<{ code: string }> {
    const openApiSpec = await this.fetchLocalOpenApiSpec();

    const prompt = `
      You are an expert Developer Experience Engineer.
      Your task is to generate a production-ready, typed API Client SDK in ${dto.language} for the following OpenAPI specification.

      Requirements:
      1. Use modern best practices (e.g., 'httpx'/'pydantic' for Python, 'axios'/'typescript' for Node).
      2. Include a helper class with methods matching the API endpoints.
      3. Add comprehensive docstrings/JSDoc.
      4. Include a brief usage example at the bottom in comments.
      5. Return ONLY the code, no markdown formatting (no \`\`\`), no conversational filler.

      OpenAPI Spec:
      ${JSON.stringify(openApiSpec)}
    `;

    return this.callLlm(prompt);
  }

  /**
   * Fetches the Swagger JSON from the localhost endpoint.
   * Assumes the app is running on the configured port.
   */
  private async fetchLocalOpenApiSpec(): Promise<unknown> {
    const port = this.configService.get<string>('PORT') || 3000;
    const url = `http://localhost:${port}/api-json`; // Standard NestJS Swagger JSON endpoint

    try {
      const { data } = await firstValueFrom(this.httpService.get<unknown>(url));
      return data;
    } catch (error) {
      this.logger.error(`Failed to fetch OpenAPI spec from ${url}`, error);
      throw new InternalServerErrorException(
        'Could not retrieve internal API specification. Is the server fully up?',
      );
    }
  }

  /**
   * Sends the prompt to Groq API.
   */
  private async callLlm(prompt: string): Promise<{ code: string }> {
    const apiKey = this.configService.get<string>('GROQ_API_KEY');
    const groqModel = this.configService.get<string>('GROQ_MODEL');
    if (!apiKey || !groqModel) {
      throw new InternalServerErrorException(
        'GROQ_API_KEY or GROQ_MODEL is not defined in environment variables',
      );
    }

    try {
      const payload = {
        model: groqModel,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1, // Low temperature for deterministic code generation
      };

      const { data } = await firstValueFrom(
        this.httpService.post<GroqResponse>(this.groqApiUrl, payload, {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        }),
      );

      const generatedContent = data.choices[0]?.message?.content || '';
      // Clean up potential markdown code blocks if the model ignores the instruction
      const cleanCode = generatedContent
        .replace(/```[a-z]*\n/g, '')
        .replace(/```/g, '');

      return { code: cleanCode.trim() };
    } catch (error: unknown) {
      const axiosError = error as AxiosErrorLike;
      const errorDetails = axiosError.response?.data || axiosError.message;
      this.logger.error('Error calling Groq API', errorDetails);

      throw new InternalServerErrorException(
        `Groq Error: ${JSON.stringify(errorDetails)}`,
      );
    }
  }
}

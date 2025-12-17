import {
  Controller,
  Post,
  Body,
  Res,
  Headers,
  Logger,
  Get,
  Param,
  NotFoundException
} from '@nestjs/common';
import type { Response } from 'express';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { ConversationsService } from '../conversations/conversations.service';
import { ChatRequestDto } from './dto/chat-request.dto';
import { firstValueFrom } from 'rxjs';

/**
 * Controller responsible for handling Chat interactions and Evaluation retrieval.
 * Acts as an orchestration layer between the Frontend and the Python ML Service.
 */
@Controller('chat')
export class ChatController {
  private readonly logger = new Logger(ChatController.name);
  private readonly mlServiceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly conversationsService: ConversationsService,
  ) {
    this.mlServiceUrl = this.configService.getOrThrow<string>('FASTAPI_ML_URL');
  }

  /**
   * Retrieves the evaluation metrics for a specific message ID.
   * Proxies the request to the ML backend.
   * * @param messageId - The UUID of the message to check.
   * @returns The evaluation metrics if ready.
   * @throws NotFoundException if the evaluation is still pending or does not exist.
   */
  @Get('evaluation/:id')
  async getEvaluation(@Param('id') messageId: string) {
    this.logger.debug(`Polling evaluation metrics for message: ${messageId}`);
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.mlServiceUrl}/chat/evaluation/${messageId}`)
      );
      return response.data;
    } catch (error: unknown) {
      // If ML service returns 404, it usually means the background task hasn't finished yet.
      if ((error as any).response?.status === 404) {
        throw new NotFoundException('Evaluation pending or not found');
      }
      this.logger.error(`Error fetching evaluation proxy: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Main Chat Endpoint.
   * 1. Saves user message to MongoDB.
   * 2. Forwards request to ML Service (streaming).
   * 3. Streams response back to client via SSE.
   * 4. Triggers background evaluation in ML Service.
   * 5. Persists assistant response to MongoDB upon stream completion.
   */
  @Post()
  async chat(
    @Body() body: ChatRequestDto,
    @Headers('x-user-tier') userTier: string = 'free',
    @Headers('x-user-id') userId: string = 'default-user',
    @Res() res: Response,
  ) {
    // Generate or extract a consistent ID for this interaction.
    // This ID links the User Prompt, ML Response, and Ragas Evaluation.
    // We allow the frontend to supply it to facilitate client-side state management.
    const messageId = (body as any)['messageId'] || crypto.randomUUID();

    this.logger.log(`Processing chat interaction [${messageId}] for user ${userId} (Tier: ${userTier})`);

    // 1. Persist User Intent
    await this.conversationsService.addMessage(userId, 'user', body.message, { messageId });

    // 2. Prepare Context (Retrieve history)
    const conversation = await this.conversationsService.findOrCreate(userId);
    const historyPayload = conversation.messages.map(msg => ({
      role: msg.role,
      content: msg.content
    })).slice(0, -1); // Exclude the current message we just added

    try {
      // 3. Forward to ML Backend
      const response = await this.httpService.axiosRef({
        method: 'post',
        url: `${this.mlServiceUrl}/chat`,
        data: {
          query: body.message,
          history: historyPayload,
          message_id: messageId // Crucial: Send ID to ML for tracking evaluation
        },
        headers: {
          'X-User-Tier': userTier,
          'Content-Type': 'application/json',
        },
        responseType: 'stream',
      });

      const stream = response.data;
      let fullResponseText = '';

      // Set headers for Server-Sent Events (SSE)
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Message-Id', messageId); // Return ID to client

      // 4. Handle Stream
      stream.on('data', (chunk: Buffer) => {
        const textChunk = chunk.toString();
        fullResponseText += textChunk;
        res.write(textChunk); // Pipe chunk to client
      });

      stream.on('end', async () => {
        this.logger.log(`Stream finished for [${messageId}]. Persisting response.`);

        // 5. Persist Assistant Response
        await this.conversationsService.addMessage(userId, 'assistant', fullResponseText, {
          model: userTier === 'pro' ? 'Gemma 2' : 'Llama 3.1',
          tier: userTier,
          evaluationId: messageId // Link to future evaluation metrics
        });
        res.end();
      });

      stream.on('error', (err: Error) => {
        this.logger.error('Stream transmission error:', err);
        res.end();
      });

    } catch (error: unknown) {
      this.logger.error('Failed to establish connection with ML Backend', (error as Error).message);
      res.status(500).json({ error: 'AI Agent unavailable' });
    }
  }
}
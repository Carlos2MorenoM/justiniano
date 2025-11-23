import { Controller, Post, Body, Res, Headers, Logger } from '@nestjs/common';
import type { Response } from 'express';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { ConversationsService } from '../conversations/conversations.service';
import { ChatRequestDto } from './dto/chat-request.dto';
import { firstValueFrom } from 'rxjs';

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

  @Post()
  async chat(
    @Body() body: ChatRequestDto,
    @Headers('x-user-tier') userTier: string = 'free', // Default to free
    @Headers('x-user-id') userId: string = 'default-user', // Mock user for now
    @Res() res: Response,
  ) {
    this.logger.log(`Processing chat for user ${userId} (Tier: ${userTier})`);

    // 1. Save User Message to MongoDB
    await this.conversationsService.addMessage(userId, 'user', body.message);

    // 2. Retrieve History for Context
    // We get the full conversation document to inject into the ML context
    const conversation = await this.conversationsService.findOrCreate(userId);
    
    // Format history for ML (exclude the just-added message to avoid duplication if needed, 
    // but usually ML expects previous context. Let's clean it up.)
    const historyPayload = conversation.messages.map(msg => ({
        role: msg.role,
        content: msg.content
    })).slice(0, -1); // Remove the last one we just added, as it is sent as 'query'

    // 3. Call ML Backend with Streaming
    try {
      const response = await this.httpService.axiosRef({
        method: 'post',
        url: `${this.mlServiceUrl}/chat`,
        data: {
          query: body.message,
          history: historyPayload, 
        },
        headers: {
          'X-User-Tier': userTier,
          'Content-Type': 'application/json',
        },
        responseType: 'stream',
      });

      // 4. Pipe the stream to the client and accumulate text
      const stream = response.data;
      let fullResponseText = '';

      // Set headers for Server-Sent Events (SSE) compatibility
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      stream.on('data', (chunk: Buffer) => {
        const textChunk = chunk.toString();
        fullResponseText += textChunk;
        res.write(textChunk); // Forward chunk to frontend
      });

      stream.on('end', async () => {
        // 5. Save Assistant Response to MongoDB when stream finishes
        this.logger.log('Stream finished. Saving response to DB.');
        await this.conversationsService.addMessage(userId, 'assistant', fullResponseText, {
            model: userTier === 'pro' ? 'Gemma' : 'Llama 3.1',
            timestamp: new Date()
        });
        res.end();
      });

      stream.on('error', (err) => {
        this.logger.error('Stream error:', err);
        res.end(); // Close connection on error
      });

    } catch (error) {
      this.logger.error('Error calling ML Backend', error.message);
      res.status(500).json({ error: 'Failed to connect to AI Agent' });
    }
  }
}
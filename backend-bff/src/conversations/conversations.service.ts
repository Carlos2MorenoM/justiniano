import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Conversation } from './schemas/conversation.schema';

@Injectable()
export class ConversationsService {
  private readonly logger = new Logger(ConversationsService.name);

  constructor(
    @InjectModel(Conversation.name) private conversationModel: Model<Conversation>,
  ) { }

  // Find existing conversation or create a new one for the user
  async findOrCreate(userId: string): Promise<Conversation> {
    let conversation = await this.conversationModel.findOne({ userId }).exec();
    if (!conversation) {
      conversation = new this.conversationModel({ userId, messages: [] });
      await conversation.save();
    }
    return conversation;
  }

  // Append a new message to the conversation history
  async addMessage(
    userId: string,
    role: 'user' | 'assistant',
    content: string,
    metadata?: any,
  ) {
    try {
      let conversation = await this.conversationModel.findOne({ userId });

      if (!conversation) {
        conversation = new this.conversationModel({ userId, messages: [] });
      }

      conversation.messages.push({
        role,
        content,
        timestamp: new Date(),
        metadata,
      });

      const savedDoc = await conversation.save();
      this.logger.log(`Message saved for user ${userId}. Total messages: ${savedDoc.messages.length}`);
      return savedDoc;

    } catch (error) {
      this.logger.error(`Failed to save message for user ${userId}`, error);
      throw error;
    }
  }

  // Retrieve full history for context reconstruction
  async getHistory(userId: string) {
    return this.conversationModel.findOne({ userId }).exec();
  }
}
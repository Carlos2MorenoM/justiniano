import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Conversation } from './schemas/conversation.schema';

@Injectable()
export class ConversationsService {
  constructor(
    @InjectModel(Conversation.name) private conversationModel: Model<Conversation>,
  ) {}

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
    return this.conversationModel
      .findOneAndUpdate(
        { userId },
        {
          $push: {
            messages: {
              role,
              content,
              timestamp: new Date(),
              metadata,
            },
          },
        },
        { new: true, upsert: true },
      )
      .exec();
  }

  // Retrieve full history for context reconstruction
  async getHistory(userId: string) {
    return this.conversationModel.findOne({ userId }).exec();
  }
}
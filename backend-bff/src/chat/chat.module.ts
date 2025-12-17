import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { HttpModule } from '@nestjs/axios';
import { ConversationsModule } from '../conversations/conversations.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    HttpModule, // To call Backend ML
    ConversationsModule, // To save history
    ConfigModule, // To read env vars
  ],
  controllers: [ChatController],
})
export class ChatModule {}

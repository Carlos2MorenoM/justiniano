import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConversationsService } from './conversations.service';
import {
  Conversation,
  ConversationSchema,
} from './schemas/conversation.schema';

@Module({
  imports: [
    // Register the schema with Mongoose so it can be injected
    MongooseModule.forFeature([
      { name: Conversation.name, schema: ConversationSchema },
    ]),
  ],
  providers: [ConversationsService],
  exports: [ConversationsService], // Export required for ChatController usage
})
export class ConversationsModule {}

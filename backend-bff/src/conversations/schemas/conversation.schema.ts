import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ConversationDocument = HydratedDocument<Conversation>;

@Schema({ _id: false })
export class Message {
  @Prop({ required: true, enum: ['user', 'assistant', 'system'] })
  role: string;

  @Prop({ required: true })
  content: string;

  @Prop({ default: Date.now })
  timestamp: Date;

  //Optional metadata for per-message metrics (e.g., latency)
  @Prop({ type: Object })
  metadata?: Record<string, any>;
}

const MessageSchema = SchemaFactory.createForClass(Message);

@Schema({ timestamps: true })
export class Conversation {
  //Index for fast lookups by user ID
  @Prop({ Required: true, index: true })
  userId: string;

  @Prop({ default: 'free' })
  tier: string;

  @Prop({ type: [MessageSchema], default: [] })
  messages: Message[];

  //Session-level metrics for analysis
  @Prop({ type: Object })
  sessionMetrics?: {
    totalTokens?: number;
    averageLatency?: number;
  };
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);

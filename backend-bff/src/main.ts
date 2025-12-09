import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { setupSwagger } from './setup-swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for development flexibility
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Initialize Swagger documentation
  setupSwagger(app);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
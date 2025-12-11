import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

/**
 * Configures and initializes Swagger documentation for the application.
 * This setup prepares the OpenApi specification required for the AI SDK Generator.
 *
 * @param app - The NestJS application instance
 */
export function setupSwagger(app: INestApplication): void {
    const config = new DocumentBuilder()
        .setTitle('Justiniano BFF API')
        .setDescription(
            'API Gateway and orchestrator for the Justiniano RAG system. Single Source of Truth for the AI SDK Generator.',
        )
        .setVersion('1.0')
        .addTag('justiniano')
        .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);
}
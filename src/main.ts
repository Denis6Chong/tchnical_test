import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { LoggerMiddleware } from './middleware/logging.middleware';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Swagger config
  const config = new DocumentBuilder()
    .setTitle('E-commerce API')
    .setDescription('API documentation for the e-commerce platform')
    .setVersion('1.0')
    .addBearerAuth() // enables JWT auth in docs
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
  app.use(new LoggerMiddleware().use);
   app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  await app.listen(process.env.PORT ?? 3000,"0.0.0.0");
}
bootstrap();

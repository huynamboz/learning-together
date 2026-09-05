import 'reflect-metadata';
import { randomUUID } from 'node:crypto';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/http/http-exception.filter';
import { requestContext } from './common/http/request-context';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));
  app.use((request: { header: (name: string) => string | undefined }, response: { setHeader: (name: string, value: string) => void }, next: () => void) => {
    const requestId = request.header('x-request-id') ?? randomUUID();
    response.setHeader('x-request-id', requestId);
    requestContext.run({ requestId }, next);
  });
  app.use(helmet());
  const allowedOrigins = (process.env.APP_ORIGIN ?? 'http://localhost:3011').split(',').map((origin) => origin.trim()).filter(Boolean);
  app.enableCors({ origin: allowedOrigins, credentials: true });
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  app.useGlobalFilters(new HttpExceptionFilter());

  const swaggerConfig = new DocumentBuilder().setTitle('Đậu TOEIC API').setDescription('API nền tảng học TOEIC').setVersion('1.0').addBearerAuth().build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, swaggerConfig));

  await app.listen(Number(process.env.PORT ?? 3010));
}

void bootstrap();

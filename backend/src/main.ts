import { NestFactory, Reflector } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe, Logger, ClassSerializerInterceptor } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });
  const config = app.get(ConfigService);
  const isProduction = config.get('NODE_ENV') === 'production';

  // In spatele unui reverse proxy (nginx, hosting), limitarea pe IP trebuie sa vada IP-ul real al clientului
  if (config.get('TRUST_PROXY') === 'true') app.set('trust proxy', 1);

  // Securitate: header-e HTTP, marimea cererilor (cea mai mare cerere legitima e poza de profil, ~2.8 MB), CORS
  app.use(helmet());
  app.use(json({ limit: '4mb' }));
  app.use(urlencoded({ limit: '4mb', extended: true }));
  app.enableCors({
    origin: config.get('FRONTEND_URL', 'http://localhost:3000'),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());
  // ClassSerializerInterceptor aplica @Exclude() din entitati (parola, token-uri, telefon etc.);
  // fara el, orice relatie eager spre User trimitea toate coloanele userului catre client
  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(app.get(Reflector)),
    new TransformInterceptor(),
    new LoggingInterceptor(),
  );

  // Documentatia Swagger: disponibila in dezvoltare; in productie doar daca e activata explicit
  const swaggerEnabled = !isProduction || config.get('SWAGGER_ENABLED') === 'true';
  if (swaggerEnabled) {
    const document = SwaggerModule.createDocument(app, new DocumentBuilder()
      .setTitle('UniProject Hub API')
      .setDescription('Platform for managing university student projects')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('auth', 'Authentication & Authorization')
      .addTag('users', 'User Management')
      .addTag('projects', 'Project Management')
      .addTag('teams', 'Team Management')
      .addTag('tasks', 'Task Management')
      .addTag('documents', 'Document Management')
      .addTag('evaluations', 'Evaluation & Grading')
      .addTag('notifications', 'Notifications')
      .addTag('ai', 'AI Analytics')
      .addTag('chat', 'Real-time Chat')
      .addTag('dashboard', 'Dashboard & Analytics')
      .build());
    SwaggerModule.setup('api/docs', app, document, { swaggerOptions: { persistAuthorization: true } });
  }

  const port = config.get<number>('PORT', 4000);
  await app.listen(port);

  logger.log(`🚀 UniProject Hub API running on: http://localhost:${port}/api/v1`);
  if (swaggerEnabled) logger.log(`📚 Swagger docs: http://localhost:${port}/api/docs`);
}

bootstrap();

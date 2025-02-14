import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { Logger } from '@nestjs/common';
// import { WsAdapter } from '@nestjs/platform-ws';
import { exec } from 'child_process';

async function bootstrap() {
  // load data from GitHub repo to local db
  console.log('start loading')
  const child = exec(
    'node ./src/lib/db/populate-db.js',
    (error, stdout, stderr) => {
      if (error) {
        console.error(`Error populating database: ${stderr}`);
      } else {
        console.log(`Database population output: ${stdout}`);
      }
    },
  );

  // Redirect stdout and stderr to the console
  child.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
  });

  child.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
  });
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
  });

  app.useWebSocketAdapter(new IoAdapter(app));
  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  Logger.log(`🚀 Server running on http://localhost:${port}`, 'Bootstrap');
  Logger.log(`📡 WebSocket server is ready`, 'Bootstrap');
}
bootstrap();

import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { dataSourceOptions } from './lib/db/data-source';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuoteModule } from './quote/quote.module';
// import { BibleVerseGateway } from './quote/bible-verse.gateway';

@Module({
  imports: [TypeOrmModule.forRoot(dataSourceOptions), QuoteModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

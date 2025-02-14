import { forwardRef, Module } from '@nestjs/common';
import { QuoteService } from './quote.service';
import { QuoteController } from './quote.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BibleVerse } from './entities/bible-verse.entity';
import { BibleVerseGateway } from 'src/quote/bible-verse.gateway';

@Module({
  imports: [TypeOrmModule.forFeature([BibleVerse]),
  forwardRef(() => QuoteModule)
],
  controllers: [QuoteController],
  providers: [QuoteService, BibleVerseGateway],
  exports: [QuoteService],
})
export class QuoteModule {}

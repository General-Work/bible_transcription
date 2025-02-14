import { Controller, Post, Body, Get } from '@nestjs/common';
import { QuoteService } from './quote.service';

@Controller('quote')
export class QuoteController {
  constructor(private readonly quoteService: QuoteService) {}

  @Post('process-audio')
  async processAudio(
    @Body('audio') audioBuffer: Buffer,
    @Body('translation') translation: string,
  ) {
    // console.log({ audioBuffer, translation });
    // const transcription = await this.quoteService.transcribeAudio(audioBuffer);
    // const quoteAddressa =
    //   await this.quoteService.extractBibleQuote(transcription);
    // if (!quoteAddress) return { error: 'No Bible quote detected.' };
    // const quote = await this.quoteService.getBibleQuote(
    //   quoteAddress,
    //   translation,
    // );
    // return { quote };
  }

  @Get('translations')
  async getTranslations(): Promise<string[]> {
    return this.getTranslations();
  }
}

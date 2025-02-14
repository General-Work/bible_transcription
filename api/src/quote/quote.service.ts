import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BibleVerse } from './entities/bible-verse.entity';
import { BibleVerseGateway } from './bible-verse.gateway';
import { writeFile, unlink } from 'fs/promises';
import * as path from 'path';
import * as fs from 'fs';
import { AssemblyAI } from 'assemblyai';
import { createClient } from '@deepgram/sdk';
import { Readable } from 'stream';

@Injectable()
export class QuoteService {
  private openai: OpenAI;
  private gemini: GoogleGenerativeAI;

  constructor(
    @InjectRepository(BibleVerse)
    private bibleVerseRepository: Repository<BibleVerse>,
    private webSocketGateway: BibleVerseGateway,
  ) {
    // console.log(`OpenAI API Key: ${process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY : "Missing"}`);

    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,

      timeout: 60000,
    });
    this.gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }

  async transcribeAudio(audioBuffer: Buffer): Promise<string> {
    // try {
    //   const filePath = path.join(__dirname, `temp_audio_${Date.now()}.wav`);
    //   // Write audio buffer to a file
    //   await writeFile(filePath, audioBuffer);
    //   // Stream the file for transcription
    //   const response = await this.openai.audio.transcriptions.create({
    //     model: 'whisper-1',
    //     file: fs.createReadStream(filePath),
    //   });
    //   // Emit the transcription result
    //   this.webSocketGateway.server.emit('transcription', {
    //     text: response.text,
    //   });
    //   // Clean up temporary file
    //   await unlink(filePath);
    //   return response.text;
    // } catch (error) {
    //   console.error('Error transcribing audio:', error);
    //   throw new Error('Failed to transcribe audio');
    // }
    const client = new AssemblyAI({ apiKey: process.env.ASSEMBLYAI_API_KEY });
    const filePath = path.join(process.cwd(), `temp_audio_${Date.now()}.wav`);
    try {
      await writeFile(filePath, audioBuffer);
      const transcript = await client.transcripts.transcribe({
        audio: filePath,
      });
      await unlink(filePath);
      this.webSocketGateway.server.emit('transcription', {
        text: transcript.text,
      });
      return transcript.text;
    } catch (error) {
      console.error('Error transcribing audio:', error);
      await unlink(filePath).catch((unlinkError) => {
        console.error('Error deleting temporary audio file:', unlinkError);
      });
      throw new Error('Failed to transcribe audio');
    }
  }
  async extractBibleQuote(
    text: string,
    currentVerse?: { book: string; chapter: number; verse: number },
  ): Promise<string | null> {
    const model = this.gemini.getGenerativeModel({ model: 'gemini-pro' });

    if (text.toLowerCase().includes('next verse') && currentVerse) {
      return this.handleImplicitMention(text, currentVerse);
    }

    // Extract explicit Bible quote address
    const prompt = `Extract a Bible quote address from the following text: "${text}". Return only the address (e.g., "John 3:16") or null if none is found.`;
    const result = await model.generateContent(prompt);
    const quoteAddress = result.response.text().trim();
    return quoteAddress === 'null' ? null : quoteAddress;
  }

  async detectBibleVersion(text: string): Promise<string | null> {
    const model = this.gemini.getGenerativeModel({ model: 'gemini-pro' });
    const prompt = `Extract the Bible version from the following text: "${text}". Return only the version (e.g., "NIV", "KJV") or null if none is found.`;
    const result = await model.generateContent(prompt);
    const version = result.response.text().trim();
    return version === 'null' ? null : version;
  }

  async handleImplicitMention(
    text: string,
    currentVerse: { book: string; chapter: number; verse: number },
  ): Promise<string | null> {
    const model = this.gemini.getGenerativeModel({ model: 'gemini-pro' });
    const prompt = `Given the current Bible verse (${currentVerse.book} ${currentVerse.chapter}:${currentVerse.verse}), determine the next verse based on the following text: "${text}". Return only the address (e.g., "John 3:17") or null if none is found.`;
    const result = await model.generateContent(prompt);
    const nextVerse = result.response.text().trim();
    return nextVerse === 'null' ? null : nextVerse;
  }

  async getBibleQuote(
    quoteAddress: string,
    translation: string,
  ): Promise<string | null> {
    const [book, chapterVerse] = quoteAddress.split(' ');
    const [chapter, verse] = chapterVerse.split(':');
    const quote = await this.bibleVerseRepository.findOne({
      where: {
        book,
        chapter: parseInt(chapter),
        verse: parseInt(verse),
        translation,
      },
    });
    if (quote) {
      this.webSocketGateway.server.emit('quote', { quote: quote.text });
    }
    return quote ? quote.text : null;
  }
  async getTranslations(): Promise<string[]> {
    const translations = await this.bibleVerseRepository
      .createQueryBuilder('verse')
      .select('DISTINCT verse.translation', 'translation')
      .getRawMany();
    return translations.map((t) => t.translation);
  }
}

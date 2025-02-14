import { forwardRef, Inject, Logger } from '@nestjs/common';
import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { QuoteService } from './quote.service';

const translationMap: Record<string, string> = {
  AKLV: 'AKLV',
  ASV: 'ASV',
  BRG: 'BRG',
  EHV: 'EHV',
  ESV: 'ESV',
  ESVUK: 'ESVUK',
  GNV: 'GNV',
  GW: 'GW',
  ISV: 'ISV',
  JUB: 'JUB',
  KJ21: 'KJ21',
  KJV: 'KJV',
  LEB: 'LEB',
  MEV: 'MEV',
  NASB: 'NASB',
  NASB1995: 'NASB1995',
  NET: 'NET',
  NIV: 'NIV',
  NIVUK: 'NIVUK',
  NKJV: 'NKJV',
  NLT: 'NLT',
  NLV: 'NLV',
  NOG: 'NOG',
  NRSV: 'NRSV',
  NRSVUE: 'NRSVUE',
  WEB: 'WEB',
};

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
})
export class BibleVerseGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private logger = new Logger(BibleVerseGateway.name);
  private clientSessions: Map<
    string,
    {
      currentVerse: { book: string; chapter: number; verse: number };
      version: string;
    }
  > = new Map();

  @WebSocketServer()
  server: Server;

  constructor(
    @Inject(forwardRef(() => QuoteService))
    private readonly quoteService: QuoteService,
  ) {}

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.clientSessions.delete(client.id);
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    if (client) {
      this.clientSessions.set(client.id, {
        currentVerse: null,
        version: 'NIV',
      });
    } else {
      this.logger.error('Client connection failed or client object is null.');
    }
  }

  @SubscribeMessage('audioStream')
  async handleAudioStream(@MessageBody() data: any): Promise<void> {
    const clientId = data[0] as string;
    const buffer = data[1] as Buffer;
    if (!clientId) {
      this.logger.error(
        'Received audioStream event with an invalid client object',
      );
      this.server.emit('error', { message: 'Invalid or disconnected client' });
      return;
    }

    try {
      this.server.emit('transcription', { status: 'processing' });

      const transcription = await this.quoteService.transcribeAudio(buffer);
      this.server.emit('transcription', { text: transcription });

      const generatedVersion = Object.keys(translationMap).find((key) =>
        transcription.toUpperCase().includes(key),
      );

      let version =
        generatedVersion ||
        this.clientSessions.get(clientId)?.version ||
        (await this.quoteService.detectBibleVersion(transcription));

      if (!this.clientSessions.has(clientId)) {
        this.logger.error(
          `Client session not found for client ID: ${clientId}`,
        );
        return;
      }

      this.clientSessions.get(clientId).version = version;

      let quoteAddress: string | null = null;
      if (!generatedVersion) {
        const currentVerse = this.clientSessions.get(clientId).currentVerse;
        quoteAddress = await this.quoteService.extractBibleQuote(
          transcription,
          currentVerse,
        );
      }

      if (quoteAddress) {
        const [book, chapterVerse] = quoteAddress.split(' ');
        const [chapter, verse] = chapterVerse.split(':');
        this.clientSessions.get(clientId).currentVerse = {
          book,
          chapter: parseInt(chapter),
          verse: parseInt(verse),
        };

        const quote = await this.quoteService.getBibleQuote(
          quoteAddress,
          version,
        );
        this.server.emit('quote', {
          quote,
          translation: version,
          quoteAddress,
        });
      } else {
        const newVerse = this.clientSessions.get(clientId)?.currentVerse;
        const currentVersion = this.clientSessions.get(clientId)?.version;
        if (
          newVerse &&
          newVerse.book &&
          newVerse.chapter &&
          newVerse.verse &&
          currentVersion
        ) {
          const temp = await this.quoteService.extractBibleQuote(
            `${newVerse.book} ${newVerse.chapter}:${newVerse.verse}.`,
            newVerse,
          );

          const [book, chapterVerse] = temp.split(' ');
          const [chapter, verse] = chapterVerse.split(':');
          this.clientSessions.get(clientId).currentVerse = {
            book,
            chapter: parseInt(chapter),
            verse: parseInt(verse),
          };

          const quote = await this.quoteService.getBibleQuote(temp, version);
          this.server.emit('quote', {
            quote: quote,
            translation: version,
            quoteAddress: temp,
          });
        } else {
          this.server.emit('quote', {
            quote: null,
            translation: null,
            quoteAddress: null,
          });
        }
      }
    } catch (error) {
      this.logger.error('Error processing audio stream:', error);
      this.server.emit('error', { message: 'Failed to process audio' });
    }
  }
}

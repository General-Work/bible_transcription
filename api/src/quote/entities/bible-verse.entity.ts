import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity()
export class BibleVerse {
  @PrimaryColumn()
  book_id: number;

  @Column()
  book: string;

  @PrimaryColumn()
  chapter: number;

  @PrimaryColumn()
  verse: number;

  @Column()
  text: string;

  @PrimaryColumn()
  translation: string; // Add this field to store the translation version
}

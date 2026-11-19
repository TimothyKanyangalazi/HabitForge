import { getDatabase } from '../database/database';
import { FavoriteQuote } from '../types';

export const favoriteQuoteService = {
  async getAll(): Promise<FavoriteQuote[]> {
    const db = getDatabase();
    return db.getAllAsync<FavoriteQuote>(
      'SELECT id, text, author, created_at FROM favorite_quotes ORDER BY id DESC'
    );
  },

  async add(text: string, author: string): Promise<FavoriteQuote> {
    const normalizedText = text.trim();
    const normalizedAuthor = author.trim();

    if (!normalizedText) {
      throw new Error('Enter a quote before saving it.');
    }

    const db = getDatabase();
    const existing = await db.getFirstAsync<{ id: number }>(
      `SELECT id FROM favorite_quotes
       WHERE text = ? COLLATE NOCASE AND author = ? COLLATE NOCASE`,
      [normalizedText, normalizedAuthor]
    );
    if (existing) {
      throw new Error('This quote is already in your favorites.');
    }

    const result = await db.runAsync(
      'INSERT INTO favorite_quotes (text, author) VALUES (?, ?)',
      [normalizedText, normalizedAuthor]
    );

    const quote = await db.getFirstAsync<FavoriteQuote>(
      'SELECT id, text, author, created_at FROM favorite_quotes WHERE id = ?',
      [result.lastInsertRowId]
    );
    if (!quote) {
      throw new Error('The quote was saved but could not be loaded.');
    }
    return quote;
  },

  async remove(id: number): Promise<void> {
    const db = getDatabase();
    const result = await db.runAsync(
      'DELETE FROM favorite_quotes WHERE id = ?',
      [id]
    );
    if (result.changes === 0) {
      throw new Error('This quote could not be found.');
    }
  },
};

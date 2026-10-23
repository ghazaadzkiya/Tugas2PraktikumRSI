import { and, avg, count, eq, sql } from 'drizzle-orm';
import { getDb } from '../db/index.ts';
import { reviews, stalls } from '../db/schema.ts';

export class ReviewRepository {
  async findByStallAndUser(stallId: number, userId: number) {
    const db = await getDb();
    const rows = await db.select().from(reviews).where(and(
      eq(reviews.stallId, stallId), eq(reviews.userId, userId),
    ));
    return rows[0];
  }

  async create(input: { stallId: number; userId: number; rating: number; comment: string | null }) {
    const db = await getDb();
    const rows = await db.insert(reviews).output().values({ ...input, likeCount: 0 });
    return rows[0];
  }

  async refreshStallSummary(stallId: number) {
    const db = await getDb();
    const stats = await db.select({
      total: count(),
      average: avg(sql<number>`cast(${reviews.rating} as decimal(10, 4))`),
    }).from(reviews).where(eq(reviews.stallId, stallId));
    await db.update(stalls).set({
      reviewCount: Number(stats[0]?.total ?? 0),
      avgRating: Number(stats[0]?.average ?? 0).toFixed(2),
    }).where(eq(stalls.id, stallId));
  }
}
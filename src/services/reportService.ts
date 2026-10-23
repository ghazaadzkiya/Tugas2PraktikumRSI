import { avg, count, sql } from 'drizzle-orm';
import { getDb } from '../db/index.ts';
import { reviews, stalls, users } from '../db/schema.ts';
import type { ReportSummaryDto } from '../dtos/reportDto.ts';

export class ReportService {
  async getSummary(): Promise<ReportSummaryDto> {
    const db = await getDb();
    const [userRows, stallRows, reviewRows, averageRows] = await Promise.all([
      db.select({ total: count() }).from(users),
      db.select({ total: count() }).from(stalls),
      db.select({ total: count() }).from(reviews),
      db.select({ average: avg(sql<number>`cast(${reviews.rating} as decimal(10, 4))`) }).from(reviews),
    ]);
    const categories = await db.select({ category: stalls.category, total: count() })
      .from(stalls).groupBy(stalls.category).orderBy(stalls.category);

    return {
      totalUsers: Number(userRows[0]?.total ?? 0),
      totalStalls: Number(stallRows[0]?.total ?? 0),
      totalReviews: Number(reviewRows[0]?.total ?? 0),
      averageRating: Number(averageRows[0]?.average ?? 0),
      stallsByCategory: categories.map((row) => ({
        category: row.category,
        total: Number(row.total),
      })),
    };
  }
}
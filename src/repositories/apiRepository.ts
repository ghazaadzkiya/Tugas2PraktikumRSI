import { and, avg, eq, count, sql } from 'drizzle-orm';
import { getDb } from '../db/index.ts';
import { auditLogs, flags, likes, menuItems, reviews, stalls, users } from '../db/schema.ts';

const menuSelection = {
  id: menuItems.id,
  stallId: menuItems.stallId,
  name: menuItems.name,
  price: menuItems.price,
  isAvailable: menuItems.isAvailable,
  stall: {
    id: stalls.id,
    name: stalls.name,
    category: stalls.category,
    location: stalls.location,
  },
};

const reviewSelection = {
  id: reviews.id,
  stallId: reviews.stallId,
  userId: reviews.userId,
  rating: reviews.rating,
  comment: reviews.comment,
  likeCount: reviews.likeCount,
  createdAt: reviews.createdAt,
  updatedAt: reviews.updatedAt,
  user: { id: users.id, name: users.name },
};

export class ApiRepository {
  async listUsers() {
    const db = await getDb();
    return db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
    }).from(users).orderBy(users.id);
  }

  async createUser(input: { name: string; email: string; passwordHash: string; role: 'admin' | 'owner' | 'customer' }) {
    const db = await getDb();
    const rows = await db.insert(users).output({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
    }).values(input);
    return rows[0];
  }

  async listMenuItems() {
    const db = await getDb();
    return db.select(menuSelection).from(menuItems)
      .innerJoin(stalls, eq(menuItems.stallId, stalls.id)).orderBy(menuItems.id);
  }

  async getMenuItem(id: number) {
    const db = await getDb();
    const rows = await db.select(menuSelection).from(menuItems)
      .innerJoin(stalls, eq(menuItems.stallId, stalls.id)).where(eq(menuItems.id, id));
    return rows[0];
  }

  async createMenuItem(input: { stallId: number; name: string; price: number; isAvailable: boolean }) {
    const db = await getDb();
    const rows = await db.insert(menuItems).output({ id: menuItems.id }).values(input);
    return rows[0] ? this.getMenuItem(rows[0].id) : undefined;
  }

  async updateMenuItem(id: number, input: Partial<{ stallId: number; name: string; price: number; isAvailable: boolean }>) {
    const db = await getDb();
    const existing = await this.getMenuItem(id);
    if (!existing) return undefined;
    await db.update(menuItems).set(input).where(eq(menuItems.id, id));
    return this.getMenuItem(id);
  }

  async deleteMenuItem(id: number) {
    const db = await getDb();
    const existing = await this.getMenuItem(id);
    if (!existing) return undefined;
    await db.delete(menuItems).where(eq(menuItems.id, id));
    return existing;
  }

  async listReviews() {
    const db = await getDb();
    return db.select(reviewSelection).from(reviews)
      .innerJoin(users, eq(reviews.userId, users.id)).orderBy(reviews.id);
  }

  async getReview(id: number) {
    const db = await getDb();
    const rows = await db.select(reviewSelection).from(reviews)
      .innerJoin(users, eq(reviews.userId, users.id)).where(eq(reviews.id, id));
    return rows[0];
  }

  async createReview(input: { stallId: number; userId: number; rating: number; comment?: string | null }) {
    const db = await getDb();
    const rows = await db.insert(reviews).output({ id: reviews.id }).values({ ...input, likeCount: 0 });
    if (!rows[0]) return undefined;
    await this.refreshStallRating(input.stallId);
    return this.getReview(rows[0].id);
  }

  async deleteReview(id: number) {
    const db = await getDb();
    const existing = await this.getReview(id);
    if (!existing) return undefined;
    await db.delete(likes).where(eq(likes.reviewId, id));
    await db.delete(flags).where(eq(flags.reviewId, id));
    await db.delete(reviews).where(eq(reviews.id, id));
    await this.refreshStallRating(existing.stallId);
    return existing;
  }

  async createLike(input: { reviewId: number; userId: number }) {
    const db = await getDb();
    const existing = await db.select().from(likes).where(and(
      eq(likes.reviewId, input.reviewId),
      eq(likes.userId, input.userId),
    ));
    if (existing[0]) throw new Error('LIKE_ALREADY_EXISTS');

    const rows = await db.insert(likes).output().values(input);
    if (rows[0]) {
      await db.update(reviews).set({ likeCount: sql`${reviews.likeCount} + 1` })
        .where(eq(reviews.id, input.reviewId));
    }
    return rows[0];
  }

  async deleteLike(id: number) {
    const db = await getDb();
    const existing = await db.select().from(likes).where(eq(likes.id, id));
    if (!existing[0]) return undefined;
    const rows = await db.delete(likes).where(eq(likes.id, id)).output();
    if (rows[0]) {
      await db.update(reviews).set({
        likeCount: sql`CASE WHEN ${reviews.likeCount} > 0 THEN ${reviews.likeCount} - 1 ELSE 0 END`,
      }).where(eq(reviews.id, rows[0].reviewId));
    }
    return rows[0];
  }

  async listFlags() {
    const db = await getDb();
    return db.select().from(flags).orderBy(flags.id);
  }

  async updateFlagStatus(id: number, status: 'pending' | 'dismissed' | 'resolved') {
    const db = await getDb();
    const rows = await db.update(flags).set({ status }).where(eq(flags.id, id)).output();
    return rows[0];
  }

  async listAuditLogs() {
    const db = await getDb();
    return db.select().from(auditLogs).orderBy(auditLogs.id);
  }

  async createAuditLog(input: {
    userId: number;
    action: string;
    targetTable: string;
    targetId: number;
    metadata?: string | null;
  }) {
    const db = await getDb();
    const rows = await db.insert(auditLogs).output().values(input);
    return rows[0];
  }

  private async refreshStallRating(stallId: number) {
    const db = await getDb();
    const [summary] = await db.select({ average: avg(reviews.rating), total: count() })
      .from(reviews).where(eq(reviews.stallId, stallId));
    await db.update(stalls).set({
      avgRating: Number(summary?.average ?? 0).toFixed(2),
      reviewCount: Number(summary?.total ?? 0),
    }).where(eq(stalls.id, stallId));
  }
}
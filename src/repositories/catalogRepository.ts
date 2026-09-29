import { eq, sql } from 'drizzle-orm';
import { getDb } from '../db/index.ts';
import { auditLogs, flags, likes, menuItems, reviews, stalls, users } from '../db/schema.ts';

export class CatalogRepository {
  async findUsers() {
    const db = await getDb();
    return db.select({ id: users.id, name: users.name, email: users.email, role: users.role, createdAt: users.createdAt }).from(users).orderBy(users.id);
  }

  async createUser(input: { name: string; email: string; passwordHash: string; role: 'admin' | 'owner' | 'customer' }) {
    const db = await getDb();
    const rows = await db.insert(users).output().values(input);
    return rows[0];
  }

  async findMenuItems() {
    const db = await getDb();
    return db.select({ id: menuItems.id, stallId: menuItems.stallId, stallName: stalls.name, name: menuItems.name, price: menuItems.price, isAvailable: menuItems.isAvailable }).from(menuItems).innerJoin(stalls, eq(menuItems.stallId, stalls.id)).orderBy(menuItems.id);
  }

  async findMenuItemById(id: number) {
    const db = await getDb();
    const rows = await db.select({ id: menuItems.id, stallId: menuItems.stallId, stallName: stalls.name, name: menuItems.name, price: menuItems.price, isAvailable: menuItems.isAvailable }).from(menuItems).innerJoin(stalls, eq(menuItems.stallId, stalls.id)).where(eq(menuItems.id, id));
    return rows[0];
  }

  async createMenuItem(input: { stallId: number; name: string; price: number; isAvailable: boolean }) {
    const db = await getDb();
    const rows = await db.insert(menuItems).output().values(input);
    return rows[0];
  }

  async updateMenuItem(id: number, input: Partial<{ stallId: number; name: string; price: number; isAvailable: boolean }>) {
    const db = await getDb();
    const rows = await db.update(menuItems).set(input).where(eq(menuItems.id, id)).output();
    return rows[0];
  }

  async deleteMenuItem(id: number) {
    const db = await getDb();
    const rows = await db.delete(menuItems).where(eq(menuItems.id, id)).output();
    return rows[0];
  }

  async findReviews(stallId?: number) {
    const db = await getDb();
    return db.select({ id: reviews.id, stallId: reviews.stallId, userId: reviews.userId, userName: users.name, rating: reviews.rating, comment: reviews.comment, likeCount: reviews.likeCount, createdAt: reviews.createdAt, updatedAt: reviews.updatedAt }).from(reviews).innerJoin(users, eq(reviews.userId, users.id)).where(stallId === undefined ? undefined : eq(reviews.stallId, stallId)).orderBy(reviews.id);
  }

  async createReview(input: { stallId: number; userId: number; rating: number; comment?: string | null }) {
    const db = await getDb();
    const rows = await db.insert(reviews).output().values({ ...input, comment: input.comment ?? null, likeCount: 0 });
    return rows[0];
  }

  async deleteReview(id: number) {
    const db = await getDb();
    const rows = await db.delete(reviews).where(eq(reviews.id, id)).output();
    return rows[0];
  }

  async createLike(input: { reviewId: number; userId: number }) {
    const db = await getDb();
    return db.transaction(async (tx) => {
      const rows = await tx.insert(likes).output().values(input);
      await tx.update(reviews).set({ likeCount: sql`${reviews.likeCount} + 1` }).where(eq(reviews.id, input.reviewId));
      return rows[0];
    });
  }

  async deleteLike(id: number) {
    const db = await getDb();
    return db.transaction(async (tx) => {
      const likeRows = await tx.select().from(likes).where(eq(likes.id, id));
      const like = likeRows[0];
      if (!like) return undefined;
      const rows = await tx.delete(likes).where(eq(likes.id, id)).output();
      await tx.update(reviews).set({ likeCount: sql`CASE WHEN ${reviews.likeCount} > 0 THEN ${reviews.likeCount} - 1 ELSE 0 END` }).where(eq(reviews.id, like.reviewId));
      return rows[0];
    });
  }

  async findFlags() {
    const db = await getDb();
    return db.select({ id: flags.id, reviewId: flags.reviewId, reportedBy: flags.reportedBy, reason: flags.reason, status: flags.status, createdAt: flags.createdAt }).from(flags).orderBy(flags.id);
  }

  async updateFlag(id: number, status: string) {
    const db = await getDb();
    const rows = await db.update(flags).set({ status }).where(eq(flags.id, id)).output();
    return rows[0];
  }

  async findAuditLogs() {
    const db = await getDb();
    return db.select().from(auditLogs).orderBy(auditLogs.id);
  }

  async createAuditLog(input: { userId: number; action: string; targetTable: string; targetId: number; metadata?: string | null }) {
    const db = await getDb();
    const rows = await db.insert(auditLogs).output().values({ ...input, metadata: input.metadata ?? null });
    return rows[0];
  }
}
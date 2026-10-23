import { ApiRepository } from '../repositories/apiRepository.ts';

export class ApiService {
  constructor(private readonly repository: ApiRepository = new ApiRepository()) {}

  listUsers() { return this.repository.listUsers(); }
  listMenuItems() { return this.repository.listMenuItems(); }
  getMenuItem(id: number) { return this.repository.getMenuItem(id); }
  listReviews() { return this.repository.listReviews(); }
  listFlags() { return this.repository.listFlags(); }
  listAuditLogs() { return this.repository.listAuditLogs(); }

  async createUser(input: { name: string; email: string; passwordHash: string; role: 'admin' | 'owner' | 'customer' }) {
    if (!input.name || !input.email || !input.passwordHash || !['admin', 'owner', 'customer'].includes(input.role)) {
      throw new Error('INVALID_USER_INPUT');
    }
    return this.repository.createUser(input);
  }

  async createMenuItem(input: { stallId: number; name: string; price: number; isAvailable?: boolean }) {
    if (!Number.isInteger(input.stallId) || !input.name || !Number.isFinite(input.price) || input.price < 0) {
      throw new Error('INVALID_MENU_INPUT');
    }
    return this.repository.createMenuItem({ ...input, isAvailable: input.isAvailable ?? true });
  }

  updateMenuItem(id: number, input: Partial<{ stallId: number; name: string; price: number; isAvailable: boolean }>) {
    if (input.stallId !== undefined && !Number.isInteger(input.stallId)) throw new Error('INVALID_MENU_INPUT');
    if (input.name !== undefined && !input.name) throw new Error('INVALID_MENU_INPUT');
    if (input.price !== undefined && (!Number.isFinite(input.price) || input.price < 0)) throw new Error('INVALID_MENU_INPUT');
    return this.repository.updateMenuItem(id, input);
  }

  deleteMenuItem(id: number) { return this.repository.deleteMenuItem(id); }

  async createReview(input: { stallId: number; userId: number; rating: number; comment?: string | null }) {
    if (!Number.isInteger(input.stallId) || !Number.isInteger(input.userId) ||
      !Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
      throw new Error('INVALID_REVIEW_INPUT');
    }
    return this.repository.createReview(input);
  }

  deleteReview(id: number) { return this.repository.deleteReview(id); }
  createLike(input: { reviewId: number; userId: number }) {
    if (!Number.isInteger(input.reviewId) || !Number.isInteger(input.userId)) throw new Error('INVALID_LIKE_INPUT');
    return this.repository.createLike(input);
  }
  deleteLike(id: number) { return this.repository.deleteLike(id); }

  async updateFlagStatus(id: number, status: 'pending' | 'dismissed' | 'resolved') {
    if (!['pending', 'dismissed', 'resolved'].includes(status)) throw new Error('INVALID_FLAG_STATUS');
    return this.repository.updateFlagStatus(id, status);
  }

  createAuditLog(input: {
    userId: number;
    action: string;
    targetTable: string;
    targetId: number;
    metadata?: string | null;
  }) {
    if (!Number.isInteger(input.userId) || !input.action || !input.targetTable || !Number.isInteger(input.targetId)) {
      throw new Error('INVALID_AUDIT_INPUT');
    }
    return this.repository.createAuditLog(input);
  }
}
import { CatalogRepository } from '../repositories/catalogRepository.ts';

export class CatalogService {
  constructor(private repository: CatalogRepository = new CatalogRepository()) {}
  getUsers() { return this.repository.findUsers(); }
  createUser(input: Parameters<CatalogRepository['createUser']>[0]) { return this.repository.createUser(input); }
  getMenuItems() { return this.repository.findMenuItems(); }
  async getMenuItem(id: number) { const row = await this.repository.findMenuItemById(id); if (!row) throw new Error('DATA_NOT_FOUND'); return row; }
  async createMenuItem(input: Parameters<CatalogRepository['createMenuItem']>[0]) { const row = await this.repository.createMenuItem(input); if (!row) throw new Error('DATA_NOT_FOUND'); return this.getMenuItem(row.id); }
  async updateMenuItem(id: number, input: Parameters<CatalogRepository['updateMenuItem']>[1]) { const row = await this.repository.updateMenuItem(id, input); if (!row) throw new Error('DATA_NOT_FOUND'); return this.getMenuItem(id); }
  async deleteMenuItem(id: number) { const row = await this.repository.deleteMenuItem(id); if (!row) throw new Error('DATA_NOT_FOUND'); return row; }
  getReviews(stallId?: number) { return this.repository.findReviews(stallId); }
  createReview(input: Parameters<CatalogRepository['createReview']>[0]) { return this.repository.createReview(input); }
  async deleteReview(id: number) { const row = await this.repository.deleteReview(id); if (!row) throw new Error('DATA_NOT_FOUND'); return row; }
  createLike(input: Parameters<CatalogRepository['createLike']>[0]) { return this.repository.createLike(input); }
  async deleteLike(id: number) { const row = await this.repository.deleteLike(id); if (!row) throw new Error('DATA_NOT_FOUND'); return row; }
  getFlags() { return this.repository.findFlags(); }
  async updateFlag(id: number, status: string) { const row = await this.repository.updateFlag(id, status); if (!row) throw new Error('DATA_NOT_FOUND'); return row; }
  getAuditLogs() { return this.repository.findAuditLogs(); }
  createAuditLog(input: Parameters<CatalogRepository['createAuditLog']>[0]) { return this.repository.createAuditLog(input); }
}
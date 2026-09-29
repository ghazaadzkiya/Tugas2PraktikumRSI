import type { Request, Response } from 'express';
import { CatalogService } from '../services/catalogService.ts';

export class CatalogController {
  constructor(private service: CatalogService = new CatalogService()) {}
  private handleError(res: Response, error: unknown) {
    if (error instanceof Error && error.message === 'DATA_NOT_FOUND') return res.status(404).json({ status: 'fail', message: 'Data tidak ditemukan' });
    return res.status(500).json({ status: 'error', message: 'Terjadi kesalahan pada server', error: error instanceof Error ? error.message : String(error) });
  }
  users = async (_req: Request, res: Response) => { try { return res.json({ status: 'success', data: await this.service.getUsers() }); } catch (e) { return this.handleError(res, e); } };
  createUser = async (req: Request, res: Response) => { try { return res.status(201).json({ status: 'success', data: await this.service.createUser(req.body) }); } catch (e) { return this.handleError(res, e); } };
  menuItems = async (_req: Request, res: Response) => { try { return res.json({ status: 'success', data: await this.service.getMenuItems() }); } catch (e) { return this.handleError(res, e); } };
  menuItem = async (req: Request, res: Response) => { try { return res.json({ status: 'success', data: await this.service.getMenuItem(Number(req.params.id)) }); } catch (e) { return this.handleError(res, e); } };
  createMenuItem = async (req: Request, res: Response) => { try { return res.status(201).json({ status: 'success', data: await this.service.createMenuItem(req.body) }); } catch (e) { return this.handleError(res, e); } };
  updateMenuItem = async (req: Request, res: Response) => { try { return res.json({ status: 'success', data: await this.service.updateMenuItem(Number(req.params.id), req.body) }); } catch (e) { return this.handleError(res, e); } };
  deleteMenuItem = async (req: Request, res: Response) => { try { return res.json({ status: 'success', data: await this.service.deleteMenuItem(Number(req.params.id)) }); } catch (e) { return this.handleError(res, e); } };
  reviews = async (req: Request, res: Response) => { try { const stallId = req.query.stallId === undefined ? undefined : Number(req.query.stallId); return res.json({ status: 'success', data: await this.service.getReviews(stallId) }); } catch (e) { return this.handleError(res, e); } };
  createReview = async (req: Request, res: Response) => { try { return res.status(201).json({ status: 'success', data: await this.service.createReview(req.body) }); } catch (e) { return this.handleError(res, e); } };
  deleteReview = async (req: Request, res: Response) => { try { return res.json({ status: 'success', data: await this.service.deleteReview(Number(req.params.id)) }); } catch (e) { return this.handleError(res, e); } };
  createLike = async (req: Request, res: Response) => { try { return res.status(201).json({ status: 'success', data: await this.service.createLike(req.body) }); } catch (e) { return this.handleError(res, e); } };
  deleteLike = async (req: Request, res: Response) => { try { return res.json({ status: 'success', data: await this.service.deleteLike(Number(req.params.id)) }); } catch (e) { return this.handleError(res, e); } };
  flags = async (_req: Request, res: Response) => { try { return res.json({ status: 'success', data: await this.service.getFlags() }); } catch (e) { return this.handleError(res, e); } };
  updateFlag = async (req: Request, res: Response) => { try { return res.json({ status: 'success', data: await this.service.updateFlag(Number(req.params.id), req.body.status) }); } catch (e) { return this.handleError(res, e); } };
  auditLogs = async (_req: Request, res: Response) => { try { return res.json({ status: 'success', data: await this.service.getAuditLogs() }); } catch (e) { return this.handleError(res, e); } };
  createAuditLog = async (req: Request, res: Response) => { try { return res.status(201).json({ status: 'success', data: await this.service.createAuditLog(req.body) }); } catch (e) { return this.handleError(res, e); } };
}
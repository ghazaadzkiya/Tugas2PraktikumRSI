import type { Request, Response } from 'express';
import { ApiService } from '../services/apiService.ts';

export class ApiController {
  constructor(private readonly service: ApiService = new ApiService()) {}

  private handleError(res: Response, error: unknown): Response {
    if (error instanceof Error) {
      const statusByError: Record<string, number> = {
        LIKE_ALREADY_EXISTS: 409,
        INVALID_USER_INPUT: 400,
        INVALID_MENU_INPUT: 400,
        INVALID_REVIEW_INPUT: 400,
        INVALID_LIKE_INPUT: 400,
        INVALID_FLAG_STATUS: 400,
        INVALID_AUDIT_INPUT: 400,
      };
      const statusCode = statusByError[error.message];
      if (statusCode) return res.status(statusCode).json({ status: 'fail', message: error.message });
    }
    return res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan pada server',
      error: error instanceof Error ? error.message : String(error),
    });
  }

  getUsers = async (_req: Request, res: Response) => {
    try { return res.status(200).json({ status: 'success', data: await this.service.listUsers() }); }
    catch (error) { return this.handleError(res, error); }
  };
  createUser = async (req: Request, res: Response) => {
    try { return res.status(201).json({ status: 'success', data: await this.service.createUser(req.body) }); }
    catch (error) { return this.handleError(res, error); }
  };

  getMenuItems = async (_req: Request, res: Response) => {
    try { return res.status(200).json({ status: 'success', data: await this.service.listMenuItems() }); }
    catch (error) { return this.handleError(res, error); }
  };
  getMenuItem = async (req: Request, res: Response) => {
    try {
      const data = await this.service.getMenuItem(Number(req.params.id));
      return data ? res.status(200).json({ status: 'success', data }) : res.status(404).json({ status: 'fail', message: 'Menu tidak ditemukan' });
    } catch (error) { return this.handleError(res, error); }
  };
  createMenuItem = async (req: Request, res: Response) => {
    try { return res.status(201).json({ status: 'success', data: await this.service.createMenuItem(req.body) }); }
    catch (error) { return this.handleError(res, error); }
  };
  updateMenuItem = async (req: Request, res: Response) => {
    try {
      const data = await this.service.updateMenuItem(Number(req.params.id), req.body);
      return data ? res.status(200).json({ status: 'success', data }) : res.status(404).json({ status: 'fail', message: 'Menu tidak ditemukan' });
    } catch (error) { return this.handleError(res, error); }
  };
  deleteMenuItem = async (req: Request, res: Response) => {
    try {
      const data = await this.service.deleteMenuItem(Number(req.params.id));
      return data ? res.status(200).json({ status: 'success', data }) : res.status(404).json({ status: 'fail', message: 'Menu tidak ditemukan' });
    } catch (error) { return this.handleError(res, error); }
  };

  getReviews = async (_req: Request, res: Response) => {
    try { return res.status(200).json({ status: 'success', data: await this.service.listReviews() }); }
    catch (error) { return this.handleError(res, error); }
  };
  createReview = async (req: Request, res: Response) => {
    try { return res.status(201).json({ status: 'success', data: await this.service.createReview(req.body) }); }
    catch (error) { return this.handleError(res, error); }
  };
  deleteReview = async (req: Request, res: Response) => {
    try {
      const data = await this.service.deleteReview(Number(req.params.id));
      return data ? res.status(200).json({ status: 'success', data }) : res.status(404).json({ status: 'fail', message: 'Review tidak ditemukan' });
    } catch (error) { return this.handleError(res, error); }
  };

  createLike = async (req: Request, res: Response) => {
    try { return res.status(201).json({ status: 'success', data: await this.service.createLike(req.body) }); }
    catch (error) { return this.handleError(res, error); }
  };
  deleteLike = async (req: Request, res: Response) => {
    try {
      const data = await this.service.deleteLike(Number(req.params.id));
      return data ? res.status(200).json({ status: 'success', data }) : res.status(404).json({ status: 'fail', message: 'Like tidak ditemukan' });
    } catch (error) { return this.handleError(res, error); }
  };

  getFlags = async (_req: Request, res: Response) => {
    try { return res.status(200).json({ status: 'success', data: await this.service.listFlags() }); }
    catch (error) { return this.handleError(res, error); }
  };
  updateFlagStatus = async (req: Request, res: Response) => {
    try {
      const data = await this.service.updateFlagStatus(Number(req.params.id), req.body.status);
      return data ? res.status(200).json({ status: 'success', data }) : res.status(404).json({ status: 'fail', message: 'Flag tidak ditemukan' });
    } catch (error) { return this.handleError(res, error); }
  };

  getAuditLogs = async (_req: Request, res: Response) => {
    try { return res.status(200).json({ status: 'success', data: await this.service.listAuditLogs() }); }
    catch (error) { return this.handleError(res, error); }
  };
  createAuditLog = async (req: Request, res: Response) => {
    try { return res.status(201).json({ status: 'success', data: await this.service.createAuditLog(req.body) }); }
    catch (error) { return this.handleError(res, error); }
  };
}
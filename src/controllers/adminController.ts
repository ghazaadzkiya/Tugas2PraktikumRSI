import type { Request, Response } from 'express';
import { getUser } from '../middlewares/auth.ts';
import { ReportService } from '../services/reportService.ts';

export class AdminController {
  constructor(private readonly reportService: ReportService = new ReportService()) {}

  getReports = async (req: Request, res: Response): Promise<void> => {
    const { email } = getUser(req);
    const data = await this.reportService.getSummary();
    res.status(200).json({ status: 'success', meta: { requestedBy: email }, data });
  };
}
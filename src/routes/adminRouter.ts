import { Router } from 'express';
import { AdminController } from '../controllers/adminController.ts';
import { authenticate } from '../middlewares/auth.ts';
import { authorize } from '../middlewares/authorize.ts';

const adminRouter = Router();
const controller = new AdminController();

adminRouter.get('/reports', authenticate, authorize('admin'), (req, res) => {
  // #swagger.security = [{ "bearerAuth": [] }]
  // #swagger.responses[200] = { description: 'Ringkasan laporan admin' }
  return controller.getReports(req, res);
});

export { adminRouter };
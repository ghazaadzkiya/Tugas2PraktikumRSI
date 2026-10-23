import { Router } from 'express';
import { ApiController } from '../controllers/apiController.ts';
import { authenticate } from '../middlewares/auth.ts';
import { authorize } from '../middlewares/authorize.ts';

const apiRouter = Router();
const controller = new ApiController();

apiRouter.use(authenticate, authorize('admin'));

apiRouter.get('/users', (req, res) => {
	// #swagger.security = [{ "bearerAuth": [] }]
	return controller.getUsers(req, res);
});
apiRouter.post('/users', (req, res) => {
	// #swagger.security = [{ "bearerAuth": [] }]
	// #swagger.parameters['body'] = { in: 'body', required: true, schema: { $ref: '#/definitions/UserInput' } }
	return controller.createUser(req, res);
});
apiRouter.get('/menu-items', (req, res) => {
	// #swagger.security = [{ "bearerAuth": [] }]
	return controller.getMenuItems(req, res);
});
apiRouter.get('/menu-items/:id', (req, res) => {
	// #swagger.security = [{ "bearerAuth": [] }]
	return controller.getMenuItem(req, res);
});
apiRouter.post('/menu-items', (req, res) => {
	// #swagger.security = [{ "bearerAuth": [] }]
	// #swagger.parameters['body'] = { in: 'body', required: true, schema: { $ref: '#/definitions/MenuItemInput' } }
	return controller.createMenuItem(req, res);
});
apiRouter.put('/menu-items/:id', (req, res) => {
	// #swagger.security = [{ "bearerAuth": [] }]
	// #swagger.parameters['body'] = { in: 'body', required: true, schema: { $ref: '#/definitions/MenuItemInput' } }
	return controller.updateMenuItem(req, res);
});
apiRouter.delete('/menu-items/:id', (req, res) => {
	// #swagger.security = [{ "bearerAuth": [] }]
	return controller.deleteMenuItem(req, res);
});
apiRouter.get('/reviews', (req, res) => {
	// #swagger.security = [{ "bearerAuth": [] }]
	return controller.getReviews(req, res);
});
apiRouter.post('/reviews', (req, res) => {
	// #swagger.security = [{ "bearerAuth": [] }]
	// #swagger.parameters['body'] = { in: 'body', required: true, schema: { $ref: '#/definitions/ReviewInput' } }
	return controller.createReview(req, res);
});
apiRouter.delete('/reviews/:id', (req, res) => {
	// #swagger.security = [{ "bearerAuth": [] }]
	return controller.deleteReview(req, res);
});
apiRouter.post('/likes', (req, res) => {
	// #swagger.security = [{ "bearerAuth": [] }]
	// #swagger.parameters['body'] = { in: 'body', required: true, schema: { $ref: '#/definitions/LikeInput' } }
	return controller.createLike(req, res);
});
apiRouter.delete('/likes/:id', (req, res) => {
	// #swagger.security = [{ "bearerAuth": [] }]
	return controller.deleteLike(req, res);
});
apiRouter.get('/flags', (req, res) => {
	// #swagger.security = [{ "bearerAuth": [] }]
	return controller.getFlags(req, res);
});
apiRouter.put('/flags/:id', (req, res) => {
	// #swagger.security = [{ "bearerAuth": [] }]
	// #swagger.parameters['body'] = { in: 'body', required: true, schema: { $ref: '#/definitions/FlagStatusInput' } }
	return controller.updateFlagStatus(req, res);
});
apiRouter.get('/audit', (req, res) => {
	// #swagger.security = [{ "bearerAuth": [] }]
	return controller.getAuditLogs(req, res);
});
apiRouter.post('/audit', (req, res) => {
	// #swagger.security = [{ "bearerAuth": [] }]
	// #swagger.parameters['body'] = { in: 'body', required: true, schema: { $ref: '#/definitions/AuditLogInput' } }
	return controller.createAuditLog(req, res);
});

export { apiRouter };
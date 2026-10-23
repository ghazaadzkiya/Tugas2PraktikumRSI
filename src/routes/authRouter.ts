import { Router } from 'express';
import { AuthController } from '../controllers/authController.ts';
import { ProfileController } from '../controllers/profileController.ts';
import { authenticate } from '../middlewares/auth.ts';
import { validate } from '../middlewares/validate.ts';
import { loginSchema, registerSchema } from '../schemas/authSchema.ts';

const authRouter = Router();
const controller = new AuthController();
const profileController = new ProfileController();

authRouter.post('/register', validate(registerSchema, 'body'), (req, res) => {
	// #swagger.security = []
	// #swagger.parameters['body'] = { in: 'body', required: true, schema: { $ref: '#/definitions/RegisterInput' } }
	// #swagger.responses[201] = { description: 'Akun customer dibuat' }
	return controller.register(req, res);
});
authRouter.post('/login', validate(loginSchema, 'body'), (req, res) => {
	// #swagger.security = []
	// #swagger.parameters['body'] = { in: 'body', required: true, schema: { $ref: '#/definitions/LoginInput' } }
	// #swagger.responses[200] = { description: 'Token Bearer dan profil user' }
	return controller.login(req, res);
});
authRouter.get('/me', authenticate, (req, res) => {
	// #swagger.security = [{ "bearerAuth": [] }]
	// #swagger.responses[200] = { description: 'Profil dari token' }
	return controller.getMe(req, res);
});
authRouter.get('/profile', authenticate, (req, res) => {
	// #swagger.security = [{ "bearerAuth": [] }]
	// #swagger.responses[200] = { description: 'Profil terbaru dari database' }
	return profileController.getProfile(req, res);
});

export { authRouter };
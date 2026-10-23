import { OpenAPIRegistry, OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';
import { z } from '../schemas/zodOpenApi.ts';
import { loginSchema, registerSchema } from '../schemas/authSchema.ts';
import { createReviewSchema } from '../schemas/reviewSchema.ts';
import { createStallSchema, idParamSchema, stallQuerySchema, updateStallSchema } from '../schemas/stallSchema.ts';

const registry = new OpenAPIRegistry();
registry.registerComponent('securitySchemes', 'bearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
  description: 'Token JWT dari POST /api/v1/auth/login',
});

const secured = [{ bearerAuth: [] }];
const errorSchema = registry.register('ErrorResponse', z.object({
  status: z.literal('fail'),
  message: z.string(),
  errors: z.array(z.object({ field: z.string(), message: z.string() })).optional(),
}));
const authUserSchema = registry.register('AuthUser', z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
  role: z.enum(['admin', 'owner', 'customer']),
}));
const stallSchema = registry.register('Stall', z.object({
  id: z.number(),
  ownerId: z.number(),
  name: z.string(),
  category: z.string().nullable(),
  location: z.string().nullable(),
  description: z.string().nullable(),
  avgRating: z.number(),
  reviewCount: z.number(),
  isPopular: z.boolean(),
}));
const menuSchema = registry.register('Menu', z.object({
  id: z.number(), stallId: z.number(), name: z.string(), price: z.number(), isAvailable: z.boolean(),
}));
const reviewSchema = registry.register('Review', z.object({
  id: z.number(), stallId: z.number(), userId: z.number(), rating: z.number(),
  comment: z.string().nullable(), likeCount: z.number(), createdAt: z.string().nullable(),
}));
const reportSchema = registry.register('ReportSummary', z.object({
  totalUsers: z.number(), totalStalls: z.number(), totalReviews: z.number(), averageRating: z.number(),
  stallsByCategory: z.array(z.object({ category: z.string().nullable(), total: z.number() })),
}));

const json = (schema: z.ZodType) => ({ 'application/json': { schema } });
const errorResponse = (description: string) => ({ description, content: json(errorSchema) });
const unauthorized = { 401: errorResponse('Token tidak ada atau tidak valid') };
const forbidden = { 403: errorResponse('Role tidak memiliki izin') };

const registerInput = registry.register('RegisterInput', registerSchema);
const loginInput = registry.register('LoginInput', loginSchema);
const stallInput = registry.register('StallInput', createStallSchema);
const stallUpdate = registry.register('StallUpdate', updateStallSchema);
const reviewInput = registry.register('ReviewInput', createReviewSchema);

registry.registerPath({
  method: 'post', path: '/api/v1/auth/register', summary: 'Daftar akun customer',
  description: 'Publik. Role selalu customer; role tidak diterima dari body.',
  request: { body: { content: json(registerInput) } },
  responses: {
    201: { description: 'Akun dibuat', content: json(z.object({ status: z.literal('success'), data: z.object({ user: authUserSchema }) })) },
    400: errorResponse('Validasi gagal'), 409: errorResponse('Email sudah terdaftar'),
  },
});
registry.registerPath({
  method: 'post', path: '/api/v1/auth/login', summary: 'Login dan dapatkan token JWT',
  request: { body: { content: json(loginInput) } },
  responses: {
    200: { description: 'Login berhasil', content: json(z.object({ status: z.literal('success'), data: z.object({ token: z.string(), tokenType: z.literal('Bearer'), expiresIn: z.string(), user: authUserSchema }) })) },
    400: errorResponse('Validasi gagal'), 401: errorResponse('Email atau password salah'),
  },
});
registry.registerPath({
  method: 'get', path: '/api/v1/auth/me', summary: 'Profil dari token', security: secured,
  responses: { 200: { description: 'User dari token', content: json(z.object({ status: z.literal('success'), data: authUserSchema })) }, ...unauthorized },
});
registry.registerPath({
  method: 'get', path: '/api/v1/auth/profile', summary: 'Profil terbaru dari database', security: secured,
  responses: {
    200: { description: 'User terbaru', content: json(z.object({ status: z.literal('success'), data: authUserSchema })) },
    ...unauthorized, 404: errorResponse('User tidak ditemukan'),
  },
});
registry.registerPath({
  method: 'get', path: '/api/v1/stalls', summary: 'Daftar warung (publik)', request: { query: stallQuerySchema },
  responses: {
    200: { description: 'Daftar dan pagination', content: json(z.object({ status: z.literal('success'), meta: z.object({ page: z.number(), limit: z.number(), total: z.number() }), data: z.array(stallSchema) })) },
    400: errorResponse('Query tidak valid'),
  },
});
registry.registerPath({
  method: 'get', path: '/api/v1/stalls/{id}', summary: 'Detail warung (publik)', request: { params: idParamSchema },
  responses: {
    200: { description: 'Detail warung', content: json(z.object({ status: z.literal('success'), data: stallSchema })) },
    400: errorResponse('ID tidak valid'), 404: errorResponse('Warung tidak ditemukan'),
  },
});
registry.registerPath({
  method: 'get', path: '/api/v1/stalls/{id}/menus', summary: 'Daftar menu (publik)', request: { params: idParamSchema },
  responses: { 200: { description: 'Menu warung', content: json(z.object({ status: z.literal('success'), data: z.array(menuSchema) })) }, 400: errorResponse('ID tidak valid'), 404: errorResponse('Warung tidak ditemukan') },
});
registry.registerPath({
  method: 'post', path: '/api/v1/stalls', summary: 'Buat warung (owner/admin)', security: secured,
  description: 'ownerId ditentukan dari token; admin juga boleh.', request: { body: { content: json(stallInput) } },
  responses: {
    201: { description: 'Warung dibuat', content: json(z.object({ status: z.literal('success'), data: stallSchema })) },
    400: errorResponse('Validasi gagal'), ...unauthorized, ...forbidden,
  },
});
registry.registerPath({
  method: 'put', path: '/api/v1/stalls/{id}', summary: 'Update warung (owner miliknya/admin)', security: secured,
  request: { params: idParamSchema, body: { content: json(stallUpdate) } },
  responses: {
    200: { description: 'Warung diubah', content: json(z.object({ status: z.literal('success'), data: stallSchema })) },
    400: errorResponse('Parameter/body tidak valid'), ...unauthorized, ...forbidden, 404: errorResponse('Warung tidak ditemukan'),
  },
});
registry.registerPath({
  method: 'delete', path: '/api/v1/stalls/{id}', summary: 'Hapus warung (admin)', security: secured,
  request: { params: idParamSchema },
  responses: {
    200: { description: 'Warung dihapus', content: json(z.object({ status: z.literal('success'), data: stallSchema })) },
    400: errorResponse('ID tidak valid'), ...unauthorized, ...forbidden, 404: errorResponse('Warung tidak ditemukan'),
  },
});
registry.registerPath({
  method: 'post', path: '/api/v1/stalls/{id}/reviews', summary: 'Tambah review (login semua role)', security: secured,
  description: 'userId diambil dari token, bukan request body.', request: { params: idParamSchema, body: { content: json(reviewInput) } },
  responses: {
    201: { description: 'Review dibuat', content: json(z.object({ status: z.literal('success'), data: reviewSchema })) },
    400: errorResponse('Parameter/body tidak valid'), ...unauthorized, 404: errorResponse('Warung tidak ditemukan'), 409: errorResponse('Review duplikat'),
  },
});
registry.registerPath({
  method: 'get', path: '/api/v1/admin/reports', summary: 'Ringkasan laporan (admin)', security: secured,
  responses: {
    200: { description: 'Ringkasan data', content: json(z.object({ status: z.literal('success'), meta: z.object({ requestedBy: z.string() }), data: reportSchema })) },
    ...unauthorized, ...forbidden,
  },
});
registry.registerPath({
  method: 'get', path: '/health', summary: 'Cek kesehatan server dan database',
  responses: { 200: { description: 'Server dan database terhubung' }, 500: errorResponse('Database tidak tersedia') },
});

const adminOperations = [
  ['get', '/api/v1/users', 'Daftar user'], ['post', '/api/v1/users', 'Tambah user'],
  ['get', '/api/v1/menu-items', 'Daftar menu'], ['get', '/api/v1/menu-items/{id}', 'Detail menu'],
  ['post', '/api/v1/menu-items', 'Tambah menu'], ['put', '/api/v1/menu-items/{id}', 'Ubah menu'],
  ['delete', '/api/v1/menu-items/{id}', 'Hapus menu'], ['get', '/api/v1/reviews', 'Daftar review'],
  ['post', '/api/v1/reviews', 'Tambah review administratif'], ['delete', '/api/v1/reviews/{id}', 'Hapus review'],
  ['post', '/api/v1/likes', 'Tambah like'], ['delete', '/api/v1/likes/{id}', 'Hapus like'],
  ['get', '/api/v1/flags', 'Daftar flag'], ['put', '/api/v1/flags/{id}', 'Ubah status flag'],
  ['get', '/api/v1/audit', 'Daftar audit log'], ['post', '/api/v1/audit', 'Tambah audit log'],
] as const;

for (const [method, path, summary] of adminOperations) {
  registry.registerPath({
    method,
    path,
    summary,
    description: 'Endpoint administratif; hanya role admin yang diizinkan.',
    security: secured,
    responses: { 200: { description: 'Berhasil' }, 201: { description: 'Berhasil dibuat' }, ...unauthorized, ...forbidden },
  });
}

export const openApiDocument = new OpenApiGeneratorV3(registry.definitions).generateDocument({
  openapi: '3.0.0',
  info: {
    title: 'Review Kantin API',
    version: '1.0.0',
    description: 'OpenAPI 3.0 dibangun dari schema Zod. Gunakan Authorize untuk mengirim token JWT.',
  },
  servers: [{ url: 'http://localhost:3000' }],
});
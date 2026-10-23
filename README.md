# Tugas 3 — Review Kantin API

API memakai arsitektur Repository → Service → Controller → Router, Drizzle ORM untuk SQL
Server, Zod untuk validasi, JWT untuk autentikasi, dan middleware role untuk otorisasi.

## Prinsip

- Skema database dibuat dari materi pertemuan-03; pemetaan Drizzle dan seed untuk Tugas 3 berada di `src/db/`.
- Drizzle dipakai untuk **query bertipe** dari aplikasi.
- `src/db/schema.ts` **ditulis manual**, bukan hasil `drizzle-kit pull`. Alasannya:
  intropeksi (`pull`) Drizzle untuk MSSQL masih **RC** dan belum stabil.

## Prasyarat

- Node.js **>= 22.18.0**, npm
- SQL Server aktif + database `review_kantin` sudah disiapkan. Jika belum, jalankan skrip setup dari `New folder/praktikum-rsi-2026/pertemuan-03-database-backend-crud/db/`:

```powershell
sqlcmd -S localhost -E -C -i "..\New folder\praktikum-rsi-2026\pertemuan-03-database-backend-crud\db\00-setup-mixed-mode.sql"       # sekali saja
sqlcmd -S localhost -E -C -i "..\New folder\praktikum-rsi-2026\pertemuan-03-database-backend-crud\db\01-create-database-and-user.sql"
sqlcmd -S localhost -E -C -i "..\New folder\praktikum-rsi-2026\pertemuan-03-database-backend-crud\db\02-schema.sql"
sqlcmd -S localhost -E -C -i "..\New folder\praktikum-rsi-2026\pertemuan-03-database-backend-crud\db\03-seed.sql"
```

Untuk pendaftaran login, sesudah schema dan seed tersedia, jalankan juga:

```powershell
sqlcmd -S localhost -E -C -i src\db\seed-password-hashes.sql
```

---
## Langkah 1 — Buat project & install dependencies

```bash
npm init -y
npm install express mssql dotenv drizzle-orm@1.0.0-rc.5-5935859 swagger-ui-express @asteasolutions/zod-to-openapi zod bcryptjs jsonwebtoken
npm install -D typescript @types/express @types/mssql @types/node tsx drizzle-kit@1.0.0-rc.5-5935859 @types/swagger-ui-express @types/jsonwebtoken
```

> Versi `drizzle-orm`/`drizzle-kit` dipatok ke RC yang sudah diuji. Drizzle untuk MSSQL
> masih preview, jadi API bisa berubah.

### `package.json`

```json
{
  "main": "src/index.ts",
  "scripts": {
    "start": "tsx src/index.ts",
    "dev": "tsx watch src/index.ts"
  },
  "type": "commonjs"
}
```

## Langkah 2 — Konfigurasi `.env`

```
DB_SERVER=localhost
DB_PORT=1433
DB_USER=praktikum_user
DB_PASSWORD=Praktikum2026!
DB_NAME=review_kantin
DB_ENCRYPT=false
DB_TRUST_SERVER_CERTIFICATE=true
JWT_SECRET=isi-dengan-secret-acak-minimal-32-byte
JWT_EXPIRES_IN=2h
BCRYPT_SALT_ROUNDS=10
```

> Nilai yang mengandung `#` wajib dibungkus tanda kutip (dotenv menganggap `#` komentar).

## Langkah 3 — Definisikan schema (`src/db/schema.ts`)

Kita memetakan tabel SQL Server ke objek TypeScript memakai `mssqlTable` dan
builder kolom `mssql-core`.

```ts
import { mssqlTable, int, bit, nvarchar, decimal, datetime2 } from 'drizzle-orm/mssql-core';

export const users = mssqlTable('USERS', {
  id: int('id').primaryKey().identity(),
  name: nvarchar('name', { length: 100 }).notNull(),
  email: nvarchar('email', { length: 150 }).notNull().unique(),
  passwordHash: nvarchar('password_hash', { length: 255 }).notNull(),
  role: nvarchar('role', { length: 20, enum: ['admin', 'owner', 'customer'] }).notNull(),
  createdAt: datetime2('created_at'),
});

export const stalls = mssqlTable('STALLS', {
  id: int('id').primaryKey().identity(),
  ownerId: int('owner_id').notNull().references(() => users.id),
  name: nvarchar('name', { length: 100 }).notNull(),
  category: nvarchar('category', { length: 50 }),
  location: nvarchar('location', { length: 100 }),
  description: nvarchar('description', { length: 'max' }),
  avgRating: decimal('avg_rating', { precision: 3, scale: 2 }).notNull(),
  reviewCount: int('review_count').notNull(),
  createdAt: datetime2('created_at'),
});

export const menuItems = mssqlTable('MENU_ITEMS', {
  id: int('id').primaryKey().identity(),
  stallId: int('stall_id').notNull().references(() => stalls.id),
  name: nvarchar('name', { length: 100 }).notNull(),
  price: int('price').notNull(),
  isAvailable: bit('is_available').notNull(),
});
```

`src/db/schema.ts` juga memuat `reviews`, `likes`, `flags`, dan `auditLogs`
(tabel lain dari ERD yang belum dipakai di hands-on ini).

## Langkah 4 — Inisialisasi koneksi (`src/db/index.ts`)

```ts
import 'dotenv/config';
import mssql from 'mssql';
import { drizzle } from 'drizzle-orm/node-mssql';
import * as schema from './schema.ts';

const config: mssql.config = {
  server: process.env.DB_SERVER ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 1433),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
  },
};

let poolPromise: Promise<mssql.ConnectionPool> | null = null;
let dbPromise: ReturnType<typeof buildDb> | null = null;

async function buildDb() {
  poolPromise ??= mssql.connect(config);
  const pool = await poolPromise;
  return drizzle({ client: pool, schema });
}

export function getDb() {
  if (!dbPromise) {
    dbPromise = buildDb().catch((error) => {
      dbPromise = null;
      poolPromise = null;
      throw error;
    });
  }
  return dbPromise;
}
```

## Langkah 5 — Repository dengan query builder

`src/repositories/stallRepository.ts`:

```ts
import { and, count, eq, like, type SQL } from 'drizzle-orm';
import { getDb } from '../db/index.ts';
import { stalls } from '../db/schema.ts';

export class StallRepository {
  async findAll(params: FindAllParams) {
    const db = await getDb();

    const conditions: SQL[] = [];
    if (params.search) conditions.push(like(stalls.name, `%${params.search}%`));
    if (params.category) conditions.push(eq(stalls.category, params.category));
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const offset = (params.page - 1) * params.limit;

    // MSSQL: pagination = ORDER BY + OFFSET ... FETCH NEXT
    const rows = await db
      .select()
      .from(stalls)
      .where(where)
      .orderBy(stalls.id)
      .offset(offset)
      .fetch(params.limit);

    const totals = await db.select({ total: count() }).from(stalls).where(where);

    return { rows, total: Number(totals[0]?.total ?? 0) };
  }

  async create(input: CreateStallInput) {
    const db = await getDb();
    const rows = await db.insert(stalls).output().values({ /* ... */ });
    return rows[0];
  }
}
```

Join contoh (menu items) — `src/repositories/menuItemRepository.ts`:

```ts
import { eq } from 'drizzle-orm';
import { getDb } from '../db/index.ts';
import { menuItems } from '../db/schema.ts';

export class MenuItemRepository {
  async findByStallId(stallId: number) {
    const db = await getDb();
    return db.select().from(menuItems).where(eq(menuItems.stallId, stallId));
  }
}
```

## Langkah 6 — Service (mapping + logika bisnis)

`src/services/stallService.ts` memetakan row DB menjadi DTO camelCase dan menghitung
`isPopular` (rating ≥ 4.7). Perhatikan: `decimal` dari driver berbentuk **string**,
jadi di-`Number(...)`.

```ts
private toDto(row: StallRow): StallResponseDto {
  const avgRating = Number(row.avgRating);
  return { ...row, avgRating, isPopular: avgRating >= 4.7 };
}
```

## Langkah 7 — Controller, Router, dan Entry point

- `src/controllers/stallController.ts` — handler Express; `NotFoundError` dipetakan oleh error handler terpusat.
- `src/routes/stallRouter.ts` — pemetaan endpoint.
- `src/index.ts` — server Express + `GET /health` (`SELECT 1` via Drizzle).

## Langkah 8 — Jalankan & uji

```bash
npm run dev
```

| Method | Endpoint | Akses |
| --- | --- | --- |
| GET | `/health`, `/docs` | publik |
| GET | `/api/v1/stalls`, `/api/v1/stalls/:id`, `/api/v1/stalls/:id/menus` | publik |
| POST | `/api/v1/auth/register`, `/api/v1/auth/login` | publik |
| GET | `/api/v1/auth/me`, `/api/v1/auth/profile` | login, semua role |
| POST | `/api/v1/stalls` | owner, admin |
| PUT | `/api/v1/stalls/:id` | owner (warung miliknya), admin |
| DELETE | `/api/v1/stalls/:id` | admin |
| POST | `/api/v1/stalls/:id/reviews` | login, semua role |
| GET | `/api/v1/admin/reports` | admin |
| Endpoint lama lain di `/api/v1` (users, menu-items, reviews, likes, flags, audit) | admin |

Contoh:

```bash
curl.exe "http://localhost:3000/api/v1/stalls?category=Minuman&limit=2&page=1"
```

---

## Dokumentasi API (Swagger UI)

Dokumentasi dibangun sebagai **OpenAPI 3.0** dari schema Zod yang dipakai middleware
validasi, menggunakan `@asteasolutions/zod-to-openapi`. Tidak ada file spec yang perlu
digenerate manual: server menyajikan Swagger UI di `/docs` dan dokumen JSON di
`/docs/swagger.json`. Skema `bearerAuth` memakai HTTP Bearer/JWT; masukkan token melalui
tombol **Authorize**. Nilai otorisasi dipertahankan ketika halaman docs dimuat ulang.

File terkait:

- `src/docs/openapi.ts` — definisi komponen, security scheme, response, serta semua route.
- `src/schemas/zodOpenApi.ts` — satu instance Zod dengan dukungan metadata OpenAPI.
- `src/schemas/*.ts` — schema validasi yang juga menjadi sumber request body/query/params docs.
- `src/index.ts` — endpoint `/docs/swagger.json` dan Swagger UI `/docs`.

Spec menggunakan `#/components/schemas/...` sesuai OpenAPI 3.0.

---

## Catatan penting: perbedaan API Drizzle untuk MSSQL

Bila terbiasa dengan contoh Drizzle (Postgres/MySQL), ada beberapa perbedaan:

- **Pagination**: MSSQL memakai `.orderBy(...).offset(n).fetch(m)` — **bukan** `.limit()`.
  `.offset()` wajib didahului `.orderBy()`. Ada juga `.top(n)`.
- **Mengembalikan row saat insert/update/delete**: memakai `.output()` (bukan `.returning()`).
  Untuk insert, `.output()` dipanggil **sebelum** `.values()`.
- **`decimal`** dikembalikan sebagai **string** oleh driver; konversi ke `Number` bila perlu.
- **`drizzle-kit pull`** (introspeksi) untuk MSSQL masih RC dan belum stabil, sehingga
  `src/db/schema.ts` ditulis manual dan DDL database tetap mengikuti materi pertemuan-03.

## Struktur Project

```text
src/
  controllers/    # auth, profile, stall, review, admin
  db/             # koneksi, schema, seed SQL
  docs/           # OpenAPI 3 dari schema Zod
  dtos/           # response DTO
  errors/         # error aplikasi
  middlewares/    # authentication, authorization, validasi, error handler
  repositories/   # query Drizzle
  routes/         # auth, stall, admin, dan endpoint admin lama
  schemas/        # schema Zod untuk body, params, query
  services/       # auth, token, stall, review, report
  index.ts
```

## Tugas 3 — Validasi, Error, dan Otorisasi

Konfigurasi `.env` dapat dibuat dari `.env.example`; isi `JWT_SECRET` dengan secret acak
yang panjang. Sebelum menguji login akun seed, jalankan `src/db/seed-password-hashes.sql`
di database `review_kantin`. Ketiga akun uji memakai password `rahasia123`:

| Email | Role |
| --- | --- |
| `admin@kantin.test` | admin |
| `tini@kantin.test` | owner |
| `bagas@student.test` | customer |

Endpoint yang berlaku:

| Method | Endpoint | Akses |
| --- | --- | --- |
| GET | `/api/v1/stalls`, `/api/v1/stalls/:id`, `/api/v1/stalls/:id/menus` | publik |
| POST | `/api/v1/auth/register`, `/api/v1/auth/login` | publik |
| GET | `/api/v1/auth/me`, `/api/v1/auth/profile` | login, semua role |
| POST | `/api/v1/stalls` | owner, admin |
| PUT | `/api/v1/stalls/:id` | pemilik warung, admin |
| DELETE | `/api/v1/stalls/:id` | admin |
| POST | `/api/v1/stalls/:id/reviews` | login, semua role |
| GET | `/api/v1/admin/reports` | admin |
| Endpoint lama lain di `/api/v1` | admin |

Kirim token login melalui header `Authorization: Bearer <token>`. Role registrasi publik
selalu `customer`; field `role`, `ownerId`, dan `userId` dari body ditolak. Error validasi
menggunakan `{ "status": "fail", "message": "Validasi gagal", "errors": [{ "field": "name", "message": "name minimal 3 karakter" }] }`.

Validasi mengikuti spesifikasi tugas: pencarian warung maksimal 100 karakter, kategori
maksimal 50, halaman minimal 1, limit 1–100 (default 10); ID harus integer positif; nama
warung 3–100 karakter; email diretrim, diubah lowercase dan divalidasi; password register
8–72 karakter; rating review integer 1–5; komentar maksimal 1000 karakter. `PUT /stalls/:id`
menerima semua field warung secara opsional.

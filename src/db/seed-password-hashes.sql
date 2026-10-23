USE review_kantin;
GO

-- Akun uji untuk endpoint login. Password untuk ketiga akun: rahasia123.
UPDATE dbo.USERS
SET password_hash = N'$2b$10$eYDhA8k96hVOwauOdHcJ/eyLwmLpIXMJcOApklHzRNrAa2yXVweXy'
WHERE email = N'admin@kantin.test';

UPDATE dbo.USERS
SET password_hash = N'$2b$10$uDbObu/Mw0BOJ0MNJo9H4.E3RsRtKnpRHBZ4axJr76K0fSn8qYrAe'
WHERE email = N'tini@kantin.test';

UPDATE dbo.USERS
SET password_hash = N'$2b$10$XayKzWUDvMrQxrSm50SMNeJHtPZxImuhA7uUtk2h3bvD5fVzUfdje'
WHERE email = N'bagas@student.test';
GO
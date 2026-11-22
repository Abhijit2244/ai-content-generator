import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

// CRITICAL DB SAFETY RULE: Never touch dev.db!
// Integration tests run against an isolated temporary test database.
const TEST_DB_PATH = path.join(__dirname, 'test-isolated.db');
process.env.DATABASE_URL = `file:${TEST_DB_PATH}`;

describe('API Integration Tests (Isolated Ephemeral Test Database)', () => {
  let app: any;
  let testPrisma: PrismaClient;

  let tokenUserA: string;
  let userIdA: string;
  let tokenUserB: string;
  let createdContentId: string;

  beforeAll(async () => {
    if (fs.existsSync(TEST_DB_PATH)) {
      try {
        fs.unlinkSync(TEST_DB_PATH);
      } catch {}
    }

    testPrisma = new PrismaClient({
      datasources: { db: { url: `file:${TEST_DB_PATH}` } },
    });

    const { execSync } = await import('child_process');
    execSync('npx prisma db push --skip-generate', {
      env: { ...process.env, DATABASE_URL: `file:${TEST_DB_PATH}` },
      cwd: path.join(__dirname, '../../'),
      stdio: 'ignore',
    });

    app = createApp(testPrisma);
  }, 30000);

  afterAll(async () => {
    await testPrisma.$disconnect();
    if (fs.existsSync(TEST_DB_PATH)) {
      try {
        fs.unlinkSync(TEST_DB_PATH);
      } catch {}
    }
    const journalPath = `${TEST_DB_PATH}-journal`;
    if (fs.existsSync(journalPath)) {
      try {
        fs.unlinkSync(journalPath);
      } catch {}
    }
  });

  it('GET /health returns 200 and healthy status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
  });

  it('POST /api/v1/auth/register creates user account and returns token', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      name: 'User A',
      email: 'user_a@test.com',
      password: 'Password123!',
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe('user_a@test.com');
    expect(res.body.data.token).toBeDefined();

    tokenUserA = res.body.data.token;
    userIdA = res.body.data.user.id;
  });

  it('POST /api/v1/auth/register rejects duplicate email with 409 Conflict', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      name: 'User A Duplicate',
      email: 'user_a@test.com',
      password: 'Password123!',
    });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  it('POST /api/v1/auth/register rejects invalid email and weak password', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      name: 'Invalid User',
      email: 'not-an-email',
      password: 'short',
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('POST /api/v1/auth/login succeeds with correct credentials', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'user_a@test.com',
      password: 'Password123!',
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
  });

  it('POST /api/v1/auth/login rejects incorrect password with 401 Unauthorized', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'user_a@test.com',
      password: 'WrongPassword!',
    });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('GET /api/v1/auth/me returns current user profile with valid Bearer token', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${tokenUserA}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe('user_a@test.com');
  });

  it('GET /api/v1/auth/me rejects request without Bearer token with 401', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('POST /api/v1/auth/register creates User B for multi-tenant isolation testing', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      name: 'User B',
      email: 'user_b@test.com',
      password: 'Password123!',
    });

    expect(res.status).toBe(201);
    tokenUserB = res.body.data.token;
  });

  it('GET /api/v1/content returns empty list for new user with zero documents', async () => {
    const res = await request(app)
      .get('/api/v1/content')
      .set('Authorization', `Bearer ${tokenUserB}`);

    expect(res.status).toBe(200);
    expect(res.body.data.items).toEqual([]);
    expect(res.body.data.pagination.total).toBe(0);
  });

  it('Creates content item for User A in isolated test database', async () => {
    const item = await testPrisma.content.create({
      data: {
        userId: userIdA,
        title: 'User A Confidential Architecture Notes',
        contentType: 'study_notes',
        tone: 'academic',
        length: 'short',
        content: 'Confidential architecture decisions.',
        versions: {
          create: {
            versionNumber: 1,
            changeType: 'generated',
            contentSnapshot: 'Confidential architecture decisions.',
          },
        },
      },
    });

    createdContentId = item.id;
    expect(createdContentId).toBeDefined();
  });

  it('GET /api/v1/content/:id allows owner User A to retrieve their content', async () => {
    const res = await request(app)
      .get(`/api/v1/content/${createdContentId}`)
      .set('Authorization', `Bearer ${tokenUserA}`);

    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe('User A Confidential Architecture Notes');
  });

  it('GET /api/v1/content supports search query matching document title', async () => {
    const res = await request(app)
      .get('/api/v1/content?search=Confidential')
      .set('Authorization', `Bearer ${tokenUserA}`);

    expect(res.status).toBe(200);
    expect(res.body.data.items.length).toBe(1);
    expect(res.body.data.items[0].id).toBe(createdContentId);
  });

  it('GET /api/v1/content supports content type filtering', async () => {
    const res = await request(app)
      .get('/api/v1/content?contentType=study_notes')
      .set('Authorization', `Bearer ${tokenUserA}`);

    expect(res.status).toBe(200);
    expect(res.body.data.items.length).toBe(1);

    const resEmpty = await request(app)
      .get('/api/v1/content?contentType=marketing')
      .set('Authorization', `Bearer ${tokenUserA}`);

    expect(resEmpty.status).toBe(200);
    expect(resEmpty.body.data.items.length).toBe(0);
  });

  it('CRITICAL TENANT PRIVACY: User B CANNOT retrieve User A content (404 NOT_FOUND)', async () => {
    const res = await request(app)
      .get(`/api/v1/content/${createdContentId}`)
      .set('Authorization', `Bearer ${tokenUserB}`);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('CRITICAL TENANT PRIVACY: User B CANNOT update User A content (404 NOT_FOUND)', async () => {
    const res = await request(app)
      .patch(`/api/v1/content/${createdContentId}`)
      .set('Authorization', `Bearer ${tokenUserB}`)
      .send({ title: 'Hacked Title' });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('CRITICAL TENANT PRIVACY: User B CANNOT delete User A content (404 NOT_FOUND)', async () => {
    const res = await request(app)
      .delete(`/api/v1/content/${createdContentId}`)
      .set('Authorization', `Bearer ${tokenUserB}`);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('PATCH /api/v1/content/:id allows owner User A to update document and record new version', async () => {
    const res = await request(app)
      .patch(`/api/v1/content/${createdContentId}`)
      .set('Authorization', `Bearer ${tokenUserA}`)
      .send({ title: 'Updated Title', content: 'Updated content text body.' });

    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe('Updated Title');

    const versionsRes = await request(app)
      .get(`/api/v1/content/${createdContentId}/versions`)
      .set('Authorization', `Bearer ${tokenUserA}`);

    expect(versionsRes.status).toBe(200);
    expect(versionsRes.body.data.length).toBe(2);
    expect(versionsRes.body.data[0].versionNumber).toBe(2);
  });

  it('DELETE /api/v1/content/:id deletes document and verifies subsequent requests return 404', async () => {
    const res = await request(app)
      .delete(`/api/v1/content/${createdContentId}`)
      .set('Authorization', `Bearer ${tokenUserA}`);

    expect(res.status).toBe(200);

    const getRes = await request(app)
      .get(`/api/v1/content/${createdContentId}`)
      .set('Authorization', `Bearer ${tokenUserA}`);

    expect(getRes.status).toBe(404);
  });

  it('POST /api/v1/content/generate rejects creation when title is empty with 400 Bad Request', async () => {
    const res = await request(app)
      .post('/api/v1/content/generate')
      .set('Authorization', `Bearer ${tokenUserA}`)
      .send({
        title: '',
        contentType: 'blog',
        tone: 'informative',
        length: 'short',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/v1/content/:id/versions returns version 1 snapshot for created document', async () => {
    const doc = await testPrisma.content.create({
      data: {
        userId: userIdA,
        title: 'New Document via DB Seed',
        content: 'Initial text content for versioning test',
        contentType: 'email',
        tone: 'professional',
        length: 'medium',
      },
    });

    await testPrisma.contentVersion.create({
      data: {
        contentId: doc.id,
        versionNumber: 1,
        contentSnapshot: doc.content,
        changeType: 'created',
      },
    });

    const versionsRes = await request(app)
      .get(`/api/v1/content/${doc.id}/versions`)
      .set('Authorization', `Bearer ${tokenUserA}`);

    expect(versionsRes.status).toBe(200);
    expect(versionsRes.body.data).toHaveLength(1);
    expect(versionsRes.body.data[0].versionNumber).toBe(1);
    expect(versionsRes.body.data[0].changeType).toBe('created');
  });

  it('GET /api/v1/content/:id/versions returns 404 when User B requests User A document history', async () => {
    const doc = await testPrisma.content.create({
      data: {
        userId: userIdA,
        title: 'User A Secret History',
        content: 'Confidential version test',
        contentType: 'report',
        tone: 'academic',
        length: 'short',
      },
    });

    const res = await request(app)
      .get(`/api/v1/content/${doc.id}/versions`)
      .set('Authorization', `Bearer ${tokenUserB}`);

    expect(res.status).toBe(404);
  });

  it('Rejects requests with malformed or tampered Bearer token with 401 Unauthorized', async () => {
    const res = await request(app)
      .get('/api/v1/content')
      .set('Authorization', 'Bearer invalid.tampered.token');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('Rejects unauthenticated generation endpoints with 401 Unauthorized', async () => {
    const genRes = await request(app).post('/api/v1/content/generate').send({});
    expect(genRes.status).toBe(401);

    const refineRes = await request(app).post('/api/v1/content/refine').send({});
    expect(refineRes.status).toBe(401);

    const varRes = await request(app).post('/api/v1/content/variations').send({});
    expect(varRes.status).toBe(401);
  });
});

import { describe, it, expect, vi } from 'vitest';
import supertest from 'supertest';
import jwt from 'jsonwebtoken';
import { sanitizeString, sanitizeStringArray } from '../src/shared/utils/sanitizer.js';
import { LoginUserUseCase } from '../src/modules/auth/application/login-user.js';
import { IUserRepository, IPasswordHasher, ITokenService } from '../src/modules/auth/domain/user.js';
import { createApp } from '../src/app.js';
import { env } from '../src/config/env.js';

describe('Security Hardening & Attack Defense Tests', () => {
  // ---------------------------------------------------------------------------
  // 1. INPUT SANITIZATION & XSS DEFENSE
  // ---------------------------------------------------------------------------
  describe('Input Sanitization & Injection Defense (XSS & Control Chars)', () => {
    it('neutralizes stored XSS script tags from user inputs', () => {
      const malicious = 'Hello <script>alert("pwned")</script>World';
      expect(sanitizeString(malicious)).toBe('Hello World');
    });

    it('neutralizes nested or obfuscated script tags', () => {
      const malicious = '<script type="text/javascript">document.cookie</script>Safe Content';
      expect(sanitizeString(malicious)).toBe('Safe Content');
    });

    it('strips dangerous iframe and embed tags', () => {
      const malicious = 'Check this: <iframe src="http://attacker.com/steal"></iframe>';
      expect(sanitizeString(malicious)).toBe('Check this: ');
    });

    it('strips inline DOM event handler attributes (onerror, onload, onclick)', () => {
      const malicious = '<img src="x" onerror="stealCredentials()" alt="test" onload="ping()">';
      const clean = sanitizeString(malicious);
      expect(clean).not.toContain('onerror');
      expect(clean).not.toContain('onload');
      expect(clean).not.toContain('stealCredentials');
    });

    it('strips javascript: and data: pseudo-protocol injection', () => {
      const malicious = 'Read here: javascript:alert(1) or data:text/html,<script>';
      const clean = sanitizeString(malicious);
      expect(clean).not.toContain('javascript:');
      expect(clean).not.toContain('data:text/html');
    });

    it('neutralizes null-byte injection attempts', () => {
      const malicious = 'file.txt\0.exe';
      expect(sanitizeString(malicious)).toBe('file.txt.exe');
    });

    it('sanitizes string arrays and trims empty results', () => {
      const rawKeywords = ['clean keyword', '<script>bad</script>tag', '  trimmed  ', ''];
      const sanitized = sanitizeStringArray(rawKeywords);
      expect(sanitized).toEqual(['clean keyword', 'tag', 'trimmed']);
    });
  });

  // ---------------------------------------------------------------------------
  // 2. TIMING ATTACK & SIDE-CHANNEL ENUMERATION DEFENSE
  // ---------------------------------------------------------------------------
  describe('Timing Attack Defense (Email Enumeration Mitigation)', () => {
    it('executes constant-time dummy hash comparison when email does not exist', async () => {
      const mockUserRepo: IUserRepository = {
        findByEmail: vi.fn().mockResolvedValue(null),
        findById: vi.fn(),
        create: vi.fn(),
        count: vi.fn(),
      };

      const mockHasher: IPasswordHasher = {
        hash: vi.fn(),
        compare: vi.fn().mockResolvedValue(false),
      };

      const mockTokenService: ITokenService = {
        signToken: vi.fn(),
      };

      const loginUseCase = new LoginUserUseCase(mockUserRepo, mockHasher, mockTokenService);

      await expect(
        loginUseCase.execute({ email: 'nonexistent@example.com', password: 'Password123!' })
      ).rejects.toThrow('Invalid email or password');

      // Verify that mockHasher.compare was invoked even though the user does not exist!
      expect(mockHasher.compare).toHaveBeenCalledTimes(1);
      expect(mockHasher.compare).toHaveBeenCalledWith(
        'Password123!',
        expect.stringContaining('$2a$10$')
      );
    });
  });

  // ---------------------------------------------------------------------------
  // 3. JWT SECURITY & ALGORITHM CONFUSION DEFENSE
  // ---------------------------------------------------------------------------
  describe('JWT Security & Tampering Defense', () => {
    it('rejects tokens signed with none algorithm', async () => {
      // Craft an unverified token with alg: none
      const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
      const payload = Buffer.from(
        JSON.stringify({ id: 'user-123', email: 'user@example.com', name: 'User' })
      ).toString('base64url');
      const noneToken = `${header}.${payload}.`;

      const app = createApp();
      const res = await supertest(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${noneToken}`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('rejects tokens with forged/invalid signature', async () => {
      const forgedToken = jwt.sign(
        { id: 'hacker-1', email: 'hacker@example.com', name: 'Hacker' },
        'WRONG_SECRET_KEY'
      );

      const app = createApp();
      const res = await supertest(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${forgedToken}`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('rejects tokens missing essential identity claims', async () => {
      const incompleteToken = jwt.sign(
        { name: 'Anonymous' }, // missing id and email
        env.JWT_SECRET
      );

      const app = createApp();
      const res = await supertest(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${incompleteToken}`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // 4. HTTP SECURITY HEADERS (Helmet & Technology Fingerprinting)
  // ---------------------------------------------------------------------------
  describe('HTTP Security Headers & Information Disclosure Defense', () => {
    it('includes defensive HTTP headers and strips X-Powered-By', async () => {
      const app = createApp();
      const res = await supertest(app).get('/health');

      expect(res.status).toBe(200);
      // Technology fingerprinting stripped
      expect(res.headers['x-powered-by']).toBeUndefined();
      // MIME-sniffing protection
      expect(res.headers['x-content-type-options']).toBe('nosniff');
      // Clickjacking protection
      expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
    });
  });

  // ---------------------------------------------------------------------------
  // 5. CORS POLICY ENFORCEMENT
  // ---------------------------------------------------------------------------
  describe('CORS Origin Whitelist Enforcement', () => {
    it('permits authorized origin in CORS response header', async () => {
      const app = createApp();
      const res = await supertest(app)
        .get('/health')
        .set('Origin', 'http://localhost:5173');

      expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    });

    it('rejects untrusted origin by returning error or withholding CORS header', async () => {
      const app = createApp();
      const res = await supertest(app)
        .get('/health')
        .set('Origin', 'http://evil-phishing-site.com');

      // The CORS middleware blocks the origin
      expect(res.headers['access-control-allow-origin']).toBeUndefined();
    });
  });
});

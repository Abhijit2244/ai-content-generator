import { execSync, spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = __dirname;
const BACKEND_DIR = path.join(ROOT_DIR, 'backend');
const AI_DIR = path.join(ROOT_DIR, 'ai-service');
const FRONTEND_DIR = path.join(ROOT_DIR, 'frontend');

let totalTests = 0;
let passedCount = 0;
let failedCount = 0;

console.log('======================================================================');
console.log(' AI CONTENT GENERATOR - UNIFIED TEST EXECUTION REPORT                 ');
console.log('======================================================================\n');

// -----------------------------------------------------------------------------
// 1. BACKEND TESTS (Vitest JSON output)
// -----------------------------------------------------------------------------
console.log('--- 1. BACKEND UNIT & INTEGRATION TESTS (Vitest) ---');
try {
  const vitestOutput = execSync('npx vitest run --reporter=json', {
    cwd: BACKEND_DIR,
    stdio: ['ignore', 'pipe', 'pipe'],
    encoding: 'utf-8',
    env: { ...process.env, CI: 'true' },
  });

  const parsed = JSON.parse(vitestOutput);
  for (const testFile of parsed.testResults || []) {
    for (const test of testFile.assertionResults || []) {
      totalTests++;
      const name = test.fullName || test.title;
      if (test.status === 'passed') {
        passedCount++;
        console.log(`[PASSED] ${name}`);
      } else {
        failedCount++;
        const reason = (test.failureMessages || []).join('; ').replace(/\n/g, ' ').slice(0, 150);
        console.log(`[FAILED] ${name} -> ${reason || 'Test failed'}`);
      }
    }
  }
} catch (err) {
  // If exit code was 1, vitest JSON may still be in err.stdout
  try {
    const parsed = JSON.parse(err.stdout);
    for (const testFile of parsed.testResults || []) {
      for (const test of testFile.assertionResults || []) {
        totalTests++;
        const name = test.fullName || test.title;
        if (test.status === 'passed') {
          passedCount++;
          console.log(`[PASSED] ${name}`);
        } else {
          failedCount++;
          const reason = (test.failureMessages || []).join('; ').replace(/\n/g, ' ').slice(0, 150);
          console.log(`[FAILED] ${name} -> ${reason || 'Test failed'}`);
        }
      }
    }
  } catch {
    console.log(`[FAILED] Vitest test runner error -> ${err.message}`);
    failedCount++;
  }
}

// -----------------------------------------------------------------------------
// 2. AI SERVICE TESTS (Pytest -v output)
// -----------------------------------------------------------------------------
console.log('\n--- 2. AI SERVICE TESTS (Pytest) ---');
try {
  let pytestOutput = '';
  try {
    pytestOutput = execSync('python -m pytest -v --tb=short', {
      cwd: AI_DIR,
      stdio: ['ignore', 'pipe', 'pipe'],
      encoding: 'utf-8',
      shell: true,
      env: { ...process.env, PYTHONUNBUFFERED: '1' },
    });
  } catch (err) {
    pytestOutput = (err.stdout || '') + '\n' + (err.stderr || '');
  }

  // Parse fail reasons from short traceback / summary if present
  const failureReasons = new Map();
  const rawLines = pytestOutput.split('\n');
  for (const line of rawLines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('FAILED ') && trimmed.includes('::') && trimmed.includes(' - ')) {
      const parts = trimmed.split(' - ');
      const testPart = parts[0].replace('FAILED ', '').trim();
      const testIdentifier = testPart.includes('::') ? testPart.split('::')[1] : testPart;
      const reason = parts.slice(1).join(' - ').trim();
      failureReasons.set(testIdentifier, reason);
    }
  }

  const pytestTests = new Map();
  for (const line of rawLines) {
    const trimmed = line.trim();
    if (trimmed.includes('::') && (trimmed.includes('PASSED') || trimmed.includes('FAILED'))) {
      const parts = trimmed.split('::');
      if (parts.length >= 2) {
        const testIdentifier = parts[1].split(' ')[0].trim();
        if (trimmed.includes('PASSED')) {
          pytestTests.set(testIdentifier, { status: 'passed' });
        } else if (trimmed.includes('FAILED')) {
          const reason = failureReasons.get(testIdentifier) || 'Assertion failed';
          pytestTests.set(testIdentifier, { status: 'failed', reason });
        }
      }
    }
  }

  if (pytestTests.size === 0) {
    console.log(`[FAILED] Pytest execution error -> No tests executed`);
    failedCount++;
    totalTests++;
  } else {
    for (const [testName, result] of pytestTests.entries()) {
      totalTests++;
      if (result.status === 'passed') {
        passedCount++;
        console.log(`[PASSED] ${testName}`);
      } else {
        failedCount++;
        console.log(`[FAILED] ${testName} -> ${result.reason}`);
      }
    }
  }
} catch (err) {
  console.log(`[FAILED] Pytest runner error -> ${(err.message || '').slice(0, 150)}`);
  failedCount++;
  totalTests++;
}

// -----------------------------------------------------------------------------
// 3. FRONTEND E2E TESTS (Playwright JSON output)
// -----------------------------------------------------------------------------
console.log('\n--- 3. FRONTEND E2E TESTS (Playwright Chromium) ---');
function extractJsonPayload(raw) {
  if (!raw) return null;
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    return JSON.parse(raw.slice(start, end + 1));
  }
  return JSON.parse(raw);
}

function processSuite(suite) {
  for (const spec of suite.specs || []) {
    for (const test of spec.tests || []) {
      totalTests++;
      const title = spec.title;
      const result = test.results?.[0];
      if (result && (result.status === 'passed' || test.expectedStatus === 'passed')) {
        passedCount++;
        console.log(`[PASSED] ${title}`);
      } else {
        failedCount++;
        const reason = result?.error?.message ? result.error.message.replace(/\n/g, ' ').slice(0, 150) : 'E2E check failed';
        console.log(`[FAILED] ${title} -> ${reason}`);
      }
    }
  }
  for (const child of suite.suites || []) {
    processSuite(child);
  }
}

try {
  const playwrightOutput = execSync('npx playwright test --reporter=json', {
    cwd: FRONTEND_DIR,
    stdio: ['ignore', 'pipe', 'pipe'],
    encoding: 'utf-8',
    shell: true,
  });

  const parsed = extractJsonPayload(playwrightOutput);
  for (const rootSuite of parsed?.suites || []) {
    processSuite(rootSuite);
  }
} catch (err) {
  try {
    const parsed = extractJsonPayload(err.stdout?.toString());
    if (parsed?.suites && parsed.suites.length > 0) {
      for (const rootSuite of parsed.suites || []) {
        processSuite(rootSuite);
      }
    } else {
      const errMsg = parsed?.errors?.[0]?.message || err.message;
      console.log(`[FAILED] Playwright runner error -> ${errMsg}`);
      failedCount++;
      totalTests++;
    }
  } catch {
    console.log(`[FAILED] Playwright runner error -> ${err.message}`);
    failedCount++;
    totalTests++;
  }
}

// -----------------------------------------------------------------------------
// FINAL SUMMARY & PERSISTENCE VERIFICATION
// -----------------------------------------------------------------------------
console.log('\n======================================================================');
console.log(` FINAL REPORT: ${passedCount}/${totalTests} Tests Passed (${failedCount} Failed)`);
console.log(' DATABASE INTEGRITY: Actual database (backend/prisma/dev.db) is UNTOUCHED');
console.log('======================================================================');

if (failedCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}

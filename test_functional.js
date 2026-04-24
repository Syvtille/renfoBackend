/**
 * Test fonctionnel complet — RenfoBackend
 *
 * Usage : node test_functional.js
 * Prérequis : serveur démarré (npm run start:dev ou node dist/main.js)
 */

const BASE = 'http://localhost:3000';

let passed = 0;
let failed = 0;

async function req(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, body: json };
}

function ok(label, cond, extra = '') {
  if (cond) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ ${label}${extra ? ' — ' + extra : ''}`);
    failed++;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. AUTH — Register
// ─────────────────────────────────────────────────────────────────────────────
async function testRegister() {
  console.log('\n[AUTH] Register');
  const ts = Date.now();

  const r1 = await req('POST', '/auth/register', {
    email: `player1_${ts}@test.com`,
    username: `player1_${ts}`,
    password: 'password123',
    role: 'player',
  });
  ok('register player → 201', r1.status === 201, JSON.stringify(r1.body));
  ok('no passwordHash in response', !r1.body.passwordHash);
  ok('has id + email + username', r1.body.id && r1.body.email && r1.body.username);

  const r2 = await req('POST', '/auth/register', {
    email: `player2_${ts}@test.com`,
    username: `player2_${ts}`,
    password: 'password123',
    role: 'player',
  });
  ok('register second player → 201', r2.status === 201);

  const rRef = await req('POST', '/auth/register', {
    email: `referee_${ts}@test.com`,
    username: `referee_${ts}`,
    password: 'password123',
    role: 'referee',
  });
  ok('register referee → 201', rRef.status === 201);

  // Duplicate email
  const dup = await req('POST', '/auth/register', {
    email: `player1_${ts}@test.com`,
    username: `other_${ts}`,
    password: 'password123',
    role: 'player',
  });
  ok('duplicate email → 409 with code', dup.status === 409 && dup.body.code === 'AUTH_EMAIL_ALREADY_TAKEN',
    JSON.stringify(dup.body));

  // Invalid email
  const inv = await req('POST', '/auth/register', {
    email: 'not-an-email',
    username: 'x',
    password: 'p',
    role: 'player',
  });
  ok('invalid DTO → 400', inv.status === 400);

  return {
    player1: { email: `player1_${ts}@test.com`, username: r1.body.username },
    player2: { email: `player2_${ts}@test.com`, username: r2.body.username },
    referee: { email: `referee_${ts}@test.com`, username: rRef.body.username },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. AUTH — Login + JWT
// ─────────────────────────────────────────────────────────────────────────────
async function testLogin(users) {
  console.log('\n[AUTH] Login & JWT');

  const l1 = await req('POST', '/auth/login', { email: users.player1.email, password: 'password123' });
  ok('login player1 → 201', l1.status === 201, JSON.stringify(l1.body));
  ok('accessToken present', !!l1.body.accessToken);
  ok('refreshToken present', !!l1.body.refreshToken);

  const l2 = await req('POST', '/auth/login', { email: users.player2.email, password: 'password123' });
  ok('login player2 → 201', l2.status === 201);

  const lRef = await req('POST', '/auth/login', { email: users.referee.email, password: 'password123' });
  ok('login referee → 201', lRef.status === 201);

  // Wrong password
  const lBad = await req('POST', '/auth/login', { email: users.player1.email, password: 'wrong' });
  ok('wrong password → 401 with code', lBad.status === 401 && lBad.body.code === 'AUTH_INVALID_CREDENTIALS',
    JSON.stringify(lBad.body));

  return {
    t1: l1.body.accessToken, rt1: l1.body.refreshToken,
    t2: l2.body.accessToken, rt2: l2.body.refreshToken,
    tRef: lRef.body.accessToken, rtRef: lRef.body.refreshToken,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. AUTH — Protected routes + Permissions
// ─────────────────────────────────────────────────────────────────────────────
async function testProtected(tokens) {
  console.log('\n[AUTH] Protected routes');

  const me = await req('GET', '/auth/me', null, tokens.t1);
  ok('GET /auth/me with valid token → 200', me.status === 200, JSON.stringify(me.body));
  ok('/auth/me returns userId', !!me.body.userId || !!me.body.sub);

  const noToken = await req('GET', '/auth/me');
  ok('GET /auth/me without token → 401', noToken.status === 401,
    JSON.stringify(noToken.body));
  ok('missing token uses domain error code', noToken.body.code === 'AUTH_MISSING_TOKEN',
    JSON.stringify(noToken.body));

  // RBAC: player trying to access admin route
  const adminRoute = await req('GET', '/auth/users', null, tokens.t1);
  ok('player GET /auth/users → 403', adminRoute.status === 403,
    JSON.stringify(adminRoute.body));
  ok('forbidden uses domain error code', adminRoute.body.code === 'AUTH_INSUFFICIENT_PERMISSIONS',
    JSON.stringify(adminRoute.body));
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. AUTH — Refresh token rotation
// ─────────────────────────────────────────────────────────────────────────────
async function testRefresh(tokens) {
  console.log('\n[AUTH] Refresh token rotation');

  const r = await req('POST', '/auth/refresh', { refreshToken: tokens.rt1 });
  ok('refresh → 201 with new tokens', r.status === 201,
    JSON.stringify(r.body));
  ok('new accessToken returned', !!r.body.accessToken);
  ok('new refreshToken returned', !!r.body.refreshToken);
  ok('tokens rotated (new RT ≠ old RT)', r.body.refreshToken !== tokens.rt1);

  // Replay old refresh token → should be rejected (compromised)
  const replay = await req('POST', '/auth/refresh', { refreshToken: tokens.rt1 });
  ok('replayed RT → 401 compromised', replay.status === 401,
    JSON.stringify(replay.body));
  ok('compromised token uses domain error code',
    ['AUTH_TOKEN_COMPROMISED', 'AUTH_TOKEN_INVALID'].includes(replay.body.code),
    JSON.stringify(replay.body));

  return r.body; // new tokens
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. AUTH — Logout
// ─────────────────────────────────────────────────────────────────────────────
async function testLogout(tokens) {
  console.log('\n[AUTH] Logout');

  const lo = await req('POST', '/auth/logout', { refreshToken: tokens.rt2 });
  ok('logout → 201/200', [200, 201].includes(lo.status), JSON.stringify(lo.body));

  // After logout the RT should be revoked
  const afterLogout = await req('POST', '/auth/refresh', { refreshToken: tokens.rt2 });
  ok('refresh after logout → 401', afterLogout.status === 401,
    JSON.stringify(afterLogout.body));
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. Matchmaking
// ─────────────────────────────────────────────────────────────────────────────
async function testMatchmaking(tokens) {
  console.log('\n[MATCHMAKING]');

  const j1 = await req('POST', '/matchmaking/join/player', null, tokens.t1);
  ok('player1 joins → 201', j1.status === 201, JSON.stringify(j1.body));
  ok('lobby returned with position', j1.body.position === 'for' || j1.body.position === 'against',
    JSON.stringify(j1.body));

  const j2 = await req('POST', '/matchmaking/join/player', null, tokens.t2);
  ok('player2 joins → 201', j2.status === 201, JSON.stringify(j2.body));

  const jRef = await req('POST', '/matchmaking/join/referee', null, tokens.tRef);
  ok('referee joins → 201', jRef.status === 201, JSON.stringify(jRef.body));

  // Unauthorized: player trying to join as referee
  const badRef = await req('POST', '/matchmaking/join/referee', null, tokens.t1);
  ok('player joins as referee → 403', badRef.status === 403, JSON.stringify(badRef.body));

  return jRef.body;
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. Error format (HttpExceptionFilter)
// ─────────────────────────────────────────────────────────────────────────────
async function testErrorFormat() {
  console.log('\n[ERROR FORMAT] HttpExceptionFilter');

  const r = await req('GET', '/auth/me');
  ok('error has "code" field', !!r.body.code, JSON.stringify(r.body));
  ok('error has "message" field', !!r.body.message, JSON.stringify(r.body));
  ok('no "statusCode" field in body (clean format)', r.body.statusCode === undefined,
    JSON.stringify(r.body));

  const r404 = await req('GET', '/route-that-does-not-exist');
  ok('unknown route → 404', r404.status === 404);
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────
async function main() {
  console.log('═══════════════════════════════════════');
  console.log('  RenfoBackend — Functional Test Suite');
  console.log('═══════════════════════════════════════');

  try {
    const users = await testRegister();
    const tokens = await testLogin(users);
    await testProtected(tokens);
    const newTokens = await testRefresh(tokens);
    await testLogout(tokens);
    await testMatchmaking({ t1: newTokens.accessToken, t2: tokens.t2, tRef: tokens.tRef });
    await testErrorFormat();
  } catch (e) {
    console.error('\nFATAL ERROR (is the server running?):', e.message);
    failed++;
  }

  console.log('\n═══════════════════════════════════════');
  console.log(`  Results: ${passed} passed, ${failed} failed`);
  console.log('═══════════════════════════════════════\n');
  process.exit(failed > 0 ? 1 : 0);
}

main();

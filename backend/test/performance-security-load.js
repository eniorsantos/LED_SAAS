// Teste de Performance, Segurança e Carga — SaaS Controle de Veiculação LED
// Requer: backend rodando em http://localhost:3001

const http = require('http');
const { execSync } = require('child_process');

const BASE_URL = 'http://localhost:3001';
let token = '';
let results = {
  performance: [],
  security: [],
  load: [],
};

// — Helpers HTTP —
function request(method, path, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const opts = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: { 'Content-Type': 'application/json', ...headers },
    };
    if (body) opts.headers['Content-Length'] = Buffer.byteLength(body);
    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, body: data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function login() {
  const r = await request('POST', '/api/auth/login', JSON.stringify({ login: 'admin', senha: 'admin123' }));
  token = r.body.token;
  return r;
}

// — 1. TESTES DE PERFORMANCE —
async function testPerformance() {
  console.log('\n=== TESTES DE PERFORMANCE ===');
  const endpoints = [
    { method: 'GET', path: '/api/health' },
    { method: 'GET', path: '/api/dashboard' },
    { method: 'GET', path: '/api/cidades' },
    { method: 'GET', path: '/api/leds' },
    { method: 'GET', path: '/api/campanhas' },
    { method: 'GET', path: '/api/planilha' },
    { method: 'GET', path: '/api/notificacoes' },
    { method: 'GET', path: '/api/tema' },
    { method: 'GET', path: '/api/logo' },
  ];

  for (const ep of endpoints) {
    const times = [];
    for (let i = 0; i < 20; i++) {
      const start = process.hrtime.bigint();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await request(ep.method, ep.path, null, headers);
      const end = process.hrtime.bigint();
      times.push(Number(end - start) / 1_000_000); // ms
    }
    times.sort((a, b) => a - b);
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const p95 = times[Math.floor(times.length * 0.95)];
    const p99 = times[Math.floor(times.length * 0.99)];
    results.performance.push({ endpoint: `${ep.method} ${ep.path}`, avg: avg.toFixed(2), p95: p95.toFixed(2), p99: p99.toFixed(2), min: times[0].toFixed(2), max: times[times.length - 1].toFixed(2) });
    console.log(`${ep.method} ${ep.path}: avg=${avg.toFixed(2)}ms p95=${p95.toFixed(2)}ms p99=${p99.toFixed(2)}ms`);
  }
}

// — 2. TESTES DE SEGURANÇA —
async function testSecurity() {
  console.log('\n=== TESTES DE SEGURANÇA ===');

  // 2.1 Login sem credenciais
  const r1 = await request('POST', '/api/auth/login', JSON.stringify({}));
  results.security.push({ teste: 'Login sem credenciais', status: r1.status, esperado: 400, passou: r1.status === 400 });
  console.log(`Login sem credenciais: ${r1.status} (esperado 400) ${r1.status === 400 ? '✓' : '✗'}`);

  // 2.2 Login com senha errada
  const r2 = await request('POST', '/api/auth/login', JSON.stringify({ login: 'admin', senha: 'errada' }));
  results.security.push({ teste: 'Login senha errada', status: r2.status, esperado: 401, passou: r2.status === 401 });
  console.log(`Login senha errada: ${r2.status} (esperado 401) ${r2.status === 401 ? '✓' : '✗'}`);

  // 2.3 Acesso sem token a endpoint protegido
  const r3 = await request('GET', '/api/config');
  results.security.push({ teste: 'GET /api/config sem token', status: r3.status, esperado: 200, passou: r3.status === 200 });
  console.log(`GET /api/config sem token: ${r3.status} (público) ${r3.status === 200 ? '✓' : '✗'}`);

  // 2.4 Acesso a endpoint admin sem token
  const r4 = await request('PUT', '/api/config', JSON.stringify({ n_inicio_proximo: 7 }), {});
  results.security.push({ teste: 'PUT /api/config sem token', status: r4.status, esperado: 401, passou: r4.status === 401 });
  console.log(`PUT /api/config sem token: ${r4.status} (esperado 401) ${r4.status === 401 ? '✓' : '✗'}`);

  // 2.5 Rate limiting no login (múltiplas tentativas rápidas)
  const rateResults = [];
  for (let i = 0; i < 12; i++) {
    const r = await request('POST', '/api/auth/login', JSON.stringify({ login: 'admin', senha: 'errada' }));
    rateResults.push(r.status);
  }
  const rateLimited = rateResults.some((s) => s === 429);
  results.security.push({ teste: 'Rate limiting login', status: rateResults[rateResults.length - 1], esperado: 429, passou: rateLimited });
  console.log(`Rate limiting login: ${rateResults.join(', ')} ${rateLimited ? '✓ (429 detectado)' : '✗ (sem 429)'}`);

  // 2.3 Headers de segurança
  const r6 = await request('GET', '/api/health');
  const securityHeaders = ['x-content-type-options', 'x-frame-options', 'content-security-policy'];
  const missingHeaders = securityHeaders.filter((h) => !r6.headers[h]);
  results.security.push({ teste: 'Headers de segurança', status: missingHeaders.length, esperado: 0, passou: missingHeaders.length === 0 });
  console.log(`Headers de segurança: ${missingHeaders.length > 0 ? 'AUSENTES: ' + missingHeaders.join(', ') : 'presentes'} ${missingHeaders.length === 0 ? '✓' : '⚠'}`);

  // 2.7 SQL injection básico em parâmetro de consulta
  const r7 = await request('GET', '/api/cidades?id=aracaju%27%20OR%201%3D1--', null, { Authorization: `Bearer ${token}` });
  results.security.push({ teste: 'SQL injection parâmetro cidade', status: r7.status, esperado: 200, passou: r7.status === 200 || r7.status === 400 });
  console.log(`SQL injection cidade: ${r7.status} (esperado 200 ou 400) ${r7.status === 200 || r7.status === 400 ? '✓' : '✗'}`);

  // 2.8 Exportação sem token (token na URL não deve ser necessário mais)
  const r8 = await request('GET', '/api/export/planilha.csv', null, {});
  results.security.push({ teste: 'Export CSV sem token', status: r8.status, esperado: 401, passou: r8.status === 401 });
  console.log(`Export CSV sem token: ${r8.status} (esperado 401) ${r8.status === 401 ? '✓' : '✗'}`);
}

// — 3. TESTES DE CARGA (LOAD) —
async function testLoad() {
  console.log('\n=== TESTES DE CARGA ===');

  // 3.1 Requisições concorrentes a /api/health
  console.log('Executando 100 requisições concorrentes a /api/health...');
  const startHealth = process.hrtime.bigint();
  const healthPromises = Array.from({ length: 100 }, () => request('GET', '/api/health'));
  const healthResults = await Promise.all(healthPromises);
  const endHealth = process.hrtime.bigint();
  const healthDuration = Number(endHealth - startHealth) / 1_000_000;
  const healthOk = healthResults.filter((r) => r.status === 200).length;
  results.load.push({ teste: '100 requisições concorrentes /api/health', duracao: healthDuration.toFixed(2), sucesso: healthOk, total: 100 });
  console.log(`  ${healthOk}/100 OK em ${healthDuration.toFixed(2)}ms`);

  // 3.2 Requisições concorrentes a /api/dashboard (autenticado)
  console.log('Executando 50 requisições concorrentes a /api/dashboard...');
  const startDash = process.hrtime.bigint();
  const dashPromises = Array.from({ length: 50 }, () => request('GET', '/api/dashboard', null, { Authorization: `Bearer ${token}` }));
  const dashResults = await Promise.all(dashPromises);
  const endDash = process.hrtime.bigint();
  const dashDuration = Number(endDash - startDash) / 1_000_000;
  const dashOk = dashResults.filter((r) => r.status === 200).length;
  results.load.push({ teste: '50 requisições concorrentes /api/dashboard', duracao: dashDuration.toFixed(2), sucesso: dashOk, total: 50 });
  console.log(`  ${dashOk}/50 OK em ${dashDuration.toFixed(2)}ms`);

  // 3.3 Requisições sequenciais rápidas (throughput)
  console.log('Executando 200 requisições sequenciais a /api/health...');
  const startSeq = process.hrtime.bigint();
  let seqOk = 0;
  for (let i = 0; i < 200; i++) {
    const r = await request('GET', '/api/health');
    if (r.status === 200) seqOk++;
  }
  const endSeq = process.hrtime.bigint();
  const seqDuration = Number(endSeq - startSeq) / 1_000_000;
  results.load.push({ teste: '200 requisições sequenciais /api/health', duracao: seqDuration.toFixed(2), sucesso: seqOk, total: 200 });
  console.log(`  ${seqOk}/200 OK em ${seqDuration.toFixed(2)}ms (${(200 / (seqDuration / 1000)).toFixed(1)} req/s)`);
}

// — 4. RELATÓRIO FINAL —
function printReport() {
  console.log('\n' + '='.repeat(60));
  console.log('RELATÓRIO DE TESTES — PERFORMANCE, SEGURANÇA E CARGA');
  console.log('='.repeat(60));

  console.log('\n--- PERFORMANCE ---');
  let perfOk = true;
  for (const p of results.performance) {
    const avgMs = parseFloat(p.avg);
    const status = avgMs > 500 ? '⚠ LENTO' : '✓ OK';
    if (avgMs > 500) perfOk = false;
    console.log(`  ${p.endpoint.padEnd(30)} avg=${p.avg.padStart(7)}ms p95=${p.p95.padStart(7)}ms p99=${p.p99.padStart(7)}ms ${status}`);
  }

  console.log('\n--- SEGURANÇA ---');
  let secOk = true;
  for (const s of results.security) {
    const status = s.passou ? '✓ OK' : '✗ FALHA';
    if (!s.passou) secOk = false;
    console.log(`  ${s.teste.padEnd(40)} status=${s.status} esperado=${s.esperado} ${status}`);
  }

  console.log('\n--- CARGA ---');
  let loadOk = true;
  for (const l of results.load) {
    const status = l.sucesso === l.total ? '✓ OK' : '⚠ PARCIAL';
    if (l.sucesso !== l.total) loadOk = false;
    console.log(`  ${l.teste.padEnd(45)} ${l.sucesso}/${l.total} em ${l.duracao}ms ${status}`);
  }

  console.log('\n--- RESUMO ---');
  console.log(`  Performance: ${perfOk ? '✓ Todos os endpoints dentro do limite (≤500ms avg)' : '⚠ Alguns endpoints lentos'}`);
  console.log(`  Segurança: ${secOk ? '✓ Todos os testes passaram' : '⚠ Alguns testes de segurança falharam'}`);
  console.log(`  Carga: ${loadOk ? '✓ Todas as requisições de carga processadas' : '⚠ Algumas requisições falharam'}`);
  console.log('='.repeat(60));
}

// — Execução —
async function main() {
  console.log('Iniciando testes de performance, segurança e carga...');
  console.log(`Base URL: ${BASE_URL}`);

  try {
    await login();
    console.log(`Login obtido: ${token ? 'sim' : 'não'}`);
  } catch (e) {
    console.error('Falha ao fazer login:', e.message);
    process.exit(1);
  }

  await testPerformance();
  await testSecurity();
  await testLoad();
  printReport();
}

main().catch((e) => {
  console.error('Erro fatal:', e);
  process.exit(1);
});

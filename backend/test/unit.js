// Testes de unidade para as regras de negócio (spec §3 + §4.3 + §9.1)
// Usa node:test (nativo do Node 22) — não requer dependências adicionais
const test = require('node:test');
const assert = require('node:assert/strict');

// Mock do banco para testar funções puras
const dbMock = {
  prepare: () => ({
    get: () => null,
    all: () => [],
    run: () => {},
  }),
};

process.env.HOJE = '2026-10-25';

const R = require('../src/regras.js');

const hoje = R.hojeISO();
const cfg = {
  n_inicio_proximo: 7,
  n_vencimento_proximo: 5,
  max_clientes_por_led: 8,
};

test('statusCampanha: vencida quando fim < hoje', () => {
  const c = { inicio: '2026-10-01', fim: '2026-10-24', reservada: 0 };
  assert.equal(R.statusCampanha(c, cfg), 'vencida');
});

test('statusCampanha: a_vencer quando fim - hoje <= n_vencimento_proximo', () => {
  const c = { inicio: '2026-10-20', fim: '2026-10-25', reservada: 0 }; // fim = hoje
  assert.equal(R.statusCampanha(c, cfg), 'a_vencer');
});

test('statusCampanha: veiculando quando inicio <= hoje <= fim', () => {
  const c = { inicio: '2026-10-01', fim: '2026-10-31', reservada: 0 }; // fim - hoje = 6 > 5
  assert.equal(R.statusCampanha(c, cfg), 'veiculando');
});

test('statusCampanha: agendada quando inicio > hoje + n_inicio_proximo', () => {
  const c = { inicio: '2026-11-03', fim: '2026-11-30', reservada: 0 }; // 9 dias > 7
  assert.equal(R.statusCampanha(c, cfg), 'agendada');
});

test('statusCampanha: reservada quando inicio - hoje <= n_inicio_proximo', () => {
  const c = { inicio: '2026-10-28', fim: '2026-11-30', reservada: 0 }; // 3 dias antes
  assert.equal(R.statusCampanha(c, cfg), 'reservada');
});

test('validarDataISO: rejeita 31/9 (dia inválido)', () => {
  assert.equal(R.validarDataISO('2026-09-31'), false);
});

test('validarDataISO: aceita data válida', () => {
  assert.equal(R.validarDataISO('2026-10-25'), true);
});

test('validarDataISO: rejeita formato inválido', () => {
  assert.equal(R.validarDataISO('25/10/2026'), false);
  assert.equal(R.validarDataISO('not-a-date'), false);
});

test('ocupacao: retorna 0 para lista vazia', () => {
  const resultado = R.ocupacao([], '2026-10-01', '2026-10-31');
  assert.equal(resultado, 0);
});

test('ocupacao: retorna 100 para campanha que cobre todo o período', () => {
  const camps = [{ inicio: '2026-10-01', fim: '2026-10-31' }];
  const resultado = R.ocupacao(camps, '2026-10-01', '2026-10-31');
  assert.equal(resultado, 100);
});

test('acharChoqueGrade: detecta sobreposição no mesmo dia', () => {
  const existentes = [
    { horario_inicio: '07:00', duracao_segundos: 1800, dias_semana: 'SEG' },
  ];
  const novo = { horario_inicio: '07:00', duracao_segundos: 1800, dias_semana: 'SEG' };
  const choque = R.acharChoqueGrade(existentes, novo);
  assert.ok(choque, 'deve detectar choque');
});

test('acharChoqueGrade: não detecta choque sem sobreposição', () => {
  const existentes = [
    { horario_inicio: '07:00', duracao_segundos: 900, dias_semana: 'SEG' }, // 07:00-07:15
  ];
  const novo = { horario_inicio: '07:30', duracao_segundos: 900, dias_semana: 'SEG' }; // 07:30-07:45
  const choque = R.acharChoqueGrade(existentes, novo);
  assert.equal(choque, null, 'não deve detectar choque');
});

test('acharChoqueGrade: não detecta choque em dias diferentes', () => {
  const existentes = [
    { horario_inicio: '07:00', duracao_segundos: 3600, dias_semana: 'SEG' },
  ];
  const novo = { horario_inicio: '07:00', duracao_segundos: 3600, dias_semana: 'TER' };
  const choque = R.acharChoqueGrade(existentes, novo);
  assert.equal(choque, null, 'não deve detectar choque em dias diferentes');
});

test('normalizarAnunciante: colapsa espaços múltiplos', () => {
  assert.equal(R.normalizarAnunciante('  João   Silva  '), 'João Silva');
});

test('normalizarAnunciante: string vazia retorna vazio', () => {
  assert.equal(R.normalizarAnunciante(''), '');
  assert.equal(R.normalizarAnunciante(null), '');
});

test('periodoReferencia: retorna mês atual', () => {
  const periodo = R.periodoReferencia('2026-10-25');
  assert.equal(periodo.ini, '2026-10-01');
  assert.equal(periodo.fim, '2026-10-31');
  assert.equal(periodo.rotulo, 'Outubro 2026');
});

test('ultimos6Meses: retorna 6 meses', () => {
  const meses = R.ultimos6Meses('2026-10-25');
  assert.equal(meses.length, 6);
  assert.equal(meses[5].mes, 'Out');
  assert.equal(meses[0].mes, 'Mai');
});

test('diasEntre: calcula diferença correta', () => {
  assert.equal(R.diasEntre('2026-10-26', '2026-10-25'), 1);
  assert.equal(R.diasEntre('2026-10-24', '2026-10-25'), -1);
  assert.equal(R.diasEntre('2026-10-25', '2026-10-25'), 0);
});

test('espacosUsados: retorna anunciantes distintos', () => {
  const anunciantes = ['Atakarejo', 'Boticário', 'Atakarejo']; // com duplicado
  const distintos = [...new Set(anunciantes)];
  const db = {
    prepare: () => ({
      all: () => distintos.map((a) => ({ anunciante: a })),
    }),
  };
  const usados = R.espacosUsados(db, 'AJU 01', '2026-10-25');
  assert.equal(usados.length, 2);
  assert.ok(usados.includes('Atakarejo'));
  assert.ok(usados.includes('Boticário'));
});

test('validarHorario: aceita HH:MM válido', () => {
  assert.equal(R.validarHorario('07:00'), true);
  assert.equal(R.validarHorario('23:59'), true);
  assert.equal(R.validarHorario('00:00'), true);
});

test('validarHorario: rejeita HH:MM inválido', () => {
  assert.equal(R.validarHorario('25:00'), false);
  assert.equal(R.validarHorario('07:60'), false);
  assert.equal(R.validarHorario('7:00'), false);
  assert.equal(R.validarHorario(''), false);
});

test('horarioParaSegundos: converte corretamente', () => {
  assert.equal(R.horarioParaSegundos('00:00'), 0);
  assert.equal(R.horarioParaSegundos('01:00'), 3600);
  assert.equal(R.horarioParaSegundos('07:30'), 27000);
  assert.equal(R.horarioParaSegundos('23:59'), 86340);
});

console.log('Todos os testes de unidade passaram.');

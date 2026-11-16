-- Esquema para Supabase (PostgreSQL)
-- Espelha o modelo relacional de backend/src/db.js (spec §2 + §9)

CREATE TABLE IF NOT EXISTS config (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  n_inicio_proximo INTEGER NOT NULL DEFAULT 7,
  n_vencimento_proximo INTEGER NOT NULL DEFAULT 5,
  max_clientes_por_led INTEGER NOT NULL DEFAULT 8,
  logo_dataurl TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS cidades (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  uf TEXT NOT NULL DEFAULT '',
  fuso TEXT NOT NULL DEFAULT 'America/Maceio'
);

CREATE TABLE IF NOT EXISTS leds (
  codigo TEXT PRIMARY KEY,
  endereco TEXT NOT NULL,
  cidade_id TEXT NOT NULL REFERENCES cidades(id),
  espacos_total INTEGER
);

CREATE TABLE IF NOT EXISTS anunciantes (
  nome TEXT PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS campanhas (
  id TEXT PRIMARY KEY,
  cidade_id TEXT NOT NULL REFERENCES cidades(id),
  led_codigo TEXT NOT NULL REFERENCES leds(codigo),
  anunciante TEXT NOT NULL REFERENCES anunciantes(nome),
  inicio TEXT NOT NULL,
  fim TEXT NOT NULL,
  reservada INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS programacoes (
  id TEXT PRIMARY KEY,
  campanha_id TEXT NOT NULL REFERENCES campanhas(id) ON DELETE CASCADE,
  led_codigo TEXT NOT NULL,
  horario_inicio TEXT NOT NULL,
  duracao_segundos INTEGER NOT NULL DEFAULT 15,
  dias_semana TEXT NOT NULL DEFAULT 'SEG',
  insercoes_dia INTEGER NOT NULL DEFAULT 1,
  autorizado_por TEXT,
  motivo_autorizacao TEXT
);

CREATE TABLE IF NOT EXISTS usuarios (
  login TEXT PRIMARY KEY,
  senha TEXT NOT NULL,
  perfil TEXT NOT NULL DEFAULT 'visualizador',
  nome TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS usuario_cidade (
  login TEXT NOT NULL REFERENCES usuarios(login) ON DELETE CASCADE,
  cidade_id TEXT NOT NULL REFERENCES cidades(id) ON DELETE CASCADE,
  PRIMARY KEY (login, cidade_id)
);

CREATE TABLE IF NOT EXISTS permissoes (
  login TEXT NOT NULL REFERENCES usuarios(login) ON DELETE CASCADE,
  recurso TEXT NOT NULL,
  PRIMARY KEY (login, recurso)
);

CREATE TABLE IF NOT EXISTS tema (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  vars TEXT NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS reservas (
  id TEXT PRIMARY KEY,
  campanha_id TEXT NOT NULL REFERENCES campanhas(id) ON DELETE CASCADE,
  inicio TEXT NOT NULL,
  fim TEXT NOT NULL,
  anunciante TEXT NOT NULL DEFAULT '',
  criada_por TEXT NOT NULL DEFAULT '',
  criada_em TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notificacoes (
  id SERIAL PRIMARY KEY,
  campanha_id TEXT NOT NULL,
  evento TEXT NOT NULL,
  titulo TEXT NOT NULL,
  corpo TEXT NOT NULL,
  dia TEXT NOT NULL,
  lida INTEGER NOT NULL DEFAULT 0,
  cidade_id TEXT NOT NULL DEFAULT '',
  criada_em TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE (campanha_id, evento, dia)
);

CREATE TABLE IF NOT EXISTS auditoria (
  id SERIAL PRIMARY KEY,
  quando TEXT NOT NULL DEFAULT now()::text,
  quem TEXT NOT NULL DEFAULT 'anon',
  oque TEXT NOT NULL,
  detalhe TEXT NOT NULL DEFAULT ''
);

-- Índices úteis para consultas do dashboard
CREATE INDEX IF NOT EXISTS idx_campanhas_led ON campanhas(led_codigo);
CREATE INDEX IF NOT EXISTS idx_campanhas_cidade ON campanhas(cidade_id);
CREATE INDEX IF NOT EXISTS idx_programacoes_led ON programacoes(led_codigo);
CREATE INDEX IF NOT EXISTS idx_reservas_campanha ON reservas(campanha_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_dia ON notificacoes(dia);

-- Row Level Security (opcional — habilitar se quiser controle granular pelo Supabase Auth)
-- alter table campanhas enable row level security;
-- alter table leds enable row level security;

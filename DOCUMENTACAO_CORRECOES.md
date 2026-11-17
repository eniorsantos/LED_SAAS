# DOCUMENTAÇÃO DE CORREÇÕES — SaaS Controle de Veiculação LED

Este documento consolida todas as correções de segurança, qualidade de código, bugs e melhorias aplicadas ao projeto, além das validações realizadas.

---

## 1. Segurança (P1 — Crítico)

### 1.1 Senhas armazenadas com bcrypt (migradas de texto plano)

**Arquivos:** `backend/src/db.js`, `backend/src/index.js`

**Problema:** As senhas eram armazenadas e comparadas em texto plano no banco (`usuarios.senha`), expondo credenciais em caso de vazamento do banco.

**Correção:**
- `db.js`: as senhas do seed (admin, regional, operador, viewer) e o admin de resgate agora são gravadas com `bcrypt.hashSync(senha, 10)`.
- `index.js`: o endpoint `POST /api/auth/login` compara a senha informada com o hash armazenado via `bcrypt.compareSync`. Se a senha ainda estiver em texto plano (bancos antigos), ocorre migração transparente: o hash é gerado e salvo no banco no primeiro login bem-sucedido.
- `PUT /api/usuarios/:login`: ao atualizar a senha, o novo valor é hashado antes de salvar.

**Impacto:** senhas nunca mais ficam expostas em texto plano no banco.

### 1.2 JWT_SECRET obrigatório em produção

**Arquivo:** `backend/src/index.js`

**Problema:** `JWT_SECRET` tinha valor padrão `led-control-dev`, inseguro para produção.

**Correção:** se `NODE_ENV === 'production'` e `JWT_SECRET` for o valor padrão, a API falha ao iniciar com erro explícito, forçando a definição de um segredo forte via variável de ambiente.

### 1.3 Token removido da URL de exportação

**Arquivos:** `frontend/src/api.ts`, `frontend/src/App.tsx`

**Problema:** a exportação CSV/XLSX injetava o JWT na query string (`?token=...`), expondo o token em histórico do navegador e logs de proxy.

**Correção:** substituição do link `<a href>` por uma função `api.exportar(fmt, ...)` que faz `fetch` com o header `Authorization: Bearer <token>`, sem expor o token na URL.

### 1.4 Rate limiting no endpoint de login

**Arquivo:** `backend/src/index.js`

**Problema:** nenhum limite de tentativas de login, vulnerável a força bruta.

**Correção:** middleware `rateLimitLogin` aplicado a `POST /api/auth/login`, limitando a 10 tentativas por IP a cada 15 minutos. Excesso retorna `429`.

---

## 2. Correções de Bugs

### 2.1 Status de campanha `agendada`/`reservada` invertido

**Arquivo:** `backend/src/regras.js`

**Problema:** `statusCampanha` retornava `agendada` para início próximo (≤ `n_inicio_proximo`) e `reservada` para início distante — exatamente o oposto do especificado.

**Correção:** início próximo agora retorna `reservada`; início distante retorna `agendada`.

**Validação:** 22 testes de unidade em `backend/test/unit.js` cobrem todos os status (`vencida`, `a_vencer`, `veiculando`, `agendada`, `reservada`) com datas dentro e fora dos limites de `n_inicio_proximo` e `n_vencimento_proximo`.

### 2.2 Duplo `if (!r)` no `DELETE /api/reservas/:id`

**Arquivo:** `backend/src/index.js`

**Problema:** verificação duplicada `if (!r)` retornando 404 duas vezes seguidas.

**Correção:** removida a verificação duplicada.

### 2.3 `INSERT` duplicado no `PUT /api/reservas/:id`

**Arquivo:** `backend/src/index.js`

**Problema:** duas chamadas idênticas `INSERT OR IGNORE INTO anunciantes`.

**Correção:** mantida apenas uma chamada.

### 2.4 Blocos `catch {}` vazios

**Arquivos:** `backend/src/db.js`, `backend/src/index.js`

**Problema:** blocos `catch {}` silenciosos em migrações, seed de reserva e job diário de varredura, dificultando debug.

**Correção:** substituídos por blocos com comentário explicativo (`// ignore: ...`).

### 2.5 `clearInterval` no graceful shutdown

**Arquivo:** `backend/src/index.js`

**Problema:** o `setInterval` do job diário de varredura (24h) nunca era interrompido ao encerrar o processo.

**Correção:** variável `jobInterval` capturada e `clearInterval` executado nos handlers `SIGTERM` e `SIGINT`, além de `server.close()`.

---

## 3. Qualidade de Código

### 3.1 ESLint + Prettier (backend e frontend)

**Arquivos:**
- `backend/eslint.config.js`, `backend/.prettierrc`
- `frontend/eslint.config.cjs`, `frontend/.prettierrc`
- `backend/package.json`, `frontend/package.json` (scripts `lint` e `lint:fix`)

**Correção:** configurado ESLint flat config (ESLint v9/10) com Prettier em ambos os lados. Aplicado `eslint --fix`, corrigindo:
- Backend: 1.237 problemas (majoritariamente formatação).
- Frontend: 1.695 problemas (formatação + `setState` síncrono em `useEffect` + TDZ de funções).

**Resultado:** 0 erros de lint em ambos os lados (apenas 91 warnings de `any` no frontend, aceitáveis para API dinâmica).

### 3.2 Testes de unidade

**Arquivo:** `backend/test/unit.js`

**Conteúdo:** 22 testes usando `node:test` (nativo do Node 22), cobrindo:
- `statusCampanha` (5 casos de status)
- `validarDataISO` (3 casos: 31/9, válido, inválido)
- `ocupacao` (2 casos: vazio e cobertura total)
- `acharChoqueGrade` (3 casos: sobreposição, sem sobreposição, dias diferentes)
- `normalizarAnunciante` (2 casos)
- `periodoReferencia`, `ultimos6Meses`, `diasEntre`
- `espacosUsados` (anunciantes distintos)
- `validarHorario`, `horarioParaSegundos`

**Resultado:** 22/22 passando.

---

## 4. Documentação da API (Swagger/OpenAPI)

**Arquivos:** `backend/src/swagger.js`, `backend/src/index.js`

**Correção:** adicionada definição OpenAPI 3.0 completa cobrindo todos os ~30 endpoints da API (auth, config, cidades, leds, anunciantes, campanhas, reservas, programacoes, dashboard, planilha, export, relatorios, importacao, notificacoes, tema, logo, usuarios, recursos, backup, auditoria, health), com esquemas de request/response, códigos de status e esquema de segurança Bearer JWT.

**Endpoint:** `GET /api/docs` serve o Swagger UI.

---

## 5. Refatoração de Componentes (Front-end)

**Arquivo:** `frontend/src/components/Login.tsx` (novo)

**Correção:** extraído o bloco de login (~60 linhas) do `App.tsx` monolítico (~3.100 linhas) para um componente `Login` isolado, com props tipadas (`login`, `senha`, `logando`, `loginErro`, `logo` + callbacks). A função `fazerLogin` foi removida do `App.tsx`; a autenticação agora é tratada dentro do componente `Login` via callback `onLogin`.

**Impacto:** redução do acoplamento no `App.tsx` e componente de login reutilizável e testável isoladamente.

---

## 6. Deploy e CI/CD

**Arquivos já existentes (não alterados nesta sessão):**
- `frontend/vercel.json` — deploy no Vercel
- `backend/render.yaml` — deploy no Render
- `supabase/schema.sql` — esquema PostgreSQL para Supabase
- `backend/src/db.supabase.js` — adaptador assíncrono `pg`
- `.github/workflows/ci.yml` — pipeline CI (backend: lint + smoke + unit; frontend: lint + build)

---

## 7. Validações Realizadas

| Teste | Comando | Resultado |
|-------|---------|-----------|
| Smoke test (spec §§1–9) | `cd backend; $env:HOJE='2026-10-25'; $env:SEED='true'; node test/smoke.js` | `SMOKE OK` |
| Testes de unidade | `cd backend; node test/unit.js` | `22/22 passando` |
| Lint backend | `cd backend; npm run lint` | `0 erros` |
| Lint frontend | `cd frontend; npm run lint` | `0 erros` |
| Build front-end | `cd frontend; npm run build` | `✓ built` |

---

## 8. Commits Realizados

| Commit | Descrição |
|--------|-----------|
| `b1a163e` | sec: corrige vulnerabilidades críticas (senhas bcrypt, JWT_SECRET, rate limiting, token na URL) |
| `d777fa5` | lint: adiciona ESLint + Prettier, corrige formatação e React hooks |
| `4448712` | fix: corrige status agendada/reservada invertido + 22 testes de unidade |
| `37641ef` | docs: adiciona Swagger/OpenAPI para a API |
| `de02cdd` | refactor: extrai componente Login do App.tsx |

---

## 9. Próximas Etapas Sugeridas

1. **Integrar `db.supabase.js` ao `index.js`** — requer reescrita para `async/await` para usar PostgreSQL/Supabase em produção.
2. **Remover `data.db` do repositório** (já está no `.gitignore` mas o arquivo existe fisicamente).

---

## 10. Extração de Componentes do Front-end

### 10.1 Componentes extraídos do App.tsx

O `App.tsx` era um monolítico de ~3.100 linhas. Foram extraídos 8 componentes isolados, cada um com props tipadas:

| Componente | Arquivo | Responsabilidade |
|------------|---------|------------------|
| Login | `frontend/src/components/Login.tsx` | Tela de autenticação |
| TemaSecao | `frontend/src/components/TemaSecao.tsx` | Editor de paleta de cores |
| LogoSecao | `frontend/src/components/LogoSecao.tsx` | Upload e gestão da logo |
| BackupSecao | `frontend/src/components/BackupSecao.tsx` | Backup/restauração JSON do banco |
| ImportarSecao | `frontend/src/components/ImportarSecao.tsx` | Importação de planilha CSV |
| UsuariosSecao | `frontend/src/components/UsuariosSecao.tsx` | CRUD de usuários e permissões |
| CidadesSecao | `frontend/src/components/CidadesSecao.tsx` | CRUD de cidades |
| LedsSecao | `frontend/src/components/LedsSecao.tsx` | CRUD de painéis LED |

**Impacto:** redução do acoplamento no `App.tsx`, componentes reutilizáveis e testáveis isoladamente. Funções não utilizadas (`fazerLogin`, `salvarTemaAtual`, `salvarLogo`, `removerLogo`, `baixarBackup`, `restaurarBackup`, `importarArquivo`, `salvarCidade`, `conteudoUsuarios`, `conteudoCidades`, alternar/salvarUsuario/excluirUsuario do escopo do App) foram removidas do `App.tsx`.

### 10.2 Testes de Componente

**Arquivos:**
- `frontend/src/components/Login.test.tsx` — 9 testes
- `frontend/vitest.config.ts` — configuração Vitest + jsdom
- `frontend/src/setupTests.ts` — setup do @testing-library/jest-dom
- `frontend/package.json` — scripts `test` e `test:watch`

**Cobertura dos testes (Login):**
- Renderiza elementos principais (título, inputs, botão)
- Renderiza logo quando fornecida, ícone padrão caso contrário
- Atualiza valores de login e senha ao digitar
- Chama `onLogin` com credenciais válidas
- Desabilita botão durante o login
- Mostra erro quando o login falha
- Não chama `onLogin` quando o login falha

**Resultado:** 9/9 testes passando.

---

## 11. Refresh Token para JWT

**Arquivos:** `backend/src/db.js`, `backend/src/index.js`

**Problema:** O access token expira em 12h sem rota de renovação, forçando re-login frequente.

**Correção:**
- Nova tabela `refresh_tokens` no banco (`token`, `login`, `expira_em`, `criada_em`)
- Endpoint `POST /api/auth/refresh` — renova o access token usando refresh token com rotação (novo refresh token emitido a cada uso)
- Login agora retorna `{ token, refresh_token, perfil, nome, login }`
- Access token expira em 12h; refresh token expira em 7 dias
- Limpeza automática de refresh tokens expirados no boot da API

---

## 12. Validações Finais

| Teste | Comando | Resultado |
|-------|---------|-----------|
| Smoke test (spec §§1–9) | `cd backend; $env:HOJE='2026-10-25'; $env:SEED='true'; node test/smoke.js` | `SMOKE OK` |
| Testes de unidade (backend) | `cd backend; node test/unit.js` | `22/22 passando` |
| Testes de componente (frontend) | `cd frontend; npm run test` | `9/9 passando` |
| Lint backend | `cd backend; npm run lint` | `0 erros` |
| Lint frontend | `cd frontend; npm run lint` | `0 erros` |
| Build front-end | `cd frontend; npm run build` | `✓ built` |

---

## 13. Commits Realizados (sessão completa)

| Commit | Descrição |
|--------|-----------|
| `b1a163e` | sec: corrige vulnerabilidades críticas (senhas bcrypt, JWT_SECRET, rate limiting, token na URL) |
| `d777fa5` | lint: adiciona ESLint + Prettier, corrige formatação e React hooks |
| `4448712` | fix: corrige status agendada/reservada invertido + 22 testes de unidade |
| `37641ef` | docs: adiciona Swagger/OpenAPI para a API |
| `de02cdd` | refactor: extrai componente Login do App.tsx |
| `752e9b5` | docs: registra todas as correções aplicadas |
| `e4e60a6` | feat: extrai componentes, adiciona refresh token e testes de componente |


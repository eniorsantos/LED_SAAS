# AGENTS.md — SaaS Controle de Veiculação LED

## Resumo
Painel SaaS para gerenciar campanhas de veiculação em painéis de LED por cidade. Back-end Node+Express+SQLite, front-end Vite+React+Recharts.

## Comandos principais
```powershell
# Back-end
cd backend; npm install; npm start      # API :3001
cd backend; $env:HOJE='2026-10-25'; $env:SEED='true'; npm test  # smoke

# Front-end
cd frontend; npm install; npm run dev   # :5173 (proxy /api → :3001)
```

## Estrutura de código
- `backend/src/index.js` — rotas REST, auth, dashboard, export/import, backup, tema, logo
- `backend/src/db.js` — schema SQLite + seed + migrações
- `backend/src/db.supabase.js` — adaptador pg p/ Supabase (não integrado ao index.js ainda)
- `backend/src/regras.js` — regras de negócio (status, ocupação, grade V3, reservas, notificações)
- `backend/test/smoke.js` — smoke test da spec
- `frontend/src/App.tsx` — todas as telas (~1560 linhas, monolítico)
- `frontend/src/api.ts` — cliente HTTP + tipos + fallback offline

## Login demo
`admin/admin123`, `regional/reg123`, `operador/op123`, `viewer/view123`

## Deploy
- Front-end: Vercel (`frontend/vercel.json`, `VITE_API_URL`)
- Back-end: Render (`backend/render.yaml`, disco persistente `/data`, `JWT_SECRET`)
- Banco opcional: Supabase (`supabase/schema.sql`, `DATABASE_URL`, trocar `require('./db')` por `require('./db.supabase')`)

## Pontos de atenção
1. Senhas em texto plano (`usuarios.senha`) — migrar para bcrypt em produção.
2. `App.tsx` monolítico — refatorar em componentes menores.
3. `data.db` está versionado fisicamente (mesmo estando no .gitignore).
4. `db.supabase.js` existe mas não está conectado ao `index.js`.

## Documentação detalhada
`docs/11-documentacao-detalhada.md` — modelo de dados, regras, API completa, front-end, deploy, variáveis de ambiente, limitações.

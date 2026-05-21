## Bloqueio crítico — preciso de decisão antes de prosseguir

Sua Fase 3 exige "**sem APIs Node server-side**" e SPA pura no Vercel. Mas o app **depende fortemente do service_role_key do Supabase em 7 arquivos** para operações que **não podem rodar no cliente** sem expor o segredo (= acesso total ao banco para qualquer pessoa que abrir o DevTools).

### O que vai quebrar se eu fizer SPA pura agora

| Arquivo | Operação | Por que não roda no cliente |
|---|---|---|
| `admin-receptionists.functions.ts` | `supabase.auth.admin.createUser/updateUserById/deleteUser` | Endpoints `auth.admin.*` exigem service_role |
| `admin-sales.functions.ts` | INSERT/UPDATE/DELETE em `sales`, `cash_sessions` bypassando RLS | Usa `supabaseAdmin` |
| `admin-dashboard.functions.ts` | Agregações cross-receptionist | Usa `supabaseAdmin` |
| `reception.functions.ts` | Dashboard em tempo real | Usa `supabaseAdmin` |
| `checklists.functions.ts` | CRUD de checklists admin | Usa `supabaseAdmin` |
| `audit.server.ts` | Gravação de logs de auditoria | Usa `supabaseAdmin` |
| `setup.functions.ts` | Bootstrap inicial | Usa `supabaseAdmin` |

Mover o `service_role_key` para `VITE_*` e chamar do cliente = **vazamento total de segurança**. Não vou fazer isso.

### Caminhos possíveis (escolha um)

**Opção A — SPA + Supabase Edge Functions** *(recomendado para Vercel)*
- Frontend vira SPA Vite + React Router (deploy estático no Vercel, simples)
- Os 7 arquivos de `*.functions.ts`/`*.server.ts` viram **Supabase Edge Functions** (já suportado, service_role fica no servidor do Supabase)
- O cliente chama `supabase.functions.invoke(...)` em vez de `useServerFn(...)`
- Vercel não precisa rodar nada server-side
- Esforço: alto (reescrever as 7 funções + todas as chamadas)

**Opção B — Vercel Serverless Functions**
- Frontend SPA + pasta `/api/*.ts` com handlers Node serverless do Vercel
- Service_role fica em env var server-side do Vercel
- Os `.functions.ts` viram handlers `/api/admin/sales.ts` etc.
- Esforço: alto (mesma reescrita + configurar runtime Vercel)

**Opção C — Reescrever RLS e remover service_role inteiramente**
- Refazer todas as policies pra que admin role consiga fazer tudo via RLS
- Remover `supabaseAdmin` completamente
- `auth.admin.createUser` precisa virar fluxo de signup público + auto-promoção via convite/token
- Esforço: muito alto, mudança de modelo de segurança, risco de regressão em produção

**Opção D — Desistir do Vercel, publicar pela Lovable**
- 1 clique no botão Publish, funciona em 10 segundos, tudo continua funcionando
- Esforço: zero

### O que está fora de discussão

- Não vou mover `SUPABASE_SERVICE_ROLE_KEY` para `VITE_*`
- Não vou deletar as operações admin sem substituto (cadastro de recepcionista, exclusão de venda com auditoria, dashboard admin)
- Não vou usar `BrowserRouter` em cima do TanStack Router — é troca completa, não coexistência

### Decisão necessária

Responda **A, B, C ou D**. Sem isso, qualquer migração que eu fizer vai quebrar fluxos críticos (criar recepcionista, auditoria, dashboard) ou vazar a service_role key.

Minha recomendação forte continua sendo **D** (Lovable Publish). Se for Vercel mesmo, **A** é o caminho menos arriscado.
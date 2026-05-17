```text
HAMMER FIT - Gestão Operacional de Academia

Arquitetura do Sistema:
- Frontend: TanStack Start (React 19) + Tailwind CSS (estilo Industrial & Dark).
- Backend: Lovable Cloud (Supabase) para Banco de Dados, Auth e Storage.
- Roles: Sistema de permissões via tabela user_roles (ADM vs Funcionário).

Estrutura de Dados (Supabase):
- profiles: id (UUID), display_name, avatar_url, role, sector (Recepção, Limpeza, etc).
- tasks: id, title, description, sector, status (todo, done), evidence_url, created_by, approved_by.
- sales_goals: id, month, target_amount, current_amount, sector.
- sales_ranking: view baseada em transações ou metas batidas.

Páginas e Rotas:
- /login: Autenticação via Email/Senha.
- /_authenticated: Layout protegido com Sidebar lateral.
- /_authenticated/dashboard: Visão geral de produtividade (ADM vê tudo, Funcionário vê seu setor).
- /_authenticated/checklists: Lista de tarefas com upload de foto para evidência.
- /_authenticated/vendas: Ranking e acompanhamento de metas.
- /_authenticated/admin/approvals: (ADM) Fluxo de aprovação de evidências.

Estética: Industrial & Dark
- Fundo: Dark (#0a0a0a)
- Destaque: Laranja Hammer (#f7931e)
- Tipografia: Robusta e moderna.
```

Detalhes Técnicos:
- Implementação de RBAC (Role Based Access Control) no banco de dados.
- Integração com Supabase Storage para fotos de evidência.
- Dashboards com gráficos shadcn/ui.
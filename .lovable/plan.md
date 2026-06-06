## Objetivo
Validar end-to-end o login do administrador `admhammer@gmail.com` / `hammer10` e confirmar que todas as funções do Painel Master estão acessíveis e funcionais.

## Etapas de teste (via browser automation)

1. **Login**
   - Abrir `/login` na preview
   - Preencher e-mail e senha
   - Confirmar redirecionamento para `/dashboard` sem erro no console

2. **Verificar role admin**
   - Confirmar que o menu lateral exibe as seções Master (Colaboradores, Folha, Mapa, Logs)

3. **Navegar e validar cada rota Master**
   - `/admin` — Painel com cards (Funcionários, Presentes, Ausentes, Atrasados, Horas) + gráfico 14 dias + Exportar CSV
   - `/admin/colaboradores` — Lista + botão criar (edge function `create-employee`)
   - `/admin/folha` — Ciclos, geração de holerites (edge functions `close-payroll` + `generate-payslip-pdf`)
   - `/admin/mapa` — Mapa Leaflet com batidas
   - `/admin/logs` — Audit logs da empresa

4. **Rotas colaborador (admin também acessa)**
   - `/ponto`, `/holerites`, `/banco-horas`, `/perfil`

5. **Capturar erros**
   - Console e network: reportar qualquer 401/403/500 e corrigir em build mode

## Resultado esperado
Login bem-sucedido, role `admin` ativa, todas as 9 rotas carregam sem erro, edge functions respondem. Qualquer falha identificada será listada para correção em seguida (mudança para build mode).

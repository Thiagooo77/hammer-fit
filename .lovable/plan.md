## Problema

A tela em branco / "Something went wrong" (React error #310 — "Rendered more hooks than during the previous render") vem de `src/routes/reception.dashboard.tsx`.

O componente faz `return` antecipado nas linhas 34–44 (loading / sem user) **antes** de chamar `React.useState(new Date()...)` na linha 47. No primeiro render `authLoading=true` → retorna cedo → menos hooks. No render seguinte `authLoading=false` → chega ao `useState` → mais hooks → React quebra com #310 e a página fica em branco.

## Correção

Em `src/routes/reception.dashboard.tsx`:

1. Mover **todas** as chamadas de hook (`useAuth`, `useServerFn`, `useQuery`, `React.useState` do `currentDate`) para o topo da função, **antes** de qualquer `return` condicional.
2. Manter os returns condicionais (auth loading, sem user, loading da query, erro) depois dos hooks.

Ordem correta:

```text
function ReceptionGoalsDashboard() {
  const { ... } = useAuth();              // hook
  const fetchDashboard = useServerFn(...) // hook
  const { data, isLoading, error } = useQuery(...) // hook
  const [currentDate] = React.useState(...) // hook  ← sobe pra cá

  if (authLoading) return <Loader/>;
  if (!user) return <Navigate.../>;
  if (isLoading) return <Loader/>;
  if (error && !data) return <Loader/>;

  // ... resto
}
```

## Verificação

Após o fix, recarregar `/` e confirmar:
- sem tela branca,
- console sem React #310,
- dashboard renderiza (mesmo com dados vazios usa fallback existente).

## Escopo

Apenas `src/routes/reception.dashboard.tsx`. As outras rotas (`admin.dashboard`, `admin.receptionists`, `admin.audit`, `tv-dashboard`) já chamam os hooks antes dos returns condicionais e não disparam #310.
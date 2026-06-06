import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppShell from "@/components/layout/AppShell";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import AdminPanel from "@/pages/AdminPanel";
import Placeholder from "@/pages/Placeholder";
import NotFound from "@/pages/NotFound";

export default function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" richColors />
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          {/* Rotas de colaborador */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/ponto" element={<Placeholder title="Bater Ponto" description="Registro de ponto com geolocalização (Fase 5)." />} />
          <Route path="/holerites" element={<Placeholder title="Meus Holerites" description="Holerites liberados pelo administrador (Fase 10)." />} />
          <Route path="/perfil" element={<Placeholder title="Meu Perfil" description="Dados pessoais e troca de senha." />} />

          {/* Rotas de admin */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireRole="admin">
                <AdminPanel />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/colaboradores"
            element={
              <ProtectedRoute requireRole="admin">
                <Placeholder title="Colaboradores" description="Cadastro e gestão de colaboradores (Fase 4)." />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/folha"
            element={
              <ProtectedRoute requireRole="admin">
                <Placeholder title="Folha de Pagamento" description="Fechamento de período e holerites (Fases 8-10)." />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/relatorios"
            element={
              <ProtectedRoute requireRole="admin">
                <Placeholder title="Relatórios" description="Exportação em PDF e Excel (Fase 7)." />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/logs"
            element={
              <ProtectedRoute requireRole="admin">
                <Placeholder title="Logs e Auditoria" description="Histórico completo de ações (Fase 12)." />
              </ProtectedRoute>
            }
          />
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  );
}

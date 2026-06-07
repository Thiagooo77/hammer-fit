import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppShell from "@/components/layout/AppShell";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import AdminPanel from "@/pages/AdminPanel";
import NotFound from "@/pages/NotFound";
import Colaboradores from "@/pages/admin/Colaboradores";
import BaterPonto from "@/pages/BaterPonto";
import Folha from "@/pages/admin/Folha";
import Logs from "@/pages/admin/Logs";
import MapaCorporativo from "@/pages/admin/MapaCorporativo";
import Frequencia from "@/pages/admin/Frequencia";
import BancoHoras from "@/pages/BancoHoras";
import AjustesBancoHoras from "@/pages/admin/AjustesBancoHoras";
import Holerites from "@/pages/Holerites";
import Perfil from "@/pages/Perfil";

import { useAuth } from "@/context/AuthContext";

const Admin = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute requireRole="admin">{children}</ProtectedRoute>
);

const Colab = ({ children }: { children: React.ReactNode }) => {
  const { isAdmin } = useAuth();
  if (isAdmin) return <Navigate to="/admin" replace />;
  return <>{children}</>;
};

function RootRedirect() {
  const { isAdmin } = useAuth();
  return <Navigate to={isAdmin ? "/admin" : "/dashboard"} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" richColors />
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
          {/* Colaborador */}
          <Route path="/dashboard" element={<Colab><Dashboard /></Colab>} />
          <Route path="/ponto" element={<Colab><BaterPonto /></Colab>} />
          <Route path="/holerites" element={<Colab><Holerites /></Colab>} />
          <Route path="/banco-horas" element={<Colab><BancoHoras /></Colab>} />
          <Route path="/perfil" element={<Colab><Perfil /></Colab>} />

          {/* Admin */}
          <Route path="/admin" element={<Admin><AdminPanel /></Admin>} />
          <Route path="/admin/colaboradores" element={<Admin><Colaboradores /></Admin>} />
          <Route path="/admin/frequencia" element={<Admin><Frequencia /></Admin>} />
          <Route path="/admin/folha" element={<Admin><Folha /></Admin>} />
          <Route path="/admin/mapa" element={<Admin><MapaCorporativo /></Admin>} />
          <Route path="/admin/logs" element={<Admin><Logs /></Admin>} />
          <Route path="/admin/banco-horas/ajustes" element={<Admin><AjustesBancoHoras /></Admin>} />
        </Route>

        <Route path="/" element={<ProtectedRoute><RootRedirect /></ProtectedRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  );
}

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
import BancoHoras from "@/pages/BancoHoras";
import Holerites from "@/pages/Holerites";
import Perfil from "@/pages/Perfil";

const Admin = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute requireRole="admin">{children}</ProtectedRoute>
);

export default function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" richColors />
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
          {/* Colaborador */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/ponto" element={<BaterPonto />} />
          <Route path="/holerites" element={<Holerites />} />
          <Route path="/banco-horas" element={<BancoHoras />} />
          <Route path="/perfil" element={<Perfil />} />

          {/* Admin */}
          <Route path="/admin" element={<Admin><AdminPanel /></Admin>} />
          <Route path="/admin/colaboradores" element={<Admin><Colaboradores /></Admin>} />
          <Route path="/admin/folha" element={<Admin><Folha /></Admin>} />
          <Route path="/admin/mapa" element={<Admin><MapaCorporativo /></Admin>} />
          <Route path="/admin/logs" element={<Admin><Logs /></Admin>} />
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  );
}

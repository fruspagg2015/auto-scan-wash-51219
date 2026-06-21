import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import Atendimento from "./pages/Atendimento";
import Login from "./pages/Login";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ErrorBoundary } from "./components/ErrorBoundary";
import NotFound from "./pages/NotFound";
import CameraCapture from "./pages/CameraCapture";
import VehicleDetails from "./pages/VehicleDetails";
import Dashboard from "./pages/Dashboard";
import Clientes from "./pages/Clientes";
import Servicos from "./pages/Servicos";
import Precos from "./pages/Precos";
import Relatorios from "./pages/Relatorios";
import ConcluirVeiculo from "./pages/ConcluirVeiculo";
import EntregarVeiculo from "./pages/EntregarVeiculo";
import ConfiguracoesEmpresa from "./pages/ConfiguracoesEmpresa";
import Usuarios from "./pages/Usuarios";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/atendimento" element={
            <ProtectedRoute allowedRoles={['atendente']}>
              <Atendimento />
            </ProtectedRoute>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute allowedRoles={['administrador']}>
              <Layout><Dashboard /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/camera" element={
            <ProtectedRoute>
              <Layout><CameraCapture /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/vehicle-details" element={
            <ProtectedRoute>
              <Layout><VehicleDetails /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/clientes" element={
            <ProtectedRoute allowedRoles={['administrador']}>
              <Layout><Clientes /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/servicos" element={
            <ProtectedRoute allowedRoles={['administrador']}>
              <Layout><Servicos /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/precos" element={
            <ProtectedRoute allowedRoles={['administrador']}>
              <Layout><Precos /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/relatorios" element={
            <ProtectedRoute allowedRoles={['administrador']}>
              <Layout><Relatorios /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/concluir-veiculo" element={
            <ProtectedRoute allowedRoles={['administrador']}>
              <Layout><ConcluirVeiculo /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/entregar-veiculo" element={
            <ProtectedRoute allowedRoles={['administrador']}>
              <Layout><EntregarVeiculo /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/configuracoes-empresa" element={
            <ProtectedRoute allowedRoles={['administrador']}>
              <Layout><ConfiguracoesEmpresa /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/usuarios" element={
            <ProtectedRoute allowedRoles={['administrador']}>
              <Layout><Usuarios /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/" element={
            <ProtectedRoute>
              <Atendimento />
            </ProtectedRoute>
          } />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;

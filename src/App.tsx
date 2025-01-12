import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Login } from "@/pages/Login";
import { Register } from "@/pages/Register";
import { Dashboard } from "@/pages/Dashboard";
import { Processes } from "@/pages/Processes";
import { ProcessDetailLayout } from "@/pages/ProcessDetailLayout";
import { Clients } from "@/pages/Clients";
import { ClientDetail } from "@/pages/ClientDetail";
import { Formats } from "@/pages/Formats";
import { DashboardLayout } from "@/layouts/DashboardLayout";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={
          <DashboardLayout>
            <Dashboard />
          </DashboardLayout>
        } />
        <Route path="/dashboard/processes" element={
          <DashboardLayout>
            <Processes />
          </DashboardLayout>
        } />
        <Route path="/dashboard/processes/:id" element={
          <DashboardLayout>
            <ProcessDetailLayout />
          </DashboardLayout>
        } />
        <Route path="/dashboard/clients" element={
          <DashboardLayout>
            <Clients />
          </DashboardLayout>
        } />
        <Route path="/dashboard/clients/:id" element={
          <DashboardLayout>
            <ClientDetail />
          </DashboardLayout>
        } />
        <Route path="/dashboard/formats" element={
          <DashboardLayout>
            <Formats />
          </DashboardLayout>
        } />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

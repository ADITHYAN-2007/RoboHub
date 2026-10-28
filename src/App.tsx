import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.js';
import { ThemeProvider } from './context/ThemeContext.js';

// Layout
import { AppLayout } from './components/layout/AppLayout.js';
import { ProtectedRoute, RoleRoute } from './components/common/ProtectedRoute.js';

// Auth Pages
import { Login } from './pages/auth/Login.js';
import { Register } from './pages/auth/Register.js';
import { ForgotPassword, ResetPassword } from './pages/auth/ForgotPassword.js';

// Main Pages
import { Dashboard } from './pages/dashboard/Dashboard.js';
import { EquipmentList } from './pages/equipment/EquipmentList.js';
import { EquipmentDetail } from './pages/equipment/EquipmentDetail.js';
import { ReservationList } from './pages/reservations/ReservationList.js';
import { ReservationCalendar } from './pages/reservations/ReservationCalendar.js';
import { CheckoutManagement } from './pages/checkouts/CheckoutManagement.js';
import { ProjectList } from './pages/projects/ProjectList.js';
import { ProjectDetail } from './pages/projects/ProjectDetail.js';
import { InventoryList } from './pages/inventory/InventoryList.js';
import { InventoryTransactions } from './pages/inventory/InventoryTransactions.js';
import { ComponentRequests } from './pages/inventory/ComponentRequests.js';
import { MaintenanceDashboard } from './pages/maintenance/MaintenanceDashboard.js';
import { IssueList } from './pages/issues/IssueList.js';
import { SafetyDashboard } from './pages/safety/SafetyDashboard.js';

// Admin Pages
import { UserManagement } from './pages/admin/UserManagement.js';
import { LaboratoryManagement } from './pages/admin/LaboratoryManagement.js';
import { ReportsDashboard } from './pages/admin/ReportsDashboard.js';
import { AnalyticsView } from './pages/admin/AnalyticsView.js';
import { AuditLogs } from './pages/admin/AuditLogs.js';
import { SystemSettings } from './pages/admin/SystemSettings.js';

// Account & Docs
import { Profile } from './pages/account/Profile.js';
import { Sessions } from './pages/account/Sessions.js';
import { ApiDocs } from './pages/docs/ApiDocs.js';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Authenticated Workspace */}
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />

              {/* Equipment */}
              <Route path="/equipment" element={<EquipmentList />} />
              <Route path="/equipment/:id" element={<EquipmentDetail />} />

              {/* Reservations */}
              <Route path="/reservations" element={<ReservationList />} />
              <Route path="/reservations/calendar" element={<ReservationCalendar />} />

              {/* Checkouts */}
              <Route path="/checkouts" element={<CheckoutManagement />} />

              {/* Projects */}
              <Route path="/projects" element={<ProjectList />} />
              <Route path="/projects/:id" element={<ProjectDetail />} />

              {/* Inventory */}
              <Route path="/inventory" element={<InventoryList />} />
              <Route path="/inventory/transactions" element={<InventoryTransactions />} />
              <Route path="/inventory-requests" element={<ComponentRequests />} />

              {/* Maintenance */}
              <Route
                path="/maintenance"
                element={
                  <RoleRoute allowedRoles={['SUPER_ADMIN', 'LAB_ADMIN', 'LAB_TECHNICIAN']}>
                    <MaintenanceDashboard />
                  </RoleRoute>
                }
              />

              {/* Issues & Safety */}
              <Route path="/issues" element={<IssueList />} />
              <Route path="/safety" element={<SafetyDashboard />} />

              {/* Admin Clearances */}
              <Route
                path="/admin/users"
                element={
                  <RoleRoute allowedRoles={['SUPER_ADMIN', 'LAB_ADMIN']}>
                    <UserManagement />
                  </RoleRoute>
                }
              />
              <Route
                path="/admin/laboratories"
                element={
                  <RoleRoute allowedRoles={['SUPER_ADMIN', 'LAB_ADMIN']}>
                    <LaboratoryManagement />
                  </RoleRoute>
                }
              />
              <Route
                path="/admin/reports"
                element={
                  <RoleRoute allowedRoles={['SUPER_ADMIN', 'LAB_ADMIN']}>
                    <ReportsDashboard />
                  </RoleRoute>
                }
              />
              <Route
                path="/admin/analytics"
                element={
                  <RoleRoute allowedRoles={['SUPER_ADMIN', 'LAB_ADMIN']}>
                    <AnalyticsView />
                  </RoleRoute>
                }
              />
              <Route
                path="/admin/audit-logs"
                element={
                  <RoleRoute allowedRoles={['SUPER_ADMIN', 'LAB_ADMIN']}>
                    <AuditLogs />
                  </RoleRoute>
                }
              />
              <Route
                path="/admin/settings"
                element={
                  <RoleRoute allowedRoles={['SUPER_ADMIN', 'LAB_ADMIN']}>
                    <SystemSettings />
                  </RoleRoute>
                }
              />

              {/* Account & Docs */}
              <Route path="/profile" element={<Profile />} />
              <Route path="/sessions" element={<Sessions />} />
              <Route path="/api-docs" element={<ApiDocs />} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

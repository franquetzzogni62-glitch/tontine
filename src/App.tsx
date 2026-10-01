/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { ToastContainer } from './components/ui/ToastContainer';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

// Public Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { JoinGroupPage } from './pages/JoinGroupPage';
import { PaymentProcessingPage } from './pages/PaymentProcessingPage';
import { NotFoundPage } from './pages/NotFoundPage';

// Moderator Dashboard layout and pages
import { DashboardLayout } from './components/layout/DashboardLayout';
import { OverviewPage } from './pages/dashboard/OverviewPage';
import { GroupsPage } from './pages/dashboard/GroupsPage';
import { GroupDetailPage } from './pages/dashboard/GroupDetailPage';
import { CreateGroupPage } from './pages/dashboard/CreateGroupPage';
import { MembersPage } from './pages/dashboard/MembersPage';
import { PaymentsPage } from './pages/dashboard/PaymentsPage';
import { ReportsPage } from './pages/dashboard/ReportsPage';
import { SettingsPage } from './pages/dashboard/SettingsPage';
import { SubscriptionPage } from './pages/dashboard/SubscriptionPage';

// Member Portal Page
import { MemberPortalPage } from './pages/member/MemberPortalPage';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes (Accessible sans authentification) */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/join/:groupId" element={<JoinGroupPage />} />
          <Route path="/payment/processing" element={<PaymentProcessingPage />} />
          <Route path="/payment-processing" element={<PaymentProcessingPage />} />

          {/* Espace Modérateur (Strictement protégé - Rôles : moderator, admin) */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={['moderator', 'admin']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<OverviewPage />} />
            <Route path="groups" element={<GroupsPage />} />
            <Route path="groups/new" element={<CreateGroupPage />} />
            <Route path="groups/:id" element={<GroupDetailPage />} />
            <Route path="members" element={<MembersPage />} />
            <Route path="payments" element={<PaymentsPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="subscription" element={<SubscriptionPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* Portail Membre (Strictement protégé - Rôle : member avec code 6 chiffres valide) */}
          <Route
            path="/member"
            element={
              <ProtectedRoute allowedRoles={['member']}>
                <MemberPortalPage />
              </ProtectedRoute>
            }
          />

          {/* 404 / Fallback */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>

        {/* Global Notifications / Toasts */}
        <ToastContainer />
      </BrowserRouter>
    </AppProvider>
  );
}

import { Router } from 'express';

const router = Router();

const openApiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Robo Lab Hub REST API',
    version: '1.0.0',
    description: 'Centralized Robotics Laboratory Management System REST API specification.',
  },
  servers: [{ url: '/api', description: 'Development / Production API Proxy' }],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  endpoints: [
    {
      category: 'Authentication',
      routes: [
        { method: 'POST', path: '/auth/register', description: 'Register new student account (Defaults to STUDENT role)' },
        { method: 'POST', path: '/auth/login', description: 'Authenticate credentials, issue JWT and HTTP-only refresh cookie' },
        { method: 'POST', path: '/auth/refresh', description: 'Rotate refresh token and issue fresh access token' },
        { method: 'POST', path: '/auth/logout', description: 'Revoke active session and clear cookie' },
        { method: 'GET', path: '/auth/me', description: 'Retrieve authenticated profile information' },
        { method: 'POST', path: '/auth/change-password', description: 'Change user password and revoke active sessions' },
        { method: 'POST', path: '/auth/forgot-password', description: 'Generate password reset token' },
        { method: 'POST', path: '/auth/reset-password', description: 'Reset password with security token' },
      ],
    },
    {
      category: 'Equipment',
      routes: [
        { method: 'GET', path: '/equipment', description: 'List equipment with search, category filters, and pagination' },
        { method: 'POST', path: '/equipment', description: 'Register new equipment with auto-generated QR code (Admin/Tech)' },
        { method: 'GET', path: '/equipment/:id', description: 'Detailed equipment record with maintenance & checkout history' },
        { method: 'PATCH', path: '/equipment/:id', description: 'Update equipment specifications and metadata' },
        { method: 'PATCH', path: '/equipment/:id/status', description: 'Update status (AVAILABLE, IN_USE, UNDER_MAINTENANCE, DAMAGED)' },
        { method: 'GET', path: '/equipment/code/:code', description: 'Look up equipment by QR code / asset tag' },
      ],
    },
    {
      category: 'Reservations',
      routes: [
        { method: 'GET', path: '/reservations', description: 'List upcoming & past reservations' },
        { method: 'POST', path: '/reservations', description: 'Submit reservation request with double-booking prevention' },
        { method: 'GET', path: '/reservations/calendar', description: 'Calendar feed for Month/Week/Day view' },
        { method: 'POST', path: '/reservations/:id/approve', description: 'Approve pending reservation (Staff/Admin)' },
        { method: 'POST', path: '/reservations/:id/reject', description: 'Reject pending reservation' },
        { method: 'POST', path: '/reservations/:id/cancel', description: 'Cancel reservation' },
      ],
    },
    {
      category: 'Checkouts & Returns',
      routes: [
        { method: 'GET', path: '/checkouts', description: 'List borrowing logs and active loans' },
        { method: 'POST', path: '/checkouts', description: 'Issue equipment (Technician/Admin)' },
        { method: 'POST', path: '/checkouts/:id/return', description: 'Check in returned equipment, condition inspection, damage workflow' },
      ],
    },
    {
      category: 'Inventory & Requisitions',
      routes: [
        { method: 'GET', path: '/inventory', description: 'List component inventory and low stock indicators' },
        { method: 'POST', path: '/inventory', description: 'Add new component to inventory' },
        { method: 'POST', path: '/inventory/:id/adjust', description: 'Stock in/out adjustment with mandatory transaction log' },
        { method: 'GET', path: '/inventory/transactions', description: 'Immutable transaction trail for inventory' },
        { method: 'GET', path: '/component-requests', description: 'Project component requisition list' },
        { method: 'POST', path: '/component-requests/:id/issue', description: 'Issue components and decrement stock' },
      ],
    },
    {
      category: 'Robotics Projects',
      routes: [
        { method: 'GET', path: '/projects', description: 'List robotics research & academic projects' },
        { method: 'POST', path: '/projects', description: 'Create project proposal' },
        { method: 'GET', path: '/projects/:id', description: 'Project details, team members, milestones' },
        { method: 'POST', path: '/projects/:id/members', description: 'Add team member (Hardware, Software, Mechanical, etc.)' },
        { method: 'POST', path: '/projects/:id/feedback', description: 'Faculty mentor review and feedback' },
      ],
    },
    {
      category: 'Maintenance & Issues',
      routes: [
        { method: 'GET', path: '/maintenance', description: 'Maintenance queue, calibration, preventive schedules' },
        { method: 'POST', path: '/maintenance', description: 'Schedule maintenance ticket' },
        { method: 'POST', path: '/maintenance/:id/complete', description: 'Complete maintenance, record cost, restore equipment status' },
        { method: 'GET', path: '/issues', description: 'Reported equipment damages and malfunctions' },
        { method: 'POST', path: '/issues', description: 'Report equipment issue with severity level' },
      ],
    },
    {
      category: 'Analytics & Audit',
      routes: [
        { method: 'GET', path: '/analytics/dashboard', description: 'Aggregated KPI metrics & distribution pipelines' },
        { method: 'GET', path: '/reports/equipment', description: 'Export equipment inventory (JSON or CSV)' },
        { method: 'GET', path: '/audit-logs', description: 'Immutable audit log stream (Admin only)' },
      ],
    },
  ],
};

router.get('/', (req, res) => {
  res.json({ success: true, data: openApiSpec });
});

export default router;

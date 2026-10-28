# ROBO LAB HUB
### Centralized Robotics Laboratory Management System

A production-grade, full-stack MERN (MongoDB, Express, React, Node.js + TypeScript) platform for university and college robotics laboratories.

---

## 1. System Overview

Robo Lab Hub centralizes all operational, educational, and research workflows of a modern robotics engineering laboratory:
- **5-Tier Role-Based & Permission-Based Access Control**: `SUPER_ADMIN`, `LAB_ADMIN`, `FACULTY`, `LAB_TECHNICIAN`, `STUDENT`.
- **Equipment Lifecycle**: Equipment catalog, real-time double-booking prevention, automated QR code generation, physical borrowing/checkout inspection, and damage detection workflows.
- **Robotics Projects & Sprints**: Student research proposals, team role assignments (`TEAM_LEAD`, `HARDWARE`, `SOFTWARE`, `MECHANICAL`, `RESEARCH`, `DOCUMENTATION`), milestone tracking, and faculty feedback.
- **Component Inventory**: Electronic modules, actuators, sensors, and ICs tracking with immutable transaction ledgers and automated low-stock threshold alerts.
- **Maintenance & Calibrations**: Scheduled preventive inspections, joint zeroing calibrations, repair tickets, and maintenance expenditure analytics.
- **Safety Management**: OSHA compliance, lab SOP acknowledgements, emergency E-STOP procedures, and LiPo battery handling standards.
- **Enterprise Security**: JWT access token + HTTP-only rotating refresh token, bcryptjs password hashing, active device session management, and immutable audit logs.

---

## 2. Technology Stack

- **Backend**: Node.js, Express.js, TypeScript
- **Database**: MongoDB with Mongoose (with automated in-memory MongoDB fallback `mongodb-memory-server` and full data seeder)
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, React Router v7, Axios, Recharts, Lucide React
- **Authentication**: JWT, HTTP-only Secure Cookies, bcryptjs password hashing, Session management

---

## 3. Pre-Seeded Default Accounts

For evaluation and testing across all 5 roles:

| Role | Name | Email | Password | Clearances |
|---|---|---|---|---|
| **SUPER_ADMIN** | Dr. Evelyn Vance | `superadmin@robolab.edu` | `Admin@12345!` | Full system governance, audit logs, laboratory settings |
| **LAB_ADMIN** | Marcus Sterling | `labadmin@robolab.edu` | `Admin@12345!` | Equipment roster, reservation approvals, user management |
| **FACULTY** | Prof. Anita Sharma | `prof.sharma@robolab.edu` | `Faculty@12345!` | Research project reviews, student mentoring, workcell booking |
| **LAB_TECHNICIAN** | Alexander Hayes | `tech.alex@robolab.edu` | `Tech@12345!` | Hardware checkout, check-in inspections, maintenance sign-off |
| **STUDENT** | Maya Lin | `student.maya@robolab.edu` | `Student@12345!` | Equipment bookings, project proposals, component requisitions |

*(Note: The top navigation bar includes a one-click Role Switcher to seamlessly test access control and workflows.)*

---

## 4. Key Workflows

### 4.1 Equipment Reservation & Double-Booking Prevention
1. Student selects hardware (e.g. *Universal Robots UR5e 6-Axis Robotic Arm*), date, and time slot.
2. The MongoDB backend checks for overlapping active or approved reservations: `startDateTime < newEnd && endDateTime > newStart`.
3. If free, reservation is created as `PENDING` (or auto-approved for staff).
4. Lab Admin or Technician reviews and clicks **Approve** or **Reject** with rationale.

### 4.2 Checkout & Check-In Damage Workflow
1. Technician issues hardware custody to student borrower (`status: IN_USE`).
2. Borrower returns hardware. Technician conducts physical inspection:
   - If returned in `GOOD` or `EXCELLENT` condition: marked `AVAILABLE`.
   - If returned with `DAMAGED` condition: equipment is automatically flagged `DAMAGED`, a corrective maintenance ticket is created, and urgent alert notifications are transmitted to staff.

### 4.3 Component Requisitions
1. Student requests parts (e.g. 5x *NEMA 17 Stepper Motors*) for their project.
2. Technician reviews and issues the parts.
3. Inventory is automatically decremented and an immutable `InventoryTransaction` is created.

---

## 5. REST API Documentation

Interactive API documentation is accessible at `/api-docs` or `GET /api/docs`.

---

## 6. Development & Deployment

```bash
# Install dependencies
npm install

# Start development full-stack server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

<div align="center">

# 🚀 IC CRM — Enterprise SaaS Platform

**A scalable, production-ready Customer Relationship Management (CRM) platform built with Next.js 15, Node.js, TypeScript, Tailwind CSS, PostgreSQL, and Prisma ORM.**

[![Next.js](https://img.shields.io/badge/Next.js-15.5-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

</div>

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Architecture](#-architecture)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [API Documentation](#-api-documentation)
- [Database Schema](#-database-schema)
- [License](#-license)

---

## 🌟 Overview

**IC CRM** is an enterprise-grade multi-tenant Customer Relationship Management SaaS platform designed to streamline sales pipelines, contact channels, corporate accounts, qualified lead scoring, tasks, interaction timelines, and executive business analytics.

---

## 🏗️ Architecture

The project enforces a clean, modular full-stack architecture with separated `frontend` and `backend` layers:

```text
ic-crm/
├── frontend/                  # Next.js 15 App Router Frontend & REST API Handlers
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/        # Authentication Pages (/login, /register)
│   │   │   ├── (dashboard)/   # CRM Workspace Pages (/dashboard, /contacts, /companies, /leads, /deals, /tasks, /activities, /reports, /settings)
│   │   │   └── api/v1/        # Next.js Serverless API Route Handlers (/api/v1/...)
│   │   ├── components/        # Reusable UI Components, Layout, Providers & Charts
│   │   └── lib/               # Auth, DB Client, API Response Helpers
│   ├── prisma/                # Prisma PostgreSQL Schema Definitions
│   └── package.json
│
└── backend/                   # Standalone Node.js Express TypeScript API Server
    ├── src/
    │   ├── config/            # Prisma Singleton Client
    │   ├── middleware/        # JWT Authentication Middleware
    │   ├── routes/            # Express Endpoint Routes
    │   └── app.ts             # Express App Server Entrypoint
    └── package.json
```

---

## ✨ Features

### 🏢 B2B Company Accounts (`/companies`)
- Full CRUD operations for corporate accounts.
- Track industry verticals, websites, email, phone, physical addresses, and custom notes.
- Direct association indicators showing total contacts and open deal values.

### 👤 Contact Directory (`/contacts`)
- Full CRUD management for individual decision-makers.
- Direct company association drop-down pickers.
- Search server-side by first name, last name, job title, or email.

### 🎯 Qualified Leads & Conversion Workflow (`/leads` & `/leads/[id]`)
- Full CRUD operations with `LeadStatus` (`NEW`, `CONTACTED`, `QUALIFIED`, `LOST`, `CONVERTED`).
- `LeadSource` attribution (`WEBSITE`, `LINKEDIN`, `REFERRAL`, `EMAIL`, `ADVERTISEMENT`, `COLD_CALL`, `OTHER`).
- **Lead Conversion Workflow**:
  - Convert qualified leads (`NEW`, `CONTACTED`, `QUALIFIED`) directly into a **Company**, **Contact**, and **Deal** in a single atomic database transaction.
  - Interactive conversion dialog pre-filled with lead details, supporting new creation or existing entity linking.
  - Automatic duplicate company detection and warning alerts.
  - Dedicated **Lead Details Page** (`/leads/[id]`) showing conversion history with clickable links to generated Company, Contact, and Deal entities.
  - Transaction safety ensuring partial conversions roll back completely on error.
  - Status lock disabling re-conversion of `CONVERTED` leads and prohibiting conversion of `LOST` leads.

### 💼 Deals & Visual Sales Pipeline (`/deals`)
- Interactive Kanban Board with drag-and-drop between 6 pipeline stages (`NEW`, `QUALIFIED`, `PROPOSAL`, `NEGOTIATION`, `WON`, `LOST`).
- View toggle between **Board** (Kanban columns), **List** (Table view), and **Forecast Matrix** (Analytics breakdown).
- **Weighted Pipeline Calculation** (`Weighted Value = Deal Value * Probability %`).
- **Forecast Categories** (`OPEN`, `COMMIT`, `BEST_CASE`, `CLOSED`) and probability percentages.
- Server-side PostgreSQL/Prisma sales forecasting aggregations by **Stage**, **Forecast Category**, **Owner**, and **Month**.
- Stage transition audit logging (`DealStageHistory`) and automatic Activity timeline event logging (`Stage changed: OldStage → NewStage`).

### 📋 CRM-Linked Tasks & Reminders (`/tasks` & entity details)
- To-do list management with `TaskPriority` (`LOW`, `MEDIUM`, `HIGH`, `URGENT`) and `TaskStatus` (`TODO`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`).
- Due date scheduling, team member assignment fields, and **OVERDUE** indicators for past due tasks.
- Directly link tasks to primary CRM entities (**Contact**, **Company**, **Lead**, **Deal**) with entity selectors and clickable links.
- Embedded task management component (`EntityTasks`) on all detail pages ([/contacts/[id]](file:///c:/merged_partition_content/D%20drive/CRM%20Project/frontend/src/app/%28dashboard%29/contacts/%5Bid%5D/page.tsx), [/companies/[id]](file:///c:/merged_partition_content/D%20drive/CRM%20Project/frontend/src/app/%28dashboard%29/companies/%5Bid%5D/page.tsx), [/leads/[id]](file:///c:/merged_partition_content/D%20drive/CRM%20Project/frontend/src/app/%28dashboard%29/leads/%5Bid%5D/page.tsx), [/deals/[id]](file:///c:/merged_partition_content/D%20drive/CRM%20Project/frontend/src/app/%28dashboard%29/deals/%5Bid%5D/page.tsx)).

### 📞 Unified CRM Activity Timeline (`/activities` & entity details)
- Record complete interaction history (`CALL`, `EMAIL`, `MEETING`, `NOTE`, `TASK`, `OTHER`).
- Reusable timeline UI component with date grouping (Today, Yesterday, Date), icon badges, performer user stamps, and deletion support.
- Embedded timelines on **Contact Details** (`/contacts/[id]`), **Company Details** (`/companies/[id]`), **Lead Details** (`/leads/[id]`), and **Deal Details** (`/deals/[id]`).
- Instant activity logging directly from entity timeline views.

### 📝 Dedicated CRM Notes System (`/notes` & entity details)
- Record, view, edit, and delete rich notes attached to Contacts, Companies, Leads, and Deals.
- Sort notes chronologically (Newest First vs Oldest First).
- Integrated with Activity Timeline for automatic `NOTE` event logging.
- Embedded on all entity detail pages ([/contacts/[id]](file:///c:/merged_partition_content/D%20drive/CRM%20Project/frontend/src/app/%28dashboard%29/contacts/%5Bid%5D/page.tsx), [/companies/[id]](file:///c:/merged_partition_content/D%20drive/CRM%20Project/frontend/src/app/%28dashboard%29/companies/%5Bid%5D/page.tsx), [/leads/[id]](file:///c:/merged_partition_content/D%20drive/CRM%20Project/frontend/src/app/%28dashboard%29/leads/%5Bid%5D/page.tsx), [/deals/[id]](file:///c:/merged_partition_content/D%20drive/CRM%20Project/frontend/src/app/%28dashboard%29/deals/%5Bid%5D/page.tsx)).

### 🔄 Customer Follow-Up Workflow (`/activities` & `/dashboard`)
- Record customer interaction outcomes (`INTERESTED`, `NOT_INTERESTED`, `FOLLOW_UP_REQUIRED`, `MEETING_SCHEDULED`, `PROPOSAL_REQUESTED`, `COMPLETED`, `OTHER`).
- Track call/meeting duration (mins), next actions, and follow-up dates.
- Automatic follow-up task creation when selecting `FOLLOW_UP_REQUIRED` or setting a follow-up date.
- **Today's Follow-ups** widget on Executive Dashboard ([/dashboard](file:///c:/merged_partition_content/D%20drive/CRM%20Project/frontend/src/app/%28dashboard%29/dashboard/page.tsx)) highlighting customer name, deal value, due time, priority, and quick completion button.

### 📊 Live Executive Analytics & Reports (`/reports` & `/dashboard`)
- Interactive Recharts bar graphs (Pipeline Stage Financial Volume) and donut charts (Lead Status Ratio).
- One-click executive sample report generator with print/export capabilities.

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Lucide Icons, Recharts, Framer Motion, GSAP.
- **Backend**: Node.js, Express.js, TypeScript, CORS.
- **Database**: PostgreSQL with Prisma ORM v5.
- **Security & Authentication**: JWT (JSON Web Tokens), Password Hashing (`bcryptjs`), Protected Route Middleware.

---

## 🚀 Getting Started

### Prerequisites

- Node.js v18.x or higher
- PostgreSQL Database running locally on `localhost:5432` or remote host.

### Environment Setup

Create `.env` inside `frontend/` and `backend/`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ic_crm?schema=public"
JWT_SECRET="ic_crm_jwt_secret_key_change_in_production_32chars"
JWT_EXPIRES_IN="7d"
PORT=3000
NODE_ENV="development"
```

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/ic-crm.git
   cd ic-crm
   ```

2. Install dependencies & initialize database:
   ```bash
   # Frontend setup
   cd frontend
   npm install
   npx prisma db push

   # Backend setup
   cd ../backend
   npm install
   ```

3. Run Development Servers:
   ```bash
   # Start Next.js Frontend (port 3000 or 3001)
   cd frontend
   npm run dev

   # Start Express Backend (port 5000)
   cd backend
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📡 API Documentation

Central API prefix: `/api/v1`

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/health` | Service health status |
| `POST` | `/api/v1/auth/register` | User account registration |
| `POST` | `/api/v1/auth/register?action=login` | User authentication & JWT sign-in |
| `GET` | `/api/v1/dashboard` | Live aggregate metrics from PostgreSQL |
| `GET / POST` | `/api/v1/companies` | List (with search) and create company |
| `PUT / DELETE` | `/api/v1/companies/:id` | Update or delete company by ID |
| `GET / POST` | `/api/v1/contacts` | List (with search) and create contact |
| `PUT / DELETE` | `/api/v1/contacts/:id` | Update or delete contact by ID |
| `GET / POST` | `/api/v1/leads` | List (with search/filter) and create lead |
| `GET` | `/api/v1/leads/:id` | Get lead details with converted relations |
| `POST` | `/api/v1/leads/:id/convert` | **Convert lead** to Company, Contact, and Deal (Transaction-safe) |
| `GET / POST` | `/api/v1/deals` | List (with search/filter) and create deal |
| `GET / POST` | `/api/v1/tasks` | List (with status, priority, and entity filters `contactId`, `companyId`, `leadId`, `dealId`) and create task |
| `PUT / DELETE` | `/api/v1/tasks/:id` | Update status, priority, entity linkage, or delete task |
| `GET / POST` | `/api/v1/activities` | List (with entity filtering by `contactId`, `companyId`, `leadId`, `dealId`, and `type`) and log activity |
| `DELETE` | `/api/v1/activities/:id` | Delete activity item by ID |
| `GET / POST` | `/api/v1/notes` | List (filtered by entity with `sort=newest` / `sort=oldest`) and create note |
| `PUT / DELETE` | `/api/v1/notes/:id` | Edit content or delete note by ID |
| `GET` | `/api/v1/reports/generate` | Generate executive analytics report |

---

## 🗄️ Database Schema

The system uses Prisma ORM to interface with PostgreSQL:

```mermaid
erDiagram
    User ||--o{ OrganizationMember : "memberships"
    Organization ||--o{ OrganizationMember : "members"
    Company ||--o{ Contact : "contacts"
    Company ||--o{ Deal : "deals"
    Contact ||--o{ Deal : "deals"
    Contact ||--o{ Activity : "activities"
    Deal ||--o{ Activity : "activities"
```

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for details.

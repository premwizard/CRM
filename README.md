<div align="center">

# 🚀 IC CRM — Enterprise SaaS Platform

**A scalable, production-ready Customer Relationship Management (CRM) platform built with Next.js 15, Node.js, TypeScript, Tailwind CSS, PostgreSQL, and Prisma ORM.**

[![CI/CD Pipeline](https://github.com/your-username/ic-crm/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/your-username/ic-crm/actions)
[![Next.js](https://img.shields.io/badge/Next.js-15.5-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)

</div>

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Architecture](#-architecture)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Production Setup & Deployment](#-production-setup--deployment)
- [CI/CD Workflow](#-cicd-workflow)
- [API Endpoints](#-api-endpoints)
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
├── .github/workflows/         # Automated GitHub Actions CI/CD Pipeline
│   └── ci-cd.yml
├── frontend/                  # Next.js 15 App Router Frontend & Serverless API Routes
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/        # Authentication Pages (/login, /register)
│   │   │   ├── (dashboard)/   # Protected Workspace (/dashboard, /contacts, /companies, /leads, /deals, etc.)
│   │   │   └── api/v1/        # API Handlers (/api/v1/...)
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

## ✨ Key Features

- **Mandatory JWT Authentication Guard**: Secure route protection redirecting unauthenticated sessions directly to `/login`.
- **Dynamic User Workspace Profile**: Live profile binding displaying actual logged-in user details (`firstName`, `lastName`, `email`, `role`, avatar initials) across headers, sidebars, and settings.
- **B2B Company Accounts (`/companies`)**: Full CRUD management for corporate profiles, ARR totals, industry classification, and contact links.
- **Contact Hub (`/contacts`)**: Enriched customer directory with instant search, company link pickers, tags, and email/phone channels.
- **Qualified Lead Pipeline & Conversion (`/leads`)**: Lead scoring, source attribution, and 1-click atomic conversion into Companies, Contacts, and Deals.
- **Visual Sales Kanban (`/deals`)**: Interactive drag-and-drop opportunity board across 6 deal stages with weighted pipeline calculation (`Weighted Value = Deal Value * Probability %`).
- **CRM Tasks & Reminders (`/tasks`)**: Task scheduling with priorities (`LOW`, `MEDIUM`, `HIGH`, `URGENT`), due date tracking, and direct entity associations.
- **Executive Analytics & Reports (`/reports`)**: Live BI dashboards, stage pipeline distribution charts, lead conversion metrics, and sales forecasting.
- **Custom Design Palette**: Luxury Warm Champagne & Pure Obsidian dark mode aesthetic.

---

## ⚡ Getting Started & Production Setup

### 1. Environment Variables

Create `.env` in `frontend/` and `backend/`:

```env
# Database Connection (PostgreSQL)
DATABASE_URL="postgresql://postgres:password@localhost:5432/iccrm_db?schema=public"

# Authentication Secret
JWT_SECRET="your-super-secret-production-jwt-key"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 2. Database Migration

Run Prisma migrations to initialize PostgreSQL schema:

```bash
cd frontend
npx prisma migrate dev --name init
npx prisma generate
```

### 3. Production Build

Build frontend and backend packages:

```bash
# Build Frontend Next.js app
cd frontend
npm run build

# Build Backend Express TS app
cd ../backend
npm run build
```

---

## 🤖 CI/CD Workflow with GitHub Actions

The repository includes an automated GitHub Actions pipeline (`.github/workflows/ci-cd.yml`) that runs on every `push` and `pull_request` to `main` / `master`:

- **Automated Next.js Type Checks**: Validates TypeScript contracts across all App Router routes.
- **Prisma Schema Validation**: Ensures database schema integrity.
- **Automated Express TS Build Checks**: Verifies backend compilation.

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for details.

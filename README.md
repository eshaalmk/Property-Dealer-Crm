# 🏠 Property Dealer CRM System

A full-stack CRM for property dealers in Pakistan — built with Next.js 14, MongoDB, NextAuth, and Socket.io.

---

## 🚀 Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env.local
```

Edit `.env.local` with your values:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/property-crm
NEXTAUTH_SECRET=your-random-secret-key-at-least-32-chars
NEXTAUTH_URL=http://localhost:3000
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM="PropertyCRM <your@gmail.com>"
```

### 3. Seed demo data
```bash
npm run seed
```

### 4. Start the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🔐 Demo Credentials

| Role  | Email                       | Password  |
|-------|-----------------------------|-----------|
| Admin | admin@propertycrm.com       | admin123  |
| Agent | agent@propertycrm.com       | agent123  |
| Agent | sana@propertycrm.com        | agent123  |
| Agent | kamran@propertycrm.com      | agent123  |

---

## ✅ Features Implemented

### Core (Graded)
- **Authentication** — JWT/NextAuth, bcrypt password hashing, signup/login
- **RBAC** — Admin (full access) / Agent (assigned leads only), route protection via middleware
- **Lead Management** — Full CRUD, 9 fields as per spec, pagination, search & filters
- **Lead Scoring** — Auto-scoring on create/update: >20M=High(100), 10–20M=Medium(60), <10M=Low(20)
- **Real-time Updates** — Socket.io server with polling fallback (15s)
- **Analytics Dashboard** — Charts: status, priority, source, leads over time, agent performance
- **WhatsApp Integration** — Click-to-chat with `wa.me/{phone}` format
- **Email Notifications** — New lead alert to admins, assignment confirmation to agents
- **Activity Timeline** — Full audit trail: create, status change, assignment, notes, follow-up
- **Smart Follow-ups** — Overdue, due today, upcoming (3 days), stale (7+ days inactive)
- **Validation Middleware** — Zod schemas for all inputs
- **Auth Middleware** — JWT verification, role enforcement on all API routes
- **Rate Limiting** — Agents: 50 req/min, Admins: unlimited

### Bonus Features
- **AI Follow-up Suggestions** — Rule-based engine with Urdu message templates
- **Export to CSV** — One-click CSV download
- **Export to Excel (.xlsx)** — Full spreadsheet export
- **Export to PDF** — Formatted PDF with styling
- **Lead History Tracking** — Full chronological timeline per lead
- **Activity Logs** — Who did what and when

---

## 🏗️ Tech Stack

| Layer      | Technology                        |
|------------|-----------------------------------|
| Frontend   | Next.js 14 (App Router), React 18 |
| Styling    | Tailwind CSS, Recharts            |
| Backend    | Next.js API Routes, Node.js       |
| Database   | MongoDB with Mongoose             |
| Auth       | NextAuth v4 + JWT                 |
| Real-time  | Socket.io + polling fallback      |
| Email      | Nodemailer (SMTP)                 |
| Validation | Zod                               |
| Export     | xlsx, jsPDF, jspdf-autotable      |

---

## 📁 Project Structure

```
src/
├── app/
│   ├── (auth)/           # Login, Signup pages
│   ├── (dashboard)/      # Protected dashboard pages
│   │   ├── dashboard/    # Admin analytics dashboard
│   │   ├── leads/        # Lead list + detail
│   │   ├── agents/       # Agent management
│   │   ├── analytics/    # Full analytics
│   │   └── reminders/    # Follow-up tracker
│   ├── api/              # All API routes
│   │   ├── auth/         # NextAuth + signup
│   │   ├── leads/        # CRUD + activities + AI suggest
│   │   ├── agents/       # Agent management
│   │   ├── analytics/    # Aggregation queries
│   │   ├── reminders/    # Follow-up detection
│   │   └── export/       # CSV export
│   └── globals.css
├── components/
│   ├── leads/            # LeadModal
│   └── shared/           # Providers
├── lib/
│   ├── auth.ts           # NextAuth config
│   ├── email.ts          # Email templates
│   ├── socket.ts         # Socket.io helpers
│   ├── db/connect.ts     # MongoDB connection
│   ├── middleware/       # Rate limit, validation, auth
│   └── utils/export.ts   # Excel/PDF export
├── models/               # Mongoose models
│   ├── User.ts
│   ├── Lead.ts           # Auto-scoring pre-save hook
│   └── Activity.ts
└── middleware.ts         # Next.js route protection
```

---

## 🌐 Deployment (Vercel)

1. Push to GitHub
2. Import on [vercel.com](https://vercel.com)
3. Set all environment variables from `.env.example`
4. Deploy — runs automatically on push

> **Note**: Socket.io requires a custom server. For Vercel, the polling fallback (15s interval) automatically activates. For full Socket.io support, deploy to Railway, Render, or a VPS.

---

## 📋 Lead Scoring Rules

| Budget         | Priority | Score |
|----------------|----------|-------|
| > PKR 20M      | High     | 100   |
| PKR 10M–20M    | Medium   | 60    |
| < PKR 10M      | Low      | 20    |

Scoring is applied automatically in the `Lead` model's `pre('save')` middleware.

---

## 📧 Email Setup (Gmail)

1. Enable 2FA on your Gmail account
2. Go to Google Account → Security → App Passwords
3. Create an app password for "Mail"
4. Use that as `EMAIL_PASS` in `.env.local`

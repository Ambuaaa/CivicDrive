# CivicDrive

**A cleaner, friendlier way to use driving licence services** — a hackathon prototype that
reimagines the Parivahan/SARATHI experience around one clear citizen journey:

> Register → Apply → Upload documents → Officer verifies → Pay (mock) → Book RTO slot → Get digital licence

> ⚠️ **Unofficial student prototype.** Not affiliated with, endorsed by, or connected to MoRTH,
> parivahan.gov.in, SARATHI or UIDAI. Every account, payment, document and RTO slot here is mock data.

---

## Demo accounts (also shown on the login page)

| Role    | Email                 | Password   |
| ------- | --------------------- | ---------- |
| Citizen | `demo@civicdrive.in`  | `demo1234` |
| Admin   | `admin@civicdrive.in` | `admin1234`|

Seeded applications let you jump into any stage instantly:

| Application       | Stage              | What you can demo                        |
| ----------------- | ------------------ | ---------------------------------------- |
| `CD-2026-100001`  | Approved           | Digital licence card, full timeline      |
| `CD-2026-100002`  | Fee paid           | Book an RTO slot immediately             |
| `CD-2026-100003`  | Submitted          | Admin: verify docs / request correction  |
| `CD-2026-100004`  | Appointment booked | Admin: issue licence                     |

Public tracking without login: `/track?q=CD-2026-100001`

## What works vs what's mocked

**Working:** guided multi-step wizard with server-side re-validation, application state machine in
Postgres/SQLite with full status history, double-booking-proof slot booking (DB-level uniqueness),
role-based access, notifications on every status change, public masked tracking, friendly
field-level error messages ("PIN code must contain exactly 6 digits"), EN/हिं toggle.

**Mocked (by design):** payments (simulated gateway, fake txn IDs), document storage (in our own
demo DB), Aadhaar/DigiLocker/KYC, RTO slots (synthetic), SMS/email (in-app only).
See `/about` inside the app for the full honest breakdown.

## Tech stack

Next.js 16 (App Router, Server Actions) · TypeScript · Tailwind CSS v4 · Prisma + SQLite (dev) /
Postgres (prod) · bcryptjs sessions (HMAC-signed httpOnly cookie) · Zod validation (client + server) · sonner

## Run locally

```bash
npm install
npx prisma db push        # create dev.db
npm run db:seed           # demo users, RTOs, slots, sample applications
npm run dev               # http://localhost:3000
```

## Deploy (Vercel + Neon Postgres, free tier)

1. Push this repo to GitHub.
2. Create a free Postgres at [neon.tech](https://neon.tech) → copy the connection string.
3. In `prisma/schema.prisma`, switch the provider: `provider = "postgresql"`.
4. Create a [Vercel](https://vercel.com) project from the repo and add env vars:
   - `DATABASE_URL` = your Neon connection string (with `?sslmode=require`)
   - `SESSION_SECRET` = any long random string
5. From your machine, against the prod DB:
   ```bash
   set DATABASE_URL=<neon-url>
   npx prisma db push
   npx tsx prisma/seed.ts
   ```
6. Deploy → live link ready for submission.

## Project structure

```
src/
  app/
    page.tsx                  # task-based landing ("What do you want to do?")
    login/                    # mock auth with one-tap demo credentials
    dashboard/                # citizen home: applications + notifications
    apply/                    # guided wizard (type/RTO → personal → address → docs → review)
    application/[id]/         # timeline, documents, receipts, digital licence payoff
    pay/[id]/                 # mock gateway with fee breakdown + success screen
    book/[id]/                # RTO slot picker (double-booking impossible)
    track/                    # public track-by-number (privacy-masked)
    admin/                    # officer workspace: queue → review → approve/reject/correct
    actions/                  # server actions (auth, applications, admin, notifications)
    api/documents/[id]/       # owner/admin-only document streaming
  components/                 # UI kit, wizard, timeline, licence card, admin panels
  lib/                        # db, auth, constants (state machine), zod schemas, i18n EN/HI
prisma/
  schema.prisma               # User, Rto, Slot, Application, Document, Payment, Appointment…
  seed.ts                     # demo data across every journey stage
```

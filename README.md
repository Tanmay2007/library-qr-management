# LibQR Studio

**Enterprise QR-code powered library asset management system.**

Built with **Next.js 15 App Router**, **Prisma 6**, **Neon PostgreSQL**, and **Tailwind CSS 4**.

---

## Features

| Area | Capabilities |
|---|---|
| **Book Inventory** | Add, search, filter, edit, and delete books; unique ISBN and QR code per title |
| **QR Scanning** | Live camera scan and manual QR lookup; confetti on successful match |
| **Circulation & Loans** | Issue books to borrowers with a due date; return via form or QR scan |
| **Borrowed Books** | Real-time active-loan board with calendar-accurate overdue badges |
| **Members** | Register borrowers with email and membership-number uniqueness enforcement |
| **Dashboard** | Live KPI cards (titles, on-loan, active members, overdue), category breakdown, recent catalog, real-time audit stream |
| **Transaction History** | Server-side multi-filter audit log (status, overdue, date range, book, borrower) |
| **CSV Export** | Download filtered transaction history as a dated `.csv` file |
| **Reliability** | Atomic Prisma transactions prevent negative availability and double-returns; concurrent race-condition guards; credential-safe error messages |

---

## Prerequisites

| Requirement | Version |
|---|---|
| Node.js | 20 LTS or later |
| npm | 10 or later |
| PostgreSQL | Neon serverless (recommended) or any Postgres 14+ |
| Git | Any recent version |

---

## Local Setup

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd library-qr-management
```

### 2. Install dependencies

```bash
npm install
```

`postinstall` automatically runs `prisma generate`, so no manual step is needed.

### 3. Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and set your real Neon (or Postgres) connection string:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require
```

> **Security:** `.env` is listed in `.gitignore` and must never be committed or shared.  
> `.env.example` contains only placeholder values and is safe to commit.

### 4. Run Prisma migrations

For a **new database** (first time setup), apply the existing migration:

```bash
npx prisma migrate deploy
```

For **local iterative development** (requires a shadow database):

```bash
npx prisma migrate dev
```

After any schema change, regenerate the Prisma client:

```bash
npx prisma generate
```

### 5. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. Production build

```bash
npm run build
npm run start
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ Yes | PostgreSQL connection string (Neon pooled recommended) |

No other secrets or environment variables are required.

---

## Project Structure

```
app/
  api/
    books/                  GET, POST, PATCH, DELETE books
    borrowers/              GET, POST borrowers
    dashboard/              GET live dashboard KPIs, categories, recent data
    transactions/
      route.ts              GET filtered transaction history
      export/route.ts       GET filtered CSV export
      active/route.ts       GET active loans (for QR return flow)
      issue/route.ts        POST issue a book loan
      return/route.ts       POST return a loan
  page.tsx                  Single-page shell with tab routing
  layout.tsx
components/
  Dashboard.tsx
  Inventory.tsx
  QRScanner.tsx
  Circulation.tsx
  BorrowedBooks.tsx
  TransactionHistory.tsx
  Members.tsx
  Sidebar.tsx
  Navbar.tsx
lib/
  prisma.ts                 Prisma + Neon adapter singleton
  transactionFilters.ts     Shared filter builder (used by history + export)
  mockData.ts               Legacy mock data (used by Members / QR Studio tabs)
prisma/
  schema.prisma             Book, Borrower, Transaction models
  migrations/               Database migration history
```

---

## Test Coverage (Phase 11)

All 28 automated edge-case and reliability checks pass:

- Issuing an unavailable book is rejected; `availableCopies` never goes negative
- A borrower cannot hold the same book twice concurrently
- Returning an already-returned loan is rejected; availability is not double-incremented
- Invalid and unknown QR codes return clear 404/400 responses without crashing
- Missing or malformed API input returns descriptive 400-level errors
- Duplicate ISBN, email, and membership-number attempts return clear 409 conflicts
- Books with circulation history cannot be deleted (409 guard)
- A loan due today is **On Time**; returned loans are **never Overdue**
- Two simultaneous issue attempts for a 1-copy book: exactly one succeeds, one is rejected (Prisma atomic guard)
- All error responses are credential-safe — no connection strings, passwords, or host names exposed

---

## Deploying to Vercel

### Before deploying

Ensure the following is true locally:

```bash
npm run build   # must exit 0 with no errors
```

### Steps

1. **Push your code** to a GitHub, GitLab, or Bitbucket repository.

2. **Import the project** on [vercel.com/new](https://vercel.com/new).

3. **Set environment variables** in the Vercel dashboard:
   - Go to **Project → Settings → Environment Variables**
   - Add `DATABASE_URL` and paste your Neon (or Postgres) connection string
   - Set the environment to **Production**, **Preview**, and **Development** as needed

   > **Security:** Never paste the connection string into any file that is committed. Only enter it in the Vercel dashboard or Vercel CLI.

4. **Deploy.** Vercel will run `npm install` (which triggers `prisma generate` via `postinstall`), then `next build`.

5. **Apply migrations** against your production database once before or after the first deploy:
   ```bash
   # Run locally, pointed at your production DATABASE_URL
   DATABASE_URL="your-production-url" npx prisma migrate deploy
   ```

6. Open the deployed URL and verify the Dashboard loads with live data.

### Vercel-specific notes

- The `postinstall` script in `package.json` runs `prisma generate` automatically on every Vercel build — no manual step required.
- All API routes are Vercel-compatible serverless functions (no `export const runtime = 'edge'` required).
- Neon's serverless driver (`@neondatabase/serverless` + `@prisma/adapter-neon`) works correctly in the Vercel Node.js runtime.

---

## QR Camera Permissions

The **QR Scanner Hub** tab uses the device's hardware camera via the browser `getUserMedia` API.

- On first use the browser will prompt for camera permission — click **Allow**.
- On mobile devices, the page must be served over **HTTPS** (Vercel's default) for camera access to work.
- On localhost, `http://localhost` is treated as a secure context by most browsers.
- If permission is denied, a clear error message is shown with instructions to re-enable camera access in browser settings.
- The manual QR lookup field is always available as a fallback if camera access is unavailable.

---

## License

Private repository — all rights reserved.

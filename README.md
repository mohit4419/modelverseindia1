# ModelVerse India

Discover top talent at ModelVerse India. We connect professional fashion, commercial, and acting models with premier casting opportunities across India.

---

## 🛠️ Tech Stack

- **Frontend:** React (Vite), TypeScript, Tailwind CSS, motion
- **Backend:** Node.js (Express), WebSocket support
- **Database:** PostgreSQL (with Supabase Auth & Storage Integration)
- **AI capabilities:** Gemini API (via @google/genai SDK)
- **Payment Gateway:** Razorpay integration

---

## ✨ Features

- **Model Discovery:** Browse and search models filtered by city, gender, height, category, and skills.
- **Secure Authentication:** Integrated client/model signup, and protected admin dashboards.
- **Booking Management:** Complete flow for hiring models, scheduling dates, and processing payments.
- **Review System:** Automated model rating & review counters updated instantly via PostgreSQL database triggers.
- **Real-Time Interactive Chat:** WebSocket-supported messaging platform between clients and models.

---

## 🚀 Run Locally

### Prerequisites
- Node.js (v18+ recommended)
- A Supabase project (PostgreSQL instance with `auth` schema if executing auth-linked migrations)

### 1. Install dependencies
```bash
npm install
```

### 2. Set up environment variables
```bash
cp .env.example .env
```
Edit `.env` and configure your API credentials:
- `GEMINI_API_KEY`: Server-side Gemini AI secret key
- `SUPABASE_URL` / `VITE_SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY` / `SUPABASE_SECRET_KEY`: Client and admin-level API access keys
- `JWT_SECRET`: For local custom API token verification
- `COOKIE_SECRET`: Session parsing security key

### 3. Database Initialization & Seed
To set up your database schema, apply the SQL migrations inside the `/database/migrations/` directory in order:
1. Run `001_initial_schema.sql` up to `009_triggers.sql` to initialize tables, relations, indexes, and automated database triggers.
2. **Apply lookup reference data:** Execute `010_reference_seed.sql` to seed required global reference values (categories, skill registers).
3. **Apply sandbox/dev demo data (Optional):** Execute `011_demo_seed.sql` to populate high-fidelity mock users, bookings, and interactive reviews.

### 4. Start the development server
```bash
npm run dev
```

---

## 🔑 Demo Accounts

The following fictional demo accounts are pre-seeded in the database via the optional `011_demo_seed.sql` migration for sandbox testing, staging, and local development purposes:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Demo Client** | `client@modelverse.in` | `password123` |
| **Demo Model** | `model@modelverse.in` | `password123` |
| **Super Admin** | `admin@modelverse.in` | `password123` |

> ⚠️ **Important Security Note**
> These accounts exist only when the optional `011_demo_seed.sql` development seed has been applied. They are strictly excluded from pristine production environments.

---

## 📄 License
This project is licensed under the MIT License.

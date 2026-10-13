# Weather & Budget-Smart Bangladesh Tourist Planner

SE331 Software Engineering Design Capstone Project - Fall 2026
Department of Software Engineering, Daffodil International University
Group 05 · Lab Section 42 D1
A full-stack web application that helps tourists plan trips across Bangladesh by combining live weather
data with realistic budget estimation: destination browsing, itinerary builder, weather suitability
scores and alerts, best-time recommendations, budget estimator, expense tracker, budget-based destination
recommendations and an admin panel.

## Tech stack

| Layer        | Technology                                            |
| ------------ | ----------------------------------------------------- |
| Frontend     | React.js (Vite), React Router, Recharts, Tailwind CSS |
| Backend      | Node.js, Express.js (REST API, JWT authentication)    |
| Database     | MySQL (XAMPP)                                         |
| Weather data | Open-Meteo API (free, no key)                         |

## Team

| Member   | Name           | ID         |
| -------- | -------------- | ---------- |
| Member 1 | Efaz Al Tasin  | 241-35-526 |
| Member 2 | Rubaiyat Ratul | 241-35-344 |
| Member 3 | Md. Raj Aryan  | 241-35-545 |

## Getting started

Requirements: Node.js 20+, Git, XAMPP (MySQL).

1. Start **MySQL** in the XAMPP Control Panel.
2. Backend

```bash
cd server
npm install
cp .env.example .env # Windows: copy .env.example .env (then edit JWT_SECRET)
npm run db:setup # creates the database, tables and sample data
npm run dev # http://localhost:5000
```

3. Frontend (new terminal)

```bash
cd client
npm install
npm run dev # http://localhost:5173
```

Demo accounts: `admin@tourist.com / Admin@123` and `tourist@example.com / Tourist@123`.

## Project structure

```
server/ Express API (src/routes, src/middleware, src/utils, sql, scripts)
client/ React app (src/pages, src/components, src/context, src/lib)
```

Pages in `client/src/pages` and routers in `server/src/routes` are auto-registered, and
`components/*-widgets` folders are plug-in areas, so each member can add features without editing shared
files.

## Non-functional requirements

Performance (gzip, caching, indexes, pagination), security (bcrypt, JWT, RBAC, validation, sanitisation,
parameterised SQL, helmet, rate limiting) and responsive, accessible UI (Tailwind, Chrome/Firefox/Edge).

## Git workflow

Feature branches (`feature/<name>`), conventional commit messages, pull requests reviewed by a teammate,
merged with a merge commit (no squash) so every commit stays visible.

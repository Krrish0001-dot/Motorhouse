# Motorhouse — Express + MongoDB Atlas

This is the **backend authentication and vehicle CRUD stage** of the Incubyte car dealership kata. Purchase/restock inventory actions and the React frontend are planned for later stages.

## Current REST API

| Method | Path | Result |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Creates a member or invite-code admin (`201`), rejects invalid input (`422`), wrong invite (`403`), or duplicate email (`409`) |
| `POST` | `/api/auth/login` | Returns a 12-hour JWT bearer token (`200`), or `401` |
| `GET` | `/api/auth/me` | Returns the token holder's public profile (`200`), or `401` |
| `GET` | `/api/vehicles` | Lists all vehicles, including out-of-stock items (authenticated) |
| `GET` | `/api/vehicles/search` | Filters by `make`, `model`, `category`, `min_price`, `max_price` (authenticated) |
| `POST` | `/api/vehicles` | Adds a vehicle (admin only) |
| `PUT` | `/api/vehicles/:id` | Updates supplied fields (admin only) |
| `DELETE` | `/api/vehicles/:id` | Deletes a vehicle (admin only) |

Passwords use bcrypt hashes. The database has a unique email index. The server assigns the admin role only when `admin_code` matches the private `ADMIN_INVITE_CODE`; a client-supplied `role` is ignored. MongoDB Atlas is the persistent production database; the tests inject a small fake user store to verify HTTP behavior without requiring Atlas credentials. Real Atlas integration is still to be checked with your cluster.

Vehicles have a generated MongoDB ID, make, model, category, price, and quantity. Add a vehicle with JSON such as `{"make":"Honda","model":"Civic","category":"Sedan","price":19000.50,"quantity":2}` and an admin bearer token. Prices are stored as integer cents to avoid floating-point stock prices; the API returns numeric prices. Search text matches case-insensitive substrings and combines supplied filters. Invalid details return `422`, missing vehicles `404`, and non-admin writes `403`. The full collection is returned without pagination at this kata stage.

## Local setup

1. Create a MongoDB Atlas cluster, a database user, and a Network Access rule that permits your development machine. Copy its Node.js connection string.
2. The working `backend/.env` is included in the private project download with generated `JWT_SECRET` and `ADMIN_INVITE_CODE`. Open it and add your Atlas URI after `MONGODB_URI=`. Keep this file private; Git ignores it. Do not publish the download as-is because it contains these secrets. The public Git repository should contain only `.env.example`.
3. Run:

```bash
cd backend
npm ci
npm test
npm run dev
```

The API listens at `http://localhost:8000`. No Atlas credentials are required to run the tests; running the server requires a working Atlas connection. Your local startup output confirmed the connection. Do not paste the URI or password into chat or commit them.

Register your admin account by including the code from your private `.env` file:

```json
{"email":"you@example.com","password":"your-long-password","admin_code":"your-private-code"}
```

Send that JSON to `POST /api/auth/register`. Do not expose the invite code in a public frontend bundle; when the React registration form is built, it will send the entered code directly to the API.

## TDD progress

The Git history contains failing tests before the authentication and vehicle CRUD implementations. Tests use Node's built-in test runner and Supertest; the Mongo search adapter also has a query test. See `TEST_REPORT.md` for results and `PROMPTS.md` for the conversation record status.

## My AI Usage

OpenAI Codex helped draft authentication and vehicle tests, the Express and MongoDB implementation, and documentation. The tests and code were reviewed against the kata requirements. AI made the red–green cycles faster; exercise the new vehicle endpoints against your Atlas cluster after applying this update. Add a complete raw chat export or public link to `PROMPTS.md` before submission.

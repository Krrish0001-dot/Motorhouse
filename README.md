# Motorhouse — Express + MongoDB Atlas

This is the **backend authentication stage** of the Incubyte car dealership kata. Vehicle inventory, purchasing, admin access, and the React frontend are planned for later stages.

## Current REST API

| Method | Path | Result |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Creates a member (`201`), rejects invalid input (`422`) or duplicate email (`409`) |
| `POST` | `/api/auth/login` | Returns a 12-hour JWT bearer token (`200`), or `401` |
| `GET` | `/api/auth/me` | Returns the token holder's public profile (`200`), or `401` |

Passwords use bcrypt hashes. The database has a unique email index. Registration cannot grant itself admin access. MongoDB Atlas is the persistent production database; the tests inject a small fake user store to verify HTTP behavior without requiring Atlas credentials. Real Atlas integration is still to be checked with your cluster.

## Local setup

1. Create a MongoDB Atlas cluster, a database user, and a Network Access rule that permits your development machine. Copy its Node.js connection string.
2. In `backend`, copy `.env.example` to `.env`, fill in `MONGODB_URI`, and set a random `JWT_SECRET` of at least 32 bytes. Keep `.env` private.
3. Run:

```bash
cd backend
npm ci
npm test
npm run dev
```

The API listens at `http://localhost:8000`. No Atlas credentials are required to run the tests; running the server requires a working Atlas connection. Do not paste the URI or password into chat or commit them.

## TDD progress

The first commit contains failing tests for registration, login, token authentication, and error handling. The next commit adds the implementation. Tests use Node's built-in test runner and Supertest. See `PROMPTS.md` for the conversation record status.

## My AI Usage

OpenAI Codex helped draft the authentication tests, Express implementation, and documentation. The tests and code were reviewed against the kata requirements. AI made the first red–green cycle faster; MongoDB Atlas behavior still needs an integration check with a real cluster. Add a complete raw chat export or public link to `PROMPTS.md` before submission.

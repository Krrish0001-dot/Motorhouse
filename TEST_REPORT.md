# Test report

Run from `backend/`:

```text
$ npm test
tests 15
pass 15
fail 0

$ node --test --experimental-test-coverage
file                       line %   branch %   funcs %
src/app.js                  93.94      75.00     100.00
src/controllers/authController.js     94.12      84.00     100.00
src/controllers/vehicleController.js 100.00     100.00     100.00
src/models/vehicleModel.js            73.77      80.00      50.00
all files                   91.75      89.68      84.62
```

These tests cover authentication, permissions, vehicle validation, CRUD, search, purchase, restock, and the public health endpoint through Supertest with injected stores. Adapter tests verify literal Mongo search and the atomic conditional purchase update. The user's local browser check confirmed Atlas-backed create, edit, and purchase behavior. The Git history records failing tests before each backend feature implementation.

Run from `frontend/`:

```text
$ npm test
Test Files  1 passed (1)
Tests       4 passed (4)

$ npm run build
vite build completed successfully
```

The frontend tests exercise registration with an optional admin invite code, automatic login, authenticated inventory loading, text filtering, purchase confirmation and cancellation, disabling purchase when stock reaches zero, admin CRUD/restock controls, and hiding admin controls from members. These use a mocked HTTP boundary. The user's local browser check confirmed that create and edit persist after refresh, purchase reduced the displayed quantity, and the member view works. The supplied screenshots also show the disabled out-of-stock button. Each frontend test commit preceded the related implementation and initially failed as expected. The frontend dependency audit observed eight advisories (five moderate, one high, two critical); dependency upgrades have not yet been made or validated.

## Hosted smoke check (manual)

- Render API: `https://motorhouse.onrender.com/api/health` returned `{"status":"ok"}` in the user's browser.
- CORS: a preflight request from `https://frontend-delta-woad-48.vercel.app` returned `204` with that exact `access-control-allow-origin`; a login POST with deliberately invalid credentials returned `401` and `{"error":"Invalid credentials"}` with the same allowed origin.
- Vercel production: the deployed JavaScript contained `https://motorhouse.onrender.com` and not `http://localhost:8000`; the user successfully signed in through `https://frontend-delta-woad-48.vercel.app` after using the production domain rather than a deployment-specific URL.

These are manual checks, separate from the 15 backend and four frontend automated tests above. Hosted purchase, restock, and delete were not rechecked after deployment.

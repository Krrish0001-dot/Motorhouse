# Test report

Run from `backend/`:

```text
$ npm test
tests 14
pass 14
fail 0

$ node --test --experimental-test-coverage
file                       line %   branch %   funcs %
src/app.js                  93.75      66.67     100.00
src/controllers/authController.js     94.12      84.00     100.00
src/controllers/vehicleController.js 100.00     100.00     100.00
src/models/vehicleModel.js            73.77      80.00      50.00
all files                   91.72      89.60      84.21
```

These tests cover authentication, permissions, vehicle validation, CRUD, search, purchase, and restock through Supertest with injected stores. Adapter tests verify literal Mongo search and the atomic conditional purchase update. The existing 14 tests stayed green through the MVC refactor. The user's local server startup confirmed Atlas connectivity, but the inventory operations still need a live Atlas integration check. The Git history records failing tests before each backend feature implementation.

Run from `frontend/`:

```text
$ npm test
Test Files  1 passed (1)
Tests       2 passed (2)

$ npm run build
vite build completed successfully
```

The frontend tests exercise registration with an optional admin invite code, automatic login, authenticated inventory loading, text filtering, purchase, and disabling purchase when stock reaches zero. These use a mocked HTTP boundary; the browser UI and Atlas-backed end-to-end flow still need a local manual check. The frontend test commit preceded the implementation commit and initially failed as expected.

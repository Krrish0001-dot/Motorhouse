# Backend API test report

Run from `backend/`:

```text
$ npm test
tests 14
pass 14
fail 0

$ node --test --experimental-test-coverage
file                  line %   branch %   funcs %
src/app.js             90.24      83.78      88.89
src/mongo-vehicles.js  73.77      80.00      50.00
src/vehicle-routes.js 100.00      92.54     100.00
all files              90.63      88.60      83.33
```

These tests cover authentication, permissions, vehicle validation, CRUD, search, purchase, and restock through Supertest with injected stores. Adapter tests verify literal Mongo search and the atomic conditional purchase update. The user's local server startup confirmed Atlas connectivity, but the inventory operations still need a live Atlas integration check. The Git history records failing tests before each backend feature implementation.

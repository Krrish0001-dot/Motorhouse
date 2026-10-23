# Authentication and vehicle API test report

Run from `backend/`:

```text
$ npm test
tests 11
pass 11
fail 0

$ node --test --experimental-test-coverage
file                  line %   branch %   funcs %
src/app.js             90.24      83.78      88.89
src/mongo-vehicles.js  70.45      85.71      37.50
src/vehicle-routes.js 100.00      91.38     100.00
all files              90.63      88.24      81.25
```

These tests cover authentication, permissions, vehicle validation, CRUD, and search through Supertest with injected stores. One adapter test verifies Mongo search query escaping and price bounds. The user's local server startup confirmed Atlas connectivity, but the vehicle operations still need a live Atlas integration check. The Git history records failing tests before the authentication and vehicle feature implementations.

# Authentication stage test report

Run from `backend/`:

```text
$ npm test
tests 4
pass 4
fail 0

$ node --test --experimental-test-coverage
file           line %   branch %   funcs %
src/app.js      88.06      80.65      87.50
```

These tests cover the HTTP authentication behavior through Supertest using an injected fake user store. They do not prove the Atlas network connection or MongoDB adapter; that integration check requires a configured Atlas cluster. The first commit records a failing test run; the second implements the behavior.

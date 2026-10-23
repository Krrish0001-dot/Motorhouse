# Authentication stage test report

Run from `backend/`:

```text
$ npm test
tests 6
pass 6
fail 0

$ node --test --experimental-test-coverage
file           line %   branch %   funcs %
src/app.js      89.61      82.86      87.50
```

These tests cover the HTTP authentication behavior, including valid and invalid admin invite codes, through Supertest using an injected fake user store. They do not prove the Atlas network connection or MongoDB adapter; that integration check requires a configured Atlas cluster. The Git history records a failing test run before each implementation.

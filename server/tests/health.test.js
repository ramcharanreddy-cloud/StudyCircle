const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const app = require("../app");

test("health endpoint returns a successful API status", async () => {
  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/health`);
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.success, true);
    assert.match(body.message, /running/i);
  } finally {
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
});

test("unknown API endpoints return a JSON 404", async () => {
  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/not-a-route`);
    const body = await response.json();
    assert.equal(response.status, 404);
    assert.equal(body.success, false);
  } finally {
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
});

const http = require('http');
const assert = require('assert');

function request(path, method = 'GET', body) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const req = http.request({
      hostname: '127.0.0.1',
      port: 8000,
      path,
      method,
      headers: payload ? {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      } : {}
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: data ? JSON.parse(data) : null, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, body: data, headers: res.headers });
        }
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

(async () => {
  const account = await request('/api/account');
  assert.strictEqual(account.status, 200, 'GET /api/account should be 200');
  assert.ok(account.body && account.body.customer_name, 'account should include customer_name');

  const login = await request('/api/auth/login', 'POST', { username: 'kaan', password: '123456' });
  assert.strictEqual(login.status, 200, 'POST /api/auth/login should be 200');
  assert.ok(login.body && login.body.success, 'login should return success true');

  const statement = await request('/api/statement?days=7');
  assert.strictEqual(statement.status, 200, 'GET /api/statement should be 200');
  console.log('Smoke checks OK');
})().catch((err) => {
  console.error('Smoke checks failed');
  console.error(err.message);
  process.exit(1);
});

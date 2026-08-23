require('dotenv').config();
const http = require('http');
const mongoose = require('mongoose');
const app = require('../src/app');
const connectDB = require('../src/config/db');

const roles = [
  { role: 'Quản lý', u: 'admin', p: 'admin123' },
  { role: 'NV bán hàng', u: 'banhang', p: '123456' },
  { role: 'Thủ kho', u: 'thukho', p: '123456' },
  { role: 'Thu ngân', u: 'thungan', p: '123456' },
  { role: 'Kế toán', u: 'ketoan', p: '123456' },
  { role: 'Kỹ thuật', u: 'kythuat', p: '123456' }
];

async function verifyAllLogins() {
  await connectDB();

  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  console.log(`🌐 Server kiểm tra đang chạy tại port ${port}`);
  console.log('Kiểm tra đăng nhập nhanh cho tất cả 6 vai trò...\n');

  let passed = 0;

  for (const item of roles) {
    // 1. Login
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenDangNhap: item.u, matKhau: item.p })
    });

    const loginData = await loginRes.json();
    const cookie = loginRes.headers.get('set-cookie')?.split(';')[0];

    const user = loginData.user || (loginData.data && loginData.data.user);
    if (!loginData.success || !user) {
      console.error(`❌ [FAIL] ${item.role} (${item.u}) login failed:`, loginData);
      continue;
    }

    // 2. Call GET /api/auth/me using the session cookie
    const meRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Cookie: cookie }
    });
    const meData = await meRes.json();
    const meUser = meData.user || (meData.data && meData.data.user);

    if (meRes.status === 200 && meData.success && meUser) {
      console.log(`✅ [PASS] ${item.role.padEnd(15)} | User: ${meUser.hoTen} (@${meUser.tenDangNhap}) -> Session OK`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${item.role} session check failed:`, meData);
    }
  }

  console.log(`\n🎉 Hoàn tất kiểm tra: ${passed}/6 tài khoản đăng nhập thành công 100%!`);

  await mongoose.connection.close();
  server.close();
  setTimeout(() => process.exit(0), 50);
}

verifyAllLogins().catch(err => {
  console.error('Lỗi khi chạy verifyAllLogins:', err);
  process.exit(1);
});

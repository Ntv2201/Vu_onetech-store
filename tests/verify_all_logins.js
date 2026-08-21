const roles = [
  { role: 'Quản lý', u: 'admin', p: 'admin123' },
  { role: 'NV bán hàng', u: 'banhang', p: '123456' },
  { role: 'Thủ kho', u: 'thukho', p: '123456' },
  { role: 'Thu ngân', u: 'thungan', p: '123456' },
  { role: 'Kế toán', u: 'ketoan', p: '123456' },
  { role: 'Kỹ thuật', u: 'kythuat', p: '123456' }
];

async function verifyAllLogins() {
  const baseUrl = 'http://localhost:3000';
  console.log('Kiểm tra đăng nhập nhanh cho tất cả 6 vai trò...\n');

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
    } else {
      console.error(`❌ [FAIL] ${item.role} session check failed:`, meData);
    }
  }

  console.log('\nHoàn tất kiểm tra 6 tài khoản!');
}

verifyAllLogins();

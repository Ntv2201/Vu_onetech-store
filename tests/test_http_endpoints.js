require('dotenv').config();
const http = require('http');
const mongoose = require('mongoose');
const app = require('../src/app');
const connectDB = require('../src/config/db');

async function testHttp() {
  await connectDB();

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  console.log(`\n🌐 HTTP Test Server đang chạy tại port ${port}...`);

  let cookie = '';

  // 1. Đăng nhập tài khoản banhang
  console.log('1. Kiểm tra đăng nhập POST /api/auth/login...');
  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tenDangNhap: 'banhang', matKhau: '123456' })
  });

  const loginData = await loginRes.json();
  const setCookie = loginRes.headers.get('set-cookie');
  if (setCookie) {
    cookie = setCookie.split(';')[0];
  }

  const user = loginData.user || (loginData.data ? loginData.data.user : null);
  console.log(`   Status: ${loginRes.status}, Success: ${loginData.success}, Vai trò: ${user ? user.vaiTro : 'N/A'}`);
  if (!loginData.success) throw new Error('Đăng nhập thất bại');

  // 2. Gọi GET /api/hoa-don
  console.log('\n2. Kiểm tra GET /api/hoa-don...');
  const hdRes = await fetch(`${baseUrl}/api/hoa-don`, {
    headers: { Cookie: cookie }
  });
  const hdData = await hdRes.json();
  const total = hdData.pagination ? hdData.pagination.total : (hdData.data ? hdData.data.pagination.total : 0);
  console.log(`   Status: ${hdRes.status}, Total: ${total}`);
  if (hdRes.status !== 200) throw new Error('GET /api/hoa-don thất bại');

  // 3. Gọi GET /api/bao-hanh/tra-cuu/356789012345004
  console.log('\n3. Kiểm tra GET /api/bao-hanh/tra-cuu/:imei...');
  const lookupRes = await fetch(`${baseUrl}/api/bao-hanh/tra-cuu/356789012345004`, {
    headers: { Cookie: cookie }
  });
  const lookupData = await lookupRes.json();
  const bhInfo = lookupData.data ? lookupData.data.baoHanh : lookupData.baoHanh;
  console.log(`   Status: ${lookupRes.status}, Còn hạn BH: ${bhInfo ? bhInfo.conHanBaoHanh : 'N/A'} (${bhInfo ? bhInfo.soNgayConLai : 0} ngày)`);
  if (lookupRes.status !== 200) throw new Error('Tra cứu thất bại');

  // 4. Kiểm tra Phân quyền RBAC: banhang gọi API chỉ dành cho Quản lý / Kỹ thuật (POST /api/bao-hanh/:id/linh-kien) -> Phải nhận 403
  console.log('\n4. Kiểm tra Phân quyền RBAC (NV Bán hàng xuất linh kiện -> nhận 403 Forbidden)...');
  const roleRes = await fetch(`${baseUrl}/api/bao-hanh/600000000000000000000000/linh-kien`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ linhKienId: '600000000000000000000000', soLuong: 1 })
  });
  const roleData = await roleRes.json();
  console.log(`   Status: ${roleRes.status}, Success: ${roleData.success}, Message: "${roleData.message}"`);
  if (roleRes.status === 403) {
    console.log('   ✅ Phân quyền RBAC hoạt động chính xác (403 Forbidden)!');
  } else {
    throw new Error(`Kỳ vọng 403 nhưng nhận ${roleRes.status}`);
  }

  console.log('\n✅ TẤT CẢ CÁC HTTP API ENDPOINTS ĐÃ TEST THÀNH CÔNG 100%!');

  await mongoose.disconnect();
  server.close(() => {
    process.exit(0);
  });
}

testHttp().catch(err => {
  console.error('❌ Lỗi HTTP test:', err);
  process.exit(1);
});

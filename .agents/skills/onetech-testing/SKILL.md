---
name: onetech-testing
description: Hướng dẫn viết test tự động (Integration Tests, E2E, RBAC 403 Forbidden, HTTP endpoints) và đăng ký vào Master Test Runner (tests/run_all_tests.js).
---

# ONETECH STORE - AUTOMATED TESTING GUIDE

Kỹ năng này cung cấp mẫu chuẩn và quy trình viết test tự động cho bất kỳ module mới nào trong OneTech Store.

---

## 1. Mẫu File Test Chuẩn (`tests/test_[module].js`)

```javascript
require('dotenv').config();
const http = require('http');
const mongoose = require('mongoose');
const app = require('../src/app');
const connectDB = require('../src/config/db');
const { NhanVien, SanPham } = require('../src/models');
const { SanPhamService } = require('../src/services');

async function runTests() {
  console.log('===============================================================');
  console.log('🚀 BẮT ĐẦU KIỂM THỬ MODULE [TÊN MODULE]');
  console.log('===============================================================\n');

  await connectDB();

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // 1. Lấy dữ liệu mẫu từ Database (đã seed)
    const nvQuanLy = await NhanVien.findOne({ tenDangNhap: 'admin' });
    const nvBanHang = await NhanVien.findOne({ tenDangNhap: 'banhang' });

    if (!nvQuanLy || !nvBanHang) {
      throw new Error('Database chưa được seed. Hãy chạy "npm run seed" trước.');
    }

    // TEST 1: Kiểm thử Service Logic
    console.log('--- TEST 1: Kiểm thử Service ---');
    const spMoi = await SanPhamService.taoMoi({
      maSP: 'TEST_' + Date.now(),
      tenMay: 'iPhone Test Auto',
      hang: 'Apple',
      giaBan: 30000000,
      giaNhap: 25000000
    });
    assert(spMoi && spMoi._id, 'Tạo mới sản phẩm qua Service thành công');

    // TEST 2: Kiểm thử HTTP API & Phân quyền RBAC
    console.log('\n--- TEST 2: Kiểm thử HTTP REST API & RBAC ---');
    const server = http.createServer(app);
    await new Promise(resolve => server.listen(0, resolve));
    const port = server.address().port;

    async function makeRequest(path, method = 'GET', body = null, cookie = '') {
      return new Promise((resolve, reject) => {
        const req = http.request({
          hostname: '127.0.0.1',
          port,
          path,
          method,
          headers: {
            'Content-Type': 'application/json',
            ...(cookie ? { 'Cookie': cookie } : {})
          }
        }, res => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            try {
              resolve({ status: res.statusCode, data: JSON.parse(data), headers: res.headers });
            } catch (e) {
              resolve({ status: res.statusCode, data, headers: res.headers });
            }
          });
        });
        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
      });
    }

    // Login vai trò Quản lý -> Lấy Cookie Session
    const loginRes = await makeRequest('/api/auth/login', 'POST', {
      tenDangNhap: 'admin',
      matKhau: '123456'
    });
    const cookieAdmin = loginRes.headers['set-cookie'] ? loginRes.headers['set-cookie'][0] : '';

    // Gọi API hợp lệ -> 200 OK
    const resGet = await makeRequest('/api/san-pham', 'GET', null, cookieAdmin);
    assert(resGet.status === 200, 'HTTP GET /api/san-pham trả về 200 OK');

    // Login vai trò Bán hàng -> Gọi API cấm -> 403 Forbidden
    const loginBH = await makeRequest('/api/auth/login', 'POST', {
      tenDangNhap: 'banhang',
      matKhau: '123456'
    });
    const cookieBH = loginBH.headers['set-cookie'] ? loginBH.headers['set-cookie'][0] : '';

    const resForbidden = await makeRequest('/api/san-pham', 'POST', { tenMay: 'Fail' }, cookieBH);
    assert(resForbidden.status === 403, 'RBAC chặn NV Bán hàng tạo sản phẩm (Nhận 403 Forbidden)');

    server.close();

    // TỔNG KẾT
    console.log('\n===============================================================');
    console.log(`🎉 KẾT QUẢ KIỂM THỬ: ${passed} PASS, ${failed} FAIL`);
    console.log('===============================================================');

    if (failed === 0) {
      console.log('✅ TOÀN BỘ TEST CASES ĐÃ VƯỢT QUA 100%!\n');
      process.exit(0);
    } else {
      console.error(`❌ CÓ ${failed} TEST CASES THẤT BẠI!\n`);
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Lỗi ngoại lệ khi test:', error);
    process.exit(1);
  }
}

runTests();
```

---

## 2. Đăng Ký Vào Master Runner (`tests/run_all_tests.js`)

Mỗi khi tạo file test mới, mở `tests/run_all_tests.js` và thêm vào mảng `TEST_SUITES`:
```javascript
const TEST_SUITES = [
  // ... các suites cũ
  { name: 'Tên Module Mới (Tác Giả - Tuần X)', file: 'test_module_moi.js' }
];
```

Chạy `npm test` để kiểm thử toàn bộ hệ thống!

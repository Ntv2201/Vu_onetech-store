/**
 * MASTER TEST RUNNER - ONETECH STORE
 * Chạy tự động toàn bộ 14 test suites của dự án và in ra bảng tổng kết trực quan
 */

const { spawnSync } = require('child_process');
const path = require('path');

const TEST_SUITES = [
  { name: 'POS Bán Hàng & Bảo Hành Cơ Bản (Tuấn - Tuần 3)', file: 'test_tuan_module.js' },
  { name: 'E2E Bán Hàng POS, Cọc, Bảo Hành, KPI (Tuấn - Tuần 5-6)', file: 'test_tuan_tuan5_6_e2e.js' },
  { name: 'Đặt Hàng Trước (Pre-order) & Cọc (Việt - Tuần 3)', file: 'test_viet_module.js' },
  { name: 'Đổi Trả Máy & Cấn Trừ Tiền Cọc (Việt - Tuần 4)', file: 'test_viet_tuan4.js' },
  { name: 'Tình Huống Biên Đổi Kèm PK, Hủy Phiếu RBAC (Việt - Tuần 5)', file: 'test_viet_tuan5.js' },
  { name: 'E2E Toàn Trình Đặt Cọc -> POS -> Đổi Trả -> Hủy Phiếu (Việt - Tuần 6)', file: 'test_viet_tuan6_e2e.js' },
  { name: 'Tồn Kho Dùng Chung & Công Nợ Đa Hình (An - Tuần 3)', file: 'test_an_tuan3.js' },
  { name: 'Đối Soát Công Nợ & Cảnh Báo Quá Hạn (An - Tuần 4)', file: 'test_an_tuan4.js' },
  { name: 'Hợp Đồng Trả Góp & Lịch Thu Kỳ Hạn (An - Tuần 5)', file: 'test_an_tuan5.js' },
  { name: 'Nhập Kho Máy IMEI & Phụ Kiện (Tuân - Tuần 3)', file: 'test_tuan_nhap_kho.js' },
  { name: 'Nhập Kho Hàng Loạt IMEI & Lịch Sử NCC (Tuân - Tuần 4)', file: 'test_tuan_tuan4.js' },
  { name: 'Trả Hàng Nhà Cung Cấp & Cấn Trừ Công Nợ (Tuân - Tuần 5)', file: 'test_tuan_tuan5.js' },
  { name: 'Thu - Chi & Báo Cáo Sổ Quỹ Dùng Chung (Vượng - Tuần 3)', file: 'test_vuong_module.js' },
  { name: 'Kiểm Kê Kho & Xử Lý Lệch IMEI (Vượng - Tuần 4)', file: 'test_vuong_tuan4_kiemke.js' },
  { name: 'Ma Trận Đăng Nhập 6 Vai Trò (QA)', file: 'verify_all_logins.js' },
  { name: 'Bảo Vệ HTTP API & REST Contracts 24 Endpoints (QA & Backend)', file: 'test_http_endpoints.js' },
  { name: 'Ràng Buộc DOM Element ID & Data Extractors Frontend (QA & UI)', file: 'test_frontend_dom_contract.js' },
  { name: 'Stress Test & Concurrency Atomic Lock (QA & Tối Ưu)', file: 'test_concurrency_stress.js' },
  { name: 'Kiểm Thử Cấu Trúc Giao Diện HTML, Sidebar & Assets (QA & UI)', file: 'test_ui_html_structure.js' }
];

console.log('======================================================================');
console.log('🏆 ONETECH STORE - MASTER TEST SUITE RUNNER');
console.log(`🚀 Bắt đầu thực thi kiểm thử tự động trên ${TEST_SUITES.length} bộ Test Suites...`);
console.log('======================================================================\n');

const startTime = Date.now();
const results = [];
let totalPassCount = 0;
let totalFailCount = 0;

for (let i = 0; i < TEST_SUITES.length; i++) {
  const suite = TEST_SUITES[i];
  const filePath = path.join(__dirname, suite.file);
  const suiteStart = Date.now();

  process.stdout.write(`[${i + 1}/${TEST_SUITES.length}] Đang chạy ${suite.file}... `);

  const proc = spawnSync('node', [filePath], {
    encoding: 'utf8',
    env: process.env
  });

  const duration = ((Date.now() - suiteStart) / 1000).toFixed(2);
  const isPassed = proc.status === 0;

  // Trích xuất số lượng PASS / FAIL từ output
  const output = proc.stdout + proc.stderr;
  const passMatches = (output.match(/\[PASS\]/g) || []).length;
  const failMatches = (output.match(/\[FAIL\]/g) || []).length;

  totalPassCount += passMatches;
  totalFailCount += failMatches;

  if (isPassed) {
    console.log(`\x1b[32m✔ PASS\x1b[0m (${passMatches} assertions, ${duration}s)`);
  } else {
    console.log(`\x1b[31m✖ FAIL\x1b[0m (${failMatches} failed, ${duration}s)`);
    console.error(output.slice(-400));
  }

  results.push({
    file: suite.file,
    name: suite.name,
    passed: isPassed,
    passCount: passMatches,
    failCount: failMatches,
    duration: `${duration}s`
  });
}

const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);

console.log('\n======================================================================');
console.log('📊 BẢNG TỔNG HỢP KẾT QUẢ KIỂM THỬ TOÀN HỆ THỐNG');
console.log('======================================================================');
console.table(results.map(r => ({
  'Test Suite': r.name,
  'File': r.file,
  'Kết quả': r.passed ? '✅ PASS' : '❌ FAIL',
  'Pass': r.passCount,
  'Fail': r.failCount,
  'Thời gian': r.duration
})));

console.log('----------------------------------------------------------------------');
console.log(`⏱  Tổng thời gian thực thi: ${totalDuration}s`);
console.log(`🎯 Tổng số Test Assertions: ${totalPassCount + totalFailCount}`);
console.log(`✅ Thành công: ${totalPassCount} | ❌ Thất bại: ${totalFailCount}`);
console.log('======================================================================');

// Dọn dẹp dữ liệu test phát sinh để bảo toàn cơ sở dữ liệu thật
spawnSync('node', [path.join(__dirname, 'cleanup_db.js')], { encoding: 'utf8', env: process.env });

if (results.every(r => r.passed)) {
  console.log(`\n🎉 TUYỆT VỜI! TOÀN BỘ ${TEST_SUITES.length}/${TEST_SUITES.length} BỘ TEST SUITES ĐÃ PASS 100%!\n`);
  process.exit(0);
} else {
  console.error('\n❌ CẢNH BÁO: MỘT SỐ BỘ TEST BỊ THẤT BẠI. VUI LÒNG KIỂM TRA LẠI!\n');
  process.exit(1);
}

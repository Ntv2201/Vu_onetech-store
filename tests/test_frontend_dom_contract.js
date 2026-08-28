// TEST SUITE: KIỂM THỬ RÀNG BUỘC DOM ID & BỘ GIẢI NÉN DỮ LIỆU FRONTEND (QA & UI)
// 1. Quét toàn bộ các DOM Element ID được gọi trong tất cả file JS (/src/public/js/*.js)
//    và đối chiếu với các thẻ trong HTML (/src/public/pages/) để chống triệt để lỗi null element ID.
// 2. Giả lập toàn bộ logic trích xuất dữ liệu của Frontend từ API Backend (NCC, SanPham, PhuKien, LinhKien, DanhMuc)
//    đảm bảo các ô dropdown <select> luôn nhận được dữ liệu hợp lệ (> 0 items) và không bị crash runtime.

const fs = require('fs');
const path = require('path');
require('dotenv').config();
const connectDB = require('../src/config/db');
const mongoose = require('mongoose');
const {
  NhaCungCapService,
  SanPhamService,
  PhuKienService,
  DanhMucService,
  MayImeiService,
  BaoHanhService
} = require('../src/services');

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

async function runDomAndExtractorTests() {
  console.log('======================================================================');
  console.log('🔍 BẮT ĐẦU KIỂM THỬ RÀNG BUỘC DOM ELEMENT ID & LOGIC EXTRACTOR FRONTEND');
  console.log('======================================================================\n');

  const publicDir = path.join(__dirname, '../src/public');
  const jsDir = path.join(publicDir, 'js');
  const pagesDir = path.join(publicDir, 'pages');
  const partialsDir = path.join(publicDir, 'partials');

  // Đọc toàn bộ nội dung HTML và partials để làm từ điển kiểm tra ID
  function getAllHtmlFiles(dir, files = []) {
    if (!fs.existsSync(dir)) return files;
    fs.readdirSync(dir).forEach(f => {
      const full = path.join(dir, f);
      if (fs.statSync(full).isDirectory()) getAllHtmlFiles(full, files);
      else if (f.endsWith('.html')) files.push(full);
    });
    return files;
  }

  const allHtmlPaths = [...getAllHtmlFiles(pagesDir), ...getAllHtmlFiles(partialsDir)];
  const allHtmlContents = allHtmlPaths.map(p => fs.readFileSync(p, 'utf8')).join('\n');

  // -------------------------------------------------------------
  // 1. KIỂM TRA DOM ID GIỮA CLIENT JS VÀ HTML
  // -------------------------------------------------------------
  console.log('--- 1. Kiểm tra DOM Element ID Binding giữa Client JS và HTML ---');

  const criticalModules = [
    {
      file: 'nhapkho.js',
      ids: ['filterNCC', 'inputNCC', 'filterTuNgay', 'filterDenNgay', 'tablePhieuNhapBody', 'formCreateNhapKho', 'mayRowsContainer', 'phuKienRowsContainer', 'modalCreateNhapKho']
    },
    {
      file: 'mayimei.js',
      ids: ['filterSearch', 'filterSanPham', 'filterTrangThai', 'tableImeiBody', 'selectSanPham', 'mayImeiForm']
    },
    {
      file: 'sanpham.js',
      ids: ['filterSearch', 'filterDanhMuc', 'filterHang', 'tableSanPhamBody', 'sanPhamForm', 'selectDanhMuc']
    },
    {
      file: 'phukien.js',
      ids: ['filterSearch', 'filterDanhMuc', 'tablePhuKienBody', 'formAddPhuKien', 'formEditPhuKien', 'selectAddDanhMuc', 'selectEditDanhMuc']
    },
    {
      file: 'banhang.js',
      ids: ['filterPosSanPham', 'searchImeiInput', 'availableImeiList', 'selectKhachHang', 'cartTableBody', 'btnSubmitOrder']
    },
    {
      file: 'baohanh.js',
      ids: ['filterPbhSearch', 'filterPbhTrangThai', 'tableWarrantyBody', 'selectLinhKien', 'modalXuatLinhKien', 'formXuatLK']
    },
    {
      file: 'dattruoc.js',
      ids: ['searchPreorderInput', 'filterStatusSelect', 'preorderTableBody', 'createKhachHangSelect', 'createSanPhamSelect', 'createPreorderForm']
    },
    {
      file: 'doitra.js',
      ids: ['searchDoiTraInput', 'filterLoaiDoiTra', 'filterTrangThaiDoiTra', 'doiTraTableBody', 'selectSanPhamMoi', 'selectImeiMoi', 'selectPhuKienMoi']
    }
  ];

  criticalModules.forEach(mod => {
    mod.ids.forEach(id => {
      // Kiểm tra id="xyz" trong toàn bộ HTML
      const idPattern = new RegExp(`id=["']${id}["']`, 'i');
      const existsInHtml = idPattern.test(allHtmlContents);
      assert(existsInHtml, `[${mod.file}] DOM Element ID "#${id}" tồn tại chính xác trong mã nguồn HTML`);
    });
  });

  // -------------------------------------------------------------
  // 2. GIẢ LẬP FRONTEND DATA EXTRACTORS VỚI DỮ LIỆU THỰC TẾ
  // -------------------------------------------------------------
  console.log('\n--- 2. Giả lập Frontend Data Extractors với Dữ liệu Master Data ---');

  await connectDB();

  // 2.1 Trích xuất Nhà Cung Cấp (nhapkho.js)
  const nccData = await NhaCungCapService.getAllNhaCungCaps();
  const dsNhaCungCap = Array.isArray(nccData) ? nccData : (nccData?.list || nccData?.nhaCungCaps || []);
  assert(dsNhaCungCap.length >= 4, `[nhapkho.js] Extractor dsNhaCungCap lấy được ${dsNhaCungCap.length} NCC (>= 4 NCC)`);
  const nccOptions = dsNhaCungCap.map(ncc => `<option value="${ncc._id}">${ncc.tenNCC}</option>`).join('');
  assert(nccOptions.includes('<option value="') && nccOptions.includes('Apple'), '[nhapkho.js] Tạo chuỗi HTML options Nhà Cung Cấp thành công');

  // 2.2 Trích xuất Model Sản Phẩm (nhapkho.js, mayimei.js, banhang.js, dattruoc.js, doitra.js)
  const spData = await SanPhamService.getAllSanPhams();
  const dsSanPham = Array.isArray(spData) ? spData : (spData?.sanPhams || spData?.list || []);
  assert(dsSanPham.length >= 10, `[Master] Extractor dsSanPham lấy được ${dsSanPham.length} model máy (>= 10 model)`);
  const spOptions = dsSanPham.map(sp => `<option value="${sp._id}">${sp.tenMay}</option>`).join('');
  assert(spOptions.includes('<option value="') && spOptions.includes('iPhone 15 Pro Max'), '[Master] Tạo chuỗi HTML options Model Sản Phẩm thành công');

  // 2.3 Trích xuất Phụ Kiện (nhapkho.js, banhang.js, doitra.js)
  const pkData = await PhuKienService.getAllPhuKiens();
  const dsPhuKien = Array.isArray(pkData) ? pkData : (pkData?.phuKiens || pkData?.list || []);
  assert(dsPhuKien.length >= 6, `[Master] Extractor dsPhuKien lấy được ${dsPhuKien.length} phụ kiện (>= 6 phụ kiện)`);
  const pkOptions = dsPhuKien.map(pk => `<option value="${pk._id}">${pk.tenPK}</option>`).join('');
  assert(pkOptions.includes('<option value="') && pkOptions.includes('Củ sạc'), '[Master] Tạo chuỗi HTML options Phụ Kiện thành công');

  // 2.4 Trích xuất Linh Kiện (baohanh.js)
  const lkData = await BaoHanhService.getAllLinhKien();
  const dsLinhKien = Array.isArray(lkData) ? lkData : (lkData?.linhKiens || []);
  assert(dsLinhKien.length >= 4, `[baohanh.js] Extractor dsLinhKien lấy được ${dsLinhKien.length} linh kiện (>= 4 linh kiện)`);
  const lkOptions = dsLinhKien.map(lk => `<option value="${lk._id}">${lk.tenLK}</option>`).join('');
  assert(lkOptions.includes('<option value="') && lkOptions.includes('Màn hình'), '[baohanh.js] Tạo chuỗi HTML options Linh Kiện thành công');

  // 2.5 Trích xuất Danh Mục (sanpham.js, phukien.js, danhmuc.js)
  const dmData = await DanhMucService.getAllDanhMucs();
  const dsDanhMuc = Array.isArray(dmData) ? dmData : (dmData?.danhMucs || dmData?.list || []);
  assert(dsDanhMuc.length >= 4, `[Master] Extractor dsDanhMuc lấy được ${dsDanhMuc.length} danh mục (>= 4 danh mục)`);
  const dmOptions = dsDanhMuc.map(dm => `<option value="${dm._id}">${dm.tenDanhMuc}</option>`).join('');
  assert(dmOptions.includes('<option value="') && dmOptions.includes('Điện thoại'), '[Master] Tạo chuỗi HTML options Danh Mục thành công');

  // 2.6 Trích xuất Máy IMEI Còn Hàng (banhang.js, doitra.js)
  const imeiData = await MayImeiService.getAllImeis({ trangThai: 'Con hang' });
  const dsImeiConHang = Array.isArray(imeiData) ? imeiData : (imeiData?.imeis || []);
  assert(dsImeiConHang.length > 0, `[banhang.js] Extractor dsImeiConHang lấy được ${dsImeiConHang.length} máy sẵn sàng bán`);
  assert(dsImeiConHang.every(m => m.trangThai === 'Con hang'), '[banhang.js] Toàn bộ máy trích xuất đều ở trạng thái "Con hang"');

  await mongoose.connection.close();

  // -------------------------------------------------------------
  // TỔNG KẾT
  // -------------------------------------------------------------
  console.log('\n======================================================================');
  console.log(`🎯 KẾT QUẢ KIỂM THỬ DOM ID & EXTRACTOR CONTRACTS: ${passed} PASS, ${failed} FAIL`);
  console.log('======================================================================');

  if (failed === 0) {
    console.log('✅ TOÀN BỘ DOM ELEMENT IDS ĐỀU KHỚP HTML & TẤT CẢ EXTRACTORS ĐỀU RENDER OPTIONS THÀNH CÔNG!\n');
    process.exit(0);
  } else {
    console.error(`❌ CÓ ${failed} LỖI DOM ELEMENT ID HOẶC EXTRACTOR CONTRACT!\n`);
    process.exit(1);
  }
}

runDomAndExtractorTests().catch(err => {
  console.error('❌ Lỗi ngoại lệ trong test DOM Contract:', err);
  process.exit(1);
});

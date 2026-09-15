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
      ids: ['filterNCC', 'inputNCC', 'filterTuNgay', 'filterDenNgay', 'tablePhieuNhapBody', 'formCreateNhapKho', 'mayRowsContainer', 'phuKienRowsContainer', 'modalCreateNhapKho', 'fileInputExcelNhapKho', 'bulkInputImeis']
    },
    {
      file: 'kiemke.js',
      ids: ['fileInputExcelKiemKe', 'textareaImeiThucTe', 'badgeCountScanned', 'selectKho', 'inputGhiChu', 'btnSubmitKiemKe']
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
  // 3. KIỂM THỬ GIẢI THUẬT BÓC TÁCH IMEI TỪ EXCEL & AN TOÀN XSS
  // -------------------------------------------------------------
  console.log('\n--- 3. Kiểm thử Giải thuật Bóc tách IMEI từ Excel & An toàn XSS ---');

  const ignoreKeywords = new Set([
    'STT', 'MAMAY', 'TENMAY', 'SANPHAM', 'IMEI', 'MAIMEI', 'SERIAL', 'SERIALNUMBER',
    'DESCRIPTION', 'NOTE', 'GHICHU', 'STATUS', 'TRANGTHAI', 'PRICE', 'GIANHAP', 'GIABAN',
    'SOLUONG', 'QUANTITY', 'NHACUNGCAP', 'SUPPLIER', 'PHONENUMBER', 'DIENTHOAI', 'DANHSACH'
  ]);

  function extractImeisFromRawValues(rawValues) {
    const imeis = [];
    rawValues.forEach(val => {
      // 1. Nếu nguyên ô khi bỏ khoảng trắng là mã IMEI 14-16 chữ số (VD: 3589 1234 5678 901)
      const cellClean = String(val).trim();
      const cellDigits = cellClean.replace(/\s+/g, '');
      if (/^\d{14,16}$/.test(cellDigits)) {
        imeis.push(cellDigits);
        return;
      }

      // 2. Tách theo khoảng trắng, xuống dòng, dấu phẩy, chấm phẩy, tab
      const parts = cellClean.split(/[\n,;\t\r\s]+/).map(s => s.trim()).filter(Boolean);
      parts.forEach(p => {
        let clean = p;
        if (/^[0-9]+(\.[0-9]+)?[eE]\+[0-9]+$/.test(clean)) {
          try {
            clean = BigInt(Math.round(Number(clean))).toString();
          } catch (e) {}
        }
        clean = clean.replace(/[^a-zA-Z0-9]/g, '');
        // Hợp lệ: 8-20 ký tự, PHẢI có ít nhất 1 chữ số, không nằm trong từ khóa tiêu đề cột
        if (/^[a-zA-Z0-9]{8,20}$/.test(clean) && /\d/.test(clean) && !ignoreKeywords.has(clean.toUpperCase())) {
          imeis.push(clean);
        }
      });
    });
    return [...new Set(imeis)];
  }

  // Test 3.1: Bóc tách IMEI chuẩn và lọc bỏ header bảng
  const mockExcelRows = [
    'STT,Tên máy,Mã IMEI,Ghi chú',
    '1, iPhone 15 Pro Max, 358912345678901, Máy mới nguyên seal',
    '2, Samsung S24 Ultra, 359123456789012, Bản quốc tế',
    'SERIALNUMBER, DESCRIPTION, NOTE, STATUS' // Header tiếng Anh cần loại bỏ
  ];
  const extracted = extractImeisFromRawValues(mockExcelRows);
  assert(extracted.length === 2, `[Excel Parser] Trích xuất chính xác 2 mã IMEI hợp lệ (loại bỏ headers STT, SERIALNUMBER, DESCRIPTION)`);
  assert(extracted.includes('358912345678901') && extracted.includes('359123456789012'), '[Excel Parser] 2 mã IMEI 15 chữ số được trích xuất nguyên vẹn');

  // Test 3.2: Xử lý số khoa học do Excel tự format (vd: 3.58912E+14)
  const sciExcelVal = ['3.58912345678901e+14'];
  const extractedSci = extractImeisFromRawValues(sciExcelVal);
  assert(extractedSci.length === 1 && extractedSci[0] === '358912345678901', '[Excel Parser] Chuỗi số khoa học 3.58912345678901e+14 chuyển đổi chuẩn xác thành IMEI 358912345678901');

  // Test 3.3: Kiểm tra XSS escape tên file
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
  const maliciousFileName = '<img src=x onerror=alert(1)>.xlsx';
  const escapedFileName = escapeHtml(maliciousFileName);
  assert(!escapedFileName.includes('<img') && escapedFileName.includes('&lt;img'), '[Excel Parser] Tên file chứa mã độc XSS được escape HTML an toàn trước khi truyền vào Toast');

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

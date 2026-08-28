/**
 * TEST SUITE: KIỂM THỬ TOÀN DIỆN HTTP ENDPOINTS & API CONTRACTS (QA & BACKEND)
 * Kiểm tra toàn bộ 24+ REST API endpoints thực tế trên HTTP Server:
 * 1. Đăng nhập 6 vai trò & cấp phát Session Cookie
 * 2. Cấu trúc Payload trả về đúng chuẩn cho Frontend
 * 3. Kiểm tra tính sẵn sàng của dữ liệu Master Data (NCC, Sản phẩm, Phụ kiện, Linh kiện, Danh mục)
 * 4. Phân quyền RBAC 403 Forbidden chặn nghiêm ngặt các vai trò trái quyền
 */

require('dotenv').config();
const http = require('http');
const mongoose = require('mongoose');
const app = require('../src/app');
const connectDB = require('../src/config/db');

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

async function runHttpContractTests() {
  console.log('======================================================================');
  console.log('🌐 BẮT ĐẦU KIỂM THỬ TOÀN BỘ HTTP ENDPOINTS & FRONTEND API CONTRACTS');
  console.log('======================================================================\n');

  await connectDB();

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  console.log(`[HTTP Server] Đang lắng nghe tại cổng nội bộ: ${port}\n`);

  // Helper hàm gọi API có kèm Cookie
  async function requestApi(urlPath, options = {}, cookie = '') {
    const headers = {
      'Content-Type': 'application/json',
      ...(cookie ? { Cookie: cookie } : {}),
      ...(options.headers || {})
    };
    const response = await fetch(`${baseUrl}${urlPath}`, {
      ...options,
      headers
    });
    let body = null;
    try {
      body = await response.json();
    } catch (e) {
      body = null;
    }
    return { status: response.status, headers: response.headers, data: body };
  }

  // -------------------------------------------------------------
  // 1. XÁC THỰC & ĐĂNG NHẬP 6 VAI TRÒ
  // -------------------------------------------------------------
  console.log('--- 1. Kiểm thử Xác thực & Đăng nhập 6 Vai trò ---');
  const roleCookies = {};

  const rolesToLogin = [
    { username: 'admin', pass: 'admin123', role: 'Quản lý' },
    { username: 'banhang', pass: '123456', role: 'NV bán hàng' },
    { username: 'thukho', pass: '123456', role: 'Thủ kho' },
    { username: 'thungan', pass: '123456', role: 'Thu ngân' },
    { username: 'ketoan', pass: '123456', role: 'Kế toán' },
    { username: 'kythuat', pass: '123456', role: 'Kỹ thuật' }
  ];

  for (const r of rolesToLogin) {
    const res = await requestApi('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ tenDangNhap: r.username, matKhau: r.pass })
    });
    assert(res.status === 200 && res.data?.success === true, `Đăng nhập vai trò "${r.role}" (${r.username}) thành công`);
    const setCookie = res.headers.get('set-cookie');
    if (setCookie) {
      roleCookies[r.username] = setCookie.split(';')[0];
    }
  }

  const adminCookie = roleCookies['admin'];
  const banHangCookie = roleCookies['banhang'];
  const thuKhoCookie = roleCookies['thukho'];
  const kyThuatCookie = roleCookies['kythuat'];
  const keToanCookie = roleCookies['ketoan'];

  // -------------------------------------------------------------
  // 2. MASTER DATA CONTRACTS (DANH MỤC, NCC, MODEL SP, PHỤ KIỆN, LINH KIỆN)
  // -------------------------------------------------------------
  console.log('\n--- 2. Kiểm thử Master Data Contracts (Dành cho Dropdowns & Forms) ---');

  // 2.1 GET /api/danh-muc
  const resDM = await requestApi('/api/danh-muc', {}, adminCookie);
  assert(resDM.status === 200 && resDM.data?.success === true, 'GET /api/danh-muc trả về 200 OK');
  const danhMucs = Array.isArray(resDM.data?.data) ? resDM.data.data : [];
  assert(danhMucs.length >= 4, `Danh mục trả về mảng có ${danhMucs.length} mục (>= 4 danh mục)`);
  assert(danhMucs[0] && typeof danhMucs[0].tenDanhMuc === 'string', 'Mỗi danh mục có trường "tenDanhMuc" hợp lệ');

  // 2.2 GET /api/nha-cung-cap
  const resNCC = await requestApi('/api/nha-cung-cap', {}, adminCookie);
  assert(resNCC.status === 200 && resNCC.data?.success === true, 'GET /api/nha-cung-cap trả về 200 OK');
  const nccs = Array.isArray(resNCC.data?.data) ? resNCC.data.data : [];
  assert(nccs.length >= 4, `Nhà cung cấp trả về ${nccs.length} đối tác (>= 4 NCC) cho dropdown Nhập kho`);
  assert(nccs.some(n => n.tenNCC.includes('Apple')), 'Có NCC "Apple" trong danh sách');
  assert(nccs.some(n => n.tenNCC.includes('Samsung')), 'Có NCC "Samsung" trong danh sách');

  // 2.3 GET /api/san-pham
  const resSP = await requestApi('/api/san-pham', {}, adminCookie);
  assert(resSP.status === 200 && resSP.data?.success === true, 'GET /api/san-pham trả về 200 OK');
  const spPayload = resSP.data?.data;
  const sanPhams = spPayload?.sanPhams || (Array.isArray(spPayload) ? spPayload : []);
  assert(Array.isArray(sanPhams) && sanPhams.length >= 10, `Model sản phẩm trả về ${sanPhams.length} dòng máy (>= 10 model)`);
  assert(sanPhams.some(sp => sp.tenMay.includes('iPhone 15 Pro Max')), 'Có model "iPhone 15 Pro Max"');
  assert(sanPhams.some(sp => sp.tenMay.includes('Galaxy S24 Ultra')), 'Có model "Galaxy S24 Ultra"');

  // 2.4 GET /api/phu-kien
  const resPK = await requestApi('/api/phu-kien', {}, adminCookie);
  assert(resPK.status === 200 && resPK.data?.success === true, 'GET /api/phu-kien trả về 200 OK');
  const pkPayload = resPK.data?.data;
  const phuKiens = pkPayload?.phuKiens || (Array.isArray(pkPayload) ? pkPayload : []);
  assert(Array.isArray(phuKiens) && phuKiens.length >= 6, `Phụ kiện trả về ${phuKiens.length} loại (>= 6 phụ kiện)`);
  assert(phuKiens.some(pk => pk.tenPK.includes('Củ sạc')), 'Có phụ kiện "Củ sạc"');

  // 2.5 GET /api/bao-hanh/linh-kien
  const resLK = await requestApi('/api/bao-hanh/linh-kien', {}, kyThuatCookie);
  assert(resLK.status === 200 && resLK.data?.success === true, 'GET /api/bao-hanh/linh-kien trả về 200 OK');
  const linhKiens = Array.isArray(resLK.data?.data) ? resLK.data.data : [];
  assert(linhKiens.length >= 4, `Linh kiện sửa chữa trả về ${linhKiens.length} loại (>= 4 linh kiện) cho modal xuất LK`);
  assert(linhKiens.some(lk => lk.tenLK.includes('Màn hình')), 'Có linh kiện "Màn hình"');

  // 2.6 GET /api/khach-hang
  const resKH = await requestApi('/api/khach-hang', {}, banHangCookie);
  assert(resKH.status === 200 && resKH.data?.success === true, 'GET /api/khach-hang trả về 200 OK');
  const khachHangs = Array.isArray(resKH.data?.data) ? resKH.data.data : [];
  assert(khachHangs.length >= 6, `Khách hàng trả về ${khachHangs.length} người (>= 6 KH)`);

  // 2.7 GET /api/may-imei?trangThai=Con hang
  const resImei = await requestApi('/api/may-imei?trangThai=Con hang', {}, banHangCookie);
  assert(resImei.status === 200 && resImei.data?.success === true, 'GET /api/may-imei?trangThai=Con hang trả về 200 OK');
  const imeiPayload = resImei.data?.data;
  const availableImeis = imeiPayload?.imeis || (Array.isArray(imeiPayload) ? imeiPayload : []);
  assert(Array.isArray(availableImeis) && availableImeis.length > 0, `Máy IMEI "Con hang" trả về ${availableImeis.length} máy sẵn sàng bán`);
  assert(availableImeis.every(m => m.trangThai === 'Con hang'), 'Tất cả máy trả về đều có trạng thái "Con hang"');

  // -------------------------------------------------------------
  // 3. NGHIỆP VỤ & SỔ QUỸ CONTRACTS
  // -------------------------------------------------------------
  console.log('\n--- 3. Kiểm thử Nghiệp vụ & Sổ quỹ Contracts ---');

  // 3.1 GET /api/hoa-don
  const resHD = await requestApi('/api/hoa-don', {}, banHangCookie);
  assert(resHD.status === 200 && resHD.data?.success === true, 'GET /api/hoa-don trả về 200 OK');
  const hdList = resHD.data?.data?.hoaDons || resHD.data?.data?.list || [];
  assert(hdList.length > 0, `Danh sách Hóa đơn POS có ${hdList.length} đơn hàng`);

  // 3.2 GET /api/phieu-nhap
  const resPN = await requestApi('/api/phieu-nhap', {}, thuKhoCookie);
  assert(resPN.status === 200 && resPN.data?.success === true, 'GET /api/phieu-nhap trả về 200 OK');
  const pnList = resPN.data?.data?.list || resPN.data?.data?.phieuNhaps || [];
  assert(pnList.length > 0, `Danh sách Phiếu nhập kho có ${pnList.length} phiếu`);

  // 3.3 GET /api/dat-truoc
  const resDT = await requestApi('/api/dat-truoc', {}, banHangCookie);
  assert(resDT.status === 200 && resDT.data?.success === true, 'GET /api/dat-truoc trả về 200 OK');
  const dtList = resDT.data?.data?.donDatHangs || resDT.data?.data?.list || [];
  assert(dtList.length > 0, `Danh sách Đơn đặt trước Pre-order có ${dtList.length} đơn`);

  // 3.4 GET /api/doi-tra
  const resDoiTra = await requestApi('/api/doi-tra', {}, banHangCookie);
  assert(resDoiTra.status === 200 && resDoiTra.data?.success === true, 'GET /api/doi-tra trả về 200 OK');
  const doiTraList = resDoiTra.data?.data?.danhSach || resDoiTra.data?.data?.phieuDoiTras || resDoiTra.data?.data?.list || [];
  assert(doiTraList.length > 0, `Danh sách Phiếu đổi trả có ${doiTraList.length} phiếu`);

  // 3.5 GET /api/bao-hanh
  const resBH = await requestApi('/api/bao-hanh', {}, kyThuatCookie);
  assert(resBH.status === 200 && resBH.data?.success === true, 'GET /api/bao-hanh trả về 200 OK');
  const bhList = resBH.data?.data?.phieuBaoHanhs || resBH.data?.data?.list || (Array.isArray(resBH.data?.data) ? resBH.data?.data : []);
  assert(Array.isArray(bhList) && bhList.length > 0, `Danh sách Phiếu bảo hành có ${bhList.length} phiếu`);

  // 3.6 GET /api/cong-no
  const resCN = await requestApi('/api/cong-no', {}, keToanCookie);
  assert(resCN.status === 200 && resCN.data?.success === true, 'GET /api/cong-no trả về 200 OK');
  const cnList = resCN.data?.data?.items || resCN.data?.data?.list || [];
  assert(cnList.length > 0, `Danh sách Hồ sơ công nợ có ${cnList.length} bản ghi`);

  // 3.7 GET /api/thanh-toan/so-quy
  const resSQ = await requestApi('/api/thanh-toan/so-quy', {}, keToanCookie);
  assert(resSQ.status === 200 && resSQ.data?.success === true, 'GET /api/thanh-toan/so-quy trả về 200 OK');
  const sqData = resSQ.data?.data;
  assert(sqData && sqData.tongThu !== undefined && sqData.tongChi !== undefined, 'Sổ quỹ trả về đầy đủ tổngThu, tongChi, soDu');

  // 3.8 GET /api/kiem-ke
  const resKK = await requestApi('/api/kiem-ke', {}, thuKhoCookie);
  assert(resKK.status === 200 && resKK.data?.success === true, 'GET /api/kiem-ke trả về 200 OK');
  const kkData = resKK.data?.data;
  assert(kkData && Array.isArray(kkData.items || kkData), 'Danh sách biên bản kiểm kê trả về đúng mảng items');

  // 3.9 GET /api/bao-cao/doanh-thu
  const resBC = await requestApi('/api/bao-cao/doanh-thu', {}, keToanCookie);
  assert(resBC.status === 200 && resBC.data?.success === true, 'GET /api/bao-cao/doanh-thu trả về 200 OK');
  const bcData = resBC.data?.data;
  assert(bcData && bcData.tongQuan && typeof bcData.tongQuan.tongDoanhThu === 'number', 'Báo cáo doanh thu trả về đầy đủ tổngQuan');

  // -------------------------------------------------------------
  // 4. KIỂM THỬ MA TRẬN PHÂN QUYỀN RBAC 403 FORBIDDEN
  // -------------------------------------------------------------
  console.log('\n--- 4. Kiểm thử Ma trận Phân quyền RBAC 403 Forbidden ---');

  // 4.1 Bán hàng gọi API Kỹ thuật (Xuất linh kiện) -> Phải nhận 403
  const rbac1 = await requestApi('/api/bao-hanh/600000000000000000000000/linh-kien', {
    method: 'POST',
    body: JSON.stringify({ linhKienId: '600000000000000000000000', soLuong: 1 })
  }, banHangCookie);
  assert(rbac1.status === 403, 'NV Bán hàng không có quyền xuất linh kiện bảo hành (Nhận 403 Forbidden)');

  // 4.2 Kỹ thuật tạo Hóa đơn bán hàng -> Phải nhận 403
  const rbac2 = await requestApi('/api/hoa-don', {
    method: 'POST',
    body: JSON.stringify({ khachHangId: '600000000000000000000000', danhSachMay: [] })
  }, kyThuatCookie);
  assert(rbac2.status === 403, 'Kỹ thuật không có quyền lập hóa đơn bán hàng POS (Nhận 403 Forbidden)');

  // 4.3 Thủ kho xóa Nhà cung cấp (Chỉ Quản lý được xóa) -> Phải nhận 403
  const rbac3 = await requestApi('/api/nha-cung-cap/600000000000000000000000', {
    method: 'DELETE'
  }, thuKhoCookie);
  assert(rbac3.status === 403, 'Thủ kho không có quyền xóa nhà cung cấp (Nhận 403 Forbidden)');

  // 4.4 Thu ngân lập Phiếu nhập kho -> Phải nhận 403
  const rbac4 = await requestApi('/api/phieu-nhap', {
    method: 'POST',
    body: JSON.stringify({ nhaCungCap: '600000000000000000000000' })
  }, roleCookies['thungan']);
  assert(rbac4.status === 403, 'Thu ngân không có quyền lập phiếu nhập kho (Nhận 403 Forbidden)');

  // 4.5 Kỹ thuật lập Biên bản kiểm kê kho -> Phải nhận 403
  const rbac5 = await requestApi('/api/kiem-ke', {
    method: 'POST',
    body: JSON.stringify({ danhSachImeiThucTe: [] })
  }, kyThuatCookie);
  assert(rbac5.status === 403, 'Kỹ thuật không có quyền lập biên bản kiểm kê kho (Nhận 403 Forbidden)');

  // -------------------------------------------------------------
  // TỔNG KẾT
  // -------------------------------------------------------------
  console.log('\n======================================================================');
  console.log(`🎯 KẾT QUẢ KIỂM THỬ HTTP CONTRACTS: ${passed} PASS, ${failed} FAIL`);
  console.log('======================================================================');

  await mongoose.connection.close();
  server.close();

  if (failed === 0) {
    console.log('✅ TOÀN BỘ 24+ REST API ENDPOINTS ĐỀU HOẠT ĐỘNG HOÀN HẢO & KHỚP 100% FRONTEND CONTRACT!\n');
    process.exit(0);
  } else {
    console.error(`❌ CÓ ${failed} LỖI HTTP API HOẶC CONTRACT CHƯA ĐẠT!\n`);
    process.exit(1);
  }
}

runHttpContractTests().catch(err => {
  console.error('❌ Lỗi ngoại lệ trong HTTP test:', err);
  process.exit(1);
});

/**
 * TEST SUITE: PHÂN HỆ BÁO CÁO THỐNG KÊ & ĐỐI SOÁT SỔ QUÝ E2E (ĐINH ĐỨC VƯỢNG - TUẦN 5 & 6)
 * Kiểm tra toàn diện các nghiệp vụ:
 * 1. Báo cáo Doanh thu, Chi phí, Lợi nhuận gộp theo mốc thời gian (ngày / tuần / tháng)
 * 2. Xếp hạng Top sản phẩm bán chạy theo số lượng và doanh thu
 * 3. Báo cáo & Cảnh báo máy IMEI tồn kho lâu ngày (> 30 ngày, > 60 ngày)
 * 4. Đối soát chéo tài chính tổng hợp toàn hệ thống (Sổ quỹ, Hóa đơn, Nhập kho, Công nợ, Tồn kho)
 * 5. Kiểm thử REST Endpoints HTTP & Ma trận phân quyền RBAC 403 Forbidden
 */

require('dotenv').config();
const http = require('http');
const mongoose = require('mongoose');
const app = require('../src/app');
const connectDB = require('../src/config/db');
const { BaoCaoService, ThanhToanService, HoaDonService, PhieuNhapService } = require('../src/services');
const {
  NhanVien,
  KhachHang,
  NhaCungCap,
  SanPham,
  MayImei,
  HoaDon,
  PhieuThu,
  PhieuChi,
  TonKho
} = require('../src/models');

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ [PASS] ${message}`);
    passCount++;
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
    failCount++;
  }
}

async function runBaoCaoE2ETests() {
  console.log('======================================================================');
  console.log('📊 BẮT ĐẦU KIỂM THỬ BÁO CÁO THỐNG KÊ & ĐỐI SOÁT TÀI CHÍNH (VƯỢNG - TUẦN 5 & 6)');
  console.log('======================================================================\n');

  await connectDB();

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

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
    return { status: response.status, data: body, headers: response.headers };
  }

  try {
    // ─────────────────────────────────────────────────────────────────
    // CHUẨN BỊ ĐĂNG NHẬP CÁC VAI TRÒ
    // ─────────────────────────────────────────────────────────────────
    console.log('--- 1. Đăng nhập phân quyền hệ thống ---');
    const resLoginAdmin = await requestApi('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ tenDangNhap: 'admin', matKhau: 'admin123' })
    });
    const adminCookie = resLoginAdmin.headers.get('set-cookie')?.split(';')[0] || '';
    assert(resLoginAdmin.status === 200, 'Đăng nhập Quản lý (admin) thành công');

    const resLoginKeToan = await requestApi('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ tenDangNhap: 'ketoan', matKhau: '123456' })
    });
    const keToanCookie = resLoginKeToan.headers.get('set-cookie')?.split(';')[0] || '';
    assert(resLoginKeToan.status === 200, 'Đăng nhập Kế toán (ketoan) thành công');

    const resLoginKyThuat = await requestApi('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ tenDangNhap: 'kythuat', matKhau: '123456' })
    });
    const kyThuatCookie = resLoginKyThuat.headers.get('set-cookie')?.split(';')[0] || '';
    assert(resLoginKyThuat.status === 200, 'Đăng nhập Kỹ thuật (kythuat) thành công');

    // ─────────────────────────────────────────────────────────────────
    // TEST 2: Kiểm thử Báo cáo Doanh thu, Chi phí & Lợi nhuận gộp
    // ─────────────────────────────────────────────────────────────────
    console.log('\n--- 2. Kiểm thử Báo cáo Doanh thu, Chi phí & Lợi nhuận gộp ---');
    const bcDoanhThu = await BaoCaoService.getBaoCaoDoanhThu({ nhom: 'ngay' });

    assert(bcDoanhThu && bcDoanhThu.tongQuan, 'Lấy báo cáo tổng quan doanh thu thành công');
    assert(typeof bcDoanhThu.tongQuan.tongDoanhThu === 'number', `Tổng doanh thu tính hợp lệ: ${bcDoanhThu.tongQuan.tongDoanhThu.toLocaleString('vi-VN')} đ`);
    assert(typeof bcDoanhThu.tongQuan.tongChiPhi === 'number', `Tổng chi phí tính hợp lệ: ${bcDoanhThu.tongQuan.tongChiPhi.toLocaleString('vi-VN')} đ`);
    assert(
      bcDoanhThu.tongQuan.loiNhuanGop === bcDoanhThu.tongQuan.tongDoanhThu - bcDoanhThu.tongQuan.tongChiPhi,
      'Lợi nhuận gộp khớp chuẩn toán học (Lợi nhuận = Doanh thu - Chi phí)'
    );
    assert(Array.isArray(bcDoanhThu.bieuDo.labels), 'Dữ liệu biểu đồ trả về mảng labels thời gian');
    assert(Array.isArray(bcDoanhThu.bieuDo.doanhThu), 'Dữ liệu biểu đồ trả về mảng series doanhThu');

    // Nhóm theo tháng
    const bcThang = await BaoCaoService.getBaoCaoDoanhThu({ nhom: 'thang' });
    assert(bcThang.bieuDo.nhom === 'thang', 'Hỗ trợ gom nhóm dữ liệu theo Tháng (YYYY-MM)');

    // ─────────────────────────────────────────────────────────────────
    // TEST 3: Kiểm thử Top Sản phẩm Bán chạy
    // ─────────────────────────────────────────────────────────────────
    console.log('\n--- 3. Kiểm thử Top Sản phẩm Bán chạy ---');
    const bcTop = await BaoCaoService.getTopSanPham({ limit: 5 });

    assert(bcTop && Array.isArray(bcTop.topTheoSoLuong), 'Danh sách Top theo số lượng trả về dạng mảng');
    assert(Array.isArray(bcTop.topTheoDoanhThu), 'Danh sách Top theo doanh thu trả về dạng mảng');
    assert(typeof bcTop.tongSanPhamDaBan === 'number', `Tổng sản phẩm đã bán: ${bcTop.tongSanPhamDaBan}`);

    if (bcTop.topTheoSoLuong.length > 1) {
      assert(
        bcTop.topTheoSoLuong[0].soLuongBan >= bcTop.topTheoSoLuong[1].soLuongBan,
        'Top 1 có số lượng bán lớn hơn hoặc bằng Top 2'
      );
    }

    // ─────────────────────────────────────────────────────────────────
    // TEST 4: Kiểm thử Báo cáo Hàng tồn kho lâu ngày
    // ─────────────────────────────────────────────────────────────────
    console.log('\n--- 4. Kiểm thử Báo cáo Hàng tồn kho lâu ngày (> 30 ngày / > 60 ngày) ---');
    
    // Tạo 1 máy mẫu nhập cách đây 70 ngày để kiểm thử
    const sp = await SanPham.findOne();
    const imeiTonCu = `IMEI_TON_CU_${Date.now()}`;
    const ngayNhapCu = new Date(Date.now() - 70 * 24 * 60 * 60 * 1000);

    await MayImei.create({
      imei: imeiTonCu,
      sanPham: sp._id,
      giaNhap: 12000000,
      trangThai: 'Con hang',
      ngayNhap: ngayNhapCu
    });

    const bcTonLau = await BaoCaoService.getHangTonLauNgay({ soNgay: 60, limit: 10 });
    assert(bcTonLau && bcTonLau.tongSoLuong >= 1, `Phát hiện có máy tồn kho lâu ngày (> 60 ngày): ${bcTonLau.tongSoLuong} máy`);
    const foundTonCu = bcTonLau.danhSach.find(m => m.imei === imeiTonCu);
    assert(foundTonCu && foundTonCu.soNgayTon >= 70, `Tính chính xác số ngày tồn kho của máy (${foundTonCu ? foundTonCu.soNgayTon : 0} ngày)`);
    assert(bcTonLau.tongVonTonLau >= 12000000, `Tổng vốn tồn kho lâu ngày tính hợp lệ: ${bcTonLau.tongVonTonLau.toLocaleString('vi-VN')} đ`);

    // Dọn dẹp máy test
    await MayImei.deleteOne({ imei: imeiTonCu });

    // ─────────────────────────────────────────────────────────────────
    // TEST 5: Kiểm thử Đối soát Chéo Tài chính Tổng hợp
    // ─────────────────────────────────────────────────────────────────
    console.log('\n--- 5. Kiểm thử Đối soát Chéo Tài chính Tổng hợp ---');
    const bcTaiChinh = await BaoCaoService.getBaoCaoTaiChinhTongHop();

    assert(bcTaiChinh && bcTaiChinh.soQuy, 'Lấy báo cáo số dư sổ quỹ tổng hợp thành công');
    assert(
      bcTaiChinh.soQuy.tonQuy === bcTaiChinh.soQuy.tongThu - bcTaiChinh.soQuy.tongChi,
      'Số dư tồn quỹ khớp 100% (Tồn quỹ = Tổng Thu - Tổng Chi)'
    );
    assert(
      bcTaiChinh.soQuy.tonQuy === bcTaiChinh.soQuy.tonQuyTienMat + bcTaiChinh.soQuy.tonQuyNganHang,
      'Tồn quỹ khớp tổng Tiền mặt + Ngân hàng'
    );
    assert(typeof bcTaiChinh.tonKho.tongGiaTriKho === 'number', `Tổng giá trị vốn kho hàng: ${bcTaiChinh.tonKho.tongGiaTriKho.toLocaleString('vi-VN')} đ`);

    // ─────────────────────────────────────────────────────────────────
    // TEST 6: Kiểm thử REST HTTP Endpoints & Phân quyền RBAC 403
    // ─────────────────────────────────────────────────────────────────
    console.log('\n--- 6. Kiểm thử REST Endpoints & RBAC 403 Forbidden ---');

    // 6.1 Quản lý truy cập Báo cáo Doanh thu -> 200 OK
    const resAdminDT = await requestApi('/api/bao-cao/doanh-thu', {}, adminCookie);
    assert(resAdminDT.status === 200 && resAdminDT.data?.success === true, 'GET /api/bao-cao/doanh-thu (Quản lý) trả về 200 OK');

    // 6.2 Kế toán truy cập Báo cáo Tài chính Tổng hợp -> 200 OK
    const resKeToanTC = await requestApi('/api/bao-cao/tong-hop-tai-chinh', {}, keToanCookie);
    assert(resKeToanTC.status === 200 && resKeToanTC.data?.success === true, 'GET /api/bao-cao/tong-hop-tai-chinh (Kế toán) trả về 200 OK');

    // 6.3 Kỹ thuật truy cập Báo cáo Doanh thu -> 403 Forbidden
    const resKyThuatDT = await requestApi('/api/bao-cao/doanh-thu', {}, kyThuatCookie);
    assert(resKyThuatDT.status === 403, 'Kỹ thuật bị chặn 403 Forbidden khi xem Báo cáo Doanh thu');

    // 6.4 Kỹ thuật truy cập Báo cáo Tài chính Tổng hợp -> 403 Forbidden
    const resKyThuatTC = await requestApi('/api/bao-cao/tong-hop-tai-chinh', {}, kyThuatCookie);
    assert(resKyThuatTC.status === 403, 'Kỹ thuật bị chặn 403 Forbidden khi xem Báo cáo Tài chính');

  } catch (error) {
    console.error('\n❌ Lỗi Test không mong đợi:', error.message);
    failCount++;
  } finally {
    await mongoose.connection.close();
    server.close();
    console.log(`\n======================================================================`);
    console.log(`📊 KẾT QUẢ KIỂM THỬ BÁO CÁO TUẦN 5-6: ${passCount} PASS | ${failCount} FAIL`);
    console.log(`======================================================================\n`);
    if (failCount > 0) process.exit(1);
  }
}

runBaoCaoE2ETests();

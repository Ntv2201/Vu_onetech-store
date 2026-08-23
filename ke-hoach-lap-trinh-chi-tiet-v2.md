# KẾ HOẠCH LẬP TRÌNH CHI TIẾT — ONE TECH STORE
### Lộ trình 8 tuần (40 ngày làm việc) — 6 Thành viên
> **Trạng thái hiện tại: ĐANG Ở TUẦN THỨ 3 (Giai đoạn tăng tốc các module lõi)**

---

## I. QUY ƯỚC CHUNG TOÀN DỰ ÁN (BẮT BUỘC CHO 6 THÀNH VIÊN)
1. **Chuẩn hóa RESTful API:** Mọi phản hồi dùng format thống nhất:
   - Thành công: `{ success: true, message: "...", data: { ... } }`
   - Lỗi: `{ success: false, message: "..." }` kèm HTTP Status Code chuẩn (400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 409 Conflict).
2. **Kiến trúc Layered MVC + OOP Service:**
   - Mọi thao tác ghi dữ liệu nhiều bảng PHẢI đi qua Service OOP (`src/services/`) với atomic validation / transaction, không viết logic trực tiếp trong Controller.
   - Controllers kế thừa `BaseController` (`sendSuccess`, `sendError`, `handleError`).
   - Services kế thừa `BaseService`.
3. **Bảo mật & Phân quyền RBAC:**
   - 100% routes được bảo vệ qua middleware `requireAuth` và `requireRole([...])` theo 6 vai trò: `QuanLy`, `ThuKho`, `BanHang`, `ThuNgan`, `KeToan`, `KyThuat`.
4. **Quản lý theo IMEI:** Mỗi máy điện thoại là 1 bản ghi riêng trong `MAY_IMEI` với trạng thái riêng (`Con hang`, `Da ban`, `Bao hanh`, `Loi`), không quản lý theo số lượng gộp.

---

## II. TỔNG QUAN ROADMAP 8 TUẦN

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                 LỘ TRÌNH PHÁT TRIỂN 8 TUẦN                                       │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
 [Tuần 1-2] ĐÃ HOÀN THÀNH 100%
   ├─ Scaffold MVC + 26 Mongoose Models (An)
   ├─ RBAC 6 Vai trò + CRUD Danh mục cơ bản
   ├─ Module Bán hàng POS + Xuất kho theo IMEI (Tuấn)
   ├─ Module Tra cứu IMEI & Tiếp nhận/Hoàn tất Bảo hành (Tuấn)
   └─ Khung UI Bootstrap + POS Bán hàng + Tra cứu BH (Vũ)

 [Tuần 3] HIỆN TẠI (Đang triển khai)
   ├─ Module Nhập kho máy IMEI & Phụ kiện (Tuân)
   ├─ Module Đặt hàng trước Pre-order (Việt)
   ├─ Hàm tồn kho dùng chung + Nền tảng Công nợ (An)
   ├─ Module Sổ quỹ Thu - Chi dùng chung (Vượng)
   ├─ UI Redesign & Animation Pack toàn diện [ĐÃ MERGE] (Vũ)
   └─ Giao diện Nhập kho & Đặt trước (Vũ)

 [Tuần 4] Luồng Nghiệp vụ Nâng cao & Liên kết
   ├─ Module Đổi trả máy IMEI + Xử lý bù/hoàn tiền chênh lệch (Việt)
   ├─ Chuyển đổi Đặt trước thành Hóa đơn bán cấn trừ cọc (Việt + Tuấn)
   ├─ Quản lý NCC & Nhập kho hàng loạt (Tuân)
   ├─ Kiểm kê kho & Điều chỉnh lệch IMEI (Vượng)
   └─ Đối soát & Thanh toán công nợ (An)

 [Tuần 5] Tài chính, Trả góp & Báo cáo
   ├─ Module Hợp đồng Trả góp & Lịch thu kỳ (An)
   ├─ Báo cáo Doanh thu, Top SP, Tồn lâu ngày (Vượng)
   ├─ Xử lý các tình huống biên (Edge Cases) sau bán hàng (Tuân, Việt, Tuấn)
   └─ Tích hợp Chart.js vẽ biểu đồ Dashboard (Vũ + Vượng)

 [Tuần 6] Tích hợp Toàn diện (E2E) & Hoàn thiện UI/Print
   ├─ Nối 100% API Backend vào Frontend (Vũ + 5 Dev)
   ├─ Chuẩn hóa Mẫu in: Hóa đơn, Phiếu nhập, Phiếu BH, Phiếu đổi trả (Vũ)
   └─ Tối ưu UX/UI, validation Client-Server

 [Tuần 7] Kiểm thử Toàn diện & Tối ưu Hệ thống
   ├─ Chạy full test suite tự động 6 module
   ├─ Stress test dữ liệu lớn (1.000+ IMEI) & kiểm tra Concurrency
   └─ Rà soát ma trận bảo mật 6 Actor & Fix bugs

 [Tuần 8] Dữ liệu Demo, Kịch bản & Nghiệm thu
   ├─ Nạp seed data phong phú mô phỏng thực tế
   ├─ Soạn kịch bản Demo phân vai & diễn tập bảo vệ đồ án
   └─ Đóng gói source code & hoàn thiện tài liệu bàn giao
```

---

## III. PHÂN CÔNG CHI TIẾT THEO TỪNG THÀNH VIÊN

---

### 👤 THÀNH VIÊN 1 — NGUYỄN QUANG TUẤN (Bán hàng & Dịch vụ Bảo hành)

#### Tuần 1-2: Xây dựng Module Bán hàng & Bảo hành [ĐÃ HOÀN THÀNH 100%]
- [x] Xác nhận 26 Mongoose models, viết `HoaDonService`, `BaoHanhService`.
- [x] `POST /api/hoa-don` — Bán hàng theo danh sách IMEI & Phụ kiện:
  1. Kiểm tra từng IMEI `TrangThai = 'Con hang'` (nếu lỗi $\rightarrow$ ném 409 Conflict).
  2. Kiểm tra tồn phụ kiện $\rightarrow$ Trừ tồn kho.
  3. Đổi `MAY_IMEI` $\rightarrow$ `Da ban`, tự động sinh `PhieuXuatKho`.
- [x] `POST /api/bao-hanh` — Tiếp nhận BH: kiểm tra máy đã bán, kiểm tra còn hạn BH (`NgayLap + SoThangBH`).
- [x] `GET /api/bao-hanh/tra-cuu/:imei` — Tra cứu dòng đời IMEI: Ngày nhập, Ngày bán, Hạn BH, Lịch sử sửa.
- [x] `POST /api/bao-hanh/:id/linh-kien` — Xuất linh kiện trừ tồn kho.
- [x] `PUT /api/bao-hanh/:id/hoan-tat` — Đổi phiếu `Da sua xong`, trả `MAY_IMEI` về `Da ban`.
- [x] Viết bộ test tự động 26/26 test cases PASS ([`tests/test_tuan_module.js`](tests/test_tuan_module.js)).

#### Tuần 3-4 [HIỆN TẠI]: Hỗ trợ tích hợp Cấn trừ Cọc & Mở rộng Nghiệp vụ [ĐÃ HOÀN THÀNH TUẦN 3]
- [x] Mở rộng `HoaDonService.banHang()` / `taoHoaDonBanHang()`: Tiếp nhận tham số `donDatHangId` từ bạn Việt để tự động cấn trừ số tiền cọc đã thu vào tổng thanh toán hóa đơn.
- [x] Tối ưu hóa xử lý concurrency & atomic lock khi nhiều giao dịch cùng thao tác trên 1 IMEI (chặn xung đột 409 Conflict).
- [x] Bổ sung API `GET /api/hoa-don/dat-truoc/tim-kiem` và giao diện chọn đơn đặt trước cấn trừ cọc trên POS bán hàng.
- [x] Đã kiểm thử 32/32 test cases PASS bao gồm kiểm thử cấn trừ cọc và race condition lock.

#### Tuần 5-6: Hỗ trợ tích hợp E2E & Tối ưu Luồng Bán hàng
- [ ] Phối hợp với Vũ hoàn thiện trải nghiệm POS bán hàng (phím tắt quét barcode IMEI, in nhanh).
- [ ] Kiểm thử luồng tích hợp: Đặt trước $\rightarrow$ Bán hàng $\rightarrow$ Bảo hành $\rightarrow$ Đổi trả.

#### Tuần 7-8: Stress Test, Diễn tập Demo & Đóng gói
- [ ] Chạy stress test bán hàng đồng thời nhiều IMEI.
- [ ] Phụ trách phần demo luồng Bán hàng POS & Tra cứu Bảo hành trong buổi bảo vệ.

---

### 👤 THÀNH VIÊN 2 — PHẠM MINH TUÂN (Mua hàng & Nhập kho, Nhà cung cấp)

#### Tuần 1-2: Nền tảng Model & Chuẩn bị [ĐÃ HOÀN THÀNH]
- [x] Rà soát cấu trúc bảng `PhieuNhap`, `CT_PhieuNhap`, `NhaCungCap`, `PhieuChi`.
- [x] CRUD cơ bản đối tác Nhà cung cấp (`/api/nha-cung-cap`).

#### Tuần 3 [HIỆN TẠI]: Xây dựng API Nhập kho Cốt lõi
- [ ] Xây dựng `PhieuNhapService` kế thừa `BaseService`, `PhieuNhapController`, route `/api/phieu-nhap`.
- [ ] `POST /api/phieu-nhap` — payload: `{ maNCC, maNV, danhSachMay: [{maSP, imei, giaNhap, mauSac, dungLuong}], danhSachPhuKien: [{maPK, soLuong, giaNhap}], hinhThucThanhToan, ghiChu }`:
  1. Kiểm tra từng IMEI trong `danhSachMay` **chưa tồn tại** trong `MAY_IMEI` — nếu trùng ném lỗi `409 Conflict`.
  2. Tạo `PHIEUNHAP`.
  3. Tạo mới từng bản ghi `MAY_IMEI` với `TrangThai = 'Con hang'`, tạo `CT_PHIEUNHAP`.
  4. Cập nhật `PhuKien.soLuongTon` và gọi `capNhatTonKho` của An để tăng số lượng tồn.
  5. Xử lý thanh toán: Nếu thanh toán ngay $\rightarrow$ gọi `taoPhieuChi` của Vượng; nếu ghi nợ $\rightarrow$ ghi nhận `CONGNO` NCC.
- [ ] `GET /api/phieu-nhap`, `GET /api/phieu-nhap/:id`.

#### Tuần 4: Quản lý Nhà cung cấp nâng cao & Nhập hàng loạt
- [ ] `GET /api/nha-cung-cap/:id/lich-su-nhap` — Xem lịch sử các đợt nhập hàng theo NCC, tổng tiền, dư nợ.
- [ ] `POST /api/phieu-nhap/import-hang-loat` — Hỗ trợ nhập danh sách nhiều IMEI cùng lúc từ text/file.
- [ ] Viết test tự động: Nhập lô 5 máy $\rightarrow$ 5 IMEI hiển thị đúng `Con hang`, nhập trùng IMEI bị chặn 409.

#### Tuần 5: Xử lý Tình huống Biên & Trả hàng NCC
- [ ] `POST /api/phieu-nhap/tra-hang-ncc` — Trả lại máy lỗi cho NCC (đổi trạng thái IMEI, giảm công nợ NCC).
- [ ] Tinh chỉnh phân quyền: Chỉ `ThuKho`, `QuanLy` được nhập kho.

#### Tuần 6-8: Nối UI, Kiểm thử Tích hợp & Demo
- [ ] Nối API với màn hình `src/public/nhap-kho/index.html` của Vũ.
- [ ] Kiểm thử đối soát: Số lượng nhập kho luôn khớp 100% với số lượng tồn kho của An và phiếu chi của Vượng.
- [ ] Chuẩn bị kịch bản demo nhập lô máy mới vào hệ thống.

---

### 👤 THÀNH VIÊN 3 — TRƯƠNG THẾ AN (Tồn kho, Công nợ, Trả góp)

#### Tuần 1-2: Xây dựng Schema 26 Models & Seed Data [ĐÃ HOÀN THÀNH 100%]
- [x] Khởi tạo trọn bộ 26 Mongoose Models trong `src/models/`.
- [x] Tạo seed script cơ bản (`src/seeds/seed.js`) 6 tài khoản mẫu theo 6 vai trò.

#### Tuần 3 [HIỆN TẠI]: Service Tồn kho Dùng chung & Nền tảng Công nợ
- [ ] Viết **hàm dùng chung** cập nhật tồn kho: `capNhatTonKho(maSP, maKho, delta)` export từ `TonKhoService` để Tuấn, Tuân, Việt cùng gọi.
- [ ] `GET /api/kho/ton-kho?maKho=` — Thống kê tồn kho theo từng Model sản phẩm và kho hàng.
- [ ] `GET /api/kho/phieu-xuat` — Danh sách phiếu xuất kho.
- [ ] `GET /api/cong-no` — Danh sách công nợ (lọc theo `loaiDoiTuong`, `maKH`, `maNCC`, `trangThai`).
- [ ] Viết hàm validate đa hình cho `CONGNO`: nếu `LoaiDoiTuong = 'KhachHang'` thì bắt buộc có `MaKH` và `MaNCC = null`, ngược lại tương tự.

#### Tuần 4: Đối soát & Thanh toán Công nợ
- [ ] `GET /api/cong-no/:id` — Chi tiết khoản nợ kèm lịch sử phiếu thu/chi liên quan.
- [ ] `POST /api/cong-no/:id/thanh-toan` — Thu nợ / Trả nợ (gọi Service của Vượng tạo phiếu thu/chi).
- [ ] Tự động cập nhật trạng thái nợ: `Chua tra` $\rightarrow$ `Dang tra` $\rightarrow$ `Da hoan tat`.

#### Tuần 5: Phân hệ Hợp đồng Trả góp
- [ ] `POST /api/tra-gop` — payload: `{ soHD, soTienTraTruoc, soKy }` (3/6/9/12 tháng).
  - Tính toán: `SoTienTraGop = (HOADON.TongTien - soTienTraTruoc) / soKy`.
- [ ] `GET /api/tra-gop/:id/lich-thu` — Sinh lịch thu định kỳ theo tháng dựa trên ngày lập hóa đơn.
- [ ] `POST /api/tra-gop/:id/thu-ky` — Thu tiền 1 kỳ (tự động gọi Service Vượng sinh `PhieuThu`).

#### Tuần 6-8: Nối UI, Kiểm thử Dữ liệu & Demo
- [ ] Nối API với giao diện Công nợ & Trả góp của Vũ.
- [ ] Viết test tự động (`tests/test_an_cong_no.js`): Nhập kho $\rightarrow$ bán hàng $\rightarrow$ kiểm tra tồn kho chính xác từng chiếc; tạo hợp đồng trả góp 12 kỳ tính đúng số tiền.
- [ ] Demo luồng lập hợp đồng trả góp & đối soát công nợ khách hàng/NCC.

---

### 👤 THÀNH VIÊN 4 — NGUYỄN TUẤN VŨ (Frontend / UI / UX)

#### Tuần 1-2: Layout Tổng quan & POS Bán hàng [ĐÃ HOÀN THÀNH]
- [x] Xây dựng Layout Bootstrap 5 dùng chung: Navbar, Sidebar tự động ẩn/hiện menu theo `user.vaiTro`.
- [x] Màn hình Đăng nhập `src/public/login.html` có các nút chọn nhanh 6 tài khoản demo.
- [x] Màn hình Bán hàng POS `src/public/ban-hang/index.html` (quét IMEI, giỏ hàng, chọn KH, in HĐ).
- [x] Màn hình Tra cứu Bảo hành `src/public/bao-hanh/index.html` (timeline dòng đời máy).

#### Tuần 3 [HIỆN TẠI]: UI Redesign, Hoạt ảnh & Màn hình Nhập kho - Đặt trước
- [x] **Nâng cấp Toàn diện UI/UX & Bộ Hoạt ảnh (UI Redesign & Animation Pack):**
  - [x] Thiết kế bộ Keyframe Animation mượt mà (`fadeInUp`, `slideDown`, `cardIn`, `bgFloat`, `logoSpin`...).
  - [x] Tính năng **Thu gọn / Mở rộng Sidebar (Collapsible Sidebar)** trên Desktop kèm lưu trạng thái vào `localStorage`.
  - [x] Hoàn thiện **Mobile Responsive Sidebar** với lớp phủ mờ `sidebar-overlay` và tự động đóng menu khi bấm điều hướng trên di động (< 992px).
  - [x] Thiết kế lại màn hình **Đăng nhập (`src/public/pages/login.html`)** hiện đại với hiệu ứng gradient nổi bật, card animation và badge chọn nhanh tài khoản demo.
  - [x] Tích hợp hiệu ứng đếm số tăng dần (`animateCount` với easing `easeOutCubic`) cho toàn bộ thẻ thống kê số liệu trên **Dashboard (`src/public/js/dashboard.js`)**.
  - [x] **Phân quyền Giao diện Đa tầng (Client-side RBAC & Route Guarding):** Lọc menu Sidebar thông minh cho 6 vai trò, ẩn danh mục rỗng, tùy biến nút Dashboard theo quyền và chặn truy cập URL trái phép.
- [ ] `src/public/pages/nhap-kho/index.html`: Giao diện chọn NCC, bảng nhập nhiều dòng IMEI, paste nhanh danh sách IMEI (nối API của Tuân).
- [ ] `src/public/pages/dat-truoc/index.html`: Form tiếp nhận đơn đặt trước, thu tiền cọc, danh sách theo dõi đơn hàng (nối API của Việt).

#### Tuần 4: Màn hình Đổi trả máy & Quản lý Công nợ
- [ ] `src/public/doi-tra/index.html`: Giao diện tra cứu hóa đơn cũ, chọn IMEI mới cần đổi, hiển thị tiền chênh lệch cần thu thêm/hoàn lại (nối API của Việt).
- [ ] `src/public/cong-no/index.html`: Bảng theo dõi công nợ KH & NCC, nút thanh toán từng phần/toàn phần (nối API của An).

#### Tuần 5: Màn hình Trả góp, Kiểm kê & Biểu đồ Dashboard
- [ ] `src/public/tra-gop/index.html`: Giao diện bảng tính trả góp, lịch thu kỳ trực quan.
- [ ] `src/public/kiem-ke/index.html`: Giao diện quét danh sách IMEI thực tế để phát hiện thừa/thiếu.
- [ ] Tích hợp Chart.js trên `src/public/index.html` (vẽ biểu đồ doanh thu theo ngày/tháng, top sản phẩm).

#### Tuần 6: Bộ Mẫu In Chuẩn Hóa (@media print) & Hoàn thiện UX
- [ ] Hoàn thiện chuẩn in ấn `@media print` cho:
  1. Hóa đơn bán lẻ (khổ K80 / A5).
  2. Phiếu nhập kho (khổ A4).
  3. Phiếu bảo hành & Phiếu bàn giao sửa chữa.
  4. Phiếu đổi trả sản phẩm.
  5. Hợp đồng trả góp.
- [ ] Chuẩn hóa thông báo Toast, Modal xác nhận thao tác nguy hiểm (Xóa, Hủy đơn).

#### Tuần 7-8: Tối ưu UI Toàn diện & Hỗ trợ Diễn tập Demo
- [ ] Kiểm tra responsive trên các độ phân giải màn hình.
- [x] Kiểm tra hiển thị menu và các nút bấm theo đúng 6 vai trò người dùng (không để lộ nút chức năng bị cấm).
- [ ] Đồng hành cùng nhóm trong các buổi diễn tập demo.

---

### 👤 THÀNH VIÊN 5 — ĐINH ĐỨC VƯỢNG (Thu - Chi, Sổ quỹ, Kiểm kê, Báo cáo)

#### Tuần 1-2: Nền tảng Model & Schema [ĐÃ HOÀN THÀNH]
- [x] Xác nhận các model `PhieuThu`, `PhieuChi`, `BienBanKiemKe`, `DieuChinhKho`.
- [x] CRUD cơ bản Danh mục (`/api/danh-muc`) & Phụ kiện (`/api/phu-kien`).

#### Tuần 3 [HIỆN TẠI]: Module Lõi Thu - Chi & Sổ quỹ Dùng chung
- [ ] Xây dựng `ThanhToanService` kế thừa `BaseService`, `ThanhToanController`, route `/api/thanh-toan`.
- [ ] **Export 2 hàm dùng chung cho cả nhóm:**
  - `taoPhieuThu({ soHD, maDat, maCN, maDoiTra, soTien, phuongThuc, nguoiNop, sessionUser })`
  - `taoPhieuChi({ maPN, maDT, maHoanCoc, maDoiTra, soTien, lyDo, nguoiNhan, sessionUser })`
  - *(Cho phép Tuân nhập kho, Việt đặt cọc/đổi trả, An thu trả góp/công nợ gọi lại mà không bị trùng code)*.
- [ ] `POST /api/thanh-toan/thu`, `POST /api/thanh-toan/chi`.
- [ ] `GET /api/thanh-toan/so-quy?tuNgay=&denNgay=` — Tính tổng thu, tổng chi, số dư tồn quỹ theo khoảng thời gian.

#### Tuần 4: Phân hệ Kiểm kê kho & Xử lý Lệch IMEI
- [ ] `POST /api/kiem-ke` — payload: `{ maKho, danhSachIMEIThucTe: [...] }`:
  1. Lấy toàn bộ `MAY_IMEI` đang có `TrangThai = 'Con hang'` trong DB.
  2. IMEI có trong DB nhưng không có thực tế $\rightarrow$ cảnh báo "Thiếu hàng".
  3. IMEI quét được nhưng DB không có (hoặc đã bán) $\rightarrow$ cảnh báo "Thừa/Bất thường".
  4. Tạo `BIENBANKIEMKE` + các dòng `DIEUCHINHKHO`.
- [ ] `GET /api/kiem-ke`, `GET /api/kiem-ke/:id`.

#### Tuần 5: Phân hệ Báo cáo Thống kê & API Dashboard
- [ ] `GET /api/bao-cao/doanh-thu?tuNgay=&denNgay=&nhom=ngay|tuan|thang` — Doanh thu thuần, chi phí, lợi nhuận gộp.
- [ ] `GET /api/bao-cao/top-san-pham` — Top sản phẩm bán chạy theo số lượng và doanh thu.
- [ ] `GET /api/bao-cao/ton-lau-ngay?soNgay=60` — Danh sách các máy IMEI tồn kho lâu chưa bán.
- [ ] Cung cấp dữ liệu chuẩn định dạng cho Vũ vẽ biểu đồ Chart.js.

#### Tuần 6-8: Nối UI, Kiểm thử Sổ quỹ & Demo
- [ ] Nối API với giao diện Sổ quỹ, Kiểm kê và Báo cáo của Vũ.
- [ ] Viết test tự động (`tests/test_vuong_thu_chi.js`): Sổ quỹ luôn khớp với tổng hóa đơn + phiếu nhập + đặt cọc + trả góp.
- [ ] Demo luồng Kiểm kê phát hiện IMEI thừa/thiếu và Báo cáo Dashboard.

---

### 👤 THÀNH VIÊN 6 — TÔ QUỐC VIỆT (Đổi trả & Đặt hàng trước)

#### Tuần 1-2: Khởi tạo & Tìm hiểu Kiến trúc [ĐÃ HOÀN THÀNH]
- [x] Nắm rõ cấu trúc Service Layer OOP và mô hình quản lý theo từng IMEI.
- [x] Tham gia xây dựng kiểm thử RBAC 403 Forbidden cho 6 vai trò.

#### Tuần 3 [HIỆN TẠI]: Xây dựng Phân hệ Đặt hàng trước (Pre-order) [ĐÃ HOÀN THÀNH 100%]
- [x] Xây dựng `DatTruocService` kế thừa `BaseService`, `DatTruocController`, route `/api/dat-truoc`.
- [x] `POST /api/dat-truoc` — payload: `{ maKH, maSP, soTienCoc, hanLay, ghiChu }`:
  1. Kiểm tra khách hàng và sản phẩm tồn tại.
  2. Tạo bản ghi `DONDATHANGTRUOC` với `TrangThai = 'Da dat coc'`.
  3. Tự động gọi `taoPhieuThu` của Vượng để ghi nhận tiền cọc (loại `DatCoc`).
- [x] `GET /api/dat-truoc` — Danh sách đơn đặt trước (lọc `trangThai`, `maKH`, `tuNgay`, `denNgay`, phân trang).
- [x] `GET /api/dat-truoc/:id` — Chi tiết đơn đặt trước và phiếu thu cọc kèm theo.
- [x] `PUT /api/dat-truoc/:id/huy` — Khách hủy đơn đặt:
  1. Kiểm tra đơn đang ở `Da dat coc`.
  2. Cập nhật `TrangThai = 'Da huy'`.
  3. Tự động gọi `taoPhieuChi` của Vượng hoàn tiền cọc cho khách.
- [x] Viết bộ kiểm thử tự động 32/32 test cases PASS (`tests/test_viet_module.js`).

#### Tuần 4: Chuyển đổi Hóa đơn & Xây dựng Phân hệ Đổi trả máy (Trọng tâm)
- [ ] `PUT /api/dat-truoc/:id/chuyen-hoa-don` — Khách đến nhận máy:
  1. Kiểm tra đơn đặt trước hợp lệ.
  2. Nhận IMEI máy chọn, gọi `HoaDonService.banHang()` của Tuấn kèm `donDatHangId` để **cấn trừ tiền cọc** vào hóa đơn.
  3. Đổi trạng thái `DONDATHANGTRUOC` $\rightarrow$ `Da nhan may`.
- [ ] Xây dựng `DoiTraService` kế thừa `BaseService`, `DoiTraController`, route `/api/doi-tra`.
- [ ] `POST /api/doi-tra` — payload: `{ soHD, imeiCu, imeiMoi, lyDo, ghiChu }`:
  1. Kiểm tra `imeiCu` thuộc đúng hóa đơn `soHD` (qua `CT_HOADON_MAY`).
  2. Kiểm tra thời hạn đổi trả cho phép (VD: trong vòng 30 ngày từ `NgayLap`).
  3. Kiểm tra `imeiMoi` đang có `TrangThai = 'Con hang'` trong kho.
  4. Tạo bản ghi `PHIEUDOITRA`.
  5. Cập nhật `MAY_IMEI` của `imeiCu` $\rightarrow$ `TrangThai = 'Loi'`.
  6. Cập nhật `MAY_IMEI` của `imeiMoi` $\rightarrow$ `TrangThai = 'Da ban'`.
  7. Xử lý chênh lệch giá giữa máy mới và máy cũ:
     - Giá máy mới > máy cũ: Gọi `taoPhieuThu` của Vượng thu thêm tiền chênh lệch.
     - Giá máy mới < máy cũ: Gọi `taoPhieuChi` của Vượng hoàn tiền thừa cho khách.
     - Bằng giá: Không tạo phiếu thu/chi.
- [ ] `GET /api/doi-tra`, `GET /api/doi-tra/:id`, `GET /api/doi-tra/lich-su-imei/:imei`.

#### Tuần 5: Hoàn thiện Tình huống Biên & Phân quyền
- [ ] Gắn middleware `requireRole(['QuanLy', 'BanHang', 'ThuNgan'])` cho các route Đổi trả & Đặt trước.
- [ ] Xử lý các tình huống biên: Đổi máy kèm phụ kiện phát sinh, hủy đổi trả nếu có sai sót.

#### Tuần 6-8: Nối UI, Kiểm thử Tự động & Demo
- [ ] Nối API với giao diện Đặt trước (`src/public/dat-truoc/`) và Đổi trả (`src/public/doi-tra/`) của Vũ.
- [ ] Viết test tự động (`tests/test_viet_module.js`):
  1. Đặt cọc $\rightarrow$ chuyển hóa đơn cấn trừ tiền cọc chính xác.
  2. Đổi trả máy: `imeiCu` sang `Loi`, `imeiMoi` sang `Da ban`, sinh đúng phiếu thu/chi chênh lệch giá.
  3. Chặn đổi máy không thuộc hóa đơn hoặc máy mới không còn hàng.
- [ ] Demo trực tiếp luồng Đặt cọc nhận máy và Đổi trả máy lỗi lấy máy mới trong buổi nghiệm thu.

---

## IV. MA TRẬN PHỐI HỢP & ĐIỂM GIAO THOA (CẦN THỐNG NHẤT)

| Vấn đề nghiệp vụ | Ai liên quan | Nội dung thống nhất kỹ thuật |
|---|---|---|
| **Hàm cập nhật tồn kho dùng chung** | An, Tuân, Tuấn, Việt | An export `capNhatTonKho(maSP, maKho, delta)` từ `TonKhoService`. Tất cả thành viên gọi hàm này khi nhập hàng, bán hàng, đổi trả. |
| **Service Thu / Chi dùng chung** | Vượng, An, Tuân, Việt | Vượng export `taoPhieuThu()`, `taoPhieuChi()` từ `ThanhToanService`. Tuân (nhập kho), An (trả góp/công nợ), Việt (cọc/hoàn cọc/đổi trả) gọi lại. |
| **Cấn trừ tiền cọc khi bán máy** | Việt, Tuấn | Khi khách nhận máy đặt trước, Việt truyền `donDatHangId` sang `HoaDonService.banHang()` của Tuấn để trừ thẳng số tiền cọc vào hóa đơn bán. |
| **Xử lý chênh lệch giá khi Đổi trả** | Việt, Vượng | Việt so sánh `donGiaBan` máy mới vs máy cũ, tự động gọi `taoPhieuThu` (nếu bù tiền) hoặc `taoPhieuChi` (nếu hoàn tiền). |
| **Mẫu in & Kết nối giao diện** | Vũ + 5 Dev | Vũ dựng mock UI trước, các Dev cung cấp endpoint đúng định dạng JSON `{ success, data, message }` để ráp nối không bị delay. |

---

## V. CHECKLIST ĐÁNH GIÁ NGHIỆM THU THEO TỪNG TUẦN

- [x] **Cuối Tuần 2:** Chạy được server, nạp seed 6 vai trò, Bán hàng POS và Tra cứu Bảo hành chạy mượt (26/26 tests PASS).
- [ ] **Cuối Tuần 3:** Nhập kho thành công sinh IMEI `Con hang`, tạo đơn đặt trước sinh phiếu thu cọc, sổ quỹ cập nhật đúng số dư.
- [ ] **Cuối Tuần 4:** Đổi trả 1 máy chuyển đúng trạng thái 2 IMEI và tính chênh lệch tiền; cấn trừ cọc vào hóa đơn chuẩn; kiểm kê kho chỉ ra đúng IMEI lệch.
- [ ] **Cuối Tuần 5:** Hợp đồng trả góp sinh đúng lịch thu từng kỳ; Dashboard vẽ được biểu đồ doanh thu và top SP bán chạy.
- [ ] **Cuối Tuần 6:** 100% màn hình giao diện kết nối API thật (không còn mock data); in đẹp mọi loại phiếu qua `@media print`.
- [ ] **Cuối Tuần 7:** Bộ kiểm thử tự động toàn dự án PASS 100%; kiểm tra phân quyền 6 vai trò không có lỗ hổng 403; không có lỗi xung đột IMEI.
- [ ] **Cuối Tuần 8:** Kịch bản demo 5-7 phút trơn tru không lỗi; dữ liệu seed đầy đủ và trực quan; sẵn sàng 100% bảo vệ đồ án.

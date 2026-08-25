# KẾ HOẠCH LẬP TRÌNH CHI TIẾT — ONE TECH STORE
### Lộ trình 8 tuần (40 ngày làm việc) — Đội ngũ 7 Thành viên (6 Devs + 1 QA Tester)
> **Trạng thái hiện tại: ĐANG Ở TUẦN THỨ 4 (Giai đoạn mở rộng Nghiệp vụ Nâng cao & Kiểm thử Tự động Chuyên sâu)**

---

## I. QUY ƯỚC CHUNG TOÀN DỰ ÁN (BẮT BUỘC CHO 7 THÀNH VIÊN)
1. **Chuẩn hóa RESTful API:** Mọi phản hồi dùng format thống nhất:
   - Thành công: `{ success: true, message: "...", data: { ... } }`
   - Lỗi: `{ success: false, message: "..." }` kèm HTTP Status Code chuẩn (400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 409 Conflict).
2. **Kiến trúc Layered MVC + OOP Service:**
   - Mọi thao tác ghi dữ liệu nhiều bảng PHẢI đi qua Service OOP (`src/services/`) với atomic validation / transaction, không viết logic trực tiếp trong Controller.
   - Controllers kế thừa `BaseController` (`sendSuccess`, `sendError`, `handleError`).
   - Services kế thừa `BaseService`.
3. **Bảo mật & Phân quyền RBAC:**
   - 100% routes được bảo vệ qua middleware `requireAuth` và `requireRole([...])` theo 6 vai trò: `QuanLy`, `ThuKho`, `BanHang`, `ThuNgan`, `KeToan`, `KyThuat`.
4. **Quản lý theo IMEI:** Mỗi máy điện thoại là 1 thực thể độc lập trong `MAY_IMEI` với trạng thái riêng (`Con hang`, `Da ban`, `Bao hanh`, `Loi`), không quản lý theo số lượng gộp.
5. **Quy trình Kiểm thử QA Chặt chẽ (Lê Việt Anh phụ trách):**
   - Mọi Pull Request trước khi merge vào `main` bắt buộc phải vượt qua 100% các bộ Test Suite tự động.
   - Luôn tuân thủ nguyên tắc: `git commit` $\rightarrow$ `git pull origin main` $\rightarrow$ `npm test` $\rightarrow$ `git push`.

---

## II. TỔNG QUAN ROADMAP 8 TUẦN

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                 LỘ TRÌNH PHÁT TRIỂN 8 TUẦN                                       │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
 [Tuần 1-2] ĐÃ HOÀN THÀNH 100% ✅
   ├─ Scaffold MVC + 26 Mongoose Models (An)
   ├─ RBAC 6 Vai trò + CRUD Danh mục, Khách hàng, NCC, Phụ kiện
   ├─ Module Bán hàng POS + Xuất kho theo IMEI (Tuấn)
   ├─ Module Tra cứu IMEI & Tiếp nhận/Hoàn tất Bảo hành (Tuấn)
   └─ Khung UI Bootstrap + POS Bán hàng + Tra cứu BH (Vũ)

 [Tuần 3] ĐÃ HOÀN THÀNH 100% ✅
   ├─ Module Nhập kho máy IMEI & Phụ kiện [ĐÃ MERGE] (Tuân)
   ├─ Module Đặt hàng trước Pre-order & Cọc [ĐÃ MERGE] (Việt)
   ├─ Hàm tồn kho dùng chung + Nền tảng Công nợ Đa hình [ĐÃ MERGE] (An)
   ├─ Module Sổ quỹ Thu - Chi Dùng chung [ĐÃ MERGE] (Vượng)
   ├─ UI Redesign & Animation Pack toàn diện [ĐÃ MERGE] (Vũ)
   └─ Nạp Seed Data mô phỏng thực tế đa kho hàng (An + Cả nhóm)

 [Tuần 4] ĐANG TRIỂN KHAI ⏳ (Nghiệp vụ Nâng cao & Thiết lập QA Tester)
   ├─ Module Bán hàng POS liên kết Sổ quỹ/Công nợ & Tra cứu đổi trả [ĐÃ XONG 100%] (Tuấn)
   ├─ Module Đổi trả máy IMEI + Cấn trừ cọc Đơn đặt trước [ĐÃ XONG 100%] (Việt)
   ├─ Quản lý NCC & Nhập kho hàng loạt từ text/file (Tuân)
   ├─ Phân hệ Kiểm kê kho & Điều chỉnh lệch IMEI thực tế (Vượng)
   ├─ Đối soát chi tiết & Cảnh báo Công nợ quá hạn [ĐÃ XONG 100%] (An)
   ├─ Màn hình Đổi trả & Kiểm kê kho (Vũ)
   └─ Thiết lập Master Test Matrix, Rà soát 8 Test Suites & Test E2E liên module (Việt Anh - QA)

 [Tuần 5] Tài chính, Trả góp & Báo cáo Dashboard
   ├─ Module Hợp đồng Trả góp & Lịch thu kỳ hạn theo tháng (An)
   ├─ Báo cáo Doanh thu, Chi phí, Top SP, Tồn kho lâu ngày (Vượng)
   ├─ Tích hợp Chart.js vẽ biểu đồ Dashboard (Vũ + Vượng)
   ├─ Xử lý các tình huống biên (Edge Cases) sau bán hàng (Tuân, Việt, Tuấn)
   └─ QA Test Suite chuyên sâu: Trả góp, Báo cáo & Boundary Testing (Việt Anh - QA)

 [Tuần 6] Tích hợp Toàn diện (E2E) & Chuẩn Hóa Mẫu In (@media print)
   ├─ Nối 100% API Backend vào Frontend cho toàn bộ các trang web (Vũ + 5 Devs)
   ├─ Chuẩn hóa Bộ 5 Mẫu In: Hóa đơn, Phiếu nhập, Phiếu BH, Phiếu đổi trả, HĐ Trả góp (Vũ)
   ├─ Tối ưu UX/UI, Toast thông báo, Modal xác nhận an toàn (Vũ)
   └─ QA UI Testing trên đa trình duyệt & Đánh giá chất lượng in ấn (Việt Anh - QA)

 [Tuần 7] Stress Test, Concurrency Lock & Tối ưu Bảo mật RBAC
   ├─ Stress test dữ liệu lớn (1.000+ máy IMEI) (Việt Anh - QA + Cả nhóm)
   ├─ Concurrency Race Condition Lock: Chặn bán đúp đồng thời 1 IMEI (Việt Anh - QA)
   ├─ Rà soát ma trận bảo mật 6 Actor (RBAC Security Audit) & Fix bugs (Việt Anh - QA)
   └─ Tối ưu tốc độ truy vấn Mongoose Indexing (Cả nhóm)

 [Tuần 8] Báo cáo QA, Diễn tập Demo Phân Vai & Nghiệm thu Bảo vệ Đồ án 🏁
   ├─ Xuất Báo cáo Đánh giá Chất lượng Phần mềm (QA Test Report) 100% Pass (Việt Anh - QA)
   ├─ Soạn kịch bản Demo phân vai chi tiết từng thành viên & Diễn tập bảo vệ (Cả nhóm)
   ├─ Nạp seed data trực quan phục vụ buổi thuyết trình (Cả nhóm)
   └─ Đóng gói mã nguồn & Hoàn thiện tài liệu bàn giao đồ án (Cả nhóm)
```

---

## III. PHÂN CÔNG CHI TIẾT THEO TỪNG THÀNH VIÊN (7 THÀNH VIÊN)

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

#### Tuần 3-4: Tích hợp Cấn trừ Cọc & Mở rộng Nghiệp vụ Bán hàng POS [ĐÃ HOÀN THÀNH 100%]
- [x] Mở rộng `HoaDonService.taoHoaDonBanHang()`: Tiếp nhận tham số `donDatHangId` từ bạn Việt để tự động cấn trừ số tiền cọc đã thu vào tổng thanh toán hóa đơn.
- [x] Tối ưu hóa xử lý concurrency & atomic lock khi nhiều giao dịch cùng thao tác trên 1 IMEI (chặn xung đột 409 Conflict).
- [x] Bổ sung API `GET /api/hoa-don/dat-truoc/tim-kiem` và giao diện chọn đơn đặt trước cấn trừ cọc trên POS bán hàng.
- [x] Tích hợp liên Service: Bán hàng tự động gọi `ThanhToanService.taoPhieuThu` sinh Phiếu Thu trong Sổ quỹ hoặc gọi `CongNoService.taoCongNo` tạo hồ sơ Công Nợ khi bán ghi nợ.
- [x] Tự động gọi `TonKhoService.capNhatTonKho` giảm tồn kho sản phẩm khi bán máy IMEI.
- [x] `GET /api/hoa-don/imei-kha-dung` — Danh sách máy IMEI khả dụng bán hàng POS.
- [x] `GET /api/hoa-don/kiem-tra-doi-tra/:imei` — Kiểm tra điều kiện đổi trả theo IMEI trong 30 ngày (hỗ trợ phân hệ Đổi trả của Việt).
- [x] `GET /api/hoa-don/thong-ke-nhanh` — Thống kê nhanh doanh thu và số lượng đơn hôm nay.
- [x] Đã kiểm thử 44/44 test cases PASS ([`tests/test_tuan_module.js`](tests/test_tuan_module.js)).

#### Tuần 5-6: Hỗ trợ tích hợp E2E & Tối ưu Luồng Bán hàng POS
- [ ] Phối hợp với Vũ hoàn thiện trải nghiệm POS bán hàng (phím tắt quét barcode IMEI, in nhanh hóa đơn).
- [ ] Phối hợp với Việt Anh (QA) kiểm thử luồng tích hợp: Đặt trước $\rightarrow$ Bán hàng $\rightarrow$ Bảo hành $\rightarrow$ Đổi trả.

#### Tuần 7-8: Stress Test, Diễn tập Demo & Đóng gói
- [ ] Chạy stress test bán hàng đồng thời nhiều IMEI cùng QA.
- [ ] Phụ trách phần demo luồng Bán hàng POS & Tra cứu Bảo hành trong buổi bảo vệ.

---

### 👤 THÀNH VIÊN 2 — PHẠM ĐĂNG TUÂN (Mua hàng & Nhập kho, Nhà cung cấp)

#### Tuần 1-2: Nền tảng Model & Chuẩn bị [ĐÃ HOÀN THÀNH]
- [x] Rà soát cấu trúc bảng `PhieuNhap`, `CT_PhieuNhap`, `NhaCungCap`, `PhieuChi`.
- [x] CRUD cơ bản đối tác Nhà cung cấp (`/api/nha-cung-cap`).

#### Tuần 3: Xây dựng API Nhập kho Cốt lõi [ĐÃ HOÀN THÀNH 100%]
- [x] Xây dựng `PhieuNhapService` kế thừa `BaseService`, `PhieuNhapController`, route `/api/phieu-nhap`.
- [x] `POST /api/phieu-nhap` — Tạo phiếu nhập, kiểm tra chặn trùng IMEI, tạo máy `Con hang`, tăng tồn phụ kiện, gọi `TonKhoService`, sinh `PhieuChi` hoặc ghi nợ `CongNo`.
- [x] `GET /api/phieu-nhap`, `GET /api/phieu-nhap/:id`.
- [x] Xây dựng giao diện Nhập kho `src/public/pages/nhap-kho/index.html` và `src/public/js/nhapkho.js`.
- [x] Viết bộ kiểm thử tự động 25/25 test cases PASS ([`tests/test_tuan_nhap_kho.js`](tests/test_tuan_nhap_kho.js)).

#### Tuần 4 [HIỆN TẠI]: Quản lý Nhà cung cấp nâng cao & Nhập hàng loạt
- [ ] `GET /api/nha-cung-cap/:id/lich-su-nhap` — Xem lịch sử các đợt nhập hàng theo NCC, tổng tiền, dư nợ.
- [ ] `POST /api/phieu-nhap/import-hang-loat` — Hỗ trợ nhập danh sách nhiều IMEI cùng lúc từ chuỗi text/danh sách dán nhanh.
- [ ] Bổ sung test tự động: Nhập lô nhiều máy $\rightarrow$ IMEI hiển thị đúng `Con hang`, chặn trùng IMEI 409.

#### Tuần 5: Xử lý Tình huống Biên & Trả hàng NCC
- [ ] `POST /api/phieu-nhap/tra-hang-ncc` — Trả lại máy lỗi cho NCC (đổi trạng thái IMEI, giảm công nợ NCC).
- [ ] Tinh chỉnh phân quyền: Chỉ `ThuKho`, `QuanLy` được nhập kho.

#### Tuần 6-8: Nối UI, Kiểm thử Tích hợp & Demo
- [ ] Nối API với màn hình Nhập kho của Vũ và nghiệm thu cùng Việt Anh (QA).
- [ ] Chuẩn bị kịch bản demo nhập lô máy mới vào hệ thống trong buổi bảo vệ.

---

### 👤 THÀNH VIÊN 3 — TRƯƠNG THẾ AN (Tồn kho, Công nợ, Trả góp)

#### Tuần 1-2: Xây dựng Schema 26 Models & Seed Data [ĐÃ HOÀN THÀNH 100%]
- [x] Khởi tạo trọn bộ 26 Mongoose Models trong `src/models/`.
- [x] Tạo seed script cơ bản (`src/seeds/seed.js`) 6 tài khoản mẫu theo 6 vai trò.

#### Tuần 3: Service Tồn kho Dùng chung & Nền tảng Công nợ [ĐÃ HOÀN THÀNH 100%]
- [x] Viết **hàm dùng chung** cập nhật tồn kho: `capNhatTonKho(maSP, maKho, delta)` export từ `TonKhoService` để Tuấn, Tuân, Việt cùng gọi.
- [x] `GET /api/kho/ton-kho?maKho=` — Thống kê tồn kho theo từng Model sản phẩm và kho hàng.
- [x] `GET /api/kho/phieu-xuat` — Danh sách phiếu xuất kho.
- [x] `GET /api/cong-no` — Danh sách công nợ (lọc theo `loaiDoiTuong`, `maKH`, `maNCC`, `trangThai`).
- [x] `GET /api/cong-no/:id` — Lấy chi tiết hồ sơ công nợ.
- [x] `POST /api/cong-no/:id/thanh-toan` — Thu nợ khách hàng / Trả nợ NCC (tự động gọi `ThanhToanService` sinh phiếu thu/chi và đổi trạng thái `Da tra het`).
- [x] Viết hàm validate đa hình cho `CONGNO`: nếu `LoaiDoiTuong = 'KhachHang'` thì bắt buộc có `khachHang` và `nhaCungCap = null`, ngược lại tương tự.
- [x] Xây dựng giao diện Quản lý Công nợ `src/public/pages/cong-no/index.html` và `src/public/js/congno.js`.
- [x] Viết bộ kiểm thử tự động 28/28 test cases PASS ([`tests/test_an_tuan3.js`](tests/test_an_tuan3.js)).

#### Tuần 4 [HIỆN TẠI]: Đối soát Công nợ & Quản lý Quá hạn [ĐÃ HOÀN THÀNH 100%]
- [x] `GET /api/cong-no/:id` — Xem chi tiết hồ sơ nợ kèm danh sách các Phiếu Thu / Phiếu Chi liên quan đã thanh toán (`lichSuThanhToan`).
- [x] Quản lý hạn thanh toán (`hanThanhToan`), chuyển trạng thái sang `Qua han` khi nợ vượt hạn cam kết và tự động quét cập nhật qua `POST /api/cong-no/kiem-tra-qua-han`.
- [x] `GET /api/cong-no/doi-soat` — Báo cáo thống kê đối soát công nợ tổng hợp Khách Hàng, Nhà Cung Cấp, nợ quá hạn và tổng dư nợ toàn hệ thống.
- [x] Viết bộ kiểm thử tự động 24/24 test cases PASS ([`tests/test_an_tuan4.js`](tests/test_an_tuan4.js)).

#### Tuần 5: Phân hệ Hợp đồng Trả góp
- [ ] `POST /api/tra-gop` — payload: `{ soHD, soTienTraTruoc, soKy }` (3/6/9/12 tháng).
  - Tính toán: `SoTienTraGop = (HOADON.TongTien - soTienTraTruoc) / soKy`.
- [ ] `GET /api/tra-gop/:id/lich-thu` — Sinh lịch thu định kỳ theo tháng dựa trên ngày lập hóa đơn.
- [ ] `POST /api/tra-gop/:id/thu-ky` — Thu tiền 1 kỳ (tự động gọi Service Vượng sinh `PhieuThu`).

#### Tuần 6-8: Nối UI, Kiểm thử Dữ liệu & Demo
- [ ] Nối API với giao diện Công nợ & Trả góp của Vũ.
- [ ] Phối hợp cùng Việt Anh (QA) kiểm thử đối soát tồn kho và tính toán trả góp 12 kỳ chính xác 100%.
- [ ] Demo luồng lập hợp đồng trả góp & đối soát công nợ khách hàng/NCC.

---

### 👤 THÀNH VIÊN 4 — NGUYỄN TUẤN VŨ (Frontend / UI / UX)

#### Tuần 1-2: Layout Tổng quan & POS Bán hàng [ĐÃ HOÀN THÀNH]
- [x] Xây dựng Layout Bootstrap 5 dùng chung: Navbar, Sidebar tự động ẩn/hiện menu theo `user.vaiTro`.
- [x] Màn hình Đăng nhập `src/public/login.html` có các nút chọn nhanh 6 tài khoản demo.
- [x] Màn hình Bán hàng POS `src/public/ban-hang/index.html` (quét IMEI, giỏ hàng, chọn KH, in HĐ).
- [x] Màn hình Tra cứu Bảo hành `src/public/bao-hanh/index.html` (timeline dòng đời máy).

#### Tuần 3: UI Redesign, Hoạt ảnh & Màn hình Nhập kho - Đặt trước [ĐÃ HOÀN THÀNH 100%]
- [x] **Nâng cấp Toàn diện UI/UX & Bộ Hoạt ảnh (UI Redesign & Animation Pack):**
  - Keyframe Animation mượt mà (`fadeInUp`, `slideDown`, `cardIn`, `bgFloat`, `logoSpin`...).
  - Tính năng Collapsible Sidebar trên Desktop + Mobile Responsive Sidebar với overlay.
  - Phân quyền giao diện đa tầng (Client-side RBAC & Route Guarding) cho 6 vai trò.
- [x] Màn hình Nhập kho (`src/public/pages/nhap-kho/index.html`) và Sổ quỹ (`src/public/pages/so-quy/index.html`).
- [x] Màn hình Quản lý Công nợ (`src/public/pages/cong-no/index.html`).

#### Tuần 4 [HIỆN TẠI]: Màn hình Đổi trả máy & Kiểm kê kho
- [x] `src/public/pages/doi-tra/index.html`: Giao diện tra cứu hóa đơn cũ, chọn IMEI mới cần đổi, tính toán chênh lệch thu thêm/hoàn lại (nối API của Việt).
- [ ] `src/public/pages/kiem-ke/index.html`: Giao diện quét danh sách IMEI thực tế để phát hiện thừa/thiếu (nối API của Vượng).

#### Tuần 5: Màn hình Trả góp & Tích hợp Biểu đồ Chart.js
- [ ] `src/public/pages/tra-gop/index.html`: Giao diện bảng tính trả góp, lịch thu kỳ trực quan.
- [ ] Tích hợp Chart.js trên trang chủ Dashboard (vẽ biểu đồ doanh thu theo ngày/tháng, top sản phẩm bán chạy).

#### Tuần 6: Bộ Mẫu In Chuẩn Hóa (@media print) & Hoàn thiện UX
- [ ] Hoàn thiện chuẩn in ấn `@media print` cho:
  1. Hóa đơn bán lẻ (khổ K80 / A5).
  2. Phiếu nhập kho (khổ A4).
  3. Phiếu bảo hành & Phiếu bàn giao sửa chữa.
  4. Phiếu đổi trả sản phẩm.
  5. Hợp đồng trả góp.
- [ ] Chuẩn hóa thông báo Toast, Modal xác nhận thao tác nguy hiểm (Xóa, Hủy đơn).

#### Tuần 7-8: Tối ưu UI Toàn diện & Hỗ trợ Diễn tập Demo
- [ ] Phối hợp cùng Việt Anh (QA) kiểm tra responsive trên mọi độ phân giải màn hình.
- [ ] Kiểm tra hiển thị menu và các nút bấm theo đúng 6 vai trò người dùng (không để lộ nút chức năng bị cấm).
- [ ] Đồng hành cùng nhóm trong các buổi diễn tập demo.

---

### 👤 THÀNH VIÊN 5 — ĐINH ĐỨC VƯỢNG (Thu - Chi, Sổ quỹ, Kiểm kê, Báo cáo)

#### Tuần 1-2: Nền tảng Model & Schema [ĐÃ HOÀN THÀNH]
- [x] Xác nhận các model `PhieuThu`, `PhieuChi`, `BienBanKiemKe`, `DieuChinhKho`.
- [x] CRUD cơ bản Danh mục (`/api/danh-muc`) & Phụ kiện (`/api/phu-kien`).

#### Tuần 3: Module Lõi Thu - Chi & Sổ quỹ Dùng chung [ĐÃ HOÀN THÀNH 100%]
- [x] Xây dựng `ThanhToanService` kế thừa `BaseService`, `ThanhToanController`, route `/api/thanh-toan`.
- [x] **Export 2 hàm dùng chung cho cả nhóm:**
  - `taoPhieuThu({ hoaDon, donDatHang, congNo, phieuDoiTra, soTien, hinhThuc, ghiChu, ngayThu, sessionUser })`
  - `taoPhieuChi({ phieuNhap, donDatHang, phieuDoiTra, maDT, soTien, hinhThuc, lyDo, ngayChi, sessionUser })`
- [x] `POST /api/thanh-toan/thu`, `POST /api/thanh-toan/chi`.
- [x] `GET /api/thanh-toan/so-quy?tuNgay=&denNgay=` — Tính tổng thu, tổng chi, số dư tồn quỹ theo khoảng thời gian và phân loại theo hình thức thanh toán.
- [x] Xây dựng giao diện Sổ Quỹ `src/public/pages/so-quy/index.html` và `src/public/js/soquy.js`.
- [x] Viết bộ kiểm thử tự động 37/37 test cases PASS ([`tests/test_vuong_module.js`](tests/test_vuong_module.js)).

#### Tuần 4 [HIỆN TẠI]: Phân hệ Kiểm kê kho & Xử lý Lệch IMEI
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
- [ ] Phối hợp cùng Việt Anh (QA) đối soát số liệu sổ quỹ luôn khớp 100% với Hóa đơn + Nhập kho + Trả góp + Đổi trả.
- [ ] Demo luồng Kiểm kê phát hiện IMEI thừa/thiếu và Báo cáo Dashboard.

---

### 👤 THÀNH VIÊN 6 — TÔ QUỐC VIỆT (Đổi trả & Đặt hàng trước)

#### Tuần 1-2: Khởi tạo & Tìm hiểu Kiến trúc [ĐÃ HOÀN THÀNH]
- [x] Nắm rõ cấu trúc Service Layer OOP và mô hình quản lý theo từng IMEI.
- [x] Tham gia xây dựng kiểm thử RBAC 403 Forbidden cho 6 vai trò.

#### Tuần 3: Phân hệ Đặt hàng trước (Pre-order) [ĐÃ HOÀN THÀNH 100%]
- [x] Xây dựng `DatTruocService` kế thừa `BaseService`, `DatTruocController`, route `/api/dat-truoc`.
- [x] `POST /api/dat-truoc` — Tạo đơn đặt trước, tự động gọi `taoPhieuThu` thu tiền cọc.
- [x] `GET /api/dat-truoc`, `GET /api/dat-truoc/:id`.
- [x] `PUT /api/dat-truoc/:id/huy` — Khách hủy đơn $\rightarrow$ tự động gọi `taoPhieuChi` hoàn cọc.
- [x] Viết bộ kiểm thử tự động 32/32 test cases PASS (`tests/test_viet_module.js`).

#### Tuần 4 [HIỆN TẠI]: Chuyển đổi Hóa đơn & Phân hệ Đổi trả máy (Trọng tâm) [ĐÃ HOÀN THÀNH 100%]
- [x] `PUT /api/dat-truoc/:id/chuyen-hoa-don` — Khách đến nhận máy $\rightarrow$ gọi `HoaDonService.taoHoaDonBanHang` cấn trừ cọc và xuất hóa đơn.
- [x] Xây dựng `DoiTraService` kế thừa `BaseService`, `DoiTraController`, route `/api/doi-tra`.
- [x] `POST /api/doi-tra` — Đổi máy (máy cũ $\rightarrow$ `Loi`, máy mới $\rightarrow$ `Da ban`, tính chênh lệch tiền thu/chi qua `ThanhToanService`) và Trả hàng hoàn tiền 100%.
- [x] `GET /api/doi-tra`, `GET /api/doi-tra/:id`, `GET /api/doi-tra/lich-su-imei/:imei`.
- [x] Xây dựng giao diện Đổi trả `src/public/pages/doi-tra/index.html` và `src/public/js/doitra.js`.
- [x] Viết bộ kiểm thử tự động 39/39 test cases PASS (`tests/test_viet_tuan4.js`).

#### Tuần 5: Hoàn thiện Tình huống Biên & Phân quyền
- [ ] Gắn middleware `requireRole(['QuanLy', 'BanHang', 'ThuNgan'])` cho các route Đổi trả & Đặt trước.
- [ ] Xử lý các tình huống biên: Đổi máy kèm phụ kiện phát sinh, hủy đổi trả nếu có sai sót.

#### Tuần 6-8: Nối UI, Kiểm thử Tự động & Demo
- [ ] Nối API với giao diện Đặt trước và Đổi trả của Vũ, nghiệm thu cùng Việt Anh (QA).
- [ ] Demo trực tiếp luồng Đặt cọc nhận máy và Đổi trả máy trong buổi nghiệm thu.

---

### 👤 THÀNH VIÊN 7 — LÊ VIỆT ANH (QA / Tester & Kiểm thử Tự động Chuyên sâu) *(MỚI THAM GIA TỪ TUẦN 4)*

#### Tuần 4 [HIỆN TẠI]: Thiết lập Quy trình QA & Master Test Matrix
- [x] Rà soát và đánh giá 8 bộ test suites hiện có của nhóm (`tests/`), xác nhận độ phủ 211+ test assertions PASS 100%.
- [ ] Xây dựng **Ma trận Kiểm thử Tổng thể (Master Test Matrix)** đối chiếu 26 Model Mongoose và hơn 35 REST API endpoints.
- [ ] Viết bộ test tích hợp luồng khép kín E2E (`tests/test_e2e_workflow.js`): Nhập kho (Tuân) $\rightarrow$ Đặt trước cọc (Việt) $\rightarrow$ Bán hàng POS cấn trừ cọc (Tuấn) $\rightarrow$ Đổi trả / Bảo hành $\rightarrow$ Sổ quỹ (Vượng) & Công nợ (An).
- [ ] Thiết lập kịch bản chạy test tập trung `npm run test:all` để kiểm thử toàn diện trước mỗi lần merge PR.

#### Tuần 5: Kiểm thử Phân hệ Tài chính, Trả góp & Báo cáo
- [ ] Viết bộ test kiểm thử phân hệ Hợp đồng Trả góp của An (`tests/test_qa_tra_gop.js`):
  1. Kiểm tra công thức chia kỳ hạn (3, 6, 9, 12 tháng), số tiền trả trước, số tiền góp mỗi tháng.
  2. Kiểm tra lịch thu kỳ hạn sinh theo ngày hóa đơn.
  3. Kiểm tra thu tiền kỳ hạn tự động sinh `PhieuThu` trong Sổ Quỹ và cập nhật dư nợ.
  4. Chặn thu tiền khi hợp đồng đã tất toán hoặc thu vượt số kỳ.
- [ ] Viết bộ test đối soát Báo cáo Doanh thu & Tồn kho của Vượng:
  1. Đối soát: $\text{Doanh thu báo cáo} = \sum \text{Hóa đơn bán} + \sum \text{Thu chênh lệch đổi trả}$.
  2. Đối soát: $\text{Số dư sổ quỹ} = \sum \text{Phiếu Thu} - \sum \text{Phiếu Chi}$.
  3. Kiểm tra danh sách máy tồn kho lâu ngày (> 60 ngày).
- [ ] Kiểm thử các tình huống biên (Boundary & Negative Tests): Nhập số tiền âm, nhập IMEI chứa ký tự đặc biệt, xuất linh kiện khi kho linh kiện bằng 0, đổi trả máy ngoài hạn 30 ngày.

#### Tuần 6: Kiểm thử Giao diện (UI Testing), Mẫu in & Trải nghiệm Người dùng
- [ ] Kiểm thử Responsive giao diện trên các kích thước màn hình: Desktop (1920x1080, 1366x768), Tablet (iPad 768px), Mobile (iPhone/Android < 576px).
- [ ] Kiểm tra in ấn thực tế `@media print` cho 5 loại biểu mẫu:
  1. Hóa đơn bán lẻ (khổ K80 & A5).
  2. Phiếu nhập kho (khổ A4).
  3. Phiếu tiếp nhận bảo hành & sửa chữa.
  4. Phiếu đổi trả sản phẩm.
  5. Hợp đồng mua hàng trả góp.
- [ ] Kiểm tra tính hoàn thiện của thông báo Toast và Modal xác nhận hành động nguy hiểm (Xóa, Hủy đơn).

#### Tuần 7: Stress Test (1.000+ IMEI), Concurrency Test & Ma trận Bảo mật RBAC
- [ ] Viết script **Stress Test** nạp 1.000+ máy IMEI vật lý và mô phỏng tải xử lý liên tục.
- [ ] Kiểm thử **Concurrency Race Condition**: Mô phỏng 20 phiên gửi request bán hàng đồng thời trên cùng 1 chiếc IMEI $\rightarrow$ xác nhận atomic lock chỉ cho phép 1 phiên thành công (19 phiên còn lại nhận 409 Conflict).
- [ ] Kiểm thử **Quét lỗ hổng phân quyền (RBAC Security Audit)**: Gọi chéo tất cả các API từ 6 tài khoản người dùng khác nhau $\rightarrow$ đảm bảo 100% các thao tác trái quyền đều bị chặn `403 Forbidden`.

#### Tuần 8: Báo cáo Đánh giá Chất lượng (QA Report) & Điều phối Demo
- [ ] Biên soạn tài liệu **Báo cáo Đánh giá Chất lượng Phần mềm (QA Test Report)** với biểu đồ tỷ lệ Test Coverage và danh sách 100% Test Cases PASS.
- [ ] Soạn **Checklist Kịch bản Diễn tập Demo** (Demo Script) từng bước cho 6 thành viên để báo cáo bảo vệ đồ án trước Hội đồng chấm thi.
- [ ] Đóng gói toàn bộ Test Artifacts và tài liệu kiểm thử bàn giao cho Giảng viên.

---

## IV. MA TRẬN PHỐI HỢP & ĐIỂM GIAO THOA (CẦN THỐNG NHẤT)

| Vấn đề nghiệp vụ | Ai liên quan | Nội dung thống nhất kỹ thuật |
|---|---|---|
| **Hàm cập nhật tồn kho dùng chung** | An, Tuân, Tuấn, Việt | An export `capNhatTonKho(maSP, maKho, delta)` từ `TonKhoService`. Tất cả thành viên gọi hàm này khi nhập hàng, bán hàng, đổi trả. |
| **Service Thu / Chi dùng chung** | Vượng, An, Tuân, Việt | Vượng export `taoPhieuThu()`, `taoPhieuChi()` từ `ThanhToanService`. Tuân (nhập kho), An (trả góp/công nợ), Việt (cọc/hoàn cọc/đổi trả) gọi lại. |
| **Cấn trừ tiền cọc khi bán máy** | Việt, Tuấn | Khi khách nhận máy đặt trước, Việt truyền `donDatHangId` sang `HoaDonService.taoHoaDonBanHang()` của Tuấn để trừ thẳng số tiền cọc vào hóa đơn bán. |
| **Xử lý chênh lệch giá khi Đổi trả** | Việt, Vượng | Việt so sánh `donGiaBan` máy mới vs máy cũ, tự động gọi `taoPhieuThu` (nếu bù tiền) hoặc `taoPhieuChi` (nếu hoàn tiền). |
| **Kiểm định & Nghiệm thu PR** | Việt Anh (QA) + 6 Devs | Mọi Pull Request trước khi merge vào `main` bắt buộc phải được Việt Anh chạy test độc lập và xác nhận 100% PASS. |
| **Mẫu in & Kết nối giao diện** | Vũ + 5 Devs + QA | Vũ dựng mock UI trước, các Dev cung cấp endpoint đúng định dạng JSON `{ success, data, message }`, Việt Anh kiểm thử tương thích hiển thị. |

---

## V. CHECKLIST ĐÁNH GIÁ NGHIỆM THU THEO TỪNG TUẦN

- [x] **Cuối Tuần 2:** Chạy được server, nạp seed 6 vai trò, Bán hàng POS và Tra cứu Bảo hành chạy mượt (26/26 tests PASS).
- [x] **Cuối Tuần 3:** Nhập kho thành công sinh IMEI `Con hang`, tạo đơn đặt trước sinh phiếu thu cọc, sổ quỹ cập nhật đúng số dư (122/122 tests PASS).
- [ ] **Cuối Tuần 4:** Đổi trả 1 máy chuyển đúng trạng thái 2 IMEI và tính chênh lệch tiền; cấn trừ cọc vào hóa đơn chuẩn; kiểm kê kho chỉ ra đúng IMEI lệch; QA thiết lập Master Test Matrix và Test E2E liên module (211+ tests PASS).
- [ ] **Cuối Tuần 5:** Hợp đồng trả góp sinh đúng lịch thu từng kỳ; Dashboard vẽ được biểu đồ doanh thu và top SP bán chạy; QA hoàn thành bộ test Trả góp & Báo cáo.
- [ ] **Cuối Tuần 6:** 100% màn hình giao diện kết nối API thật (không còn mock data); in đẹp mọi loại phiếu qua `@media print`; QA kiểm thử UI Responsive.
- [ ] **Cuối Tuần 7:** Bộ kiểm thử tự động toàn dự án PASS 100%; kiểm tra phân quyền 6 vai trò không có lỗ hổng 403; Stress test 1.000+ IMEI và Concurrency Lock hoạt động hoàn hảo.
- [ ] **Cuối Tuần 8:** Báo cáo QA Test Report đầy đủ; Kịch bản demo 5-7 phút trơn tru không lỗi; dữ liệu seed trực quan; sẵn sàng 100% bảo vệ đồ án xuất sắc.

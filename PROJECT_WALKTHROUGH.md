# PROJECT WALKTHROUGH — ONE TECH STORE
> **Tài liệu bàn giao kỹ thuật & kiến trúc toàn diện dành cho AI Agent và Developer tiếp nhận dự án.**
> **Kiến trúc hiện tại: Layered MVC + OOP Service & Controller Layer (Node.js / Express / Mongoose / Vanilla JS).**

---

## 1. TỔNG QUAN DỰ ÁN & BÀI TOÁN KINH DOANH

* **Tên dự án:** One Tech Store — Hệ thống Quản lý Bán hàng Chuỗi Cửa hàng Điện thoại.
* **Đặc thù nghiệp vụ cốt lõi:** **Quản lý hàng hóa theo từng số IMEI/Serial vật lý riêng biệt**. 
  - Với điện thoại/máy tính bảng: Không quản lý theo số lượng gộp. Mỗi chiếc máy là 1 bản ghi riêng trong CSDL gắn với 1 mã IMEI (15 ký tự), có giá nhập riêng, màu sắc, dung lượng và trạng thái độc lập (*Còn hàng, Đã bán, Bảo hành, Lỗi*).
  - Với phụ kiện (củ sạc, cáp, tai nghe...): Quản lý theo số lượng tồn kho (`soLuongTon`).
  - Mọi luồng giao dịch (Bán hàng -> Xuất kho -> Bảo hành -> Đổi trả) đều truy vết chính xác theo từng số IMEI.

---

## 2. KIẾN TRÚC KỸ THUẬT (LAYERED MVC & OOP ARCHITECTURE)

Hệ thống được tổ chức theo mô hình **Layered MVC kết hợp OOP Service Layer** (Decoupled Backend API & Static Frontend):

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        KIẾN TRÚC TỔNG THỂ HỆ THỐNG (LAYERED MVC + OOP)                 │
└────────────────────────────────────────────────────────────────────────────────────────┘

 [ CLIENT / BROWSER (VIEW) ]
       │
       ├─► 1. Static Web Pages: 100% HTML5 thuần + Bootstrap 5 + Bootstrap Icons (src/public/)
       │      - Dashboard, Bán hàng POS, Tra cứu & Bảo hành, Quản lý IMEI, Sản phẩm...
       │      - Tự động dựng layout (Sidebar, Navbar) theo vai trò qua js/layout.js
       │
       └─► 2. Client JS Modules: Gọi RESTful API qua Fetch API Wrapper (src/public/js/api.js)
              - js/banhang.js, js/baohanh.js, js/mayimei.js, js/sanpham.js...
       │
       ▼ HTTP Request (JSON / Cookie Session)
 [ EXPRESS SERVER ] (src/app.js & src/server.js)
       │
       ├─► Middlewares:
       │      - express.json(), express.urlencoded(), express-session
       │      - requireAuth, requireRole (RBAC 6 vai trò, trả về JSON 401/403)
       │
       ├─► RESTful API Routes: /api/... (src/routes/)
       │      - /api/auth, /api/dashboard, /api/hoa-don, /api/bao-hanh, /api/may-imei...
       │
       ├─► Controllers OOP (src/controllers/):
       │      - Kế thừa BaseController (chuẩn hóa sendSuccess, sendError, handleError)
       │      - HoaDonController, BaoHanhController, MayImeiController, SanPhamController...
       │
       ├─► Services OOP (src/services/):
       │      - Kế thừa BaseService (đóng gói toàn bộ Business Rules & Concurrency Validation)
       │      - HoaDonService, BaoHanhService, MayImeiService, SanPhamService...
       │
       └─► Mongoose ODM Models: src/models/ (26 Models CSDL)
              │
              ▼
       [ MONGODB DATABASE ] (mongodb://127.0.0.1:27017/onetech_store)
```

---

## 3. CẤU TRÚC THƯ MỤC DỰ ÁN (PROJECT STRUCTURE)

```
onetech/
├── .env.example                         # Mẫu cấu hình biến môi trường
├── package.json                         # Danh sách dependencies & scripts
├── brief-agent-one-tech-store.md        # Brief yêu cầu ban đầu của dự án
├── ke-hoach-lap-trinh-chi-tiet-v2.md    # Kế hoạch phân công 6 thành viên (chi tiết theo ngày)
├── one_tech_store_schema.sql            # Thiết kế CSDL 26 bảng chuẩn SQL
├── one_tech_store_mo_ta_bang.md         # Tài liệu mô tả chi tiết 26 bảng
├── one_tech_store_erd.dbml              # Sơ đồ quan hệ thực thể ERD
├── README.md                            # Hướng dẫn cài đặt & tài khoản demo
├── PROJECT_WALKTHROUGH.md               # Bản Walkthrough kỹ thuật (File này)
├── tests/                               # Bộ kiểm thử tự động
│   ├── test_tuan_module.js              # Kiểm thử 26 test cases luồng Bán hàng, IMEI, Bảo hành
│   └── test_http_endpoints.js           # Kiểm thử tích hợp HTTP API & RBAC 403 Forbidden
└── src/
    ├── server.js                        # Entry point khởi động HTTP Server (Port 3000)
    ├── app.js                           # Cấu hình Express, Middleware, Static & API Routes
    ├── config/
    │   └── db.js                        # Kết nối MongoDB qua Mongoose
    ├── models/                          # 26 Mongoose Models (Đầy đủ theo thiết kế)
    │   ├── NhanVien.js, KhachHang.js, NhaCungCap.js
    │   ├── DanhMuc.js, SanPham.js, MayImei.js, PhuKien.js, LinhKien.js
    │   ├── HoaDon.js, CT_HoaDon_May.js, CT_HoaDon_PhuKien.js, PhieuXuatKho.js
    │   ├── PhieuBaoHanh.js, CT_PBH_LinhKien.js, PhieuDoiTra.js
    │   ├── PhieuNhap.js, CT_PhieuNhap.js, PhieuChi.js
    │   ├── Kho.js, TonKho.js, BienBanKiemKe.js, DieuChinhKho.js
    │   ├── CongNo.js, PhieuThu.js, DonDatHangTruoc.js, HopDongTraGop.js
    │   └── index.js                     # Export tập trung 26 models
    ├── services/                        # [TẦNG OOP SERVICE] Đóng gói toàn bộ logic nghiệp vụ
    │   ├── BaseService.js               # Base Class (phân trang, tạo lỗi HTTP chuẩn)
    │   ├── HoaDonService.js             # Bán hàng theo IMEI, chống xung đột 409, xuất kho
    │   ├── BaoHanhService.js            # Tiếp nhận, tính hạn BH, tra cứu, xuất linh kiện, hoàn tất
    │   ├── MayImeiService.js            # Quản lý vòng đời máy IMEI (nhập lẻ / hàng loạt)
    │   ├── SanPhamService.js            # Quản lý Model máy & tính tồn kho tổng hợp
    │   ├── KhachHangService.js          # Quản lý khách hàng & lịch sử hóa đơn
    │   ├── NhanVienService.js           # Quản lý nhân viên, đổi mật khẩu, phân quyền
    │   ├── NhaCungCapService.js         # Quản lý nhà cung cấp
    │   ├── DanhMucService.js            # Quản lý danh mục sản phẩm
    │   ├── PhuKienService.js            # Quản lý phụ kiện & tồn kho số lượng
    │   ├── AuthService.js               # Xác thực đăng nhập & phiên làm việc
    │   ├── DashboardService.js          # Thống kê tổng hợp số liệu hệ thống
    │   └── index.js                     # Export tập hợp tất cả Services
    ├── controllers/                     # [TẦNG OOP CONTROLLER] Kế thừa BaseController
    │   ├── BaseController.js            # Base Class (sendSuccess, sendError, handleError)
    │   ├── authController.js            # POST /api/auth/login, logout, me
    │   ├── dashboardController.js       # GET /api/dashboard
    │   ├── hoaDonController.js          # GET /api/hoa-don, GET /:id, POST / (Bán hàng)
    │   ├── baoHanhController.js         # Tra cứu, tiếp nhận, xuất linh kiện, hoàn tất
    │   ├── mayImeiController.js         # CRUD máy IMEI
    │   ├── sanPhamController.js         # CRUD sản phẩm
    │   ├── khachHangController.js       # CRUD khách hàng
    │   ├── nhaCungCapController.js      # CRUD nhà cung cấp
    │   ├── nhanVienController.js        # CRUD nhân viên (chỉ Quản lý)
    │   ├── danhMucController.js         # CRUD danh mục
    │   └── phuKienController.js         # CRUD phụ kiện
    ├── routes/                          # Định tuyến REST API & Gắn RBAC Middleware
    │   ├── authRoutes.js, dashboardRoutes.js
    │   ├── hoaDonRoutes.js, baoHanhRoutes.js
    │   ├── sanPhamRoutes.js, mayImeiRoutes.js
    │   ├── khachHangRoutes.js, nhaCungCapRoutes.js
    │   ├── nhanVienRoutes.js, danhMucRoutes.js, phuKienRoutes.js
    │   └── index.js                     # Mount toàn bộ vào /api/...
    ├── middlewares/
    │   └── auth.js                      # requireAuth, requireRole (Trả JSON 401/403)
    ├── seeds/
    │   └── seed.js                      # Nạp dữ liệu mẫu 6 vai trò, SP, IMEI, HĐ, BH
    └── public/                          # Frontend tĩnh (100% HTML/CSS/JS thuần)
        ├── login.html                   # Đăng nhập (kèm nút chọn nhanh 6 vai trò)
        ├── index.html                   # Dashboard tổng quan
        ├── 404.html                     # Trang 404 Not Found
        ├── ban-hang/index.html          # Màn hình Bán hàng POS theo IMEI & Quản lý HĐ
        ├── bao-hanh/index.html          # Màn hình Tra cứu dòng đời IMEI & Quản lý BH
        ├── san-pham/                    # index.html, form.html, detail.html
        ├── may-imei/                    # index.html, form.html
        ├── khach-hang/                  # index.html, form.html
        ├── nha-cung-cap/                # index.html, form.html
        ├── nhan-vien/                   # index.html, form.html
        ├── danh-muc/                    # index.html
        ├── phu-kien/                    # index.html
        ├── css/style.css                # CSS giao diện
        └── js/                          # Client JS logic
            ├── api.js                   # Wrapper gọi API, toast notification, helper
            ├── layout.js                # Dựng Sidebar/Navbar & phân quyền Menu
            ├── banhang.js               # Logic POS bán hàng, giỏ hàng, in hóa đơn
            ├── baohanh.js               # Logic tra cứu IMEI, lập phiếu BH, xuất linh kiện
            ├── auth.js, dashboard.js, sanpham.js, mayimei.js...
```

---

## 4. BẢN ĐỒ CƠ SỞ DỮ LIỆU (26 MODELS CHIA THEO 6 PHÂN HỆ)

```
├── 1. Danh mục & Sản phẩm (Core Inventory)
│   ├── DanhMuc (tenDanhMuc)
│   ├── SanPham (tenMay, hang, giaBan, soThangBH, moTa, danhMuc -> DanhMuc)
│   ├── MayImei (imei [PK], giaNhap, trangThai ['Con hang'|'Da ban'|'Bao hanh'|'Loi'], mauSac, dungLuong, sanPham -> SanPham)
│   ├── PhuKien (tenPK, giaBan, soLuongTon, danhMuc -> DanhMuc)
│   ├── LinhKien (tenLK, donGia, soLuongTon)
│   ├── NhanVien (hoTen, sdt, vaiTro, tenDangNhap, matKhau, trangThai)
│   ├── KhachHang (hoTen, sdt, diaChi)
│   └── NhaCungCap (tenNCC, sdt, diaChi)
│
├── 2. Bán hàng & Trả góp (Sales & Orders)
│   ├── DonDatHangTruoc (khachHang, sanPham, imei, soTienCoc, hanLay, trangThai)
│   ├── HoaDon (soHD, khachHang, nhanVien, donDatHang, ngayLap, tongTien, trangThai, hanThanhToan)
│   ├── CT_HoaDon_May (hoaDon -> HoaDon, imei -> MayImei, donGiaBan) [SL luôn = 1]
│   ├── CT_HoaDon_PhuKien (hoaDon -> HoaDon, phuKien -> PhuKien, soLuong, donGiaBan)
│   └── HopDongTraGop (hoaDon, soTienTraGop, soKy, soTienMoiKy, ngayBatDau, trangThaiDuyet)
│
├── 3. Mua hàng & Chi phí (Purchasing)
│   ├── PhieuNhap (nhaCungCap, nhanVien, ngayNhap, tongTien, ghiChu)
│   ├── CT_PhieuNhap (phieuNhap, imei -> MayImei, donGiaNhap)
│   └── PhieuChi (phieuNhap, doiTuong, soTien, ngayChi, lyDo)
│
├── 4. Thanh toán & Công nợ (Finance)
│   ├── CongNo (loaiDoiTuong ['KhachHang'|'NhaCungCap'], khachHang, nhaCungCap, hoaDon, phieuNhap, soTienNo, soTienDaTra, trangThai)
│   └── PhieuThu (hoaDon, donDatHang, congNo, soTien, ngayThu, phuongThuc)
│
├── 5. Kho vận (Warehouse)
│   ├── Kho (tenKho, diaChi)
│   ├── TonKho (kho, sanPham, soLuong)
│   ├── PhieuXuatKho (hoaDon, kho, lyDoXuat, ngayXuat)
│   ├── BienBanKiemKe (kho, nhanVien, ngayKiemKe, ghiChu)
│   └── DieuChinhKho (bienBan, sanPham, soLuongLech, lyDo)
│
└── 6. Bảo hành & Đổi trả (Warranty & Returns)
    ├── PhieuBaoHanh (maPBH, imei -> MayImei, khachHang, nhanVien, moTaLoi, ngayTiepNhan, trangThai, ghiChu)
    ├── CT_PBH_LinhKien (phieuBaoHanh -> PhieuBaoHanh, linhKien -> LinhKien, soLuong, donGia)
    └── PhieuDoiTra (hoaDon, imeiCu, imeiMoi, lyDo, ngayDoiTra, trangThai)
```

---

## 5. MA TRẬN PHÂN QUYỀN 6 ACTOR (RBAC MATRIX)

Hệ thống hỗ trợ 6 vai trò người dùng được bảo vệ chặt chẽ tại tầng Middleware (`src/middlewares/auth.js`):

| Vai trò (Actor) | Demo Login | Quyền hạn trên API & Giao diện |
|---|---|---|
| **Quản lý** | `admin` / `admin123` | **Toàn quyền hệ thống**: Quản trị tài khoản nhân viên (`/api/nhan-vien`), phân quyền, quản lý toàn bộ phân hệ và quyền xóa (`DELETE`). |
| **Thủ kho** | `thukho` / `123456` | Thêm/Sửa Model sản phẩm, **Nhập máy IMEI** (đơn/hàng loạt), Quản lý Phụ kiện, Quản lý Nhà cung cấp. |
| **NV bán hàng** | `banhang` / `123456` | Xem sản phẩm, kiểm tra tồn kho IMEI còn hàng, Thêm/Sửa Khách hàng, **Bán hàng POS theo IMEI**, Lập hóa đơn, Tiếp nhận bảo hành. |
| **Thu ngân** | `thungan` / `123456` | Quản lý Khách hàng, xem bảng giá sản phẩm, Xem danh sách hóa đơn, Bán hàng POS. |
| **Kế toán** | `ketoan` / `123456` | Quản lý Nhà cung cấp, xem danh sách hóa đơn, đối soát giá nhập, Thu/Chi, Công nợ. |
| **Kỹ thuật** | `kythuat` / `123456` | **Tra cứu bảo hành theo IMEI**, Tiếp nhận bảo hành, **Xuất linh kiện thay thế**, Hoàn tất sửa chữa máy. |

---

## 6. DANH SÁCH RESTFUL API ENDPOINTS

Tất cả API trả về định dạng JSON thống nhất theo quy ước dự án:
```json
{ "success": true, "message": "Thông báo thành công", "data": { ... } }
```

### 6.1. Xác thực & Phiên làm việc (`/api/auth`)
* `POST /api/auth/login`: Nhận `{ tenDangNhap, matKhau }` -> Lưu session, trả về thông tin user.
* `POST /api/auth/logout`: Hủy session, xóa cookie.
* `GET /api/auth/me`: Trả về thông tin tài khoản đang đăng nhập (hoặc `401 Unauthorized`).

### 6.2. Bảng điều khiển (`/api/dashboard`)
* `GET /api/dashboard`: Trả về số liệu thống kê tổng hợp (`totalMayImei`, `imeiConHang`, `imeiDaBan`, `imeiBaoHanh`, `totalSanPham`, `totalKhachHang`, `totalHoaDon`, `totalPhieuBaoHanh`) + danh sách máy và model mới nhất.

### 6.3. Bán hàng & Hóa đơn (`/api/hoa-don`) — *Module Nguyễn Quang Tuấn*
* `GET /api/hoa-don`: Lấy danh sách hóa đơn (hỗ trợ lọc `tuNgay`, `denNgay`, `maKH`, `trangThai`, `search`, phân trang).
* `GET /api/hoa-don/:id`: Chi tiết 1 hóa đơn kèm danh sách máy IMEI, danh sách phụ kiện, thông tin phiếu xuất kho.
* `POST /api/hoa-don`: **Bán hàng theo danh sách IMEI & phụ kiện**:
  - Khóa & kiểm tra trạng thái IMEI: Nếu có bất kỳ máy nào không ở trạng thái `Con hang` $\rightarrow$ ném lỗi **`409 Conflict`**.
  - Kiểm tra tồn kho phụ kiện $\rightarrow$ ném lỗi nếu không đủ hàng.
  - Tạo `HoaDon`, tạo `CT_HoaDon_May`, `CT_HoaDon_PhuKien`.
  - Cập nhật `MayImei.trangThai = 'Da ban'`.
  - Trừ số lượng tồn phụ kiện.
  - Tự động sinh `PhieuXuatKho`.

### 6.4. Dịch vụ & Bảo hành theo IMEI (`/api/bao-hanh`) — *Module Nguyễn Quang Tuấn*
* `GET /api/bao-hanh/tra-cuu/:imei`: **Tra cứu dòng đời IMEI**: Trả về ngày nhập kho, ngày bán, hạn bảo hành (`NgayBan + SoThangBH tháng`), số ngày còn lại, và lịch sử tất cả các lần bảo hành cùng linh kiện đã thay.
* `GET /api/bao-hanh`: Danh sách phiếu bảo hành (lọc theo `trangThai`, `imei`, `search`, `tuNgay`, `denNgay`).
* `GET /api/bao-hanh/:id`: Chi tiết 1 phiếu bảo hành và danh sách linh kiện đã xuất.
* `POST /api/bao-hanh`: **Tiếp nhận bảo hành**:
  - Kiểm tra máy đã từng bán qua `CT_HoaDon_May` (chặn nếu chưa bán).
  - Kiểm tra hạn bảo hành (chặn nếu đã quá hạn BH).
  - Tạo `PhieuBaoHanh` (`trangThai = 'Dang xu ly'`).
  - Cập nhật `MayImei.trangThai = 'Bao hanh'`.
* `POST /api/bao-hanh/:id/linh-kien`: **Xuất linh kiện thay thế**: Tạo `CT_PBH_LinhKien` và trừ tồn kho `LinhKien.soLuongTon`.
* `PUT /api/bao-hanh/:id/hoan-tat`: **Hoàn tất sửa chữa**: Đổi trạng thái phiếu sang `Da sua xong`, khôi phục `MayImei.trangThai = 'Da ban'` (đã trả khách).

### 6.5. Quản lý Máy IMEI (`/api/may-imei`)
* `GET /api/may-imei`: Lấy danh sách IMEI (hỗ trợ query `search`, `sanPhamId`, `trangThai`).
* `GET /api/may-imei/:imei`: Chi tiết 1 máy theo IMEI.
* `POST /api/may-imei`: Nhập máy IMEI mới (nhập lẻ qua `singleImei` hoặc **nhập hàng loạt** qua `imeiList`, tự động lọc trùng).
* `PUT /api/may-imei/:imei`: Cập nhật thông tin/trạng thái máy.
* `DELETE /api/may-imei/:imei`: Xóa máy (chặn xóa nếu máy có trạng thái `Da ban`).

### 6.6. Sản phẩm, Phụ kiện & Đối tác
* `/api/san-pham`: `GET`, `GET /:id`, `POST`, `PUT`, `DELETE` Model sản phẩm (kèm tính tồn kho tự động).
* `/api/phu-kien`: `GET`, `GET /:id`, `POST`, `PUT`, `DELETE` phụ kiện.
* `/api/danh-muc`: `GET`, `GET /:id`, `POST`, `PUT`, `DELETE` danh mục.
* `/api/khach-hang`: `GET`, `GET /:id`, `POST`, `PUT`, `DELETE` khách hàng.
* `/api/nha-cung-cap`: `GET`, `GET /:id`, `POST`, `PUT`, `DELETE` nhà cung cấp.
* `/api/nhan-vien`: `GET`, `GET /:id`, `POST`, `PUT`, `DELETE` nhân viên (Chỉ role `Quản lý`).

---

## 7. HƯỚNG DẪN DÀNH CHO CÁC THÀNH VIÊN KHI CODE MODULE MỚI

Khi bạn (hoặc thành viên khác) tiếp tục triển khai các module tiếp theo (nhập kho của Tuân, công nợ/trả góp của An, thu chi/kiểm kê của Vượng), hãy tuân thủ kiến trúc OOP phân tầng như sau:

### Bước 1: Tạo Service Class (`src/services/`)
* Kế thừa `BaseService`, đóng gói toàn bộ business rules:
  ```javascript
  const BaseService = require('./BaseService');
  const { PhieuNhap, MayImei, CT_PhieuNhap } = require('../models');

  class PhieuNhapService extends BaseService {
    constructor() {
      super(PhieuNhap);
    }

    async taoPhieuNhap(payload, sessionUser) {
      // Validate, kiểm tra trùng IMEI -> 409
      // Tạo PhieuNhap, tạo MayImei, tạo CT_PhieuNhap
      // Gọi service cập nhật tồn kho dùng chung
    }
  }

  module.exports = new PhieuNhapService();
  ```

### Bước 2: Tạo Controller Class (`src/controllers/`)
* Kế thừa `BaseController`, sử dụng `this.sendSuccess`, `this.sendError`, `this.handleError`:
  ```javascript
  const BaseController = require('./BaseController');
  const { PhieuNhapService } = require('../services');

  class PhieuNhapController extends BaseController {
    constructor() {
      super();
      this.create = this.create.bind(this);
    }

    async create(req, res) {
      try {
        const result = await PhieuNhapService.taoPhieuNhap(req.body, req.session.user);
        return this.sendSuccess(res, result, 'Tạo phiếu nhập thành công', 201);
      } catch (error) {
        return this.handleError(res, error, 'Lỗi khi nhập kho');
      }
    }
  }

  module.exports = new PhieuNhapController();
  ```

### Bước 3: Tạo Route & Gắn Middleware RBAC (`src/routes/`)
* Tạo route và sử dụng `requireAuth`, `requireRole(...)`.
* Mount route vào `src/routes/index.js`.

---

## 8. HƯỚNG DẪN KHỞI CHẠY & KIỂM THỬ

1. **Cài đặt thư viện:**
   ```bash
   npm install
   ```
2. **Nạp dữ liệu mẫu (Seed Data):**
   ```bash
   npm run seed
   ```
3. **Chạy kiểm thử tự động toàn bộ module:**
   ```bash
   node tests/test_tuan_module.js
   node tests/test_http_endpoints.js
   ```
4. **Chạy server phát triển:**
   ```bash
   npm run dev
   ```
5. **Truy cập ứng dụng:**
   - URL: `http://localhost:3000` (hoặc `http://localhost:3000/login.html`)
   - Bán hàng POS: `http://localhost:3000/ban-hang/`
   - Tra cứu & Bảo hành: `http://localhost:3000/bao-hanh/`

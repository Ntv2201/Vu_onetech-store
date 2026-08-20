# PROJECT WALKTHROUGH — ONE TECH STORE
> **Tài liệu bàn giao kỹ thuật & kiến trúc toàn diện dành cho AI Agent và Developer tiếp nhận dự án.**

---

## 1. TỔNG QUAN DỰ ÁN & BÀI TOÁN KINH DOANH

* **Tên dự án:** One Tech Store — Hệ thống Quản lý Bán hàng Chuỗi Cửa hàng Điện thoại.
* **Đặc thù nghiệp vụ cốt lõi:** **Quản lý hàng hóa theo từng số IMEI/Serial vật lý riêng biệt**. 
  - Với điện thoại/máy tính bảng: Không quản lý theo số lượng gộp. Mỗi chiếc máy là 1 bản ghi riêng trong CSDL gắn với 1 mã IMEI (15 ký tự), có giá nhập riêng, màu sắc, dung lượng và trạng thái độc lập (*Còn hàng, Đã bán, Bảo hành, Lỗi*).
  - Với phụ kiện (củ sạc, cáp, tai nghe...): Quản lý theo số lượng tồn kho (`soLuongTon`).
  - Mọi luồng giao dịch (Bán hàng -> Xuất kho -> Bảo hành -> Đổi trả) đều truy vết chính xác theo từng số IMEI.

---

## 2. KIẾN TRÚC KỸ THUẬT (SYSTEM ARCHITECTURE)

Hệ thống được xây dựng theo mô hình **Decoupled Architecture (Tách biệt hoàn toàn Backend API và Frontend tĩnh)**:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                               KIẾN TRÚC TỔNG THỂ HỆ THỐNG                              │
└────────────────────────────────────────────────────────────────────────────────────────┘

 [ CLIENT / BROWSER ]
       │
       ├─► 1. Static Web Pages: 100% HTML5 thuần + Bootstrap 5 + Bootstrap Icons (src/public/)
       │      - Nhận layout chung (Sidebar, Header) tự động qua js/layout.js
       │      - Không sử dụng template engine máy chủ (đã loại bỏ EJS)
       │
       └─► 2. Client JS Modules: Gọi RESTful API qua Fetch API Wrapper (src/public/js/api.js)
              - Xử lý DOM, render bảng, form modal, toast notification
       │
       ▼ HTTP Request (JSON / Cookie Session)
 [ BACKEND / EXPRESS SERVER ] (src/app.js & src/server.js)
       │
       ├─► Middlewares:
       │      - express.json(), express.urlencoded()
       │      - express-session (Stateful session quản lý phiên đăng nhập)
       │      - requireAuth, requireRole (RBAC 6 vai trò, trả về JSON 401/403)
       │
       ├─► RESTful API Routes: /api/... (src/routes/)
       │      - /api/auth, /api/dashboard, /api/san-pham, /api/may-imei, ...
       │
       ├─► Controllers: src/controllers/
       │      - 100% Controller CHỈ xử lý logic và trả về JSON: { success: true/false, ... }
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
├── .env.example                     # Mẫu cấu hình biến môi trường
├── package.json                     # Danh sách dependencies & scripts
├── brief-agent-one-tech-store.md    # Brief yêu cầu ban đầu của dự án
├── ke-hoach-lap-trinh-one-tech-store.md # Kế hoạch phân công 6 thành viên
├── one_tech_store_schema.sql        # Thiết kế CSDL 26 bảng chuẩn SQL
├── one_tech_store_mo_ta_bang.md     # Tài liệu mô tả chi tiết 26 bảng
├── one_tech_store_erd.dbml          # Sơ đồ quan hệ thực thể ERD
├── README.md                        # Hướng dẫn cài đặt & tài khoản demo
├── PROJECT_WALKTHROUGH.md           # Bản Walkthrough kỹ thuật (File này)
└── src/
    ├── server.js                    # Entry point khởi động HTTP Server (Port 3000)
    ├── app.js                       # Cấu hình Express, Middleware, Static & API Routes
    ├── config/
    │   └── db.js                    # Kết nối MongoDB qua Mongoose
    ├── models/                      # 26 Mongoose Models (Đầy đủ theo thiết kế)
    │   ├── NhanVien.js              # Nhân viên, phân quyền, hash mật khẩu bcrypt
    │   ├── SanPham.js               # Model máy (kèm soThangBH)
    │   ├── MayImei.js               # Từng máy vật lý theo IMEI
    │   ├── DanhMuc.js, PhuKien.js, LinhKien.js
    │   ├── KhachHang.js, NhaCungCap.js
    │   ├── HoaDon.js, CT_HoaDon_May.js, CT_HoaDon_PhuKien.js
    │   ├── PhieuNhap.js, CT_PhieuNhap.js, PhieuChi.js
    │   ├── PhieuBaoHanh.js, CT_PBH_LinhKien.js, PhieuDoiTra.js
    │   ├── Kho.js, TonKho.js, PhieuXuatKho.js, BienBanKiemKe.js, DieuChinhKho.js
    │   ├── CongNo.js, PhieuThu.js, DonDatHangTruoc.js, HopDongTraGop.js
    │   └── index.js                 # Export tập trung 26 models
    ├── middlewares/
    │   └── auth.js                  # requireAuth, requireRole (Trả JSON 401/403)
    ├── controllers/                 # Bộ điều khiển RESTful API (Chỉ trả JSON)
    │   ├── authController.js        # POST /api/auth/login, POST /api/auth/logout, GET /api/auth/me
    │   ├── dashboardController.js   # GET /api/dashboard
    │   ├── sanPhamController.js     # CRUD /api/san-pham
    │   ├── mayImeiController.js     # CRUD /api/may-imei (nhập đơn / nhập hàng loạt)
    │   ├── khachHangController.js   # CRUD /api/khach-hang
    │   ├── nhaCungCapController.js  # CRUD /api/nha-cung-cap
    │   ├── nhanVienController.js    # CRUD /api/nhan-vien (chỉ Quản lý)
    │   ├── danhMucController.js     # CRUD /api/danh-muc
    │   └── phuKienController.js     # CRUD /api/phu-kien
    ├── routes/                      # Định tuyến REST API
    │   ├── authRoutes.js
    │   ├── dashboardRoutes.js
    │   ├── sanPhamRoutes.js
    │   ├── mayImeiRoutes.js
    │   ├── khachHangRoutes.js
    │   ├── nhaCungCapRoutes.js
    │   ├── nhanVienRoutes.js
    │   ├── danhMucRoutes.js
    │   ├── phuKienRoutes.js
    │   └── index.js                 # Mount toàn bộ vào /api/...
    └── public/                      # Frontend tĩnh (100% HTML/CSS/JS thuần)
        ├── login.html               # Trang đăng nhập (kèm nút demo 6 vai trò)
        ├── index.html               # Trang Dashboard tổng quan
        ├── 404.html                 # Trang 404
        ├── san-pham/                # index.html, form.html, detail.html
        ├── may-imei/                # index.html, form.html
        ├── khach-hang/              # index.html, form.html
        ├── nha-cung-cap/            # index.html, form.html
        ├── nhan-vien/               # index.html, form.html
        ├── danh-muc/                # index.html (dùng modal thêm/sửa)
        ├── phu-kien/                # index.html (dùng modal thêm/sửa)
        ├── css/
        │   └── style.css            # Toàn bộ CSS giao diện
        └── js/                      # Client JS logic
            ├── api.js               # Wrapper gọi fetch, toast notification, helper
            ├── layout.js            # Tự động nạp Sidebar/Navbar, phân quyền menu
            ├── auth.js              # Logic đăng nhập client
            ├── dashboard.js         # Logic nạp thống kê dashboard
            ├── sanpham.js           # Logic sản phẩm
            ├── mayimei.js           # Logic IMEI & nhập hàng loạt
            ├── khachhang.js         # Logic khách hàng
            ├── nhacungcap.js        # Logic nhà cung cấp
            ├── nhanvien.js          # Logic nhân viên & phân quyền
            ├── danhmuc.js           # Logic danh mục
            └── phukien.js           # Logic phụ kiện
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
│   ├── HoaDon (khachHang, nhanVien, donDatHang, ngayLap, tongTien, trangThai, hanThanhToan)
│   ├── CT_HoaDon_May (hoaDon, imei -> MayImei, donGiaBan) [SL luôn = 1]
│   ├── CT_HoaDon_PhuKien (hoaDon, phuKien -> PhuKien, soLuong, donGiaBan)
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
    ├── PhieuBaoHanh (imei -> MayImei, khachHang, nhanVien, moTaLoi, ngayTiepNhan, ngayHenTra, trangThai)
    ├── CT_PBH_LinhKien (phieuBaoHanh, linhKien -> LinhKien, soLuong, donGia)
    └── PhieuDoiTra (hoaDon, imeiCu, imeiMoi, lyDo, ngayDoiTra, trangThai)
```

---

## 5. MA TRẬN PHÂN QUYỀN 6 ACTOR (RBAC MATRIX)

Hệ thống hỗ trợ 6 vai trò người dùng được định nghĩa trong `src/middlewares/auth.js`:

| Vai trò (Actor) | Demo Login | Quyền hạn trên API & Giao diện |
|---|---|---|
| **Quản lý** | `admin` / `admin123` | **Toàn quyền hệ thống**: Quản trị tài khoản nhân viên (`/api/nhan-vien`), phân quyền, có quyền xóa (`DELETE`) trên tất cả các bảng. |
| **Thủ kho** | `thukho` / `123456` | Thêm/Sửa Model sản phẩm, **Nhập máy IMEI** (đơn/hàng loạt), Quản lý Phụ kiện, Quản lý Nhà cung cấp. |
| **NV bán hàng** | `banhang` / `123456` | Xem sản phẩm, kiểm tra tồn kho IMEI còn hàng, Thêm/Sửa Khách hàng, Lập hóa đơn bán hàng. |
| **Thu ngân** | `thungan` / `123456` | Quản lý Khách hàng, xem bảng giá sản phẩm, Thu tiền hóa đơn (`PhieuThu`). |
| **Kế toán** | `ketoan` / `123456` | Quản lý Nhà cung cấp, theo dõi giá nhập, Thu/Chi, Công nợ. |
| **Kỹ thuật** | `kythuat` / `123456` | Cập nhật trạng thái máy IMEI (*Bảo hành, Lỗi, Còn hàng*), Tiếp nhận bảo hành. |

---

## 6. DANH SÁCH RESTFUL API ENDPOINTS HIỆN CÓ

Tất cả API trả về định dạng JSON thống nhất:
```json
{ "success": true, "message": "Thông báo", "data": { ... } }
```

### 6.1. Xác thực & Phiên làm việc (`/api/auth`)
* `POST /api/auth/login`: Nhận `{ tenDangNhap, matKhau }` -> Lưu session, trả về thông tin user.
* `POST /api/auth/logout`: Hủy session, xóa cookie.
* `GET /api/auth/me`: Trả về thông tin tài khoản đang đăng nhập (hoặc `401 Unauthorized`).

### 6.2. Bảng điều khiển (`/api/dashboard`)
* `GET /api/dashboard`: Trả về các số liệu thống kê (`totalMayImei`, `imeiConHang`, `imeiDaBan`, `imeiBaoHanh`, `totalSanPham`, `totalKhachHang`, `totalNhaCungCap`, `totalNhanVien`) + 6 IMEI và 6 Model mới nhất.

### 6.3. Quản lý Sản phẩm (`/api/san-pham`)
* `GET /api/san-pham`: Lấy danh sách (hỗ trợ query `search`, `danhMucId`, `hang`) kèm số lượng máy tồn kho thực tế tính từ `MayImei`.
* `GET /api/san-pham/:id`: Chi tiết 1 sản phẩm kèm toàn bộ danh sách IMEI của model đó.
* `POST /api/san-pham`: Thêm model mới.
* `PUT /api/san-pham/:id`: Cập nhật thông tin model.
* `DELETE /api/san-pham/:id`: Xóa model (chặn xóa nếu model vẫn còn máy IMEI trong kho).

### 6.4. Quản lý Máy IMEI (`/api/may-imei`)
* `GET /api/may-imei`: Lấy danh sách IMEI (hỗ trợ query `search`, `sanPhamId`, `trangThai`).
* `GET /api/may-imei/:imei`: Chi tiết 1 máy theo IMEI.
* `POST /api/may-imei`: Nhập máy IMEI mới (Hỗ trợ nhập 1 máy qua `singleImei` hoặc **nhập hàng loạt** qua `imeiList`, tự động kiểm tra trùng lặp).
* `PUT /api/may-imei/:imei`: Cập nhật thông tin/trạng thái máy.
* `DELETE /api/may-imei/:imei`: Xóa máy (chặn xóa nếu máy có trạng thái `Da ban`).

### 6.5. Các Danh mục & Đối tác
* `/api/danh-muc`: `GET`, `POST`, `PUT`, `DELETE` danh mục sản phẩm.
* `/api/phu-kien`: `GET`, `POST`, `PUT`, `DELETE` phụ kiện (quản lý theo số lượng tồn `soLuongTon`).
* `/api/khach-hang`: `GET`, `POST`, `PUT`, `DELETE` khách hàng.
* `/api/nha-cung-cap`: `GET`, `POST`, `PUT`, `DELETE` nhà cung cấp.
* `/api/nhan-vien`: `GET`, `POST`, `PUT`, `DELETE` nhân viên (Chỉ role `Quản lý`).

---

## 7. HƯỚNG DẪN DÀNH CHO AGENT TIẾP THEO KHI CODE MODULE MỚI

Khi bạn (hoặc một Agent khác) được giao nhiệm vụ viết các tính năng tiếp theo (như **Bán hàng POS**, **Nhập kho**, **Bảo hành**), hãy tuân thủ nghiêm ngặt các bước chuẩn sau:

### Bước 1: Tạo Backend Controller (`src/controllers/`)
* Import Model từ `../models`.
* Controller **bắt buộc trả về JSON**:
  ```javascript
  const { HoaDon, CT_HoaDon_May, MayImei } = require('../models');

  const hoaDonController = {
    postCreate: async (req, res) => {
      try {
        const { khachHang, imeiList } = req.body;
        // Logic nghiệp vụ...
        return res.status(201).json({ success: true, message: 'Tạo hóa đơn thành công', data: newHD });
      } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
      }
    }
  };
  module.exports = hoaDonController;
  ```

### Bước 2: Tạo Route & Gắn Phân quyền (`src/routes/`)
* Tạo route và sử dụng `requireAuth`, `requireRole(...)`:
  ```javascript
  const express = require('express');
  const router = express.Router();
  const hoaDonController = require('../controllers/hoaDonController');
  const { requireAuth, requireRole } = require('../middlewares/auth');

  router.use(requireAuth);
  router.post('/', requireRole('Quản lý', 'NV bán hàng', 'Thu ngân'), hoaDonController.postCreate);
  module.exports = router;
  ```
* Mount route vào `src/routes/index.js`.

### Bước 3: Tạo Giao diện HTML thuần (`src/public/<module>/`)
* Tạo file `.html` tĩnh.
* Cấu trúc khung chuẩn:
  ```html
  <!DOCTYPE html>
  <html lang="vi">
  <head>
    <meta charset="UTF-8">
    <title>Tiêu đề trang</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
    <link rel="stylesheet" href="/css/style.css">
  </head>
  <body>
    <div class="app-wrapper">
      <div id="appSidebar"></div> <!-- layout.js sẽ tự inject sidebar -->
      <div class="app-main">
        <div id="appNavbar"></div> <!-- layout.js sẽ tự inject navbar -->
        <main class="page-container">
          <!-- Nội dung chính của trang ở đây -->
        </main>
      </div>
    </div>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
    <script src="/js/api.js"></script>
    <script src="/js/layout.js"></script>
    <script src="/js/<module>.js"></script>
  </body>
  </html>
  ```

### Bước 4: Tạo Client JS (`src/public/js/<module>.js`)
* Dùng `api.get()`, `api.post()`, `api.put()`, `api.delete()`.
* Dùng `showToast(message, 'success'|'danger')` để hiện thông báo.
* Dùng `formatCurrency(amount)` để hiển thị tiền VNĐ.

---

## 8. HƯỚNG DẪN KHỞI CHẠY & SEED DỮ LIỆU

1. **Cài đặt thư viện:**
   ```bash
   npm install
   ```
2. **Nạp dữ liệu mẫu (Seed Data):**
   ```bash
   npm run seed
   ```
3. **Chạy server phát triển:**
   ```bash
   npm run dev
   ```
4. **Truy cập:** `http://localhost:3000` (hoặc `http://localhost:3000/login.html`).

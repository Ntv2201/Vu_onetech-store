# ONE TECH STORE — HỆ THỐNG QUẢN LÝ BÁN HÀNG THEO IMEI

Dự án scaffold hệ thống quản lý bán hàng cho chuỗi cửa hàng điện thoại **One Tech Store**.  
Đặc thù cốt lõi: **Quản lý hàng hóa theo từng IMEI/Serial vật lý**, không gộp số lượng chung.

---

## 1. Tech Stack
- **Backend:** Node.js, Express.js
- **Database:** MongoDB (sử dụng Mongoose ODM) — mô hình hóa đầy đủ 26 bảng theo thiết kế
- **Frontend:** HTML5 / EJS Template + Bootstrap 5 + Vanilla JS + Bootstrap Icons
- **Auth & Phân quyền:** Session + Bcryptjs + Middleware phân quyền theo 6 vai trò (`Quản lý`, `Thủ kho`, `NV bán hàng`, `Thu ngân`, `Kế toán`, `Kỹ thuật`)

---

## 2. Hướng dẫn Cài đặt & Khởi chạy

### Bước 1: Cài đặt thư viện
```bash
npm install
```

### Bước 2: Cấu hình môi trường (.env)
Tạo file `.env` tại thư mục gốc (hoặc copy từ `.env.example`):
```env
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/onetech_store
SESSION_SECRET=onetech_secret_key_super_secure_2026
NODE_ENV=development
```

### Bước 3: Nạp dữ liệu mẫu (Seed Data)
Chạy script seed để tạo danh mục, sản phẩm, IMEI theo trạng thái và tài khoản cho 6 vai trò:
```bash
npm run seed
```

### Bước 4: Khởi động Server
- Chế độ phát triển (auto-reload):
  ```bash
  npm run dev
  ```
- Chế độ chạy thông thường:
  ```bash
  npm start
  ```

Truy cập hệ thống tại: **`http://localhost:3000`** (hoặc `http://localhost:3000/login`)

---

## 3. Danh sách Tài khoản Demo

| Vai trò | Tên đăng nhập | Mật khẩu | Quyền hạn chính |
|---|---|---|---|
| **Quản lý** | `admin` | `admin123` | Toàn quyền hệ thống, quản lý tài khoản nhân viên & phân quyền |
| **NV bán hàng** | `banhang` | `123456` | Xem sản phẩm, kiểm tra IMEI còn hàng, thêm khách hàng |
| **Thủ kho** | `thukho` | `123456` | Thêm model SP, nhập máy IMEI (đơn/hàng loạt), quản lý phụ kiện |
| **Thu ngân** | `thungan` | `123456` | Quản lý khách hàng, xem danh sách sản phẩm & giá bán |
| **Kế toán** | `ketoan` | `123456` | Quản lý nhà cung cấp, đối soát giá nhập |
| **Kỹ thuật** | `kythuat` | `123456` | Cập nhật trạng thái IMEI (Bảo hành, Lỗi...), tra cứu bảo hành |

*(Trên giao diện đăng nhập có các nút bấm để tự động điền nhanh tài khoản demo)*

---

## 4. Cấu trúc Thư mục

```
onetech/
├── .env.example                 # Mẫu cấu hình môi trường
├── package.json                 # Dependencies & scripts
├── brief-agent-one-tech-store.md# File brief yêu cầu dự án
├── one_tech_store_schema.sql    # Bản thiết kế SQL gốc
├── one_tech_store_mo_ta_bang.md # Mô tả 26 bảng
├── one_tech_store_erd.dbml      # Sơ đồ quan hệ ERD
├── README.md                    # Hướng dẫn dự án
└── src/
    ├── app.js                   # Cấu hình Express app, middlewares, static & views
    ├── server.js                # Điểm khởi động server & kết nối DB
    ├── config/
    │   └── db.js                # Kết nối MongoDB (Mongoose)
    ├── models/                  # Đầy đủ 26 Mongoose Models
    │   ├── NhanVien.js          # Model nhân viên & hash mật khẩu
    │   ├── SanPham.js           # Model sản phẩm (kèm soThangBH)
    │   ├── MayImei.js           # Model máy vật lý theo từng số IMEI
    │   ├── KhachHang.js
    │   ├── NhaCungCap.js
    │   ├── DanhMuc.js
    │   ├── PhuKien.js
    │   ├── LinhKien.js
    │   ├── HoaDon.js, CT_HoaDon_May.js, CT_HoaDon_PhuKien.js
    │   ├── PhieuNhap.js, CT_PhieuNhap.js, PhieuChi.js
    │   ├── PhieuBaoHanh.js, CT_PBH_LinhKien.js, PhieuDoiTra.js
    │   ├── Kho.js, TonKho.js, PhieuXuatKho.js, BienBanKiemKe.js, DieuChinhKho.js
    │   ├── CongNo.js, PhieuThu.js, DonDatHangTruoc.js, HopDongTraGop.js
    │   └── index.js             # Export tập trung 26 models
    ├── middlewares/
    │   └── auth.js              # requireAuth, requireRole, attachUser
    ├── controllers/             # Bộ điều khiển CRUD & logic
    │   ├── authController.js
    │   ├── dashboardController.js
    │   ├── sanPhamController.js
    │   ├── mayImeiController.js
    │   ├── khachHangController.js
    │   ├── nhaCungCapController.js
    │   ├── nhanVienController.js
    │   ├── danhMucController.js
    │   └── phuKienController.js
    ├── routes/                  # Định tuyến Express
    │   ├── authRoutes.js
    │   ├── dashboardRoutes.js
    │   ├── sanPhamRoutes.js
    │   ├── mayImeiRoutes.js
    │   ├── khachHangRoutes.js
    │   ├── nhaCungCapRoutes.js
    │   ├── nhanVienRoutes.js
    │   ├── danhMucRoutes.js
    │   ├── phuKienRoutes.js
    │   └── index.js
    ├── views/                   # Giao diện EJS + Bootstrap 5
    │   ├── layouts/main.ejs     # Layout chung với sidebar & navbar
    │   ├── auth/login.ejs       # Trang đăng nhập
    │   ├── dashboard/index.ejs  # Bảng điều khiển thống kê
    │   ├── sanpham/             # CRUD Sản phẩm & xem chi tiết IMEI
    │   ├── mayimei/             # CRUD IMEI & nhập hàng loạt
    │   ├── khachhang/           # CRUD Khách hàng
    │   ├── nhacungcap/          # CRUD Nhà cung cấp
    │   ├── nhanvien/            # CRUD Nhân viên & phân quyền
    │   ├── danhmuc/             # Quản lý Danh mục
    │   ├── phukien/             # Quản lý Phụ kiện
    │   └── errors/              # Trang lỗi 403, 404, 500
    ├── public/                  # Tài nguyên tĩnh
    │   ├── css/style.css        # CSS tùy biến giao diện
    │   └── js/main.js           # Client JS helpers
    └── seeds/
        └── seed.js              # Script khởi tạo dữ liệu mẫu
```

---

## 5. Hướng dẫn Nhóm phát triển tiếp các Module tiếp theo

Để bổ sung một tính năng mới (ví dụ: *Bán hàng - Hóa đơn*, *Nhập kho*, *Bảo hành*):
1. **Model:** Các model như `HoaDon`, `PhieuNhap`, `PhieuBaoHanh` đã được khai báo sẵn tại `src/models/`.
2. **Controller:** Tạo mới controller trong `src/controllers/` (tham khảo khuôn mẫu từ `sanPhamController.js` hoặc `mayImeiController.js`).
3. **Route:** Tạo route trong `src/routes/` và áp dụng `requireRole(...)` tương ứng theo vai trò.
4. **View:** Tạo thư mục view trong `src/views/` kế thừa layout chung `layouts/main.ejs`.

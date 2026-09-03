# ONE TECH STORE — HỆ THỐNG QUẢN LÝ BÁN HÀNG THEO TỪNG IMEI

Dự án hệ thống quản lý bán hàng cho chuỗi cửa hàng điện thoại **One Tech Store**.  
Đặc thù cốt lõi: **Quản lý hàng hóa theo từng IMEI/Serial vật lý riêng biệt**, truy vết chính xác từ Nhập kho $\rightarrow$ Đặt hàng trước $\rightarrow$ Bán hàng POS $\rightarrow$ Xuất kho $\rightarrow$ Tiếp nhận/Hoàn tất Bảo hành $\rightarrow$ Đổi trả máy $\rightarrow$ Hợp đồng Trả góp & Quản lý Công nợ.

---

## 1. Tech Stack & Kiến trúc Hệ thống (Layered MVC + OOP Service)

- **Backend:** Node.js, Express.js — **RESTful API thuần (trả JSON chuẩn hóa)**
- **Kiến trúc:** Layered MVC + OOP Service Layer (`src/services/` kế thừa `BaseService`, `src/controllers/` kế thừa `BaseController`)
- **Database:** MongoDB (sử dụng Mongoose ODM) — mô hình hóa đầy đủ 26 Models CSDL
- **Frontend:** **100% HTML5 thuần + Vanilla JS (Fetch API Wrapper) + Bootstrap 5 + Bootstrap Icons + CSS Animations** (Giao diện hiện đại, card glassmorphism, responsive drawer, lọc phân quyền tự động theo vai trò, biểu mẫu in ấn chuyên nghiệp khổ K80 / A5)
- **Auth & Phân quyền RBAC:** Session + Bcryptjs + Middleware phân quyền bảo vệ 6 vai trò: `Quản lý`, `Thủ kho`, `NV bán hàng`, `Thu ngân`, `Kế toán`, `Kỹ thuật`
- **Kiểm thử tự động:** Hơn 13 bộ test suites tự động phủ $100\%$ các luồng nghiệp vụ liên phòng ban, kiểm thử tình huống biên (Boundary Testing), cấn trừ cọc, đối soát Sổ quỹ & Công nợ, và phân quyền RBAC HTTP.

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
Chạy script seed để tạo danh mục, sản phẩm, máy IMEI theo trạng thái, khách hàng, nhà cung cấp và tài khoản cho 6 vai trò:
```bash
npm run seed
```

### Bước 4: Chạy kiểm thử tự động toàn bộ phân hệ
```bash
# 1. Kiểm thử module Bán hàng POS & Dịch vụ Bảo hành (Tuấn)
node tests/test_tuan_module.js
node tests/test_tuan_tuan5_6_e2e.js

# 2. Kiểm thử module Đặt trước, Đổi trả & E2E Workflow (Việt)
node tests/test_viet_module.js
node tests/test_viet_tuan4.js
node tests/test_viet_tuan5.js
node tests/test_viet_tuan6_e2e.js

# 3. Kiểm thử module Tồn kho dùng chung, Công nợ & Trả góp (An)
node tests/test_an_tuan3.js
node tests/test_an_tuan4.js
node tests/test_an_tuan5.js

# 4. Kiểm thử module Nhập kho máy IMEI & Phụ kiện (Tuân)
node tests/test_tuan_nhap_kho.js

# 5. Kiểm thử module Thu - Chi & Sổ quỹ dùng chung (Vượng)
node tests/test_vuong_module.js

# 6. Kiểm thử đăng nhập 6 vai trò & Ma trận phân quyền RBAC (QA)
node tests/verify_all_logins.js
node tests/test_http_endpoints.js
```

### Bước 5: Khởi động Server
- Chế độ phát triển (auto-reload):
  ```bash
  npm run dev
  ```
- Chế độ chạy thông thường:
  ```bash
  npm start
  ```

Truy cập hệ thống tại: **`http://localhost:3000`** (hoặc `http://localhost:3000/login.html`)

---

## 3. Danh sách Tài khoản Demo (6 Vai trò)

| Vai trò | Tên đăng nhập | Mật khẩu | Quyền hạn & Phân hệ được truy cập |
|---|---|---|---|
| **Quản lý** | `admin` | `admin123` | **Toàn quyền hệ thống**: Dashboard, POS Bán hàng, Đặt trước, Đổi trả (bao gồm quyền hủy phiếu), Hợp đồng Trả góp, Nhập kho, Thu - Chi & Sổ quỹ, Quản lý Công nợ & Đối soát, Bảo hành, Sản phẩm, Quản lý IMEI, Danh mục, Phụ kiện, KH, NCC, Nhân viên. |
| **NV bán hàng** | `banhang` | `123456` | Dashboard, Bán hàng POS & Hóa đơn, Đặt trước, Đổi trả máy, Lập HĐ Trả góp, Phiếu thu, Tra cứu & Tiếp nhận Bảo hành, Xem Sản phẩm, Khách hàng. |
| **Thủ kho** | `thukho` | `123456` | Dashboard, Nhập kho hàng hóa & IMEI, Xem Tồn kho & Phiếu xuất, Xem Sản phẩm, Quản lý máy IMEI, Danh mục, Phụ kiện, Nhà cung cấp. |
| **Thu ngân** | `thungan` | `123456` | Dashboard, Bán hàng POS & Hóa đơn, Đặt trước, Đổi trả, Thu tiền kỳ Trả góp, Thu - Chi & Sổ quỹ, Quản lý Công nợ, Xem bảng giá Sản phẩm, Quản lý Khách hàng. |
| **Kế toán** | `ketoan` | `123456` | Dashboard, Thu - Chi & Sổ quỹ, Quản lý Công nợ & Đối soát quá hạn, Quản lý Hợp đồng Trả góp & Thu tiền kỳ, Đặt trước, Tra cứu Phiếu nhập, Tra cứu Hóa đơn, Xem Sản phẩm, Phụ kiện, Khách hàng, Quản lý Nhà cung cấp. |
| **Kỹ thuật** | `kythuat` | `123456` | Dashboard, Tra cứu dòng đời IMEI, Tiếp nhận/Sửa chữa Bảo hành, Xuất linh kiện thay thế, Cập nhật trạng thái máy IMEI. |

*(Trên trang đăng nhập có các nút badge để tự động điền nhanh tài khoản demo 1-click).*

---

## 4. Cấu trúc Thư mục Dự án

```
onetech/
├── .env.example                         # Mẫu cấu hình môi trường
├── package.json                         # Dependencies & scripts
├── ke-hoach-lap-trinh-chi-tiet-v2.md    # Kế hoạch phân công 7 thành viên theo ngày (Lộ trình 8 tuần)
├── PROJECT_WALKTHROUGH.md               # Tài liệu bàn giao kỹ thuật & kiến trúc chi tiết
├── one_tech_store_schema.sql            # Bản thiết kế SQL gốc
├── one_tech_store_mo_ta_bang.md         # Mô tả 26 bảng CSDL
├── one_tech_store_erd.dbml              # Sơ đồ quan hệ ERD
├── README.md                            # Hướng dẫn dự án (File này)
├── tests/                               # Trọn bộ 13 test suites kiểm thử tự động
│   ├── test_tuan_module.js              # 44 tests Bán hàng POS, IMEI, Bảo hành
│   ├── test_tuan_tuan5_6_e2e.js         # 33 tests E2E tích hợp Bán hàng POS, Cọc, Bảo hành, KPI
│   ├── test_viet_module.js              # 32 tests Đặt hàng trước & Cọc (Tuần 3)
│   ├── test_viet_tuan4.js               # 39 tests Đổi trả máy & Cấn trừ cọc (Tuần 4)
│   ├── test_viet_tuan5.js               # 26 tests Tình huống biên & Hủy phiếu RBAC (Tuần 5)
│   ├── test_viet_tuan6_e2e.js           # 21 tests Kịch bản E2E toàn trình Đặt cọc -> POS -> Đổi trả (Tuần 6)
│   ├── test_an_tuan3.js                 # 28 tests Tồn kho dùng chung & Công nợ đa hình (Tuần 3)
│   ├── test_an_tuan4.js                 # 24 tests Đối soát công nợ & Quản lý quá hạn (Tuần 4)
│   ├── test_an_tuan5.js                 # 23 tests Hợp đồng Trả góp & Lịch thu kỳ (Tuần 5)
│   ├── test_tuan_nhap_kho.js            # 25 tests Nhập kho máy IMEI & Phụ kiện (Tuần 3)
│   ├── test_vuong_module.js             # 37 tests Thu - Chi & Báo cáo Sổ quỹ dùng chung (Tuần 3)
│   ├── test_http_endpoints.js           # Kiểm thử tích hợp HTTP API & RBAC 403 Forbidden
│   └── verify_all_logins.js             # Kiểm thử đăng nhập 6 vai trò
└── src/
    ├── app.js                           # Cấu hình Express App, REST API & Static Server
    ├── server.js                        # Điểm khởi động server & kết nối DB
    ├── config/
    │   └── db.js                        # Kết nối MongoDB (Mongoose)
    ├── models/                          # Đầy đủ 26 Mongoose Models
    │   ├── NhanVien.js, KhachHang.js, NhaCungCap.js
    │   ├── DanhMuc.js, SanPham.js, MayImei.js, PhuKien.js, LinhKien.js
    │   ├── HoaDon.js, CT_HoaDon_May.js, CT_HoaDon_PhuKien.js, PhieuXuatKho.js
    │   ├── PhieuBaoHanh.js, CT_PBH_LinhKien.js, PhieuDoiTra.js
    │   ├── PhieuNhap.js, CT_PhieuNhap.js, PhieuChi.js
    │   ├── Kho.js, TonKho.js, BienBanKiemKe.js, DieuChinhKho.js
    │   ├── CongNo.js, PhieuThu.js, DonDatHangTruoc.js, HopDongTraGop.js
    │   └── index.js                     # Export tập trung 26 models
    ├── services/                        # [TẦNG OOP SERVICE] Đóng gói toàn bộ logic nghiệp vụ
    │   ├── BaseService.js               # Base Service Class
    │   ├── HoaDonService.js             # Bán hàng POS, khóa IMEI, trừ kho, cấn trừ cọc
    │   ├── BaoHanhService.js            # Tra cứu dòng đời IMEI, tiếp nhận BH, xuất LK, hoàn tất
    │   ├── DatTruocService.js           # Đặt hàng trước, thu tiền cọc, hủy đơn hoàn cọc, gán IMEI
    │   ├── DoiTraService.js             # Đổi trả máy, đổi kèm phụ kiện, tính chênh lệch, hủy phiếu hoàn tác
    │   ├── TraGopService.js             # Lập HĐ trả góp, sinh lịch thu kỳ, thu tiền kỳ, tự sinh Phiếu Thu
    │   ├── CongNoService.js             # Công nợ đa hình, thanh toán nợ, đối soát & cảnh báo quá hạn
    │   ├── TonKhoService.js             # Hàm tồn kho dùng chung capNhatTonKho, thống kê tồn, phiếu xuất
    │   ├── PhieuNhapService.js          # Nhập kho máy IMEI & phụ kiện, tự tăng tồn, chi tiền/ghi nợ
    │   ├── ThanhToanService.js          # Sổ quỹ & Thu - Chi dùng chung (taoPhieuThu, taoPhieuChi)
    │   ├── MayImeiService.js            # Quản lý vòng đời máy IMEI (nhập lẻ / hàng loạt)
    │   ├── SanPhamService.js            # Quản lý Model sản phẩm & tính tồn kho
    │   ├── KhachHangService.js, NhanVienService.js, NhaCungCapService.js
    │   ├── DanhMucService.js, PhuKienService.js
    │   ├── AuthService.js, DashboardService.js
    │   └── index.js                     # Export tập hợp Services
    ├── controllers/                     # [TẦNG OOP CONTROLLER] Kế thừa BaseController
    │   ├── BaseController.js            # Base Controller Class (sendSuccess, sendError, handleError)
    │   ├── authController.js, dashboardController.js
    │   ├── hoaDonController.js, baoHanhController.js, datTruocController.js
    │   ├── doiTraController.js, TraGopController.js, congNoController.js
    │   ├── khoController.js, phieuNhapController.js, thanhToanController.js
    │   ├── sanPhamController.js, mayImeiController.js
    │   ├── khachHangController.js, nhaCungCapController.js
    │   ├── nhanVienController.js, danhMucController.js, phuKienController.js
    │   └── index.js
    ├── middlewares/
    │   └── auth.js                      # requireAuth, requireRole (Trả JSON 401/403)
    ├── routes/                          # Định tuyến REST API (/api/...)
    │   ├── authRoutes.js, dashboardRoutes.js
    │   ├── hoaDonRoutes.js, baoHanhRoutes.js, datTruocRoutes.js
    │   ├── doiTraRoutes.js, traGopRoutes.js, congNoRoutes.js
    │   ├── khoRoutes.js, phieuNhapRoutes.js, thanhToanRoutes.js
    │   ├── sanPhamRoutes.js, mayImeiRoutes.js
    │   ├── khachHangRoutes.js, nhaCungCapRoutes.js
    │   ├── nhanVienRoutes.js, danhMucRoutes.js, phuKienRoutes.js
    │   └── index.js
    └── public/                          # Giao diện Frontend (Tách bạch CSS, JS, HTML Pages)
        ├── css/                         # 🎨 TOÀN BỘ FILE STYLESHEET
        │   └── style.css                # CSS thiết kế giao diện, animations & theme
        ├── js/                          # ⚡ TOÀN BỘ FILE JAVASCRIPT CLIENT
        │   ├── api.js                   # Fetch API helper, toast notifications
        │   ├── layout.js                # Dựng sidebar/navbar, phân quyền menu & route guard
        │   ├── dashboard.js             # Hiệu ứng đếm số & thao tác nhanh Dashboard
        │   ├── banhang.js               # Logic POS bán hàng, giỏ hàng, in hóa đơn chuyên nghiệp
        │   ├── baohanh.js               # Logic tra cứu IMEI, lập phiếu BH, xuất linh kiện
        │   ├── dattruoc.js              # Logic Đặt trước (Pre-order), thu/hoàn cọc
        │   ├── doitra.js                # Logic Đổi trả máy, đổi kèm phụ kiện, in biên bản, hủy phiếu
        │   ├── congno.js                # Logic Quản lý Công nợ & Thanh toán nợ
        │   ├── nhapkho.js               # Logic Nhập kho máy IMEI & Phụ kiện
        │   ├── soquy.js                 # Logic Báo cáo Sổ quỹ & Quản lý Thu/Chi
        │   └── auth.js, sanpham.js, mayimei.js, khachhang.js, nhacungcap.js...
        └── pages/                       # 📄 TOÀN BỘ CÁC TRANG HTML GIAO DIỆN
            ├── index.html               # Trang Dashboard tổng quan
            ├── login.html               # Trang Đăng nhập hiện đại
            ├── 404.html                 # Trang 404 Not Found
            ├── ban-hang/index.html      # Màn hình Bán hàng POS & Hóa đơn
            ├── bao-hanh/index.html      # Màn hình Tra cứu & Bảo hành
            ├── dat-truoc/index.html     # Màn hình Quản lý Đơn đặt trước & Thu cọc
            ├── doi-tra/index.html       # Màn hình Quản lý Đổi trả máy & In biên bản
            ├── cong-no/index.html       # Màn hình Quản lý Công nợ & Đối soát
            ├── nhap-kho/index.html      # Màn hình Nhập kho hàng hóa & IMEI
            ├── so-quy/index.html        # Màn hình Sổ quỹ Thu - Chi
            ├── san-pham/                # Danh sách, form thêm/sửa, chi tiết SP
            ├── may-imei/                # Danh sách, form nhập lẻ & hàng loạt IMEI
            ├── khach-hang/              # Danh sách & form khách hàng
            ├── nha-cung-cap/            # Danh sách & form nhà cung cấp
            ├── nhan-vien/               # Danh sách & form nhân viên, phân quyền
            ├── danh-muc/                # Danh sách & modal danh mục
            └── phu-kien/                # Danh sách & modal phụ kiện
```

---

## 5. Hướng dẫn Phát triển & Tiếp nhận Module mới

Khi tiếp tục triển khai các module tiếp theo (Kiểm kê kho & Báo cáo Dashboard của Vượng, Mở rộng nhập kho của Tuân, Stress test của QA):
1. **Service Class (`src/services/`):** Kế thừa `BaseService`, đóng gói toàn bộ business rules, kiểm tra trạng thái IMEI và xử lý atomic transactions.
2. **Controller Class (`src/controllers/`):** Kế thừa `BaseController`, sử dụng `this.sendSuccess(res, data, message)` và `this.handleError(res, error)`.
3. **REST Routes (`src/routes/`):** Gắn middleware `requireAuth` và `requireRole([...])` bảo vệ quyền truy cập theo 6 vai trò.
4. **Frontend (`src/public/`):** Sử dụng `api.get()` / `api.post()` để gọi Backend API và tự động kế thừa layout/sidebar phân quyền từ `js/layout.js`.


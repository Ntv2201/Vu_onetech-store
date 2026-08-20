# BRIEF CHO AGENT — SCAFFOLD SƠ BỘ DỰ ÁN "ONE TECH STORE"

## 1. Tổng quan
Xây dựng hệ thống quản lý bán hàng cho chuỗi cửa hàng điện thoại "One Tech Store". Đặc thù: quản lý hàng hóa theo **từng IMEI/Serial**, không quản lý theo số lượng gộp.

## 2. Tech stack (đã chốt)
- Backend: **Node.js + Express**
- Database: **MySQL hoặc PostgreSQL** (theo ERD quan hệ, có FK)
- ORM: **Sequelize hoặc Prisma** (bắt buộc dùng ORM, không viết SQL tay — schema có 27 bảng nhiều khóa ngoại)
- Frontend: **HTML/CSS/JS thuần + Bootstrap** (không dùng framework SPA, giữ đơn giản)
- Auth: session/JWT + middleware phân quyền theo `NhanVien.VaiTro`

## 3. Việc cần agent làm sơ bộ (giai đoạn scaffold)
1. Khởi tạo project Node.js + Express, cấu trúc thư mục chuẩn (routes/controllers/models/middlewares/views hoặc public).
2. Cấu hình kết nối DB qua ORM, file `.env` cho connection string.
3. Dựng **migration cho toàn bộ schema** theo danh sách bảng ở mục 4 bên dưới (sẽ đính kèm ERD/DB design chi tiết riêng).
4. Viết seed data mẫu tối thiểu: vài NhanVien (đủ vai trò), vài SanPham kèm MAY_IMEI, vài NCC/KhachHang.
5. Dựng middleware auth + phân quyền cơ bản (login, check role theo route).
6. Dựng CRUD boilerplate (route + controller + view đơn giản) cho các bảng danh mục: SanPham, MAY_IMEI, NhaCungCap, KhachHang, NhanVien — dùng làm khuôn mẫu để nhóm tự nhân bản sang module khác.

**Chưa cần làm ở giai đoạn này** (để nhóm tự code theo phân công): luồng nghiệp vụ Bán hàng, Mua hàng/Nhập kho, Bảo hành, Công nợ/Trả góp, Báo cáo, OCR scan.

## 4. Ràng buộc quan trọng khi dựng schema
- Mỗi máy điện thoại là 1 bản ghi riêng trong `MAY_IMEI` (trạng thái: Còn hàng/Đã bán), không gộp số lượng.
- `SanPham` cần có cột lưu **số tháng bảo hành** để tính hạn bảo hành từ ngày bán.
- `PhieuNhapKho` cần hiển thị được tên sản phẩm (không chỉ mã SP).
- Không cần bảng/actor cho "bên thứ 3" (đối tác tài chính) — trả góp quản lý nội bộ.
- File DB design/ERD chi tiết (27 bảng) sẽ đính kèm riêng — agent dựa vào đó để sinh migration, không tự suy đoán cấu trúc bảng.

## 5. Định dạng bàn giao mong muốn
- Repo chạy được ngay bằng `npm install && npm run dev` (kèm hướng dẫn tạo `.env`).
- README ngắn: cấu trúc thư mục, cách chạy migration + seed, tài khoản demo để đăng nhập thử.

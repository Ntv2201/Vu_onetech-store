# BRIEF CHO AGENT — SCAFFOLD SƠ BỘ DỰ ÁN "ONE TECH STORE"
> **LƯU Ý:** Đây là tài liệu yêu cầu ban đầu (Day 1 Brief).  
> Hệ thống hiện tại đã hoàn thiện kiến trúc **Layered MVC + OOP Service Layer (Node.js, Express, MongoDB/Mongoose, Vanilla JS)**.  
> Chi tiết tài liệu kỹ thuật và kế hoạch thực hiện hiện hành vui lòng xem tại:
> - **[PROJECT_WALKTHROUGH.md](PROJECT_WALKTHROUGH.md)** — Tài liệu bàn giao kiến trúc kỹ thuật toàn diện.
> - **[ke-hoach-lap-trinh-chi-tiet-v2.md](ke-hoach-lap-trinh-chi-tiet-v2.md)** — Kế hoạch phân công 6 thành viên theo lộ trình 8 tuần.
> - **[README.md](README.md)** — Hướng dẫn cài đặt, tài khoản demo và cấu trúc dự án.

---

## 1. Tổng quan
Xây dựng hệ thống quản lý bán hàng cho chuỗi cửa hàng điện thoại "One Tech Store". Đặc thù: quản lý hàng hóa theo **từng IMEI/Serial**, không quản lý theo số lượng gộp.

## 2. Tech stack (Đã triển khai thực tế)
- **Backend:** Node.js + Express.js (RESTful API JSON)
- **Database:** MongoDB (sử dụng Mongoose ODM — 26 Models CSDL)
- **Architecture:** Layered MVC + OOP Service Layer (`BaseService`, `BaseController`)
- **Frontend:** HTML5 + Vanilla JS + Bootstrap 5 + Bootstrap Icons + CSS Keyframe Animations
- **Auth & RBAC:** Session + Bcryptjs + Middleware phân quyền bảo vệ 6 vai trò (`Quản lý`, `Thủ kho`, `NV bán hàng`, `Thu ngân`, `Kế toán`, `Kỹ thuật`)

## 3. Ràng buộc nghiệp vụ cốt lõi
- Mỗi máy điện thoại là 1 bản ghi riêng trong `MAY_IMEI` (trạng thái: *Còn hàng, Đã bán, Bảo hành, Lỗi*), không gộp số lượng.
- `SanPham` lưu **số tháng bảo hành** (`soThangBH`) để tự động tính hạn bảo hành từ ngày lập hóa đơn bán.
- Bán hàng theo danh sách IMEI: kiểm tra trạng thái IMEI tức thì, chặn xung đột 409 Conflict nếu máy đã bán, tự động trừ kho phụ kiện và sinh `PhieuXuatKho`.
- Tra cứu bảo hành: truy vết toàn bộ vòng đời IMEI (ngày nhập kho, ngày xuất bán, hạn bảo hành, lịch sử tiếp nhận sửa chữa và linh kiện thay thế).
- Trả góp và Công nợ: quản lý nội bộ, không phụ thuộc đối tác thứ 3.

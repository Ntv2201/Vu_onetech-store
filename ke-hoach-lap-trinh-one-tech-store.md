# KẾ HOẠCH LẬP TRÌNH CỤ THỂ — ONE TECH STORE
### Stack: Node.js + Express + Sequelize (ORM) + MySQL/PostgreSQL + Bootstrap
### Thời gian: 3 tuần code + buffer (linh hoạt 2-4 tuần theo deadline thực tế)
### Nhân sự: 6 người

---

## GIAI ĐOẠN 0 — Chuẩn bị chung (làm trong 1 buổi, TRƯỚC khi bắt đầu Tuần 1)

Cả nhóm họp 30-45 phút, làm ngay các việc sau — thiếu bước này sẽ dễ đá nhau code:

- [ ] Tạo repo Git chung, nhánh `main` (bảo vệ, không push trực tiếp) + `dev` (nhánh tích hợp).
- [ ] An chạy `one_tech_store_schema.sql` để dựng DB thật, seed vài dòng mẫu mỗi bảng.
- [ ] Thống nhất cấu trúc thư mục dùng chung:
  ```
  /config      - kết nối DB, biến môi trường
  /models      - Sequelize models (1 file/bảng)
  /controllers - logic xử lý theo module
  /routes      - định tuyến API
  /middlewares - auth, check quyền, xử lý lỗi
  /public      - CSS/JS/Bootstrap tĩnh
  /views       - giao diện (nếu render server-side) hoặc /public cho SPA đơn giản
  ```
- [ ] Thống nhất quy ước đặt tên route API (VD: `/api/sanpham`, `/api/hoadon`) để không người mỗi kiểu.
- [ ] Tạo file `.env.example` (không commit `.env` thật).
- [ ] Mỗi người tự `git clone`, chạy được `npm install && npm run dev` trên máy mình trước khi qua Tuần 1.

---

## TUẦN 1 — Nền móng (Deadline: hết tuần, DEMO được đăng nhập + CRUD danh mục)

| Người | Việc cụ thể | Output kiểm tra được |
|---|---|---|
| **Trương Thế An** | Viết toàn bộ Sequelize models từ 26 bảng (dùng `one_tech_store_schema.sql` làm chuẩn) + file migration + seed script | `npm run migrate && npm run seed` chạy không lỗi, DB có đủ 26 bảng |
| **Nguyễn Tuấn Vũ** | Dựng layout Bootstrap chung (sidebar menu theo vai trò, header, khung trang) + màn hình Đăng nhập (giao diện) | Trang login hiển thị đúng theo wireframe đã có |
| **Nguyễn Quang Tuấn** | API + giao diện CRUD **Sản phẩm + MAY_IMEI** (thêm model máy, thêm từng IMEI vào model) | Thêm/sửa/xóa 1 sản phẩm và IMEI qua giao diện, thấy cập nhật trong DB |
| **Phạm Minh Tuân** | API + giao diện CRUD **Nhà cung cấp + Khách hàng** | Tương tự — CRUD chạy được, có validate cơ bản (SĐT, không để trống tên) |
| **Đinh Đức Vượng** | Middleware **Auth (login/logout, JWT hoặc session)** + middleware phân quyền theo `NHANVIEN.VaiTro` | Đăng nhập sai báo lỗi, đăng nhập đúng vào được, chặn được route theo vai trò (test bằng 2 tài khoản vai trò khác nhau) |
| **Tô Quốc Việt** | CRUD **Nhân viên** (thêm NV mới, phân vai trò) + viết README hướng dẫn setup project | Tạo được NV mới, gán vai trò, README người ngoài đọc làm theo chạy được |

**Điều kiện tiên quyết:** An phải xong model DB trong 2 ngày đầu tuần — người khác chờ được bằng cách code giao diện tĩnh (chưa nối API) song song, tránh ngồi không.

**Merge:** mỗi người merge nhánh mình vào `dev` chậm nhất cuối ngày thứ 5 trong tuần. PM (bạn) review nhanh trước khi merge, tránh conflict dồn cục.

---

## TUẦN 2 — Nghiệp vụ lõi (Deadline: hết tuần, DEMO được 1 giao dịch bán hàng trọn vẹn)

Đây là tuần quan trọng nhất — nếu chỉ làm xong 1 việc trong cả kế hoạch, phải là việc ở tuần này.

| Người | Việc cụ thể | Output kiểm tra được |
|---|---|---|
| **Nguyễn Quang Tuấn** | API + giao diện **Bán hàng**: tra cứu IMEI còn hàng → chọn máy/phụ kiện → lập HOADON + CT_HOADON_MAY + CT_HOADON_PHUKIEN → **dùng transaction**: đổi `MAY_IMEI.TrangThai` = "Da ban" cùng lúc với tạo hóa đơn, rollback nếu lỗi giữa chừng | Bán 1 máy → IMEI đó biến mất khỏi danh sách "còn hàng", hóa đơn hiện đúng thông tin. Test: 2 tab cùng bán 1 IMEI — chỉ 1 tab thành công |
| **Phạm Minh Tuân** | API + giao diện **Nhập kho**: chọn NCC → nhập PHIEUNHAP + CT_PHIEUNHAP (theo IMEI) → tự tạo bản ghi MAY_IMEI mới với TrangThai = "Con hang", hiển thị tên sản phẩm trên phiếu | Nhập 1 lô hàng → các IMEI mới xuất hiện trong danh sách tồn kho, đúng tên máy |
| **Trương Thế An** | API **Xuất kho** (PHIEUXUATKHO gắn với HOADON, tự tạo khi hóa đơn hoàn tất) + API **Tồn kho** (TONKHO, tự cập nhật số lượng khi nhập/bán) | Sau khi bán/nhập, số liệu TONKHO đổi đúng theo IMEI thực tế |
| **Nguyễn Tuấn Vũ** | Giao diện **Bán hàng** (form chọn máy, giỏ hàng tạm, in hóa đơn) + giao diện **Nhập kho** — nối với API của Tuấn/Tuân | Thao tác trên giao diện mượt, không cần gọi Postman |
| **Đinh Đức Vượng** | API + giao diện **Thanh toán** (đủ tiền/công nợ đơn giản, chưa cần trả góp chi tiết) — PHIEUTHU, cập nhật `HOADON.TrangThai` | Chọn hình thức thanh toán, hóa đơn chuyển đúng trạng thái |
| **Tô Quốc Việt** | Viết test case thủ công (checklist) cho toàn bộ luồng Bán hàng + Nhập kho, tự tay bấm thử tìm bug, ghi lại | File checklist bug, càng tìm ra sớm càng đỡ dồn cuối kỳ |

**Điều kiện tiên quyết:** cần model DB (An, tuần 1) và auth (Vượng, tuần 1) đã xong trước khi bắt đầu.

**Milestone bắt buộc cuối tuần 2:** demo được đúng 1 kịch bản — "khách mua 1 máy, thanh toán tiền mặt, hóa đơn in ra, tồn kho tự trừ". Đây là bản demo tối thiểu để nhóm không "trắng tay" nếu tuần 3 có trục trặc.

---

## TUẦN 3 — Mở rộng nghiệp vụ + hoàn thiện (Deadline: hết tuần, sẵn sàng bảo vệ)

| Người | Việc cụ thể | Ưu tiên |
|---|---|---|
| **Nguyễn Quang Tuấn** | Bảo hành: kích hoạt phiếu khi bán, tra cứu hạn theo IMEI, lập phiếu tiếp nhận sửa chữa | Cao |
| **Phạm Minh Tuân** | Đơn đặt hàng trước (DONDATHANGTRUOC) + đổi trả (PHIEUDOITRA) | Cao |
| **Trương Thế An** | Công nợ chi tiết (CONGNO) + trả góp nội bộ (HOPDONGTRAGOP, không bên thứ 3) | Cao |
| **Nguyễn Tuấn Vũ** | Giao diện các module trên (Bảo hành, Đổi trả, Công nợ/Trả góp) + rà lại UI toàn hệ thống cho đồng bộ | Cao |
| **Đinh Đức Vượng** | Kiểm kê kho (BIENBANKIEMKE, DIEUCHINHKHO) + báo cáo doanh thu cơ bản | Trung bình |
| **Tô Quốc Việt** | Test toàn hệ thống end-to-end theo checklist đã viết tuần 2, fix bug nhỏ, chuẩn bị dữ liệu demo đẹp cho buổi bảo vệ | Cao (làm xuyên suốt cả tuần, không dồn cuối) |

**Việc để cuối cùng, sẵn sàng CẮT nếu hết giờ (không ảnh hưởng điểm cốt lõi):**
- OCR scan phiếu nhập kho (ai rảnh trong nhóm làm thêm nếu Tuần 3 các việc trên đã ổn).
- Báo cáo nâng cao (biểu đồ, xuất Excel...).

---

## LỊCH SYNC NHÓM (không cần họp dài)

- **Hàng ngày (hoặc cách ngày):** nhắn nhanh trong group — "hôm nay làm gì / vướng gì / cần API nào từ ai" — 5-10 phút đọc là đủ, không cần gọi video.
- **Cuối mỗi tuần:** họp 20-30 phút demo nhanh phần mình làm cho cả nhóm xem, PM chốt việc có đạt milestone tuần đó không.
- **Merge code:** đẩy lên `dev` tối thiểu 2 lần/tuần, không để dồn đến cuối tuần mới merge — dễ conflict khó xử lý gấp.

## RỦI RO CẦN THEO SÁT (vai trò PM nên canh 2 điểm này sát nhất)

1. **Tuần 1 — An trễ model DB** → cả nhóm bị chặn dây chuyền. Nếu thấy trễ hơn 1 ngày, PM nên hỏi ngay có cần người hỗ trợ không.
2. **Tuần 2 — luồng Bán hàng (Tuấn) không dùng transaction đúng** → lỗi bán trùng 1 IMEI cho 2 khách, đây là bug hay bị bỏ sót vì test 1 người không phát hiện ra, cần Việt test giả lập 2 người bán cùng lúc.

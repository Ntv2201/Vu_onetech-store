# KẾ HOẠCH LẬP TRÌNH CHI TIẾT — ONE TECH STORE
### Dựa trên PROJECT_WALKTHROUGH.md của nhóm, chia nhỏ theo NGÀY + endpoint cụ thể
### 3 tuần (15 ngày làm việc), 6 người

Quy ước chung mọi module phải theo (áp dụng cho cả 6 người, không lặp lại ở từng mục):
- Mọi API trả lỗi dùng format thống nhất: `{ success: false, message: "..." }`, mã lỗi HTTP đúng chuẩn (400 sai dữ liệu, 403 sai quyền, 404 không tìm thấy, 409 xung đột — VD IMEI đã bán).
- Mọi thao tác ghi nhiều bảng cùng lúc PHẢI xử lý qua Tầng Service OOP (`src/services/`) với atomic validation / transaction đảm bảo tính toàn vẹn dữ liệu, không có ngoại lệ.
- Route nào cũng phải qua middleware `checkRole([...])` / `requireRole(...)` trước khi vào controller.
- Tất cả Controllers kế thừa `BaseController` và gọi qua Service tương ứng.

---

## THÀNH VIÊN 1 — NGUYỄN QUANG TUẤN (Bán hàng & Bảo hành) — [ĐÃ HOÀN THÀNH 100%]

### Ngày 1-2: Model + API nền
- [x] Xác nhận model `HoaDon`, `CT_HoaDon_May`, `CT_HoaDon_PhuKien`, `PhieuXuatKho`, `PhieuBaoHanh`, `CT_PBH_LinhKien` đã đúng theo schema.
- [x] `GET /api/hoa-don` — list, hỗ trợ query `?tuNgay=&denNgay=&maKH=&trangThai=&search=`.
- [x] `GET /api/hoa-don/:id` — trả về đầy đủ: thông tin KH, danh sách máy (kèm IMEI, tên SP, đơn giá), danh sách phụ kiện, tổng tiền, phiếu xuất kho.

### Ngày 3-5: API Bán hàng (trọng tâm, làm kỹ nhất)
- [x] `POST /api/hoa-don` — payload: `{ khachHang, nhanVien, danhSachIMEI: [imei1, imei2], danhSachPhuKien: [{phuKien, soLuong, donGiaBan}], hinhThucThanhToan, ghiChu }`
- [x] Logic transaction / service theo đúng thứ tự:
  1. Lock + kiểm tra từng IMEI trong `danhSachIMEI` có `TrangThai = 'Con hang'` — nếu bất kỳ IMEI nào không hợp lệ → throw lỗi 409 Conflict, rollback toàn bộ, trả về rõ IMEI nào bị lỗi.
  2. Kiểm tra `PhuKien.soLuongTon` đủ cho từng dòng phụ kiện — thiếu thì rollback.
  3. Tạo `HOADON`.
  4. Insert từng dòng `CT_HOADON_MAY`, `CT_HOADON_PHUKIEN`.
  5. Update `MAY_IMEI.TrangThai = 'Da ban'` cho từng IMEI.
  6. Trừ `PHUKIEN.SoLuongTon`.
  7. Tự sinh `PHIEUXUATKHO` (SoHD, LyDoXuat = "Ban hang").
  8. Commit và trả về chi tiết hóa đơn.
- [x] Viết test tự động: bán cùng 1 IMEI $\rightarrow$ xác nhận chỉ 1 lần thành công, lần bán tiếp theo nhận lỗi 409 Conflict rõ ràng.

### Ngày 6-7: API Bảo hành
- [x] `POST /api/bao-hanh` — payload: `{ imei, moTaLoi, ghiChu, nhanVien }`
  1. Tìm `IMEI` trong `MAY_IMEI` — nếu chưa từng bán → lỗi 400 "Máy chưa bán, không thể tiếp nhận bảo hành".
  2. Truy ngược `CT_HOADON_MAY` → `HOADON.NgayLap` = ngày bán.
  3. Lấy `SANPHAM.SoThangBH` của model máy đó.
  4. Tính `HanBaoHanh = NgayLap + SoThangBH tháng`. Nếu `hôm nay > HanBaoHanh` → lỗi "Hết hạn bảo hành, ngày hết hạn: ...".
  5. Nếu còn hạn → tạo `PHIEUBAOHANH`, update `MAY_IMEI.TrangThai = 'Bao hanh'`.
- [x] `GET /api/bao-hanh/tra-cuu/:imei` — trả về ngày nhập, ngày bán, hạn BH, số ngày còn lại, lịch sử các lần bảo hành trước (kèm linh kiện đã thay).
- [x] `POST /api/bao-hanh/:id/linh-kien` — thêm dòng `CT_PBH_LINHKIEN`, đồng thời trừ `LINHKIEN.SoLuongTon`.
- [x] `PUT /api/bao-hanh/:id/hoan-tat` — đổi `TrangThai` phiếu BH sang `Da sua xong`, đổi `MAY_IMEI.TrangThai` trả lại "Da ban" (máy đã sửa xong, trả khách).

**Bàn giao cuối:** Đã kiểm thử 26/26 test cases PASS ([`tests/test_tuan_module.js`](tests/test_tuan_module.js)), có sẵn giao diện POS bán hàng và Tra cứu Bảo hành trực quan.

---

## THÀNH VIÊN 2 — PHẠM MINH TUÂN (Nhập kho, Đổi trả, Đặt trước)

### Ngày 1-3: API Nhập kho
- [ ] `POST /api/phieu-nhap` — payload: `{ maNCC, maNV, danhSachMay: [{maSP, imei, giaNhap}] }`
  1. Kiểm tra từng IMEI trong `danhSachMay` **chưa tồn tại** trong `MAY_IMEI` — trùng thì lỗi 409 "IMEI đã tồn tại trong hệ thống" (đây là lỗi hay bị bỏ sót, Việt sẽ test riêng).
  2. Tạo `PHIEUNHAP`.
  3. Với mỗi dòng: tạo `MAY_IMEI` mới (`TrangThai = 'Con hang'`), tạo `CT_PHIEUNHAP`.
  4. Cộng `TONKHO.SoLuong` theo `MaSP` (báo An để thống nhất ai giữ hàm cộng trừ tồn kho — tránh 2 người cùng viết logic này ở 2 nơi khác nhau, xem mục "Điểm cần 2 người thống nhất" cuối file).
  5. Tùy chọn thanh toán ngay hay ghi nợ → tạo `PHIEUCHI` hoặc `CONGNO` (LoaiDoiTuong = 'NhaCungCap').
- [ ] `GET /api/phieu-nhap`, `GET /api/phieu-nhap/:id`.

### Ngày 4-5: API Đổi trả
- [ ] `POST /api/doi-tra` — payload: `{ soHD, imeiCu, imeiMoi, lyDo }`
  1. Kiểm tra `imeiCu` thuộc đúng `soHD` (join qua `CT_HOADON_MAY`).
  2. Kiểm tra `imeiMoi` đang `Con hang`.
  3. Tạo `PHIEUDOITRA`.
  4. Update `MAY_IMEI` của `imeiCu` → `TrangThai = 'Loi'`.
  5. Update `MAY_IMEI` của `imeiMoi` → `TrangThai = 'Da ban'`.
  6. Nếu chênh lệch giá giữa 2 máy → cân nhắc sinh thêm `PHIEUTHU`/hoàn tiền (bàn với Vượng vì đụng module Thu-Chi của Vượng — xem mục cuối file).

### Ngày 6-7: API Đặt hàng trước
- [ ] `POST /api/dat-truoc` — payload: `{ maKH, maSP, imei (optional), soTienCoc, hanLay }`.
- [ ] `PUT /api/dat-truoc/:id/huy` — hủy đơn đặt, hoàn cọc (sinh `PHIEUTHU` âm hoặc phiếu chi hoàn cọc, thống nhất với Vượng).
- [ ] `PUT /api/dat-truoc/:id/chuyen-hoa-don` — khi khách đến lấy máy: gọi lại logic của `POST /api/hoa-don` (Tuấn) với `maDat` đính kèm để trừ luôn tiền cọc đã thu vào tổng hóa đơn.

**Bàn giao cuối:** nhập 1 lô 5 máy → 5 IMEI xuất hiện đúng, thử nhập trùng 1 IMEI → bị chặn. Đổi trả 1 máy → 2 IMEI đổi đúng trạng thái.

---

## THÀNH VIÊN 3 — TRƯƠNG THẾ AN (Tồn kho, Công nợ, Trả góp)

### Ngày 1-2: Model toàn bộ 26 bảng (làm trước tiên, chặn đường người khác)
- [x] Đã hoàn thành 26 Mongoose models trong `src/models/` theo schema.
- [ ] Viết **1 hàm dùng chung** để cộng/trừ `TONKHO.SoLuong` (VD: `capNhatTonKho(maSP, maKho, delta)`), export ra cho Tuân (nhập kho) và Tuấn (bán hàng) cùng gọi — **không để mỗi người tự viết công thức cộng trừ riêng**, đây là điểm dễ gây lệch số liệu nhất hệ thống.
- [x] Seed script cơ bản (6 tài khoản NV theo 6 vai trò, vài SP mẫu).

### Ngày 3-5: API Tồn kho + Xuất kho
- [ ] `GET /api/kho/ton-kho?maKho=` — group theo `MaSP`, trả về `SoLuong` + `TenMay`.
- [ ] `GET /api/kho/phieu-xuat` — danh sách phiếu xuất (đọc, vì phiếu xuất được Tuấn tự sinh khi bán hàng, An không tạo trực tiếp).

### Ngày 6-9: Công nợ
- [ ] `GET /api/cong-no?loaiDoiTuong=&maKH=&maNCC=&trangThai=` — danh sách công nợ, filter theo đối tượng.
- [ ] `GET /api/cong-no/:id` — chi tiết 1 khoản nợ + lịch sử `PHIEUTHU` liên quan.
- [ ] Hàm tính `TrangThai` tự động: `SoTienDaTra = 0` → "Chua tra"; `0 < SoTienDaTra < SoTienNo` → "Dang tra"; `SoTienDaTra >= SoTienNo` → "Da hoan tat".
- [ ] **Lưu ý quan trọng:** `CONGNO` không có FK cứng (đa hình) — validate ở tầng code: nếu `LoaiDoiTuong = 'KhachHang'` thì bắt buộc `MaKH` khác NULL và `MaNCC` phải NULL, ngược lại tương tự. Viết 1 hàm validate dùng chung, đừng để mỗi endpoint tự check khác nhau.

### Ngày 10-12: Trả góp
- [ ] `POST /api/tra-gop` — payload: `{ soHD, soTienTraTruoc, soKy }` (3/6/9/12 tháng).
  - Công thức: `SoTienTraGop = (HOADON.TongTien - soTienTraTruoc) / soKy`.
- [ ] `GET /api/tra-gop/:id/lich-thu` — sinh lịch thu theo kỳ (ngày dự kiến thu mỗi tháng dựa trên `NgayLap` hóa đơn).
- [ ] `POST /api/tra-gop/:id/thu-ky` — ghi nhận đã thu 1 kỳ (gọi qua module Thu-Chi của Vượng, xem mục cuối file — tránh viết trùng logic tạo `PHIEUTHU`).

**Bàn giao cuối:** bảng công nợ hiển thị đúng số dư, tạo hợp đồng trả góp 12 tháng ra đúng số tiền/kỳ, tồn kho luôn khớp giữa nhập và bán (test bằng cách nhập 3 máy, bán 1 máy, tồn phải còn đúng 2).

---

## THÀNH VIÊN 4 — NGUYỄN TUẤN VŨ (Frontend/UI)

### Ngày 1-3: Layout chung + màn hình Bán hàng POS
- [x] Layout Bootstrap dùng chung (sidebar theo vai trò đăng nhập — ẩn/hiện menu tùy `VaiTro`).
- [x] `src/public/ban-hang/index.html`: ô tìm IMEI (autocomplete gọi API của Tuấn khi có), giỏ hàng, chọn KH, chọn thanh toán.
- [x] Nối API thật của Tuấn cho API Bán hàng.

### Ngày 4-6: Màn hình Nhập kho + Đổi trả + Đặt trước
- [ ] `src/public/nhap-kho/index.html`: form chọn NCC + bảng nhập nhiều dòng IMEI, hỗ trợ paste nhanh từ Excel/text (tách theo dòng).
- [ ] Màn hình Đổi trả, Đặt trước (nối API của Tuân).

### Ngày 7-9: Print Template
- [x] Mẫu in Hóa đơn (A4/A5/K80) dùng `@media print`, ẩn hết UI thừa khi in.
- [ ] Mẫu in Phiếu bảo hành, Phiếu nhập kho.

### Ngày 10-12: Tra cứu Bảo hành/Trả góp + Dashboard
- [x] Trang tra cứu theo IMEI: dòng thời gian Nhập → Bán → Hạn BH → Lịch sử sửa.
- [ ] Giao diện lịch thu trả góp, giao diện công nợ (nối API của An).
- [x] Dashboard cơ bản (đã có API và thống kê).

**Nguyên tắc làm việc:** Vũ luôn code UI với mock data trước, không chờ API — khi backend xong thì chỉ đổi endpoint, tránh cả nhóm bị chặn dây chuyền vào 1 người.

---

## THÀNH VIÊN 5 — ĐINH ĐỨC VƯỢNG (Thu-Chi, Kiểm kê, Báo cáo)

### Ngày 1-3: Thu - Chi (module lõi cho cả nhóm gọi lại)
- [ ] `POST /api/thanh-toan/thu` — payload: `{ soHD hoặc maDat hoặc maCN, soTien }` — chỉ được điền đúng 1 trong 3, validate rõ.
- [ ] `POST /api/thanh-toan/chi` — payload: `{ maPN hoặc maDT (đối tượng chi), soTien, lyDo }`.
- [ ] **Export 2 hàm này thành service dùng chung** (`taoPhieuThu()`, `taoPhieuChi()`) để Tuân (đổi trả hoàn tiền), An (thu kỳ trả góp) gọi lại, không tự viết logic tạo phiếu thu/chi riêng ở module khác.
- [ ] `GET /api/thanh-toan/so-quy?tuNgay=&denNgay=` — tổng thu, tổng chi, số dư.

### Ngày 4-6: Kiểm kê kho
- [ ] `POST /api/kiem-ke` — payload: `{ maKho, danhSachIMEIThucTe: [...] }`.
  1. So sánh với danh sách `MAY_IMEI` có `TrangThai = 'Con hang'` trong DB.
  2. IMEI có trong DB nhưng không quét được thực tế → "thiếu".
  3. IMEI quét được thực tế nhưng không có trong DB (hoặc trạng thái khác) → "thừa"/bất thường.
  4. Tạo `BIENBANKIEMKE` + các dòng `DIEUCHINHKHO` cho từng IMEI lệch (lưu ý: bảng `DIEUCHINHKHO` gốc thiếu cột IMEI — cần thêm cột này khi tạo migration, báo An).

### Ngày 7-10: Báo cáo & Dashboard
- [ ] `GET /api/bao-cao/doanh-thu?tuNgay=&denNgay=&nhom=ngay|tuan|thang`.
- [ ] `GET /api/bao-cao/top-san-pham` — top bán chạy theo số lượng/doanh thu.
- [ ] `GET /api/bao-cao/ton-lau-ngay` — máy tồn quá X ngày chưa bán (tính từ `NgayNhap` của IMEI đó).
- [ ] Tích hợp Chart.js trên Dashboard (đưa data cho Vũ ráp giao diện).

**Bàn giao cuối:** sổ quỹ khớp với tổng hóa đơn + phiếu nhập trong kỳ, kiểm kê 1 kho phát hiện đúng IMEI thừa/thiếu đã cố tình chỉnh tay để test.

---

## THÀNH VIÊN 6 — TÔ QUỐC VIỆT (QA/Test/Demo)

### Ngày 1-3: Chuẩn bị + test module Tuần 1
- [x] Đã có test script tự động kiểm thử RBAC 403 Forbidden cho 6 vai trò.
- [ ] Viết file `TEST_CHECKLIST.md` với cột: Test case | Bước thực hiện | Kết quả mong đợi | Pass/Fail | Người sửa.
- [x] Test case Phân quyền: dùng 6 tài khoản, thử gọi API không đúng vai trò → nhận 403.

### Ngày 4-9: Test các luồng lõi (song song lúc dev đang code Tuần 2)
- [x] Test Bán hàng: bán trùng IMEI 2 lần → nhận lỗi 409 Conflict rõ ràng (`tests/test_tuan_module.js`).
- [ ] Test Nhập kho: nhập trùng IMEI đã tồn tại.
- [x] Test Bảo hành: nhập IMEI chưa từng bán (bị chặn 400), nhập IMEI trong hạn BH (tiếp nhận thành công), xuất linh kiện trừ kho, hoàn tất trả IMEI về 'Da ban'.
- [ ] Test Đổi trả, Đặt trước, Trả góp, Công nợ — theo checklist tương ứng từng module khi dev báo xong.
- [ ] Mở GitHub Issue cho mỗi bug tìm được, gắn tên người phụ trách module đó.

### Ngày 10-15: Dữ liệu Demo + kịch bản
- [x] Cập nhật `seed.js`: đủ hóa đơn mẫu, phiếu xuất kho, phiếu BH mẫu, linh kiện, IMEI đa dạng trạng thái.
- [ ] Viết kịch bản demo 5-7 phút: thứ tự thao tác chính xác, chuẩn bị sẵn IMEI/số hóa đơn dùng để demo.
- [ ] Chạy thử toàn bộ kịch bản demo tối thiểu 2 lần trước ngày bảo vệ thật.

---

## ĐIỂM CẦN 2-3 NGƯỜI THỐNG NHẤT TRƯỚC KHI CODE (họp 15 phút riêng, tránh code trùng/lệch)

| Vấn đề | Ai liên quan | Cần chốt gì |
|---|---|---|
| Hàm cộng/trừ `TONKHO.SoLuong` | An, Tuân, Tuấn | Viết trong Service dùng chung, người khác gọi lại — không tự viết riêng |
| Tạo `PHIEUTHU`/`PHIEUCHI` | Vượng, An, Tuân | Vượng export service dùng chung, An (trả góp) và Tuân (hoàn cọc/đổi trả) gọi lại |
| Cột IMEI còn thiếu ở `DIEUCHINHKHO` | An, Vượng | An thêm trường này vào model trước ngày 4 (Vượng cần nó ở ngày 4-6) |
| `PHIEUHOANTIEN` (chưa có bảng) | Tuân, Vượng | Nếu đổi trả có chênh lệch giá cần hoàn tiền, quyết định dùng tạm `PHIEUCHI` có sẵn hay thêm model mới |

# ONETECH STORE - WORKSPACE AGENT RULES & ARCHITECTURAL WORKFLOWS

Tài liệu này định nghĩa các quy tắc hoạt động, tiêu chuẩn thiết kế kiến trúc và quy trình làm việc bắt buộc dành cho AI Assistant trong toàn bộ dự án OneTech Store.

---

## 📌 QUY TẮC 1: LÀM RÕ YÊU CẦU & LẬP KẾ HOẠCH TRƯỚC KHI THỰC HIỆN

Khi người dùng đưa ra bất kỳ yêu cầu, nhiệm vụ mới hoặc yêu cầu chỉnh sửa hệ thống:

1. **Đặt câu hỏi làm rõ (Clarifying Questions):**
   - Luôn chủ động đặt ra **nhiều câu hỏi liên quan nhất có thể** để làm rõ triệt để các khía cạnh:
     - **Business Logic & Flow**: Luồng nghiệp vụ, trạng thái dữ liệu (State machine: Đặt cọc -> Bán hàng -> Xuất kho -> Đổi trả/Bảo hành).
     - **Database & Data Integrity**: Mongoose schema, compound indexes, quan hệ đa hình (Polymorphic relations).
     - **Phân quyền RBAC**: Phân quyền chi tiết cho 6 vai trò (`'Quản lý'`, `'Thủ kho'`, `'NV bán hàng'`, `'Thu ngân'`, `'Kế toán'`, `'Kỹ thuật'`).
     - **Giao diện UI/UX**: Tương tác người dùng, thông báo Toast, Modal popup, debounce search, ẩn/hiện nút bấm theo vai trò.
     - **Trường hợp biên & Tranh chấp đồng thời (Concurrency & Edge Cases)**: Khóa máy IMEI, chống bán trùng, hoàn tiền, cấn trừ cọc.

2. **Lập Bản Kế Hoạch Chi Tiết (Implementation Plan):**
   - Luôn tạo hoặc cập nhật file kế hoạch triển khai chi tiết (`implementation_plan.md`) trước khi chỉnh sửa code.
   - Bản kế hoạch phải nêu rõ: Mục tiêu, các điểm cần làm rõ, chi tiết từng file cần thêm mới / sửa đổi, kịch bản kiểm thử tự động (Verification Plan).

---

## 📌 QUY TẮC 2: QUY TRÌNH XỬ LÝ KHI NGƯỜI DÙNG NHẮN "Check PR mới giúp mình"

Bất cứ khi nào người dùng gửi tin nhắn có nội dung **"Check PR mới giúp mình"** (hoặc các biến thể kiểm tra Pull Request tương đương), AI Assistant bắt buộc phải tự động thực hiện tuần tự theo quy trình chuẩn sau:

### Bước 1: Tra cứu & Thu thập thông tin PR mới
- Sử dụng GitHub API tra cứu toàn bộ Pull Request đang mở (`state=open`) trên repository `tuan-coder-code/onetech-store`.
- Thu thập danh sách files thay đổi, commits, và diff chi tiết của PR.

### Bước 2: Viết đánh giá & Báo cáo lỗi chi tiết (TRƯỚC KHI SỬA)
- Phân tích toàn diện code trong PR:
  - **Tính năng mới**: Tóm tắt các chức năng mà PR đã đóng góp.
  - **Ưu điểm**: Đánh giá kiến trúc, tái sử dụng code, xử lý logic tốt.
  - **Báo cáo lỗi & Bất cập (Trước khi sửa)**: Liệt kê chi tiết từng lỗi (lỗi logic, sai tên trường schema, sai cú pháp RBAC, nguy cơ lỗi tính toán công nợ/tồn kho, thiếu validate...).

### Bước 3: Tự động sửa lỗi & Tối ưu hóa code
- Áp dụng các bản sửa lỗi trực tiếp vào codebase cho tất cả các vấn đề đã chỉ ra ở Bước 2.
- Chuẩn hóa phân quyền RBAC đúng quy chuẩn tiếng Việt có dấu (`'Quản lý'`, `'Thủ kho'`,...).
- Bổ sung validation, xử lý ngoại lệ và bắt lỗi an toàn.

### Bước 4: Kiểm thử tự động toàn diện (Automated Testing)
- Tạo mới hoặc cập nhật file test riêng cho PR đó trong thư mục `tests/`.
- Đăng ký file test mới vào Master Test Runner (`tests/run_all_tests.js`).
- Chạy lệnh `npm test` để kiểm tra toàn bộ các bộ test suites của hệ thống.
- **Bắt buộc 100% test suites phải PASS** trước khi tiến hành bước tiếp theo.

### Bước 5: Merge, Commit & Push lên nhánh chính
- Tạo commit theo chuẩn Conventional Commits (ví dụ: `feat(...)`, `fix(...)`) mô tả rõ các chức năng và bản vá.
- Đẩy code lên nhánh chính: `git push origin main`.

### Bước 6: Cập nhật tài liệu & Báo cáo tổng kết cho người dùng
- Cập nhật tài liệu `walkthrough.md` tổng kết các thay đổi.
- Báo cáo kết quả rõ ràng cho người dùng:
  - Tóm tắt các lỗi đã phát hiện và đã sửa.
  - Kết quả kiểm thử (số lượng test suites, số assertions pass).
  - Trạng thái git commit/push và hướng dẫn đóng/merge PR trên web GitHub.

---

## 📌 QUY TẮC 3: TIÊU CHUẨN CODE BACKEND & CLEAN ARCHITECTURE

1. **Phân tách tầng trách nhiệm (Separation of Concerns)**:
   - **Route (`src/routes/`)**: Định nghĩa URL endpoint, gắn middleware xác thực (`requireAuth`) và phân quyền vai trò (`requireRole`).
   - **Controller (`src/controllers/`)**: Kế thừa `BaseController`, chỉ làm nhiệm vụ parse request params/body/query và gọi Service tương ứng, trả về chuẩn qua `sendSuccess` hoặc `handleError`.
   - **Service (`src/services/`)**: Kế thừa `BaseService`, chứa toàn bộ logic nghiệp vụ (Business Logic), tính toán tiền, xử lý database, rollback lỗi.
   - **Model (`src/models/`)**: Định nghĩa Schema Mongoose, validation ràng buộc và compound indexes tối ưu hiệu năng.

2. **Quy chuẩn Phân quyền RBAC**:
   - Hệ thống áp dụng 6 vai trò cố định viết bằng tiếng Việt có dấu:
     1. `'Quản lý'` (Toàn quyền hệ thống)
     2. `'Thủ kho'` (Nhập kho, xuất kho, kiểm kê, danh mục NCC, máy IMEI, phụ kiện)
     3. `'NV bán hàng'` (Lập hóa đơn POS, tạo đơn đặt trước pre-order, tư vấn trả góp)
     4. `'Thu ngân'` (Thu tiền, xác nhận thanh toán hóa đơn, lập phiếu thu)
     5. `'Kế toán'` (Quản lý công nợ, sổ quỹ thu - chi, đối soát tài chính)
     6. `'Kỹ thuật'` (Tiếp nhận bảo hành, thẩm định máy đổi trả, sửa chữa)
   - Luôn sử dụng cú pháp rest parameters: `requireRole('Quản lý', 'Thủ kho')`. Tuyệt đối không dùng mảng không dấu như `['QuanLy', 'ThuKho']`.

3. **Hiệu năng & Tối ưu Database**:
   - Mọi câu lệnh truy vấn chỉ đọc (read-only) lấy danh sách hoặc báo cáo bắt buộc dùng `.lean()` để giảm tải bộ nhớ.
   - Mọi bảng có tìm kiếm kết hợp nhiều trường bắt buộc khai báo Compound Indexes trong Schema.
   - Dùng phân trang chuẩn với `getPaginationOptions(query)`.

4. **Xử lý Concurrency & Toàn vẹn dữ liệu**:
   - Khi bán máy / đổi trả máy IMEI: Bắt buộc dùng atomic update (ví dụ: `MayImei.findOneAndUpdate({ _id, trangThai: 'Con hang' }, { $set: { trangThai: 'Da ban' } })`) hoặc mutex lock để chống race condition 2 nhân viên bán cùng 1 máy.
   - Mọi thay đổi tăng giảm số dư tiền mặt / công nợ / tồn kho bắt buộc phải sinh kèm bản ghi nhật ký (Phiếu Thu / Phiếu Chi / Lịch sử công nợ / Thẻ kho).

---

## 📌 QUY TẮC 4: TIÊU CHUẨN GIAO DIỆN FRONTEND & UI/UX

1. **Kiến trúc giao diện**:
   - Sử dụng Vanilla HTML5, Bootstrap 5 và CSS tùy chỉnh chuẩn chỉnh.
   - Tái sử dụng Navbar (`/partials/navbar.html`) và Sidebar (`/partials/sidebar.html`) qua hàm `injectCommonLayout()` trong `layout.js`.
   - Giao tiếp API qua helper `api.get()`, `api.post()`, `api.put()`, `api.delete()` đã tích hợp sẵn toast thông báo và xử lý lỗi 401/403.

2. **Kiểm soát hiển thị theo vai trò (Role-based UI Visibility)**:
   - Dựa trên biến `currentUser.vaiTro` (từ `sessionStorage.getItem('currentUser')`):
     - Ẩn hoặc disable các nút bấm hành động nguy hiểm (Xóa, Sửa, Duyệt phiếu, Hủy phiếu) nếu vai trò hiện tại không có quyền.
     - Ví dụ: Nút *"Hủy hóa đơn"* hoặc *"Xóa nhà cung cấp"* chỉ hiển thị khi `currentUser.vaiTro === 'Quản lý'`.

3. **Trải nghiệm người dùng (UX)**:
   - Tìm kiếm bảng dữ liệu phải có Debounce (khoảng 300ms - 400ms) để tránh spam API.
   - Định dạng tiền tệ thống nhất: `number.toLocaleString('vi-VN') + ' đ'`.
   - Sử dụng Toast notifications rõ ràng cho trạng thái Thành công / Thất bại.

---

## 📌 QUY TẮC 5: TIÊU CHUẨN COMMIT & QUẢN LÝ PHIÊN BẢN (GIT)

- Tuân thủ quy chuẩn **Conventional Commits**:
  - `feat(...)`: Thêm tính năng mới (ví dụ: `feat(pos): Tích hợp in hóa đơn nhiệt và quét mã vạch`).
  - `fix(...)`: Sửa lỗi (ví dụ: `fix(congno): Sửa lỗi tính thiếu dư nợ nhà cung cấp`).
  - `perf(...)`: Cải thiện hiệu năng (compound index, concurrency lock, lean query).
  - `test(...)`: Bổ sung hoặc cập nhật bộ test tự động.
  - `docs(...)`: Cập nhật tài liệu hướng dẫn, README, walkthrough.
  - `refactor(...)`: Tái cấu trúc code mà không làm đổi logic nghiệp vụ.

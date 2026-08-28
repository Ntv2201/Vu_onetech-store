# ONETECH STORE - WORKSPACE AGENT RULES & WORKFLOWS

Tài liệu này định nghĩa các quy tắc hoạt động bắt buộc dành cho AI Assistant trong toàn bộ dự án OneTech Store.

---

## 📌 QUY TẮC 1: LÀM RÕ YÊU CẦU & LẬP KẾ HOẠCH TRƯỚC KHI THỰC HIỆN

Khi người dùng đưa ra bất kỳ yêu cầu, nhiệm vụ mới hoặc yêu cầu chỉnh sửa hệ thống:

1. **Đặt câu hỏi làm rõ (Clarifying Questions):**
   - Luôn chủ động đặt ra **nhiều câu hỏi liên quan nhất có thể** để làm rõ triệt để các khía cạnh:
     - Logic nghiệp vụ và luồng xử lý chi tiết (Business Logic & Flow).
     - Ràng buộc dữ liệu, Validation, Schema Database (Mongoose models, compound indexes).
     - Phân quyền người dùng / RBAC (Quản lý, Thủ kho, NV bán hàng, Thu ngân, Kế toán, Kỹ thuật).
     - Giao diện UI/UX, tương tác người dùng, thông báo lỗi / thành công (Toasts, Modals).
     - Các trường hợp biên (Edge cases), xử lý xung đột đồng thời (Concurrency, Atomic locks).

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

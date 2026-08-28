# Workspace Rules & Auto-Workflows

## Rule 1: Always Ask Clarifying Questions & Plan First
When the user requests a task, feature, or change:
1. Ask as many relevant questions as possible to clarify all requirements, business logic, constraints, edge cases, RBAC roles, and UI/UX behaviors.
2. Create/update a detailed `implementation_plan.md` before making any code changes.

## Rule 2: Automated "Check PR mới giúp mình" Workflow
Whenever the user triggers with "Check PR mới giúp mình" (or similar):
1. Query open GitHub PRs via API.
2. Provide a thorough evaluation of the PR, explicitly listing all bugs/defects found BEFORE fixing.
3. Fix all detected bugs and optimize the code.
4. Add/update test cases, register in `tests/run_all_tests.js`, and execute `npm test` (require 100% PASS).
5. Commit and push to `origin/main`.
6. Write a complete walkthrough summary and provide clear next-step instructions.

## Rule 3: Clean Backend MVC & RBAC Standard
1. Strictly follow MVC architecture: Routes -> Controllers (extend BaseController) -> Services (extend BaseService) -> Models (Mongoose).
2. RBAC must use standard Vietnamese accented roles: `'Quản lý'`, `'Thủ kho'`, `'NV bán hàng'`, `'Thu ngân'`, `'Kế toán'`, `'Kỹ thuật'`.
3. Use `.lean()` for read-only queries and maintain compound indexes.
4. Prevent race conditions on IMEI items using atomic findOneAndUpdate status checks.

## Rule 4: Frontend UI/UX Standards
1. Use Bootstrap 5, custom CSS, layout injection (`injectCommonLayout()`), and `api` helper.
2. Adapt UI elements dynamically based on `currentUser.vaiTro`.
3. Format currency with `toLocaleString('vi-VN') + ' đ'`.

## Rule 5: Conventional Commits
Use standard commit prefixes: `feat(...)`, `fix(...)`, `perf(...)`, `test(...)`, `docs(...)`, `refactor(...)`.

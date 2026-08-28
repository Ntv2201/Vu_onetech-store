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

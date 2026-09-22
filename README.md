# ONE TECH STORE
### He thong Quan ly Ban hang Chuoi Cua hang Dien thoai
### Quan ly hang hoa theo tung IMEI/Serial vat ly rieng biet

[![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0+-brightgreen)](https://mongodb.com)
[![Bootstrap](https://img.shields.io/badge/Bootstrap-5.3-purple)](https://getbootstrap.com)
[![Tests](https://img.shields.io/badge/Tests-22%20Suites%20866%20PASS-success)](./tests)

---

## Gioi thieu

**One Tech Store** la he thong quan ly ban hang chuyen biet cho chuoi cua hang dien thoai, may tinh bang va phu kien cong nghe. Diem khac biet cot loi: moi chiec may la mot ban ghi doc lap gan voi 1 ma **IMEI duy nhat (15 ky tu)**, cho phep truy vet chinh xac toan bo vong doi thiet bi tu nhap kho -> ban hang -> bao hanh -> doi tra.

---

## Tinh nang chinh

| Module | Mo ta |
|---|---|
| **Dang nhap & RBAC** | 6 vai tro phan quyen, bcrypt, session |
| **Ban hang POS** | Quet IMEI bang camera, multi-tab don hang, ma khuyen mai, in hoa don K80/A5 |
| **Nhap kho** | Phieu nhap nhieu dong, tu dong sinh IMEI, nhap hang loat tu Excel/CSV |
| **Dat truoc Pre-order** | Thu coc, lien ket can tru vao hoa don POS |
| **Doi tra** | Xu ly trong 30 ngay, tinh chenh lech tai chinh tu dong |
| **Bao hanh** | Tiep nhan, xuat linh kien thay the, hoan tat tra may |
| **Tra gop** | Hop dong tra gop, lich thu ky han tu dong |
| **Kho** | State Machine 6 trang thai IMEI, kiem ke, dieu chinh ton |
| **So quy** | Phieu Thu/Chi, so du realtime, doi soat theo ngay/thang |
| **Cong no** | Cong no khach hang + NCC, canh bao qua han |
| **Bao cao** | Doanh thu Chart.js, Top SP, Ton kho sap het, KPI nhan vien |

---

## Cong nghe su dung

| Thanh phan | Cong nghe |
|---|---|
| **Backend** | Node.js 18+ / Express.js (RESTful API JSON) |
| **Kien truc** | Layered MVC + OOP Service Layer (BaseService, BaseController) |
| **Database** | MongoDB 7.0 / Mongoose ODM (27 Collections) |
| **Frontend** | HTML5 + Vanilla JS + Bootstrap 5.3 + FontAwesome 6 |
| **Auth & Bao mat** | express-session + bcryptjs + RBAC Middleware |
| **Kiem thu** | Node.js custom test runner — 22 suites, 866 assertions, 100% PASS |

---

## Huong dan cai dat

### Yeu cau he thong
- Node.js >= 18
- MongoDB >= 6.0 (chay local hoac Atlas)
- npm >= 9

### Buoc 1: Clone va cai dat
```bash
git clone https://github.com/tuan-coder-code/onetech-store.git
cd onetech-store
npm install
```

### Buoc 2: Cau hinh moi truong
Tao file `.env` tai thu muc goc:
```env
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/onetech_store
SESSION_SECRET=onetech_secret_key_super_secure_2026
NODE_ENV=development
```

### Buoc 3: Nap du lieu mau (Seed Data)
```bash
npm run seed
```
Script tu dong tao: 7 tai khoan 6 vai tro, danh muc, san pham, IMEI mau, khach hang, NCC.

### Buoc 4: Chay server
```bash
# Che do phat trien (nodemon auto-reload)
npm run dev

# San xuat
npm start
```

### Buoc 5: Truy cap
- **URL:** http://localhost:3000
- **Trang dang nhap:** http://localhost:3000/login.html

---

## Tai khoan demo (sau khi seed)

| Vai tro | Ten dang nhap | Mat khau | Quyen han |
|---|---|---|---|
| **Quan ly** | `admin` | `admin123` | Toan quyen he thong |
| **Thu kho** | `thukho` | `thukho123` | Nhap kho, xuat kho, kiem ke, IMEI, phu kien, NCC |
| **NV ban hang** | `banhang` | `banhang123` | Lap hoa don POS, dat truoc, tu van tra gop |
| **Thu ngan** | `thungan` | `thungan123` | Thu tien, xac nhan thanh toan, lap phieu thu |
| **Ke toan** | `ketoan` | `ketoan123` | Cong no, so quy thu-chi, doi soat tai chinh |
| **Ky thuat** | `kythuat` | `kythuat123` | Tiep nhan bao hanh, tham dinh doi tra, sua chua |

---

## Kiem thu tu dong

```bash
# Chay toan bo 22 Test Suites (khuyen nghi)
npm test
# Ket qua: 22/22 suites PASS — 866/866 assertions — 0 FAIL (~13 giay)
```

| Test Suite | So luong | Mo ta |
|---|---|---|
| test_tuan_module.js | 60 | Ban hang POS, IMEI, Bao hanh, Data Contract |
| test_tuan_tuan5_6_e2e.js | 33 | E2E: Dat coc -> Ban hang -> Doi tra -> Bao hanh -> KPI |
| test_viet_module.js | 32 | Dat truoc Pre-order |
| test_viet_tuan4.js | 39 | Doi tra may & Can tru coc |
| test_viet_tuan5.js | 26 | Tinh huong bien & Huy phieu RBAC |
| test_viet_tuan6_e2e.js | 21 | E2E toan trinh |
| test_an_tuan3.js | 28 | Ton kho dung chung & Cong no |
| test_an_tuan4.js | 24 | Doi soat cong no & Qua han |
| test_an_tuan5.js | 23 | Hop dong Tra gop & Lich thu ky |
| test_tuan_nhap_kho.js | 25 | Nhap kho may IMEI & Phu kien |
| test_tuan_tuan4.js | 13 | Nhap hang loat IMEI & Lich su NCC |
| test_tuan_tuan5.js | 8 | Tra hang NCC & Can tru cong no |
| test_vuong_module.js | 37 | Thu - Chi & So quy |
| test_vuong_tuan4_kiemke.js | 23 | Kiem ke kho & Xu ly lech IMEI |
| test_vuong_tuan5_6_e2e.js | 25 | Bao cao Doanh thu, Top SP & Doi soat So quy E2E |
| verify_all_logins.js | 6 | Ma tran dang nhap 6 vai tro |
| test_http_endpoints.js | 51 | REST API 26 Endpoints & Data Contracts |
| test_frontend_dom_contract.js | 65 | DOM ID Bindings & Data Extractors |
| test_concurrency_stress.js | 5 | Atomic Lock & Stress Test 1000+ IMEI |
| test_ui_html_structure.js | 201 | HTML5 Structure, Sidebar & Assets |

---

## Cau truc thu muc

```
onetech/
|-- src/
|   |-- models/          # 27 Mongoose Schemas (MAY_IMEI, SANPHAM, HOADON...)
|   |-- services/        # OOP Service Layer (ke thua BaseService)
|   |   |-- HoaDonService.js      # Ban hang POS, Atomic Lock, can tru coc
|   |   |-- PhieuNhapService.js   # Nhap kho, sinh IMEI, cong no NCC
|   |   |-- BaoHanhService.js     # Tra cuu IMEI, tiep nhan BH, xuat LK
|   |   |-- DoiTraService.js      # Doi tra, tinh chenh lech, huy phieu
|   |   |-- DatTruocService.js    # Pre-order, thu coc, huy don hoan coc
|   |   |-- TraGopService.js      # Hop dong tra gop, thu tien ky
|   |   |-- CongNoService.js      # Cong no da hinh, canh bao qua han
|   |   |-- ThanhToanService.js   # So quy, Phieu Thu/Chi dung chung
|   |   |-- TonKhoService.js      # Ham ton kho dung chung capNhatTonKho
|   |   |-- BaoCaoService.js      # Doanh thu, Top SP, Ton kho lau/sap het
|   |   `-- ...
|   |-- controllers/     # OOP Controller Layer (ke thua BaseController)
|   |-- middlewares/     # requireAuth, requireRole (RBAC)
|   |-- routes/          # REST API /api/... (24 route files)
|   `-- public/
|       |-- css/style.css         # Design system, animations, glassmorphism
|       |-- js/
|       |   |-- api.js            # Fetch API wrapper, toast notifications
|       |   |-- layout.js         # Sidebar/Navbar injection, RBAC menu filter
|       |   |-- banhang.js        # POS logic, multi-tab, in hoa don
|       |   |-- nhapkho.js        # Nhap kho, bulk IMEI import
|       |   `-- ...
|       `-- pages/                # HTML5 pages (20+ trang)
|-- tests/               # 22 Test Suites (866 assertions, 100% PASS)
|-- AGENTS.md            # Quy tac kien truc bat buoc (AI & Developer)
|-- CONTRIBUTING.md      # Huong dan PR & quy trinh lam viec nhom
|-- PROJECT_WALKTHROUGH.md  # Tai lieu ky thuat toan dien
|-- ke-hoach-lap-trinh-chi-tiet-v2.md  # Phan cong 7 thanh vien
|-- package.json
`-- README.md
```

---

## Nhom phat trien

| STT | Ho ten | Vai tro |
|---|---|---|
| 1 | Nguyen Quang Tuan | Truong nhom / Full-stack Lead (POS, Bao hanh, Kien truc, Deploy) |
| 2 | Le Bao Tuan | Backend Dev (Nhap kho, IMEI, Tra hang NCC, TonKhoService) |
| 3 | Nguyen Viet An | Backend Dev (Cong no, So quy, Tra gop, Scaffold Models) |
| 4 | Le Phan Vuong | Backend Dev (Phieu Thu/Chi, Bao cao, Chart.js, Kiem ke) |
| 5 | Nguyen Thi Viet | Backend Dev (Dat truoc, Doi tra, Huy phieu hoan tac) |
| 6 | Do Thanh Vuc | Frontend Dev (Giao dien POS, Custom Dropdown, Mau in phap quy) |
| 7 | Le Viet Anh | QA / Tester (Master Test Runner, Stress test, RBAC Audit, Test E2E) |

---

## Tai lieu tham khao

- [AGENTS.md](./AGENTS.md) — Quy tac kien truc bat buoc (9 quy tac)
- [CONTRIBUTING.md](./CONTRIBUTING.md) — Huong dan PR va quy trinh nhom
- [PROJECT_WALKTHROUGH.md](./PROJECT_WALKTHROUGH.md) — Tai lieu ky thuat toan dien
- [ke-hoach-lap-trinh-chi-tiet-v2.md](./ke-hoach-lap-trinh-chi-tiet-v2.md) — Ke hoach phan cong 7 thanh vien

---

*One Tech Store — He thong quan ly ban hang dien thoai theo IMEI*  
*22/22 Test Suites PASS — 866/866 assertions — 0 FAIL*

# CHECKLIST KIEM TRA SO 3 — ONE TECH STORE
> Doi chieu yeu cau he thong toi thieu 90% chuc nang theo de kiem tra so 3.
> Ket qua npm test: 22/22 suites PASS — 866/866 assertions PASS (0 FAIL)

---

## THONG TIN NHOM

| STT | Ho ten | Vai tro |
|---|---|---|
| 1 | Nguyen Quang Tuan | Truong nhom / Full-stack Lead |
| 2 | Le Bao Tuan | Backend Dev (Nhap kho, IMEI, NCC) |
| 3 | Nguyen Viet An | Backend Dev (Cong no, So quy, Tra gop) |
| 4 | Le Phan Vuong | Backend Dev (So quy, Bao cao, Chart.js) |
| 5 | Nguyen Thi Viet | Backend Dev (Dat truoc, Doi tra) |
| 6 | Do Thanh Vuc | Frontend Dev (Giao dien, POS UI, Mau in) |
| 7 | Le Viet Anh | QA / Tester (Test tu dong, Stress test, RBAC audit) |

---

## MODULE BAT BUOC

### 1. DANG NHAP
| Tieu chi | Trang thai | Ghi chu |
|---|---|---|
| Dang nhap bang ten dang nhap + mat khau | PASS | /api/auth/login, bcrypt hash |
| Phien lam viec Session (dang xuat dung) | PASS | express-session |
| Sai mat khau -> thong bao loi | PASS | Toast danger |
| Phan quyen 6 vai tro (RBAC) | PASS | Quan ly / Thu kho / NV ban hang / Thu ngan / Ke toan / Ky thuat |
| Chan truy cap truc tiep URL khi chua login | PASS | Middleware requireAuth redirect login |

---

### 2. DANH MUC (CRUD day du)

#### 2.1 Khach Hang
| Tieu chi | Trang thai | Ghi chu |
|---|---|---|
| Xem danh sach (phan trang, tim kiem debounce 300ms) | PASS | /api/khach-hang |
| Them moi (validate SDT 10 so, CCCD 12 so, email duy nhat) | PASS | 409 Conflict khi trung |
| Sua thong tin | PASS | |
| Xem lich su mua hang | PASS | |
| Khoa/mo khoa tai khoan | PASS | toggle-status Soft Delete |

#### 2.2 Nha Cung Cap
| Tieu chi | Trang thai | Ghi chu |
|---|---|---|
| CRUD day du | PASS | /api/nha-cung-cap |
| Doi soat du no NCC | PASS | Lien ket cong no |

#### 2.3 Nhan Vien
| Tieu chi | Trang thai | Ghi chu |
|---|---|---|
| CRUD day du | PASS | /api/nhan-vien |
| Gan vai tro / phan quyen | PASS | 6 vai tro, tieng Viet co dau |
| Khoa/mo khoa tai khoan | PASS | toggle-status, chong tu khoa ban than |
| Doi mat khau | PASS | Hash bcrypt |

#### 2.4 Hang Hoa
| Tieu chi | Trang thai | Ghi chu |
|---|---|---|
| Quan ly model San pham (CRUD + Soft Delete) | PASS | /api/san-pham |
| Rang buoc gia ban > gia goc | PASS | SanPhamService validate |
| Quan ly Phu kien (CRUD + ton kho) | PASS | /api/phu-kien |
| Quan ly Danh muc / Loai hang | PASS | /api/danh-muc |
| Quan ly IMEI tung may (State Machine) | PASS | /api/may-imei |

---

### 3. MUA HANG
| Tieu chi | Trang thai | Ghi chu |
|---|---|---|
| Lap phieu nhap (nhieu dong chi tiet) | PASS | /api/phieu-nhap |
| Chi tiet phieu nhap (IMEI + phu kien) | PASS | CT_PhieuNhap |
| Tu dong sinh IMEI khi xac nhan nhap kho | PASS | Atomic — tranh trung IMEI (409) |
| Cap nhat ton kho phu kien ($inc) | PASS | TonKhoService.$inc voi $gte |
| Ghi nhan cong no NCC | PASS | CongNoService |
| Dat hang NCC (Don dat hang) | PASS | /api/don-dat-hang-ncc, RBAC Quan ly tao / Thu kho nhan |

---

### 4. BAN HANG
| Tieu chi | Trang thai | Ghi chu |
|---|---|---|
| Man hinh POS ban theo IMEI | PASS | Quet Camera (html5-qrcode) / nhap thu cong |
| Ho tro multi-tab don hang | PASS | Giu nhieu don dong thoi |
| Hoa don ban le (nhieu IMEI + phu kien) | PASS | /api/hoa-don |
| Chi tiet hoa don | PASS | CT_HoaDon_May, CT_HoaDon_PhuKien |
| Cong no khach hang | PASS | Khi chon hinh thuc thanh toan no |
| Dat truoc / Pre-order (dat coc) | PASS | /api/dat-truoc, can tru coc tu dong |
| Khuyen mai / Ma giam gia | PASS | /api/khuyen-mai, kiem tra thoi han |
| In hoa don nhiet K80/A5 | PASS | print-templates.js, mau phap quy 02-VT |

---

### 5. KHO
| Tieu chi | Trang thai | Ghi chu |
|---|---|---|
| Ton kho IMEI (State Machine 6 trang thai) | PASS | Con hang / Da ban / Bao hanh / Doi tra / Mat / Thanh ly |
| Ton kho phu kien (so luong ton) | PASS | soLuongTon |
| Kiem ke kho | PASS | /api/kiem-ke, bien ban kiem ke |
| Dieu chinh ton kho | PASS | Qua phieu kiem ke |
| Chan xuat am kho phu kien | PASS | Atomic $inc voi $gte: 0 |

---

### 6. THU CHI
| Tieu chi | Trang thai | Ghi chu |
|---|---|---|
| Phieu Thu | PASS | Tu sinh khi thanh toan hoa don, thu no, thu coc |
| Phieu Chi | PASS | Chi phi nhap hang, hoan tien doi tra |
| So quy (so du realtime) | PASS | /pages/so-quy, loc theo ngay/thang |
| Cong no (khach hang + NCC) | PASS | /api/cong-no, canh bao qua han |

---

### 7. BAO CAO
| Tieu chi | Trang thai | Ghi chu |
|---|---|---|
| Bao cao Doanh thu (bieu do Chart.js theo ngay/tuan/thang) | PASS | /api/bao-cao/doanh-thu |
| Bao cao Ton kho sap het hang (dong bo IMEI thuc te) | PASS | /api/bao-cao/sap-het-hang — vua sua bug dong bo |
| Top san pham ban chay | PASS | /api/bao-cao/top-san-pham |
| Hang ton lau ngay (> 60 ngay) | PASS | /api/bao-cao/ton-lau-ngay |
| KPI nhan vien (so hoa don, doanh thu) | PASS | /api/hoa-don/bao-cao/doanh-so-nhan-vien |

---

## YEU CAU CHAT LUONG
| Tieu chi | Trang thai | Ghi chu |
|---|---|---|
| Khong loi khi demo | PASS | 22/22 Test Suites chay on dinh |
| Khong crash | PASS | Try/catch toan bo Controller + Service |
| Khong nhap du lieu sai | PASS | Validate SDT, CCCD 12 so, email, ObjectId, gia ban > gia goc |
| Co thong bao Toast | PASS | success / danger / warning / info theo tung tinh huong |
| Co validate dau vao | PASS | Ca Frontend (HTML5 required) + Backend (Service layer) |
| XSS Prevention | PASS | escapeHtml() toan bo du lieu server render ra HTML |
| Race condition chong ban trung IMEI | PASS | Atomic findOneAndUpdate voi dieu kien trang thai, 409 Conflict |
| Stress test 1000+ IMEI + Concurrency Lock | PASS | 20 phien dong thoi, chi 1 phien thanh cong (19 phien 409) |
| RBAC Security Audit 6 vai tro | PASS | 100% thao tac trai quyen bi chan 403 Forbidden |

---

## TONG KET
| Nhom module | So tieu chi | Dat | Ty le |
|---|---|---|---|
| Dang nhap | 5 | 5 | 100% |
| Danh muc (4 loai) | 14 | 14 | 100% |
| Mua hang | 6 | 6 | 100% |
| Ban hang | 8 | 8 | 100% |
| Kho | 5 | 5 | 100% |
| Thu chi | 4 | 4 | 100% |
| Bao cao | 5 | 5 | 100% |
| Chat luong | 9 | 9 | 100% |
| **TONG** | **56** | **56** | **100%** |

> He thong dat 100% tieu chi kiem tra so 3 (vuot nguong toi thieu 90%).
> npm test: 22/22 suites PASS — 866/866 assertions PASS — 0 FAIL

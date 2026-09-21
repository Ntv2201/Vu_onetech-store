# CHECKLIST KIEM TRA SO 3 — ONE TECH STORE
> Doi chieu yeu cau he thong toi thieu 90% chuc nang theo de kiem tra so 3.

---

## MODULE BAT BUOC

### 1. DANG NHAP
| Tieu chi | Trang thai | Ghi chu |
|---|---|---|
| Dang nhap bang ten dang nhap + mat khau | PASS | /api/auth/login, bcrypt hash |
| Phien lam viec Session (dang xuat dung) | PASS | express-session |
| Sai mat khau thi thong bao loi | PASS | Toast danger |
| Phan quyen 6 vai tro (RBAC) | PASS | Quan ly / Thu kho / NV ban hang / Thu ngan / Ke toan / Ky thuat |
| Chan truy cap truc tiep URL khi chua login | PASS | Middleware requireAuth redirect login |

### 2. DANH MUC (CRUD day du)

#### 2.1 Khach Hang
| Tieu chi | Trang thai | Ghi chu |
|---|---|---|
| Xem danh sach (phan trang, tim kiem debounce) | PASS | /api/khach-hang + debounce 300ms |
| Them moi (validate SDT, CCCD, email duy nhat) | PASS | |
| Sua thong tin | PASS | |
| Xem lich su mua hang | PASS | |

#### 2.2 Nha Cung Cap
| Tieu chi | Trang thai | Ghi chu |
|---|---|---|
| CRUD day du | PASS | /api/nha-cung-cap |
| Doi soat du no NCC | PASS | Lien ket cong no |

#### 2.3 Nhan Vien
| Tieu chi | Trang thai | Ghi chu |
|---|---|---|
| CRUD day du | PASS | /api/nhan-vien |
| Gan vai tro / phan quyen | PASS | 6 vai tro |
| Khoa/mo khoa tai khoan | PASS | toggle-status |
| Doi mat khau | PASS | Hash bcrypt |

#### 2.4 Hang Hoa
| Tieu chi | Trang thai | Ghi chu |
|---|---|---|
| Quan ly model San pham (CRUD) | PASS | /api/san-pham |
| Quan ly Phu kien (CRUD + ton kho) | PASS | /api/phu-kien |
| Quan ly Danh muc / Loai hang | PASS | /api/danh-muc |
| Quan ly IMEI tung may | PASS | /api/may-imei — State Machine |

### 3. MUA HANG
| Tieu chi | Trang thai | Ghi chu |
|---|---|---|
| Lap phieu nhap (nhieu dong chi tiet) | PASS | /api/phieu-nhap |
| Chi tiet phieu nhap (IMEI + phu kien) | PASS | CT_PhieuNhap |
| Tu dong sinh IMEI khi xac nhan nhap kho | PASS | Atomic — tranh trung IMEI |
| Cap nhat ton kho phu kien ($inc) | PASS | TonKhoService |
| Ghi nhan cong no NCC | PASS | CongNoService |
| Dat hang NCC (Don dat hang) | PASS | /api/don-dat-hang-ncc |

### 4. BAN HANG
| Tieu chi | Trang thai | Ghi chu |
|---|---|---|
| Man hinh POS ban theo IMEI | PASS | Quet Camera / nhap thu cong |
| Hoa don ban le (nhieu IMEI + phu kien) | PASS | /api/hoa-don |
| Chi tiet hoa don | PASS | CT_HoaDon_May, CT_HoaDon_PhuKien |
| Cong no khach hang | PASS | Khi chon hinh thuc thanh toan no |
| Dat truoc / Pre-order (dat coc) | PASS | /api/dat-truoc |
| Khuyen mai / Ma giam gia | PASS | /api/khuyen-mai |
| In hoa don nhiet | PASS | print-templates.js |
| Giu don tam (multi-tab don hang) | PASS | POS multi-order tabs |

### 5. KHO
| Tieu chi | Trang thai | Ghi chu |
|---|---|---|
| Ton kho IMEI (con hang, da ban, bao hanh...) | PASS | State Machine: Con hang / Da ban / Bao hanh / Doi tra / Mat / Thanh ly |
| Ton kho phu kien (so luong ton) | PASS | soLuongTon |
| Kiem ke kho | PASS | /api/kiem-ke |
| Dieu chinh ton kho | PASS | Qua phieu kiem ke |
| Chan xuat am kho phu kien | PASS | Atomic $inc voi dieu kien $gte |

### 6. THU CHI
| Tieu chi | Trang thai | Ghi chu |
|---|---|---|
| Phieu Thu | PASS | Tu sinh khi thanh toan hoa don |
| Phieu Chi | PASS | Chi phi nhap hang, hoan tien |
| So quy (so du realtime) | PASS | /pages/so-quy |
| Cong no (khach hang + NCC) | PASS | /api/cong-no |

### 7. BAO CAO
| Tieu chi | Trang thai | Ghi chu |
|---|---|---|
| Bao cao Doanh thu (bieu do theo ngay/tuan/thang) | PASS | /api/bao-cao/doanh-thu |
| Bao cao Ton kho (sap het hang dong bo IMEI) | PASS | /api/bao-cao/sap-het-hang |
| Top san pham ban chay | PASS | /api/bao-cao/top-san-pham |
| Hang ton lau ngay | PASS | /api/bao-cao/ton-lau-ngay |
| KPI nhan vien | PASS | /api/hoa-don/bao-cao/doanh-so-nhan-vien |

---

## YEU CAU CHAT LUONG
| Tieu chi | Trang thai | Ghi chu |
|---|---|---|
| Khong loi khi demo | PASS | Toan bo module on dinh |
| Khong crash | PASS | Try/catch toan bo Controller + Service |
| Khong nhap du lieu sai | PASS | Validate SDT, CCCD 12 so, email, ObjectId |
| Co thong bao Toast | PASS | success / danger / warning / info |
| Co validate dau vao | PASS | Ca Frontend + Backend (Service layer) |
| XSS Prevention | PASS | escapeHtml() toan bo du lieu server render |
| Race condition chong ban trung IMEI | PASS | Atomic findOneAndUpdate voi dieu kien trang thai |

---

## TONG KET
| Nhom module | So tieu chi | Dat | Ty le |
|---|---|---|---|
| Dang nhap | 5 | 5 | 100% |
| Danh muc (4 loai) | 12 | 12 | 100% |
| Mua hang | 6 | 6 | 100% |
| Ban hang | 8 | 8 | 100% |
| Kho | 5 | 5 | 100% |
| Thu chi | 4 | 4 | 100% |
| Bao cao | 5 | 5 | 100% |
| Chat luong | 7 | 7 | 100% |
| **TONG** | **52** | **52** | **100%** |

> He thong dat ~100% chuc nang yeu cau Kiem tra so 3 (vuot nguong toi thieu 90%).

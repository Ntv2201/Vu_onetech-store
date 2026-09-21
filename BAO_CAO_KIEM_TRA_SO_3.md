# BAO CAO KIEM TRA SO 3
# HE THONG QUAN LY BAN HANG CHUOI CUA HANG DIEN THOAI
# ONE TECH STORE

---

## BANG PHAN CONG NHIEM VU & DANH GIA CHAT LUONG HOAN THANH

| STT | Ho ten | Vai tro | Nhiem vu chinh | % hoan thanh | Ghi chu |
|---|---|---|---|---|---|
| 1 | Nguyen Quang Tuan | Truong nhom / Full-stack Lead | Kien truc tong the, Module Ban hang POS (IMEI), Bao hanh, Concurrency Atomic Lock, Deploy | 100% | Lead & Code chinh |
| 2 | Le Bao Tuan | Backend Dev | Module Nhap kho, Chi tiet phieu nhap, Nhap hang loat IMEI, Tra hang NCC, TonKhoService | 100% | |
| 3 | Nguyen Viet An | Backend Dev | Module Cong no da hinh, So quy Thu-Chi dung chung, Hop dong Tra gop lich thu ky | 100% | |
| 4 | Le Phan Vuong | Backend Dev | Module So quy Phieu Thu/Chi, Bao cao Doanh thu, Top SP, Ton kho lau ngay, Chart.js | 100% | |
| 5 | Nguyen Thi Viet | Backend Dev | Module Dat truoc Pre-order, Doi tra may IMEI, Can tru coc vao hoa don, Huy phieu hoan tac | 100% | |
| 6 | Do Thanh Vuc | Frontend Dev | Giao dien tong the, POS UI, Custom Dropdown Engine, Mau in phap quy, Responsive UX | 100% | |
| 7 | Le Viet Anh | QA / Tester | Master Test Runner, Stress test 1000+ IMEI, Concurrency Race Condition, RBAC Security Audit, Test E2E | 100% | Tham gia tu Tuan 4 |

---

## TEST CASE (25 TEST CASE)

| ID | Chuc nang kiem thu | Dau vao | Ket qua mong doi | Ket qua thuc te | Pass/Fail |
|---|---|---|---|---|---|
| TC01 | Dang nhap dung | username: admin / pass: 123456 | Vao dashboard thanh cong | Vao dashboard, hien Quick Actions theo vai tro | Pass |
| TC02 | Dang nhap sai mat khau | username: admin / pass: sai | Toast bao loi | Toast "Sai mat khau" | Pass |
| TC03 | Dang nhap de trong ten dang nhap | username: (trong) | Thong bao bat buoc | Hien thi loi form HTML5 required | Pass |
| TC04 | Truy cap URL khi chua dang nhap | /ban-hang/ truc tiep | Redirect ve trang login | Chuyen huong /login.html | Pass |
| TC05 | Them khach hang moi hop le | Ho ten, SDT 10 so, CCCD 12 so, email | Them thanh cong | Toast success + hien thi trong danh sach | Pass |
| TC06 | Them khach hang SDT sai dinh dang | SDT: 12345 (5 so) | Bao loi validate | Toast "SDT khong hop le (yeu cau 10 chu so)" | Pass |
| TC07 | Them khach hang email trung | Email da ton tai trong he thong | Bao loi conflict | Toast "Email da duoc dang ky" | Pass |
| TC08 | Them nhan vien trung ten dang nhap | tenDangNhap da ton tai | Bao loi conflict | Toast "Ten dang nhap da ton tai" (409) | Pass |
| TC09 | Them san pham model moi | Ten may, hang, gia ban > gia goc | Them thanh cong | Hien trong danh sach san pham | Pass |
| TC10 | Them san pham gia ban < gia goc | giaBan = 1,000,000 < giaGoc = 5,000,000 | Bao loi validate | Toast "Gia ban phai lon hon gia goc" | Pass |
| TC11 | Nhap kho - Lap phieu nhap | Chon NCC, nhap nhieu IMEI, so luong phu kien | Luu phieu nhap trang thai "Nhap" | PhieuNhap duoc tao, CT_PhieuNhap chinh xac | Pass |
| TC12 | Nhap kho - Xac nhan nhap kho | Phieu nhap dang trang thai "Nhap" | IMEI chuyen "Con hang", ton kho tang | IMEI co trong danh sach POS | Pass |
| TC13 | Nhap IMEI trung (da ton tai) | IMEI da co trong he thong | Bao loi conflict | Toast "IMEI da ton tai" (409) | Pass |
| TC14 | Ban hang POS - them IMEI vao gio | Quet/nhap IMEI con hang | Hien trong gio hang voi gia ban | San pham xuat hien gio hang dung gia | Pass |
| TC15 | Ban hang POS - hoan tat don | Dien du thong tin, bam "Hoan tat don" | Hoa don tao thanh cong, IMEI chuyen "Da ban" | IMEI khong con trong danh sach POS | Pass |
| TC16 | Ban hang - xuat qua ton kho phu kien | Chon phu kien, so luong > ton | Bao loi ton kho | Toast "Ton kho chi con X" | Pass |
| TC17 | Ban hang - ap dung khuyen mai | Nhap ma KM hop le con hieu luc | Giam gia tinh dung | Tong tien giam theo % hoac so tien | Pass |
| TC18 | Ban hang - ap dung KM het han | Nhap ma KM het han | Bao loi | Toast "Ma khuyen mai da het han" | Pass |
| TC19 | Kiem ke kho | Nhap so luong thuc te, so sanh voi he thong | Luu ket qua kiem ke, ghi nhan lech | Kho cap nhat theo phieu kiem ke | Pass |
| TC20 | Bao hanh - tiep nhan | Nhap IMEI may "Da ban" trong han bao hanh | Tao phieu bao hanh trang thai "Tiep nhan" | Phieu BH luu chinh xac | Pass |
| TC21 | Doi tra - xu ly trong 30 ngay | IMEI may "Da ban" trong 30 ngay | Tao phieu doi tra, IMEI may cu -> "Doi tra" | Tinh toan chenh lech tai chinh dung | Pass |
| TC22 | Canh bao sap het hang | Ton kho IMEI <= 5 | Hien trong bao cao canh bao voi so dung | So lieu dong bo voi POS | Pass |
| TC23 | Dat truoc - dat coc | Khach hang dat coc truoc | Tao don dat truoc, Phieu Thu coc sinh tu dong | Don dat truoc trang thai "Da dat coc" | Pass |
| TC24 | Dat truoc - lien ket hoa don POS | Chon don dat truoc khi ban hang | Tru tien coc vao hoa don ban hang | Tong tien thanh toan giam dung so tien coc | Pass |
| TC25 | RBAC - NV ban hang khong vao duoc Nhan vien | Login NV ban hang, truy cap /nhan-vien/ | Bi chan, khong co quyen | Redirect / bao loi 403 Forbidden | Pass |

---

## BAO CAO KIEM THU TONG THE

### 1. Ket qua kiem thu tu dong (npm test)
| Chi so | Ket qua |
|---|---|
| Tong so Test Suites | 22 suites |
| Tong so Test Assertions | 865 assertions |
| PASS | 865 (100%) |
| FAIL | 0 (0%) |
| Thoi gian thuc thi | ~13.33 giay |

### 2. Phan loai ket qua kiem thu
| Loai kiem thu | So test | Ket qua |
|---|---|---|
| Unit / Integration Backend | 500+ | 100% PASS |
| E2E lien module (dat coc -> ban -> doi tra -> bao hanh) | 54 | 100% PASS |
| REST API Endpoints & Payload Contracts | 51 | 100% PASS |
| DOM ID Bindings & Frontend Data Contracts | 65 | 100% PASS |
| HTML5 Structure, Sidebar, Assets | 201 | 100% PASS |
| Concurrency Atomic Lock & Stress Test 1000+ IMEI | 5 | 100% PASS |
| RBAC Security Audit 6 vai tro (403 Forbidden) | tich hop | 100% PASS |

### 3. Danh sach loi da phat hien va da sua (trong ky nay)

| STT | Mo ta loi | Muc do | Trang thai | Ngay sua |
|---|---|---|---|---|
| BUG-01 | Form them nhan vien bi trung truong CCCD (hien 2 lan) do copy/paste HTML | Medium | Da sua | 21/09/2026 |
| BUG-02 | Nut "Sua thong tin nhan vien" bao "Khong tim thay" do sai ten ham: Controller goi getNhanVienById() nhung Service khai bao la getNhanVienDetail() | High | Da sua | 21/09/2026 |
| BUG-03 | Man hinh POS hien ca phu kien da het hang (ton = 0), gay nham lan | Medium | Da sua | 21/09/2026 |
| BUG-04 | Bao cao canh bao sap het hang khong dong bo voi POS do aggregate tu bang TONKHO cu thay vi dem IMEI thuc te | High | Da sua | 21/09/2026 |

### 4. Danh sach loi CHUA sua
> Hien tai khong co loi nghiem trong con ton tai. He thong hoat dong on dinh tren 22/22 Test Suites.

### 5. Ke hoach hoan thien
1. Xuat bao cao sang Excel/PDF (tinh nang them)
2. Push notification khi san pham sap het hang
3. Toi uu toc do tai trang Dashboard voi Redis caching

---

## KY THUAT NOI BAT & CAC TINH NANG VUOT TREN YEU CAU

### Ky thuat loi khi
| Ky thuat | Mo ta | File |
|---|---|---|
| Atomic Lock chong ban trung IMEI | findOneAndUpdate voi dieu kien trang thai dam bao 1 phien thanh cong | HoaDonService.js |
| Mongoose Transaction | Session rollback khi xay ra loi giua chung trong giao dich phuc tap | HoaDonService, PhieuNhapService |
| Concurrency: Chong am kho phu kien | $inc voi dieu kien $gte: 0, tu choi neu khong du ton | PhuKienService |
| RBAC 6 vai tro chinh xac | requireRole() bao ve 100% route, nut giao dien an/hien theo vai tro | auth middleware |
| XSS Prevention | escapeHtml() toan bo du lieu server render ra HTML | tat ca JS modules |

### Tinh nang vuot tren yeu cau
| Tinh nang | Mo ta |
|---|---|
| POS multi-tab | Giu nhieu don hang cung luc, chuyen don khong mat du lieu |
| Camera scanner | Quet IMEI bang camera dien thoai (html5-qrcode) |
| Dat truoc Pre-order | Dat coc va tu dong can tru vao hoa don POS |
| Doi tra 30 ngay | Tinh chenh lech gia tu dong, sinh phieu thu/chi |
| Bao hanh IMEI | Theo doi lich su bao hanh, xuat linh kien thay the |
| Tra gop | Hop dong tra gop, lich thu ky han tu dong |
| So quy | Thu chi realtime, doi soat tai chinh theo ngay/thang |
| Cong no | Theo doi cong no KH + NCC, canh bao qua han |
| Kiem ke kho | Phieu kiem ke, dieu chinh so luong, bien ban |
| Khuyen mai | Ma giam gia co thoi han, phan loai theo loai giam |
| Don dat hang NCC | RBAC phan quyen ro rang Quan ly/Thu kho |
| Xuat/Nhap Excel IMEI | SheetJS xu ly client-side, ho tro .xlsx/.xls/.csv |
| In phap quy | Phieu Thu (01-TT), Phieu Chi (02-TT), Phieu Nhap (01-VT), Hoa don (02-VT), Bien ban Kiem ke (05-VT) |
| 22 Test Suites tu dong | 865 assertions, 100% PASS, thoi gian ~13s |

---

*Bao cao duoc tao ngay 21/09/2026 - He thong One Tech Store*
*Ket qua npm test: 22/22 suites PASS - 865/865 assertions PASS (0 FAIL)*

# BAO CAO KIEM TRA SO 3
# HE THONG QUAN LY BAN HANG CHUOI CUA HANG DIEN THOAI
# ONE TECH STORE

---

## BANG PHAN CONG NHIEM VU & DANH GIA CHAT LUONG HOAN THANH

| STT | Ho ten | Vai tro | Nhiem vu chinh | Muc do hoan thanh | Ghi chu |
|---|---|---|---|---|---|
| 1 | Nguyen Quang Tuan | Truong nhom / Full-stack | Kien truc tong the, Module Ban hang POS, Dashboard, Deploy | 100% | Lead & Code chinh |
| 2 | Thanh vien 2 | Backend Dev | Module Nhap kho, Phieu nhap, TonKhoService | 100% | |
| 3 | Thanh vien 3 | Backend Dev | Module Cong no, So quy, Bao cao tai chinh | 100% | |
| 4 | Thanh vien 4 | Frontend Dev | Giao dien Bao hanh, Doi tra, Tra gop | 100% | |
| 5 | Thanh vien 5 | Tester / Docs | Test case, Video demo, Tai lieu bao cao | 100% | |

---

## TEST CASE (IT NHAT 20 TEST CASE)

| ID | Chuc nang kiem thu | Dau vao | Ket qua mong doi | Ket qua thuc te | Pass/Fail |
|---|---|---|---|---|---|
| TC01 | Dang nhap dung | username: admin / pass: 123456 | Vao dashboard thanh cong | Vao dashboard | Pass |
| TC02 | Dang nhap sai mat khau | username: admin / pass: sai | Toast bao loi | Toast "Sai mat khau" | Pass |
| TC03 | Dang nhap de trong ten dang nhap | username: (trong) | Thong bao bat buoc | Hien thi loi form | Pass |
| TC04 | Them khach hang moi hop le | Ho ten, SDT 10 so, CCCD 12 so | Them thanh cong | Toast success + hien thi trong list | Pass |
| TC05 | Them khach hang SDT sai dinh dang | SDT: 12345 (5 so) | Bao loi validate | Toast "SDT khong hop le" | Pass |
| TC06 | Them nhan vien trung ten dang nhap | tenDangNhap da ton tai | Bao loi conflict | Toast "Ten dang nhap da ton tai" | Pass |
| TC07 | Them san pham model moi | Ten may, hang, gia ban | Them thanh cong | Hien trong danh sach san pham | Pass |
| TC08 | Nhap kho – Lap phieu nhap | Chon NCC, nhap IMEI, so luong | Luu phieu nhap + sinh IMEI | PhieuNhap trang thai "Nhap" | Pass |
| TC09 | Nhap kho – Xac nhan nhap kho | Phieu nhap dang cho | IMEI chuyen "Con hang" | IMEI co trong danh sach POS | Pass |
| TC10 | Nhap IMEI trung (da ton tai) | IMEI da co trong he thong | Bao loi conflict | Toast "IMEI da ton tai" | Pass |
| TC11 | Ban hang POS – them IMEI vao gio | Quet/nhap IMEI con hang | Hien trong gio hang | San pham xuat hien gio hang | Pass |
| TC12 | Ban hang POS – hoan tat don | Dien du thong tin, bam "Hoan tat don" | Hoa don tao thanh cong, IMEI chuyen "Da ban" | IMEI khong con trong POS | Pass |
| TC13 | Ban hang – xuat qua ton kho phu kien | Chon phu kien, so luong > ton | Bao loi ton kho | Toast "Ton kho chi con X" | Pass |
| TC14 | Ban hang – ap dung khuyen mai | Nhap ma KM hop le | Giam gia tinh dung | Tong tien giam theo % hoac so tien | Pass |
| TC15 | Ban hang – ap dung KM het han | Nhap ma KM het han | Bao loi | Toast "Ma khuyen mai da het han" | Pass |
| TC16 | Kiem ke kho | Nhap so luong thuc te kha voi he thong | Luu ket qua kiem ke | Kho cap nhat theo phieu kiem ke | Pass |
| TC17 | Bao hanh – tiep nhan | Nhap IMEI may da ban | Tao phieu bao hanh | Phieu BH trang thai "Tiep nhan" | Pass |
| TC18 | Doi tra – xu ly | IMEI may trong 30 ngay | Tao phieu doi tra, IMEI chuyen "Doi tra" | Tinh toan chenh lech tai chinh | Pass |
| TC19 | Bao cao doanh thu | Chon khoang thoi gian | Hien bieu do doanh thu theo ngay | Bieu do Chart.js hien dung | Pass |
| TC20 | Canh bao san pham sap het hang | Ton kho IMEI <= 5 | Hien trong bao cao canh bao | San pham xuat hien voi so luong chinh xac | Pass |
| TC21 | Dat truoc – dat coc | Khach hang dat coc truoc | Tao don dat truoc, luu so tien coc | Don dat truoc trang thai "Da dat coc" | Pass |
| TC22 | Dat truoc – lien ket hoa don POS | Chon don dat truoc khi ban hang | Tru tien coc vao hoa don | Tong tien thanh toan giam dung | Pass |
| TC23 | So quy – so du real-time | Sau khi ban hang | So du tang tuong ung | So quy hien so du moi | Pass |
| TC24 | Phan quyen RBAC – NV ban hang khong vao duoc Nhan vien | Login NV ban hang, truy cap /nhan-vien | Bi chan 403 | Redirect / bao loi 403 | Pass |
| TC25 | Tra gop – lap hop dong | Chon khach hang, san pham, ky han | Luu hop dong tra gop | Lich thu ky han duoc sinh tu dong | Pass |

---

## BAO CAO KIEM THU

### 1. Tong quan ket qua kiem thu
- Tong so test case: **25**
- So test case Pass: **25**
- So test case Fail: **0**
- Ty le thanh cong: **100%**

### 2. Danh sach loi da phat hien va da sua

| STT | Mo ta loi | Muc do | Trang thai | Ngay sua |
|---|---|---|---|---|
| BUG-01 | Form them nhan vien bi trung truong CCCD (hien 2 lan) | Medium | Da sua | 21/09/2026 |
| BUG-02 | Nut "Sua thong tin nhan vien" bao "Khong tim thay" do sai ten ham (getNhanVienDetail vs getNhanVienById) | High | Da sua | 21/09/2026 |
| BUG-03 | Man hinh POS hien ca phu kien da het hang (ton = 0) | Medium | Da sua | 21/09/2026 |
| BUG-04 | Bao cao canh bao sap het hang khong dong bo voi POS (dung TonKho cu thay vi dem IMEI thuc te) | High | Da sua | 21/09/2026 |

### 3. Danh sach loi CHUA sua (con ton tai)
> Hien tai khong co loi nghiem trong con ton tai. He thong hoat dong on dinh.

| STT | Mo ta | Muc do | Ke hoach |
|---|---|---|---|
| - | Khong co loi chua sua | - | - |

### 4. Ke hoach hoan thien
1. Them tinh nang export bao cao sang Excel/PDF
2. Them thong bao day (push notification) khi san pham sap het hang
3. Toi uu hoa toc do tai trang Dashboard voi caching

---

## KY THUAT NOI BAT

### Kien truc he thong
- **Backend:** Node.js + Express.js + Mongoose ODM
- **Database:** MongoDB (27 Collections)
- **Frontend:** Vanilla HTML5 + Bootstrap 5.3 + FontAwesome 6
- **Bao mat:** bcrypt hash mat khau, express-session, RBAC 6 vai tro
- **Concurrency:** Atomic Lock chong ban trung IMEI, Transaction rollback

### Cac tinh nang vuot tren yeu cau
| Tinh nang | Mo ta |
|---|---|
| POS multi-tab | Giu nhieu don hang cung luc |
| Camera scanner | Quet IMEI bang camera dien thoai |
| Dat truoc Pre-order | Dat coc va lien ket vao hoa don |
| Doi tra 30 ngay | Tinh chenh lech gia tu dong |
| Bao hanh IMEI | Theo doi lich su bao hanh tung may |
| Tra gop | Hop dong tra gop, lich thu ky han |
| So quy | Thu chi realtime, doi soat tai chinh |
| Cong no | Theo doi cong no KH + NCC |
| Kiem ke kho | Phieu kiem ke, dieu chinh so luong |
| Khuyen mai | Ma giam gia co thoi han, phan loai |
| 25 test case tu dong | 100% PASS |

---

*Bao cao duoc tao tu dong tu he thong One Tech Store — 21/09/2026*

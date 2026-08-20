# MÔ TẢ CƠ SỞ DỮ LIỆU — ONE TECH STORE

Ghi chú: bảng gốc trong báo cáo có 27 bảng. Đã bỏ **DOITACTAICHINH** (đối tác tài chính bên thứ 3) theo quyết định trả góp quản lý nội bộ → còn **26 bảng**.

| STT | Tên bảng | Nhóm | Các trường chính |
|---|---|---|---|
| 1 | NHANVIEN | Danh mục | MaNV(PK), HoTen, SDT, VaiTro, TenDangNhap, MatKhau |
| 2 | KHACHHANG | Danh mục | MaKH(PK), HoTen, SDT, DiaChi |
| 3 | NHACUNGCAP | Danh mục | MaNCC(PK), TenNCC, SDT, DiaChi |
| 4 | DANHMUC | Danh mục | MaDM(PK), TenDanhMuc |
| 5 | SANPHAM | Sản phẩm | MaSP(PK), MaDM(FK), TenMay, Hang, GiaBan |
| 6 | MAY_IMEI | Sản phẩm | IMEI(PK), MaSP(FK), GiaNhap, TrangThai |
| 7 | PHUKIEN | Sản phẩm | MaPK(PK), MaDM(FK), TenPK, GiaBan, SoLuongTon |
| 8 | LINHKIEN | Sản phẩm | MaLK(PK), TenLK, DonGia, SoLuongTon |
| 9 | DONDATHANGTRUOC | Bán hàng | MaDat(PK), MaKH(FK), MaSP(FK), IMEI(FK), SoTienCoc, HanLay, TrangThai |
| 10 | HOADON | Bán hàng | SoHD(PK), MaKH(FK), MaNV(FK), MaDat(FK), NgayLap, TongTien, TrangThai, HanThanhToan |
| 11 | CT_HOADON_MAY | Bán hàng | MaCTM(PK), SoHD(FK), IMEI(FK), DonGiaBan |
| 12 | CT_HOADON_PHUKIEN | Bán hàng | MaCT(PK), SoHD(FK), MaPK(FK), SoLuong |
| 13 | HOPDONGTRAGOP | Bán hàng | MaHDTG(PK), SoHD(FK), SoTienTraGop, SoKy, TrangThaiDuyet *(đã bỏ FK bên thứ 3)* |
| 14 | CONGNO | Thanh toán | MaCN(PK), LoaiDoiTuong, MaKH(FK), MaNCC(FK), SoHD(FK), MaPN(FK), SoTienNo, SoTienDaTra, TrangThai |
| 15 | PHIEUTHU | Thanh toán | MaPT(PK), SoHD(FK), MaDat(FK), MaCN(FK), SoTien, NgayThu |
| 16 | PHIEUNHAP | Mua hàng | MaPN(PK), MaNCC(FK), MaNV(FK), NgayNhap |
| 17 | CT_PHIEUNHAP | Mua hàng | MaCTN(PK), MaPN(FK), IMEI(FK), DonGiaNhap |
| 18 | PHIEUCHI | Mua hàng | MaPC(PK), MaPN(FK), MaDT(FK), SoTien, NgayChi, LyDo |
| 19 | KHO | Kho | MaKho(PK), TenKho |
| 20 | TONKHO | Kho | MaTonKho(PK), MaKho(FK), MaSP(FK), SoLuong |
| 21 | PHIEUXUATKHO | Kho | MaPX(PK), SoHD(FK), LyDoXuat |
| 22 | BIENBANKIEMKE | Kho | MaBB(PK), MaKho(FK), Ngay |
| 23 | DIEUCHINHKHO | Kho | MaDC(PK), MaBB(FK), SoLuongDC |
| 24 | PHIEUBAOHANH | Bảo hành | MaPBH(PK), IMEI(FK), MaKH(FK), MaNV(FK), MoTaLoi, NgayTiepNhan, TrangThai |
| 25 | CT_PBH_LINHKIEN | Bảo hành | MaCTB(PK), MaPBH(FK), MaLK(FK), SoLuong |
| 26 | PHIEUDOITRA | Bảo hành/Đổi trả | MaDT(PK), SoHD(FK), IMEI(FK), LyDo, NgayDoiTra, TrangThai |

## Quan hệ chính giữa các nhóm bảng

**Danh mục & Sản phẩm:** DANHMUC (1-N) SANPHAM/PHUKIEN. SANPHAM (1-N) MAY_IMEI — mỗi model có nhiều máy vật lý, mỗi máy 1 IMEI riêng. Đây là quan hệ cốt lõi, mọi giao dịch (bán/nhập/bảo hành/đổi trả) đều truy vết theo IMEI.

**Mua hàng & Nhập kho:** NHACUNGCAP (1-N) PHIEUNHAP (1-N) CT_PHIEUNHAP, mỗi dòng CT_PHIEUNHAP ứng đúng 1 IMEI. PHIEUNHAP (1-N) PHIEUCHI.

**Bán hàng:** KHACHHANG/NHANVIEN (1-N) HOADON. DONDATHANGTRUOC (1-N) HOADON (tùy chọn). HOADON tách 2 bảng chi tiết: CT_HOADON_MAY (theo IMEI, luôn số lượng = 1) và CT_HOADON_PHUKIEN (theo số lượng).

**Thanh toán & Công nợ:** HOADON (1-N) PHIEUTHU. HOADON (1-1) HOPDONGTRAGOP (nay quản lý nội bộ). CONGNO dùng FK đa hình (LoaiDoiTuong) trỏ tới KHACHHANG hoặc NHACUNGCAP — không ràng buộc cứng ở tầng CSDL, kiểm soát ở tầng ứng dụng.

**Kho vận & Bảo hành:** HOADON (1-N) PHIEUXUATKHO. KHO (1-N) BIENBANKIEMKE (1-N) DIEUCHINHKHO. MAY_IMEI (1-N) PHIEUBAOHANH (1-N) CT_PBH_LINHKIEN.

## File đi kèm
- `one_tech_store_schema.sql` — dump SQL đầy đủ (MySQL, InnoDB, utf8mb4), tạo được toàn bộ 26 bảng + FK.
- `one_tech_store_erd.dbml` — dán vào https://dbdiagram.io để xem sơ đồ ERD trực quan.

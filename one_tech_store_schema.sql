-- =========================================================
-- ONE TECH STORE - DATABASE SCHEMA (MySQL 8.x)
-- Dựa theo thiết kế 27 bảng trong báo cáo, ĐÃ CẬP NHẬT theo
-- quyết định gần nhất: bỏ bảng DOITACTAICHINH (bên thứ 3),
-- trả góp (HOPDONGTRAGOP) quản lý nội bộ -> còn 26 bảng.
-- Charset utf8mb4 để lưu tiếng Việt có dấu không lỗi.
-- =========================================================

SET FOREIGN_KEY_CHECKS = 0;
SET NAMES utf8mb4;

-- =====================
-- 1. NHÓM DANH MỤC GỐC (không phụ thuộc bảng khác)
-- =====================

CREATE TABLE NHANVIEN (
    MaNV        INT AUTO_INCREMENT PRIMARY KEY,
    HoTen       VARCHAR(100) NOT NULL,
    SDT         VARCHAR(15),
    VaiTro      VARCHAR(50) NOT NULL,      -- Quản lý/Thủ kho/NV bán hàng/Thu ngân/Kế toán/Kỹ thuật
    TenDangNhap VARCHAR(50) NOT NULL UNIQUE,
    MatKhau     VARCHAR(255) NOT NULL      -- lưu hash, không lưu plain text
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE KHACHHANG (
    MaKH    INT AUTO_INCREMENT PRIMARY KEY,
    HoTen   VARCHAR(100) NOT NULL,
    SDT     VARCHAR(15),
    DiaChi  VARCHAR(255)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE NHACUNGCAP (
    MaNCC   INT AUTO_INCREMENT PRIMARY KEY,
    TenNCC  VARCHAR(150) NOT NULL,
    SDT     VARCHAR(15),
    DiaChi  VARCHAR(255)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE DANHMUC (
    MaDM        INT AUTO_INCREMENT PRIMARY KEY,
    TenDanhMuc  VARCHAR(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE LINHKIEN (
    MaLK        INT AUTO_INCREMENT PRIMARY KEY,
    TenLK       VARCHAR(150) NOT NULL,
    DonGia      DECIMAL(15,2) NOT NULL DEFAULT 0,
    SoLuongTon  INT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE KHO (
    MaKho   INT AUTO_INCREMENT PRIMARY KEY,
    TenKho  VARCHAR(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================
-- 2. NHÓM SẢN PHẨM (phụ thuộc DANHMUC)
-- =====================

CREATE TABLE SANPHAM (
    MaSP    INT AUTO_INCREMENT PRIMARY KEY,
    MaDM    INT NOT NULL,
    TenMay  VARCHAR(150) NOT NULL,
    Hang    VARCHAR(50),
    GiaBan  DECIMAL(15,2) NOT NULL DEFAULT 0,
    CONSTRAINT fk_sanpham_danhmuc FOREIGN KEY (MaDM) REFERENCES DANHMUC(MaDM)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE PHUKIEN (
    MaPK        INT AUTO_INCREMENT PRIMARY KEY,
    MaDM        INT NOT NULL,
    TenPK       VARCHAR(150) NOT NULL,
    GiaBan      DECIMAL(15,2) NOT NULL DEFAULT 0,
    SoLuongTon  INT NOT NULL DEFAULT 0,
    CONSTRAINT fk_phukien_danhmuc FOREIGN KEY (MaDM) REFERENCES DANHMUC(MaDM)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Mỗi máy vật lý = 1 dòng riêng, truy vết theo IMEI (không gộp số lượng)
CREATE TABLE MAY_IMEI (
    IMEI      VARCHAR(20) PRIMARY KEY,
    MaSP      INT NOT NULL,
    GiaNhap   DECIMAL(15,2) NOT NULL,
    TrangThai VARCHAR(30) NOT NULL DEFAULT 'Con hang',  -- Con hang / Da ban / Bao hanh / Loi
    CONSTRAINT fk_may_sanpham FOREIGN KEY (MaSP) REFERENCES SANPHAM(MaSP)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================
-- 3. NHÓM MUA HÀNG & NHẬP KHO
-- =====================

CREATE TABLE PHIEUNHAP (
    MaPN     INT AUTO_INCREMENT PRIMARY KEY,
    MaNCC    INT NOT NULL,
    MaNV     INT NOT NULL,
    NgayNhap DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_phieunhap_ncc FOREIGN KEY (MaNCC) REFERENCES NHACUNGCAP(MaNCC),
    CONSTRAINT fk_phieunhap_nv  FOREIGN KEY (MaNV)  REFERENCES NHANVIEN(MaNV)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE CT_PHIEUNHAP (
    MaCTN     INT AUTO_INCREMENT PRIMARY KEY,
    MaPN      INT NOT NULL,
    IMEI      VARCHAR(20) NOT NULL,
    DonGiaNhap DECIMAL(15,2) NOT NULL,
    CONSTRAINT fk_ctphieunhap_pn   FOREIGN KEY (MaPN) REFERENCES PHIEUNHAP(MaPN),
    CONSTRAINT fk_ctphieunhap_imei FOREIGN KEY (IMEI) REFERENCES MAY_IMEI(IMEI)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE PHIEUCHI (
    MaPC    INT AUTO_INCREMENT PRIMARY KEY,
    MaPN    INT NOT NULL,
    MaDT    INT,                          -- Mã đối tượng chi (NCC...), tuỳ hệ thống định nghĩa thêm
    SoTien  DECIMAL(15,2) NOT NULL,
    NgayChi DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    LyDo    VARCHAR(255),
    CONSTRAINT fk_phieuchi_pn FOREIGN KEY (MaPN) REFERENCES PHIEUNHAP(MaPN)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================
-- 4. NHÓM BÁN HÀNG
-- =====================

CREATE TABLE DONDATHANGTRUOC (
    MaDat      INT AUTO_INCREMENT PRIMARY KEY,
    MaKH       INT NOT NULL,
    MaSP       INT NOT NULL,
    IMEI       VARCHAR(20),
    SoTienCoc  DECIMAL(15,2) DEFAULT 0,
    HanLay     DATE,
    TrangThai  VARCHAR(30) NOT NULL DEFAULT 'Cho xu ly',
    CONSTRAINT fk_dat_kh   FOREIGN KEY (MaKH) REFERENCES KHACHHANG(MaKH),
    CONSTRAINT fk_dat_sp   FOREIGN KEY (MaSP) REFERENCES SANPHAM(MaSP),
    CONSTRAINT fk_dat_imei FOREIGN KEY (IMEI) REFERENCES MAY_IMEI(IMEI)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE HOADON (
    SoHD          INT AUTO_INCREMENT PRIMARY KEY,
    MaKH          INT,
    MaNV          INT NOT NULL,
    MaDat         INT,
    NgayLap       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    TongTien      DECIMAL(15,2) NOT NULL DEFAULT 0,
    TrangThai     VARCHAR(30) NOT NULL DEFAULT 'Da thanh toan', -- Da thanh toan / Cong no / Da huy
    HanThanhToan  DATE,
    CONSTRAINT fk_hd_kh  FOREIGN KEY (MaKH)  REFERENCES KHACHHANG(MaKH),
    CONSTRAINT fk_hd_nv  FOREIGN KEY (MaNV)  REFERENCES NHANVIEN(MaNV),
    CONSTRAINT fk_hd_dat FOREIGN KEY (MaDat) REFERENCES DONDATHANGTRUOC(MaDat)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE CT_HOADON_MAY (
    MaCTM     INT AUTO_INCREMENT PRIMARY KEY,
    SoHD      INT NOT NULL,
    IMEI      VARCHAR(20) NOT NULL UNIQUE,   -- 1 IMEI chỉ bán 1 lần
    DonGiaBan DECIMAL(15,2) NOT NULL,
    CONSTRAINT fk_ctm_hd   FOREIGN KEY (SoHD) REFERENCES HOADON(SoHD),
    CONSTRAINT fk_ctm_imei FOREIGN KEY (IMEI) REFERENCES MAY_IMEI(IMEI)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE CT_HOADON_PHUKIEN (
    MaCT    INT AUTO_INCREMENT PRIMARY KEY,
    SoHD    INT NOT NULL,
    MaPK    INT NOT NULL,
    SoLuong INT NOT NULL DEFAULT 1,
    CONSTRAINT fk_ctpk_hd FOREIGN KEY (SoHD) REFERENCES HOADON(SoHD),
    CONSTRAINT fk_ctpk_pk FOREIGN KEY (MaPK) REFERENCES PHUKIEN(MaPK)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Trả góp quản lý NỘI BỘ, không còn FK tới đối tác tài chính bên thứ 3
CREATE TABLE HOPDONGTRAGOP (
    MaHDTG        INT AUTO_INCREMENT PRIMARY KEY,
    SoHD          INT NOT NULL UNIQUE,
    SoTienTraGop  DECIMAL(15,2) NOT NULL,
    SoKy          INT NOT NULL,
    TrangThaiDuyet VARCHAR(30) NOT NULL DEFAULT 'Da duyet',
    CONSTRAINT fk_hdtg_hd FOREIGN KEY (SoHD) REFERENCES HOADON(SoHD)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================
-- 5. NHÓM THANH TOÁN & CÔNG NỢ
-- =====================

-- CONGNO dùng FK đa hình (LoaiDoiTuong) theo quyết định trước đó
-- (không ràng buộc cứng ở tầng CSDL, kiểm soát ở tầng ứng dụng)
CREATE TABLE CONGNO (
    MaCN          INT AUTO_INCREMENT PRIMARY KEY,
    LoaiDoiTuong  ENUM('KhachHang','NhaCungCap') NOT NULL,
    MaKH          INT,
    MaNCC         INT,
    SoHD          INT,
    MaPN          INT,
    SoTienNo      DECIMAL(15,2) NOT NULL DEFAULT 0,
    SoTienDaTra   DECIMAL(15,2) NOT NULL DEFAULT 0,
    TrangThai     VARCHAR(30) NOT NULL DEFAULT 'Con no',
    CONSTRAINT fk_congno_kh  FOREIGN KEY (MaKH)  REFERENCES KHACHHANG(MaKH),
    CONSTRAINT fk_congno_ncc FOREIGN KEY (MaNCC) REFERENCES NHACUNGCAP(MaNCC),
    CONSTRAINT fk_congno_hd  FOREIGN KEY (SoHD)  REFERENCES HOADON(SoHD),
    CONSTRAINT fk_congno_pn  FOREIGN KEY (MaPN)  REFERENCES PHIEUNHAP(MaPN)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE PHIEUTHU (
    MaPT    INT AUTO_INCREMENT PRIMARY KEY,
    SoHD    INT,
    MaDat   INT,
    MaCN    INT,
    SoTien  DECIMAL(15,2) NOT NULL,
    NgayThu DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pt_hd  FOREIGN KEY (SoHD)  REFERENCES HOADON(SoHD),
    CONSTRAINT fk_pt_dat FOREIGN KEY (MaDat) REFERENCES DONDATHANGTRUOC(MaDat),
    CONSTRAINT fk_pt_cn  FOREIGN KEY (MaCN)  REFERENCES CONGNO(MaCN)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================
-- 6. NHÓM KHO VẬN (sau bán) & KIỂM KÊ
-- =====================

CREATE TABLE TONKHO (
    MaTonKho INT AUTO_INCREMENT PRIMARY KEY,
    MaKho    INT NOT NULL,
    MaSP     INT NOT NULL,
    SoLuong  INT NOT NULL DEFAULT 0,
    CONSTRAINT fk_tonkho_kho FOREIGN KEY (MaKho) REFERENCES KHO(MaKho),
    CONSTRAINT fk_tonkho_sp  FOREIGN KEY (MaSP)  REFERENCES SANPHAM(MaSP)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE PHIEUXUATKHO (
    MaPX     INT AUTO_INCREMENT PRIMARY KEY,
    SoHD     INT NOT NULL,
    LyDoXuat VARCHAR(255),
    CONSTRAINT fk_px_hd FOREIGN KEY (SoHD) REFERENCES HOADON(SoHD)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE BIENBANKIEMKE (
    MaBB  INT AUTO_INCREMENT PRIMARY KEY,
    MaKho INT NOT NULL,
    Ngay  DATE NOT NULL,
    CONSTRAINT fk_bbkk_kho FOREIGN KEY (MaKho) REFERENCES KHO(MaKho)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE DIEUCHINHKHO (
    MaDC       INT AUTO_INCREMENT PRIMARY KEY,
    MaBB       INT NOT NULL,
    SoLuongDC  INT NOT NULL,
    CONSTRAINT fk_dc_bb FOREIGN KEY (MaBB) REFERENCES BIENBANKIEMKE(MaBB)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================
-- 7. NHÓM BẢO HÀNH & ĐỔI TRẢ
-- =====================

CREATE TABLE PHIEUBAOHANH (
    MaPBH        INT AUTO_INCREMENT PRIMARY KEY,
    IMEI         VARCHAR(20) NOT NULL,
    MaKH         INT,
    MaNV         INT NOT NULL,
    MoTaLoi      VARCHAR(255),
    NgayTiepNhan DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    TrangThai    VARCHAR(30) NOT NULL DEFAULT 'Dang xu ly',
    CONSTRAINT fk_pbh_imei FOREIGN KEY (IMEI) REFERENCES MAY_IMEI(IMEI),
    CONSTRAINT fk_pbh_kh   FOREIGN KEY (MaKH) REFERENCES KHACHHANG(MaKH),
    CONSTRAINT fk_pbh_nv   FOREIGN KEY (MaNV) REFERENCES NHANVIEN(MaNV)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE CT_PBH_LINHKIEN (
    MaCTB   INT AUTO_INCREMENT PRIMARY KEY,
    MaPBH   INT NOT NULL,
    MaLK    INT NOT NULL,
    SoLuong INT NOT NULL DEFAULT 1,
    CONSTRAINT fk_ctb_pbh FOREIGN KEY (MaPBH) REFERENCES PHIEUBAOHANH(MaPBH),
    CONSTRAINT fk_ctb_lk  FOREIGN KEY (MaLK)  REFERENCES LINHKIEN(MaLK)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE PHIEUDOITRA (
    MaDT       INT AUTO_INCREMENT PRIMARY KEY,
    SoHD       INT NOT NULL,
    IMEI       VARCHAR(20) NOT NULL,
    LyDo       VARCHAR(255),
    NgayDoiTra DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    TrangThai  VARCHAR(30) NOT NULL DEFAULT 'Cho xu ly',
    CONSTRAINT fk_dt_hd   FOREIGN KEY (SoHD) REFERENCES HOADON(SoHD),
    CONSTRAINT fk_dt_imei FOREIGN KEY (IMEI) REFERENCES MAY_IMEI(IMEI)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;

-- =========================================================
-- GHI CHÚ (không tự động áp dụng, nhóm tự quyết định thêm hay không):
-- 1. SANPHAM chưa có cột số tháng bảo hành (SoThangBH) -> nếu muốn
--    tính hạn bảo hành tự động từ ngày bán, nên thêm cột này.
-- 2. Chưa có bảng lưu "đơn đặt hàng gửi NCC" (trước khi PHIEUNHAP
--    được tạo) -> nếu quy trình Mua hàng cần theo dõi trạng thái
--    đơn đặt hàng (chờ xác nhận/đã giao), cân nhắc thêm bảng này.
-- 3. DIEUCHINHKHO hiện chưa có cột IMEI/MaSP -> nếu cần biết điều
--    chỉnh áp dụng cho máy/model nào, nên bổ sung.
-- Ba điểm trên đã trao đổi ở phần review trước, chưa đưa vào dump
-- này vì nhóm chưa xác nhận muốn thêm.
-- =========================================================

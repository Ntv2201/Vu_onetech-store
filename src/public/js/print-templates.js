/**
 * ONETECH STORE - PRINT TEMPLATES THEO CHUẨN THÔNG TƯ CHÍNH PHỦ & BỘ TÀI CHÍNH
 * ---------------------------------------------------------------------------------
 * 1. Phiếu Thu: Mẫu số 01 - TT (Ban hành theo Thông tư số 200/2014/TT-BTC)
 * 2. Phiếu Chi: Mẫu số 02 - TT (Ban hành theo Thông tư số 200/2014/TT-BTC)
 * 3. Phiếu Nhập Kho: Mẫu số 01 - VT (Ban hành theo Thông tư số 200/2014/TT-BTC)
 * 4. Phiếu Xuất Kho / Hóa Đơn: Mẫu số 02 - VT (Thông tư 200/2014/TT-BTC & NĐ 123/2020/NĐ-CP)
 */

// Hàm chuyển đổi số tiền thành chữ Tiếng Việt chuẩn mực
function docSoTienBangChu(number) {
  if (number === 0) return 'Không đồng';
  if (!number || isNaN(number)) return '';

  const dv = ['', 'nghìn', 'triệu', 'tỷ', 'nghìn tỷ', 'triệu tỷ'];
  const cs = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];

  function docBlock3So(n, full) {
    let tr = Math.floor(n / 100);
    let ch = Math.floor((n % 100) / 10);
    let dv_val = n % 10;
    let res = '';

    if (tr > 0 || full) {
      res += cs[tr] + ' trăm ';
      if (ch === 0 && dv_val > 0) res += 'lẻ ';
    }

    if (ch > 0 && ch !== 1) {
      res += cs[ch] + ' mươi ';
      if (ch === 0 && dv_val > 0) res += 'lẻ ';
    }
    if (ch === 1) res += 'mười ';

    switch (dv_val) {
      case 1:
        if (ch > 1) res += 'mốt ';
        else res += cs[dv_val] + ' ';
        break;
      case 5:
        if (ch > 0) res += 'lăm ';
        else res += cs[dv_val] + ' ';
        break;
      default:
        if (dv_val > 0) res += cs[dv_val] + ' ';
        break;
    }

    return res.trim();
  }

  let numStr = Math.abs(Math.round(number)).toString();
  let blocks = [];
  while (numStr.length > 0) {
    blocks.unshift(numStr.slice(-3));
    numStr = numStr.slice(0, -3);
  }

  let result = '';
  for (let i = 0; i < blocks.length; i++) {
    let blockVal = parseInt(blocks[i], 10);
    if (blockVal > 0) {
      let full = i > 0;
      let blockText = docBlock3So(blockVal, full);
      let unit = dv[blocks.length - 1 - i];
      result += blockText + (unit ? ' ' + unit : '') + ' ';
    }
  }

  result = result.trim();
  if (result.length > 0) {
    result = result.charAt(0).toUpperCase() + result.slice(1) + ' đồng chẵn.';
  }
  return result;
}

// In nội dung HTML trong cửa sổ in ấn chuyên nghiệp
function inNoiDungHTML(htmlContent, tieuDe = 'In Chứng Từ') {
  const printWindow = window.open('', '_blank', 'width=900,height=750');
  if (!printWindow) {
    alert('Vui lòng cho phép popup để xem bản in phiếu');
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <title>${tieuDe}</title>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css">
      <style>
        @page {
          size: A4 portrait;
          margin: 12mm 15mm;
        }
        body {
          font-family: "Times New Roman", Times, serif;
          font-size: 13.5pt;
          color: #000;
          line-height: 1.4;
          background: #fff;
        }
        .header-left {
          font-size: 10.5pt;
          line-height: 1.25;
        }
        .header-right {
          font-size: 10pt;
          font-style: italic;
          line-height: 1.25;
        }
        .doc-title {
          font-size: 18pt;
          font-weight: bold;
          text-transform: uppercase;
          margin-top: 15px;
          margin-bottom: 2px;
        }
        .doc-subtitle {
          font-size: 11pt;
          font-style: italic;
          margin-bottom: 15px;
        }
        .dotted-line {
          border-bottom: 1px dotted #000;
          display: inline-block;
          min-width: 250px;
        }
        .table-custom {
          width: 100%;
          border-collapse: collapse;
          margin-top: 12px;
          margin-bottom: 12px;
        }
        .table-custom th, .table-custom td {
          border: 1px solid #000;
          padding: 6px 8px;
          font-size: 11.5pt;
        }
        .signature-box {
          margin-top: 20px;
          page-break-inside: avoid;
        }
        .sig-title {
          font-weight: bold;
          font-size: 11.5pt;
          margin-bottom: 2px;
        }
        .sig-desc {
          font-style: italic;
          font-size: 9.5pt;
        }
        .sig-space {
          height: 75px;
        }
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; padding: 0; }
        }
      </style>
    </head>
    <body onload="window.print();">
      <div class="no-print p-2 bg-light border-bottom text-end">
        <button class="btn btn-primary btn-sm" onclick="window.print();"><i class="fa fa-print"></i> In Chứng Từ</button>
        <button class="btn btn-secondary btn-sm ms-2" onclick="window.close();">Đóng</button>
      </div>
      <div class="p-3">
        ${htmlContent}
      </div>
    </body>
    </html>
  `);
  printWindow.document.close();
}

/**
 * 1. MẪU PHIẾU THU (Mẫu số 01 - TT theo Thông tư số 200/2014/TT-BTC)
 */
function inPhieuThuChuan(data = {}) {
  const {
    soPhieu = 'PT' + Date.now().toString().slice(-6),
    ngayThu = new Date(),
    hoTenNguoiNop = 'Khách hàng',
    diaChi = '',
    lyDo = 'Thu tiền bán hàng',
    soTien = 0,
    kemTheo = '01 Hóa đơn gốc',
    nguoiLap = 'Nhân viên thu ngân'
  } = data;

  const d = new Date(ngayThu);
  const ngayStr = `Ngày ${d.getDate()} tháng ${d.getMonth() + 1} năm ${d.getFullYear()}`;
  const bangChu = docSoTienBangChu(soTien);

  const html = `
    <div class="row">
      <div class="col-7 header-left">
        <strong>Đơn vị:</strong> HỆ THỐNG CÔNG NGHỆ ONETECH STORE<br>
        <strong>Địa chỉ:</strong> 123 Đường Công Nghệ, Quận 1, TP. Hồ Chí Minh<br>
        <strong>Mã số thuế:</strong> 0317888999 - Hotline: 1900.8888
      </div>
      <div class="col-5 text-center header-right">
        <strong>Mẫu số 01 - TT</strong><br>
        (Ban hành theo Thông tư số 200/2014/TT-BTC<br>
        ngày 22/12/2014 của Bộ Tài chính)<br>
        <div class="text-end mt-1 pe-2">
          <strong>Số:</strong> ${soPhieu}<br>
          <strong>Nợ:</strong> 1111 | <strong>Có:</strong> 131, 511
        </div>
      </div>
    </div>

    <div class="text-center">
      <div class="doc-title">PHIẾU THU</div>
      <div class="doc-subtitle">${ngayStr}</div>
    </div>

    <div class="mt-2">
      <div class="mb-2">- Họ và tên người nộp tiền: <strong>${hoTenNguoiNop}</strong></div>
      <div class="mb-2">- Địa chỉ / Đơn vị: ${diaChi || 'Khách hàng mua lẻ tại cửa hàng'}</div>
      <div class="mb-2">- Lý do nộp: ${lyDo}</div>
      <div class="mb-2">- Số tiền: <strong class="fs-5">${Number(soTien).toLocaleString('vi-VN')} VNĐ</strong></div>
      <div class="mb-2">- Viết bằng chữ: <em>${bangChu}</em></div>
      <div class="mb-2">- Kèm theo: ${kemTheo} chứng từ gốc.</div>
    </div>

    <div class="row text-center signature-box">
      <div class="col">
        <div class="sig-title">Thủ trưởng đơn vị</div>
        <div class="sig-desc">(Ký, họ tên, đóng dấu)</div>
        <div class="sig-space"></div>
      </div>
      <div class="col">
        <div class="sig-title">Kế toán trưởng</div>
        <div class="sig-desc">(Ký, họ tên)</div>
        <div class="sig-space"></div>
      </div>
      <div class="col">
        <div class="sig-title">Người lập phiếu</div>
        <div class="sig-desc">(Ký, họ tên)</div>
        <div class="sig-space"></div>
        <div class="fw-bold">${nguoiLap}</div>
      </div>
      <div class="col">
        <div class="sig-title">Người nộp tiền</div>
        <div class="sig-desc">(Ký, họ tên)</div>
        <div class="sig-space"></div>
      </div>
      <div class="col">
        <div class="sig-title">Thủ quỹ</div>
        <div class="sig-desc">(Ký, họ tên)</div>
        <div class="sig-space"></div>
      </div>
    </div>

    <div class="mt-2 pt-2 border-top text-muted" style="font-size: 9pt; font-style: italic;">
      * Đã nhận đủ số tiền (viết bằng chữ): ${bangChu}
    </div>
  `;

  inNoiDungHTML(html, `Phiếu Thu ${soPhieu}`);
}

/**
 * 2. MẪU PHIẾU CHI (Mẫu số 02 - TT theo Thông tư số 200/2014/TT-BTC)
 */
function inPhieuChiChuan(data = {}) {
  const {
    soPhieu = 'PC' + Date.now().toString().slice(-6),
    ngayChi = new Date(),
    hoTenNguoiNhan = 'Đối tác / Nhà cung cấp',
    diaChi = '',
    lyDo = 'Thanh toán tiền hàng / dịch vụ',
    soTien = 0,
    kemTheo = '01 Phiếu nhập / Đề nghị thanh toán',
    nguoiLap = 'Nhân viên kế toán'
  } = data;

  const d = new Date(ngayChi);
  const ngayStr = `Ngày ${d.getDate()} tháng ${d.getMonth() + 1} năm ${d.getFullYear()}`;
  const bangChu = docSoTienBangChu(soTien);

  const html = `
    <div class="row">
      <div class="col-7 header-left">
        <strong>Đơn vị:</strong> HỆ THỐNG CÔNG NGHỆ ONETECH STORE<br>
        <strong>Địa chỉ:</strong> 123 Đường Công Nghệ, Quận 1, TP. Hồ Chí Minh<br>
        <strong>Mã số thuế:</strong> 0317888999 - Hotline: 1900.8888
      </div>
      <div class="col-5 text-center header-right">
        <strong>Mẫu số 02 - TT</strong><br>
        (Ban hành theo Thông tư số 200/2014/TT-BTC<br>
        ngày 22/12/2014 của Bộ Tài chính)<br>
        <div class="text-end mt-1 pe-2">
          <strong>Số:</strong> ${soPhieu}<br>
          <strong>Nợ:</strong> 331, 642 | <strong>Có:</strong> 1111
        </div>
      </div>
    </div>

    <div class="text-center">
      <div class="doc-title">PHIẾU CHI</div>
      <div class="doc-subtitle">${ngayStr}</div>
    </div>

    <div class="mt-2">
      <div class="mb-2">- Họ và tên người nhận tiền: <strong>${hoTenNguoiNhan}</strong></div>
      <div class="mb-2">- Địa chỉ / Đơn vị: ${diaChi || 'Nhà cung cấp / Đối tác OneTech'}</div>
      <div class="mb-2">- Lý do chi: ${lyDo}</div>
      <div class="mb-2">- Số tiền: <strong class="fs-5">${Number(soTien).toLocaleString('vi-VN')} VNĐ</strong></div>
      <div class="mb-2">- Viết bằng chữ: <em>${bangChu}</em></div>
      <div class="mb-2">- Kèm theo: ${kemTheo} chứng từ gốc.</div>
    </div>

    <div class="row text-center signature-box">
      <div class="col">
        <div class="sig-title">Thủ trưởng đơn vị</div>
        <div class="sig-desc">(Ký, họ tên, đóng dấu)</div>
        <div class="sig-space"></div>
      </div>
      <div class="col">
        <div class="sig-title">Kế toán trưởng</div>
        <div class="sig-desc">(Ký, họ tên)</div>
        <div class="sig-space"></div>
      </div>
      <div class="col">
        <div class="sig-title">Người lập phiếu</div>
        <div class="sig-desc">(Ký, họ tên)</div>
        <div class="sig-space"></div>
        <div class="fw-bold">${nguoiLap}</div>
      </div>
      <div class="col">
        <div class="sig-title">Người nhận tiền</div>
        <div class="sig-desc">(Ký, họ tên)</div>
        <div class="sig-space"></div>
      </div>
      <div class="col">
        <div class="sig-title">Thủ quỹ</div>
        <div class="sig-desc">(Ký, họ tên)</div>
        <div class="sig-space"></div>
      </div>
    </div>

    <div class="mt-2 pt-2 border-top text-muted" style="font-size: 9pt; font-style: italic;">
      * Đã nhận đủ số tiền (viết bằng chữ): ${bangChu}
    </div>
  `;

  inNoiDungHTML(html, `Phiếu Chi ${soPhieu}`);
}

/**
 * 3. MẪU PHIẾU NHẬP KHO (Mẫu số 01 - VT theo Thông tư số 200/2014/TT-BTC)
 */
function inPhieuNhapKhoChuan(data = {}) {
  const {
    maPN = 'PN' + Date.now().toString().slice(-6),
    ngayNhap = new Date(),
    tenNCC = 'Nhà cung cấp',
    diaChiNCC = '',
    nhanVien = 'Lê Thủ Kho',
    danhSachChiTiet = [],
    tongTien = 0,
    ghiChu = ''
  } = data;

  const d = new Date(ngayNhap);
  const ngayStr = `Ngày ${d.getDate()} tháng ${d.getMonth() + 1} năm ${d.getFullYear()}`;
  const bangChu = docSoTienBangChu(tongTien);

  let rowsHtml = '';
  if (danhSachChiTiet && danhSachChiTiet.length > 0) {
    danhSachChiTiet.forEach((item, index) => {
      const tenSP = item.sanPham?.tenMay || item.tenMay || item.tenPK || 'Sản phẩm máy';
      const imei = item.imei ? `<br><small class="text-muted">IMEI: ${item.imei}</small>` : '';
      const donGia = item.donGiaNhap || item.giaNhap || 0;
      const soLuong = item.soLuong || 1;
      const thanhTien = donGia * soLuong;

      rowsHtml += `
        <tr>
          <td class="text-center">${index + 1}</td>
          <td><strong>${tenSP}</strong>${imei}</td>
          <td class="text-center">Chiếc</td>
          <td class="text-center">${soLuong}</td>
          <td class="text-center">${soLuong}</td>
          <td class="text-end">${Number(donGia).toLocaleString('vi-VN')}</td>
          <td class="text-end fw-bold">${Number(thanhTien).toLocaleString('vi-VN')}</td>
        </tr>
      `;
    });
  }

  const html = `
    <div class="row">
      <div class="col-7 header-left">
        <strong>Đơn vị:</strong> HỆ THỐNG CÔNG NGHỆ ONETECH STORE<br>
        <strong>Địa chỉ:</strong> 123 Đường Công Nghệ, Quận 1, TP. Hồ Chí Minh<br>
        <strong>Bộ phận:</strong> Ban Quản lý Kho Vận
      </div>
      <div class="col-5 text-center header-right">
        <strong>Mẫu số 01 - VT</strong><br>
        (Ban hành theo Thông tư số 200/2014/TT-BTC<br>
        ngày 22/12/2014 của Bộ Tài chính)<br>
        <div class="text-end mt-1 pe-2">
          <strong>Số phiếu:</strong> ${maPN}<br>
          <strong>Nợ:</strong> 1561 | <strong>Có:</strong> 331, 111
        </div>
      </div>
    </div>

    <div class="text-center">
      <div class="doc-title">PHIẾU NHẬP KHO</div>
      <div class="doc-subtitle">${ngayStr}</div>
    </div>

    <div class="mt-2">
      <div class="mb-1">- Họ tên người giao hàng: <strong>${tenNCC}</strong></div>
      <div class="mb-1">- Địa chỉ / Đơn vị giao: ${diaChiNCC || 'Kho trung tâm phân phối chính hãng'}</div>
      <div class="mb-1">- Nhập tại kho: <strong>Kho Tổng OneTech Store</strong> - Địa chỉ: 123 Đường Công Nghệ, Q.1</div>
      <div class="mb-1">- Diễn giải / Ghi chú: ${ghiChu || 'Nhập kho sản phẩm điện thoại & phụ kiện chính hãng'}</div>
    </div>

    <table class="table-custom">
      <thead>
        <tr class="text-center bg-light">
          <th rowspan="2" style="width: 40px;">STT</th>
          <th rowspan="2">Tên, nhãn hiệu, quy cách, phẩm chất vật tư</th>
          <th rowspan="2" style="width: 60px;">ĐVT</th>
          <th colspan="2">Số lượng</th>
          <th rowspan="2" style="width: 110px;">Đơn giá (đ)</th>
          <th rowspan="2" style="width: 120px;">Thành tiền (đ)</th>
        </tr>
        <tr class="text-center bg-light">
          <th style="width: 75px;">Chứng từ</th>
          <th style="width: 75px;">Thực nhập</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
        <tr class="fw-bold bg-light">
          <td colspan="6" class="text-center">TỔNG CỘNG TIỀN HÀNG NHẬP</td>
          <td class="text-end text-primary">${Number(tongTien).toLocaleString('vi-VN')} đ</td>
        </tr>
      </tbody>
    </table>

    <div class="mb-3">- Tổng số tiền (viết bằng chữ): <em>${bangChu}</em></div>

    <div class="row text-center signature-box">
      <div class="col">
        <div class="sig-title">Người lập phiếu</div>
        <div class="sig-desc">(Ký, họ tên)</div>
        <div class="sig-space"></div>
        <div class="fw-bold">${nhanVien}</div>
      </div>
      <div class="col">
        <div class="sig-title">Người giao hàng</div>
        <div class="sig-desc">(Ký, họ tên)</div>
        <div class="sig-space"></div>
      </div>
      <div class="col">
        <div class="sig-title">Thủ kho</div>
        <div class="sig-desc">(Ký, họ tên)</div>
        <div class="sig-space"></div>
      </div>
      <div class="col">
        <div class="sig-title">Kế toán trưởng / Giám đốc</div>
        <div class="sig-desc">(Ký, họ tên)</div>
        <div class="sig-space"></div>
      </div>
    </div>
  `;

  inNoiDungHTML(html, `Phiếu Nhập Kho ${maPN}`);
}

/**
 * 4. MẪU HÓA ĐƠN BÁN HÀNG KIÊM PHIẾU XUẤT KHO (Theo Nghị định 123/2020/NĐ-CP & TT 200)
 */
function inHoaDonBanHangChuan(data = {}) {
  const {
    soHD = 'HD' + Date.now().toString().slice(-6),
    ngayLap = new Date(),
    khachHang = {},
    nhanVien = {},
    danhSachMay = [],
    danhSachPK = [],
    tienCocDaTru = 0,
    soTienGiam = 0,
    soTienThanhToan = 0,
    tongTien = 0,
    hinhThucThanhToan = 'Tiền mặt'
  } = data;

  const d = new Date(ngayLap);
  const ngayStr = `Ngày ${d.getDate()} tháng ${d.getMonth() + 1} năm ${d.getFullYear()}`;
  const bangChu = docSoTienBangChu(soTienThanhToan || tongTien);

  let stt = 1;
  let rowsHtml = '';

  // Danh sách máy
  (danhSachMay || []).forEach(item => {
    const tenMay = item.sanPham?.tenMay || item.tenMay || 'Điện thoại thông minh';
    const imei = item.imei ? `<br><small class="text-muted">IMEI: ${item.imei}</small>` : '';
    const donGia = item.donGiaBan || item.giaBan || 0;

    rowsHtml += `
      <tr>
        <td class="text-center">${stt++}</td>
        <td><strong>${tenMay}</strong>${imei}</td>
        <td class="text-center">Máy</td>
        <td class="text-center">1</td>
        <td class="text-end">${Number(donGia).toLocaleString('vi-VN')}</td>
        <td class="text-end fw-bold">${Number(donGia).toLocaleString('vi-VN')}</td>
      </tr>
    `;
  });

  // Danh sách phụ kiện
  (danhSachPK || []).forEach(item => {
    const tenPK = item.phuKien?.tenPK || item.tenPK || 'Phụ kiện';
    const donGia = item.donGiaBan || item.giaBan || 0;
    const soLuong = item.soLuong || 1;
    const thanhTien = donGia * soLuong;

    rowsHtml += `
      <tr>
        <td class="text-center">${stt++}</td>
        <td>${tenPK}</td>
        <td class="text-center">Cái</td>
        <td class="text-center">${soLuong}</td>
        <td class="text-end">${Number(donGia).toLocaleString('vi-VN')}</td>
        <td class="text-end fw-bold">${Number(thanhTien).toLocaleString('vi-VN')}</td>
      </tr>
    `;
  });

  const html = `
    <div class="row">
      <div class="col-7 header-left">
        <strong>Đơn vị bán hàng:</strong> CÔNG TY TNHH CÔNG NGHỆ ONETECH STORE<br>
        <strong>Mã số thuế:</strong> 0317888999<br>
        <strong>Địa chỉ:</strong> 123 Đường Công Nghệ, Quận 1, TP. Hồ Chí Minh<br>
        <strong>Điện thoại:</strong> 1900.8888 - Website: onetechstore.vn
      </div>
      <div class="col-5 text-center header-right">
        <strong>Mẫu số 02 - VT</strong><br>
        (Chuẩn hóa theo Nghị định 123/2020/NĐ-CP<br>
        & Thông tư số 200/2014/TT-BTC)<br>
        <div class="text-end mt-1 pe-2">
          <strong>Ký hiệu (Serial):</strong> 1C26TOT<br>
          <strong>Số HĐ:</strong> ${soHD}
        </div>
      </div>
    </div>

    <div class="text-center">
      <div class="doc-title">HÓA ĐƠN BÁN HÀNG KIÊM PHIẾU XUẤT KHO</div>
      <div class="doc-subtitle">${ngayStr}</div>
    </div>

    <div class="mt-2">
      <div class="mb-1">- Họ tên người mua hàng: <strong>${khachHang.hoTen || 'Khách hàng vãng lai'}</strong></div>
      <div class="mb-1">- Số điện thoại: ${khachHang.sdt || '---'} | Địa chỉ: ${khachHang.diaChi || 'TP. Hồ Chí Minh'}</div>
      <div class="mb-1">- Hình thức thanh toán: <strong>${hinhThucThanhToan}</strong></div>
      <div class="mb-1">- Xuất tại kho: <strong>Kho Tổng OneTech Store</strong></div>
    </div>

    <table class="table-custom">
      <thead>
        <tr class="text-center bg-light">
          <th style="width: 40px;">STT</th>
          <th>Tên hàng hóa, dịch vụ, IMEI</th>
          <th style="width: 60px;">ĐVT</th>
          <th style="width: 60px;">Số lượng</th>
          <th style="width: 120px;">Đơn giá (đ)</th>
          <th style="width: 130px;">Thành tiền (đ)</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
        <tr>
          <td colspan="5" class="text-end fw-bold">Tổng tiền hàng:</td>
          <td class="text-end fw-bold">${Number(tongTien).toLocaleString('vi-VN')} đ</td>
        </tr>
        ${tienCocDaTru > 0 ? `
        <tr>
          <td colspan="5" class="text-end text-success">Cấn trừ tiền đặt cọc trước:</td>
          <td class="text-end text-success fw-bold">-${Number(tienCocDaTru).toLocaleString('vi-VN')} đ</td>
        </tr>` : ''}
        ${soTienGiam > 0 ? `
        <tr>
          <td colspan="5" class="text-end text-danger">Giảm giá / Chiết khấu:</td>
          <td class="text-end text-danger fw-bold">-${Number(soTienGiam).toLocaleString('vi-VN')} đ</td>
        </tr>` : ''}
        <tr class="bg-light">
          <td colspan="5" class="text-end fs-6 fw-bold text-primary">TỔNG TIỀN PHẢI THANH TOÁN:</td>
          <td class="text-end fs-6 fw-bold text-primary">${Number(soTienThanhToan || tongTien).toLocaleString('vi-VN')} đ</td>
        </tr>
      </tbody>
    </table>

    <div class="mb-3">- Số tiền viết bằng chữ: <em>${bangChu}</em></div>

    <div class="row text-center signature-box">
      <div class="col">
        <div class="sig-title">Người mua hàng</div>
        <div class="sig-desc">(Ký, ghi rõ họ tên)</div>
        <div class="sig-space"></div>
        <div>${khachHang.hoTen || ''}</div>
      </div>
      <div class="col">
        <div class="sig-title">Người bán hàng / Thu ngân</div>
        <div class="sig-desc">(Ký, ghi rõ họ tên)</div>
        <div class="sig-space"></div>
        <div class="fw-bold">${nhanVien.hoTen || 'Nhân viên bán hàng'}</div>
      </div>
      <div class="col">
        <div class="sig-title">Thủ kho xuất hàng</div>
        <div class="sig-desc">(Ký, ghi rõ họ tên)</div>
        <div class="sig-space"></div>
      </div>
    </div>

    <div class="mt-3 pt-2 border-top text-center text-muted" style="font-size: 9pt;">
      <em>(Cần kiểm tra kỹ IMEI và tình trạng máy trước khi rời quầy. OneTech Store xin cảm ơn quý khách!)</em>
    </div>
  `;

  inNoiDungHTML(html, `Hóa Đơn ${soHD}`);
}

/**
 * In Biên Bản Kiểm Kê Vật Tư, Hàng Hóa Chuẩn Mẫu Số 05 - VT (Thông tư 200/2014/TT-BTC)
 */
function inBienBanKiemKeChuan(data) {
  const {
    maBienBan = 'BBKK-CHUA-LUU',
    ngay = new Date(),
    kho = {},
    nhanVien = {},
    tongLyThuyet = 0,
    tongThucTe = 0,
    tongKhop = 0,
    tongLech = 0,
    tongThieu = 0,
    tongThua = 0,
    ghiChu = '',
    danhSachChiTiet = []
  } = data;

  const d = new Date(ngay);
  const ngayStr = `Ngày ${d.getDate()} tháng ${d.getMonth() + 1} năm ${d.getFullYear()}`;
  const gioStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

  let rowsHtml = '';
  if (danhSachChiTiet.length === 0) {
    rowsHtml = '<tr><td colspan="7" class="text-center text-muted">Toàn bộ hàng hóa khớp 100%, không phát sinh chênh lệch</td></tr>';
  } else {
    danhSachChiTiet.forEach((item, index) => {
      let loaiBadge = '';
      if (item.loaiLech === 'Thieu') {
        loaiBadge = '<span class="text-danger fw-bold">Thiếu máy (-1)</span>';
      } else if (item.loaiLech === 'Thua') {
        loaiBadge = '<span class="text-warning fw-bold">Thừa máy (+1)</span>';
      } else if (item.loaiLech === 'Bat thuong') {
        loaiBadge = '<span class="text-info fw-bold">Bất thường</span>';
      } else {
        loaiBadge = '<span class="text-success fw-bold">Khớp</span>';
      }

      rowsHtml += `
        <tr>
          <td class="text-center">${index + 1}</td>
          <td class="fw-bold font-monospace">${item.imei || 'N/A'}</td>
          <td>${item.sanPham?.tenMay || item.tenMay || 'N/A'}</td>
          <td class="text-center">${item.sanPham?.hang || item.hang || 'N/A'}</td>
          <td class="text-center">${item.trangThaiMayDB || 'N/A'}</td>
          <td class="text-center">${loaiBadge}</td>
          <td>${item.lyDo || item.ghiChu || ''}</td>
        </tr>
      `;
    });
  }

  const html = `
    <div class="row">
      <div class="col-7 header-left">
        <div class="fw-bold text-uppercase">HỆ THỐNG CỬA HÀNG ĐIỆN THOẠI ONETECH STORE</div>
        <div>Địa chỉ kho: ${kho.diaChi || 'Trụ sở chính OneTech Store'}</div>
        <div>Kho kiểm kê: <strong>${kho.tenKho || 'Kho Tổng'}</strong></div>
      </div>
      <div class="col-5 text-end header-right">
        <div class="fw-bold">Mẫu số 05 - VT</div>
        <div>(Ban hành theo Thông tư số 200/2014/TT-BTC)</div>
        <div>Mã BB: <strong>${maBienBan}</strong></div>
      </div>
    </div>

    <div class="text-center">
      <div class="doc-title">BIÊN BẢN KIỂM KÊ VẬT TƯ, HÀNG HÓA</div>
      <div class="doc-subtitle">Thời điểm kiểm kê: ${gioStr}, ${ngayStr}</div>
    </div>

    <div class="mb-2">
      <div>- Ban kiểm kê gồm: Ông/Bà <strong>${nhanVien.hoTen || 'Thủ kho'}</strong> (${nhanVien.vaiTro || 'Thủ kho'}) - Trưởng ban.</div>
      <div>- Địa điểm kiểm kê: <strong>${kho.tenKho || 'Kho hàng'}</strong> - ${kho.diaChi || ''}</div>
      <div>- Ghi chú kiểm kê: ${ghiChu || 'Kiểm kê định kỳ thực tế theo số IMEI máy vật lý'}</div>
    </div>

    <div class="row g-2 mb-3">
      <div class="col-4">
        <div class="p-2 border rounded text-center">
          <div class="small text-muted">Tồn lý thuyết (DB)</div>
          <div class="fs-5 fw-bold text-primary">${tongLyThuyet} máy</div>
        </div>
      </div>
      <div class="col-4">
        <div class="p-2 border rounded text-center">
          <div class="small text-muted">Thực tế kiểm đếm</div>
          <div class="fs-5 fw-bold text-success">${tongThucTe} máy</div>
        </div>
      </div>
      <div class="col-4">
        <div class="p-2 border rounded text-center">
          <div class="small text-muted">Số lượng chênh lệch</div>
          <div class="fs-5 fw-bold ${tongLech > 0 ? 'text-danger' : 'text-success'}">${tongLech > 0 ? `${tongLech} máy (Lệch)` : 'Khớp 100%'}</div>
        </div>
      </div>
    </div>

    <div class="fw-bold mb-1">BẢNG TỔNG HỢP VÀ CHI TIẾT XỬ LÝ CHÊNH LỆCH:</div>
    <table class="table-custom">
      <thead>
        <tr class="text-center bg-light">
          <th style="width: 40px;">STT</th>
          <th style="width: 150px;">Số IMEI</th>
          <th>Tên thiết bị / Model</th>
          <th style="width: 80px;">Hãng</th>
          <th style="width: 110px;">Trạng thái DB</th>
          <th style="width: 130px;">Kết quả đối soát</th>
          <th>Nguyên nhân / Ghi chú</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>

    <div class="mb-4">
      <div class="fw-bold">Ý KIẾN VÀ KẾT LUẬN CỦA BAN KIỂM KÊ:</div>
      <div>- Tổng số máy khớp đúng thực tế: <strong>${tongKhop}</strong> / ${tongLyThuyet} máy.</div>
      <div>- Số lượng thiếu cần lập biên bản giải trình: <strong>${tongThieu}</strong> máy.</div>
      <div>- Số lượng thừa / bất thường cần xác minh nguồn gốc: <strong>${tongThua}</strong> máy.</div>
    </div>

    <div class="row text-center signature-box">
      <div class="col">
        <div class="sig-title">Thủ kho</div>
        <div class="sig-desc">(Ký, ghi rõ họ tên)</div>
        <div class="sig-space"></div>
        <div class="fw-bold">${nhanVien.hoTen || ''}</div>
      </div>
      <div class="col">
        <div class="sig-title">Kế toán kho / Giám sát</div>
        <div class="sig-desc">(Ký, ghi rõ họ tên)</div>
        <div class="sig-space"></div>
      </div>
      <div class="col">
        <div class="sig-title">Giám đốc / Quản lý duyệt</div>
        <div class="sig-desc">(Ký, đóng dấu)</div>
        <div class="sig-space"></div>
      </div>
    </div>
  `;

  inNoiDungHTML(html, `Biên Bản Kiểm Kê ${maBienBan}`);
}

// Export cho window để gọi từ bất kỳ trang JS nào
window.docSoTienBangChu = docSoTienBangChu;
window.inPhieuThuChuan = inPhieuThuChuan;
window.inPhieuChiChuan = inPhieuChiChuan;
window.inPhieuNhapKhoChuan = inPhieuNhapKhoChuan;
window.inHoaDonBanHangChuan = inHoaDonBanHangChuan;
window.inBienBanKiemKeChuan = inBienBanKiemKeChuan;


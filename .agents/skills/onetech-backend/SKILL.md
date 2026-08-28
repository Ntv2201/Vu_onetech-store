---
name: onetech-backend
description: Hướng dẫn và quy chuẩn thiết kế module Backend (Mongoose Models, Services kế thừa BaseService, Controllers kế thừa BaseController, Routes và phân quyền RBAC 6 vai trò) cho OneTech Store.
---

# ONETECH STORE - BACKEND ARCHITECTURE & BEST PRACTICES

Kỹ năng này hướng dẫn cách tạo mới hoặc tối ưu hóa các module Backend trong hệ thống OneTech Store theo chuẩn MVC và Clean Architecture.

---

## 1. Cấu Trúc File Chuẩn Một Module

```text
src/
├── models/             # Định nghĩa Schema, quan hệ, compound index
│   └── [Entity].js
├── services/           # Nghiệp vụ lõi (Business Logic), kế thừa BaseService
│   └── [Entity]Service.js
├── controllers/        # Tiếp nhận HTTP Request, trả về JSON qua BaseController
│   └── [Entity]Controller.js
└── routes/             # Định nghĩa Endpoint, requireAuth, requireRole
    └── [Entity]Routes.js
```

---

## 2. Mẫu Model Chuẩn (Mongoose)

```javascript
const mongoose = require('mongoose');

const sanPhamSchema = new mongoose.Schema({
  maSP: { type: String, required: true, unique: true, uppercase: true, trim: true },
  tenMay: { type: String, required: true, trim: true },
  hang: { type: String, required: true, trim: true },
  giaBan: { type: Number, required: true, min: 0 },
  giaNhap: { type: Number, required: true, min: 0 },
  trangThai: { type: String, enum: ['Kinh doanh', 'Ngung kinh doanh'], default: 'Kinh doanh' }
}, {
  timestamps: true
});

// Khai báo Compound Index để tối ưu tìm kiếm kết hợp
sanPhamSchema.index({ hang: 1, trangThai: 1 });
sanPhamSchema.index({ tenMay: 'text' });

module.exports = mongoose.model('SanPham', sanPhamSchema, 'SANPHAM');
```

---

## 3. Mẫu Service Chuẩn (Kế thừa BaseService)

```javascript
const BaseService = require('./BaseService');
const { SanPham } = require('../models');

class SanPhamService extends BaseService {
  constructor() {
    super(SanPham);
  }

  async getDanhSach(query = {}) {
    const filter = {};
    if (query.hang) filter.hang = query.hang;
    if (query.search) {
      filter.tenMay = { $regex: query.search.trim(), $options: 'i' };
    }

    const { page, limit, skip } = this.getPaginationOptions(query);

    const [items, total] = await Promise.all([
      SanPham.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(), // Bắt buộc dùng .lean() cho truy vấn chỉ đọc
      SanPham.countDocuments(filter)
    ]);

    return {
      items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    };
  }

  async taoMoi(payload) {
    const { tenMay, hang, giaBan, giaNhap } = payload;
    if (!tenMay || !hang) {
      throw this.createError('Vui lòng nhập đầy đủ tên máy và hãng', 400);
    }
    return await SanPham.create(payload);
  }
}

module.exports = new SanPhamService();
```

---

## 4. Mẫu Controller Chuẩn (Kế thừa BaseController)

```javascript
const BaseController = require('./BaseController');
const { SanPhamService } = require('../services');

class SanPhamController extends BaseController {
  constructor() {
    super();
    this.getDanhSach = this.getDanhSach.bind(this);
    this.taoMoi = this.taoMoi.bind(this);
  }

  async getDanhSach(req, res) {
    try {
      const result = await SanPhamService.getDanhSach(req.query);
      return this.sendSuccess(res, result, 'Lấy danh sách sản phẩm thành công');
    } catch (error) {
      return this.handleError(res, error, 'Lỗi khi tải danh sách sản phẩm');
    }
  }

  async taoMoi(req, res) {
    try {
      const result = await SanPhamService.taoMoi(req.body);
      return this.sendSuccess(res, result, 'Tạo sản phẩm thành công', 201);
    } catch (error) {
      return this.handleError(res, error, 'Lỗi khi tạo sản phẩm');
    }
  }
}

module.exports = new SanPhamController();
```

---

## 5. Mẫu Route & Phân Quyền RBAC Chuẩn

```javascript
const express = require('express');
const router = express.Router();
const sanPhamController = require('../controllers/sanPhamController');
const { requireAuth, requireRole } = require('../middlewares/auth');

router.use(requireAuth);

// GET /api/san-pham
router.get('/', sanPhamController.getDanhSach);

// POST /api/san-pham
router.post('/', requireRole('Quản lý', 'Thủ kho'), sanPhamController.taoMoi);

module.exports = router;
```

---

## 6. Quy Tắc Bắt Buộc Khi Viết Backend
1. **Tuyệt đối không viết logic DB trong Controller.** Controller chỉ gọi Service.
2. **Không cập nhật tiền / tồn kho trực tiếp:** Mọi biến động phải đi kèm tạo Phiếu Thu, Phiếu Chi, Công Nợ hoặc Thẻ Kho.
3. **Phân quyền luôn dùng tiếng Việt có dấu:** `'Quản lý'`, `'Thủ kho'`, `'NV bán hàng'`, `'Thu ngân'`, `'Kế toán'`, `'Kỹ thuật'`.

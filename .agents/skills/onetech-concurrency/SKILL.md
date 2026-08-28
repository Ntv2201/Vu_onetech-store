---
name: onetech-concurrency
description: Hướng dẫn xử lý tranh chấp đồng thời (Concurrency Control), chống bán trùng máy IMEI, Atomic Locks và Mongoose Transactions trong OneTech Store.
---

# ONETECH STORE - CONCURRENCY & DATA INTEGRITY GUIDE

Trong một cửa hàng bán lẻ điện thoại với nhiều thu ngân và nhân viên bán hàng cùng thao tác đồng thời trên cùng một cơ sở dữ liệu, việc kiểm soát tranh chấp dữ liệu (Race Condition) là tối quan trọng.

---

## 1. Vấn Đề Thường Gặp (Race Conditions)

1. **Bán trùng IMEI:** 2 nhân viên cùng bấm "Thanh toán" cho cùng một máy IMEI tại cùng một thời điểm.
2. **Âm kho phụ kiện:** 2 đơn hàng cùng trừ tồn kho của một phụ kiện chỉ còn 1 cái trong kho.
3. **Lệch số dư Sổ Quỹ:** Nhiều giao dịch ghi nhận đồng thời làm sai lệch trường tổng tiền mặt.

---

## 2. Giải Pháp Chuẩn OneTech Store

### A. Atomic Update với Điều Kiện Trạng Thái (Bán máy IMEI)
Thay vì đọc `MayImei.findOne()` rồi mới kiểm tra và `save()`, luôn sử dụng `findOneAndUpdate` nguyên tử:

```javascript
// ✅ CHUẨN: Khóa nguyên tử (Atomic Lock)
const lockMay = await MayImei.findOneAndUpdate(
  { _id: maMay, trangThai: 'Con hang' },
  { $set: { trangThai: 'Da ban', ngayBan: new Date() } },
  { new: true, session }
);

if (!lockMay) {
  throw this.createError(`Máy IMEI ${lockMay ? lockMay.imei : maMay} đã bị bán hoặc không còn sẵn sàng trong kho!`, 409);
}
```

---

### B. Atomic Decrement với Điều Kiện Không Âm (Phụ Kiện)
Không đọc `soLuongTon` ra JS rồi trừ mà dùng `$inc`:

```javascript
// ✅ CHUẨN: Trừ tồn kho nguyên tử kèm điều kiện >= số lượng cần mua
const pkUpdated = await PhuKien.findOneAndUpdate(
  { _id: maPK, soLuongTon: { $gte: soLuongMua } },
  { $inc: { soLuongTon: -soLuongMua } },
  { new: true, session }
);

if (!pkUpdated) {
  throw this.createError(`Phụ kiện không đủ số lượng tồn kho để xuất bán!`, 400);
}
```

---

### C. Mongoose Transaction Rollback
Khi một quy trình liên quan nhiều bảng (ví dụ: Tạo Hóa đơn -> Cập nhật IMEI -> Cập nhật cọc -> Tạo Phiếu Thu):

```javascript
const session = await mongoose.startSession();
session.startTransaction();

try {
  // 1. Tạo hóa đơn
  const hoaDon = await HoaDon.create([{ ...payload }], { session });

  // 2. Lock IMEI
  await MayImei.findOneAndUpdate(
    { _id: payload.mayImei, trangThai: 'Con hang' },
    { $set: { trangThai: 'Da ban' } },
    { session }
  );

  // 3. Tạo phiếu thu tiền
  await ThanhToanService.taoPhieuThu({ ...payloadThu, session });

  await session.commitTransaction();
  return hoaDon[0];
} catch (error) {
  await session.abortTransaction();
  throw error;
} finally {
  session.endSession();
}
```

const mongoose = require('mongoose');
const { BaoCaoService } = require('./src/services');
const CT_HoaDon_May = require('./src/models/CT_HoaDon_May');
const MayImei = require('./src/models/MayImei');
require('./src/models');

mongoose.connect('mongodb://127.0.0.1:27017/onetech_store').then(async () => {
  const query = { tuNgay: '2026-09-01', denNgay: '2026-09-30' };
  
  const filterHD = { trangThai: { $ne: 'Da huy' } };
  filterHD.ngayLap = { $gte: new Date('2026-09-01'), $lte: new Date('2026-09-30T23:59:59.999Z') };
  const hds = await require('./src/models/HoaDon').find(filterHD).select('_id');
  const hdIds = hds.map(h => h._id);
  
  const ctMays = await CT_HoaDon_May.find({ hoaDon: { $in: hdIds } }).lean();
  const imeisList = ctMays.map(c => c.imei).filter(Boolean);
  
  const mayImeis = await MayImei.find({ imei: { $in: imeisList } }).populate('sanPham', 'tenMay hang giaBan').lean();
  
  console.log('HoaDon Ids:', hdIds.length);
  console.log('CT_HoaDon_May count:', ctMays.length);
  console.log('imeisList length:', imeisList.length);
  console.log('mayImeis length:', mayImeis.length);
  
  if(mayImeis.length > 0) {
    console.log('mayImeis[0].sanPham:', mayImeis[0].sanPham);
  }

  process.exit(0);
});

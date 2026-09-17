const mongoose = require('mongoose');
const { TonKho } = require('./src/models');

async function test() {
  await mongoose.connect('mongodb://127.0.0.1:27017/onetech_store');
  
  const pipeline = [
    {
      $group: {
        _id: '$sanPham',
        tongSoLuong: { $sum: '$soLuong' }
      }
    },
    {
      $match: {
        tongSoLuong: { $lte: 5 }
      }
    }
  ];

  const items = await TonKho.aggregate(pipeline);
  console.log('Group match:', items.length, items);

  const pipeline2 = [ ...pipeline, {
    $lookup: {
      from: 'sanphams',
      localField: '_id',
      foreignField: '_id',
      as: 'sanPhamInfo'
    }
  }];
  const items2 = await TonKho.aggregate(pipeline2);
  console.log('With lookup:', items2.length, JSON.stringify(items2.slice(0, 2), null, 2));

  process.exit();
}
test();

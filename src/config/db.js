const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/onetech_store', {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[MongoDB] Connected successfully: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`[MongoDB] Connection error: ${error.message}`);
    console.error('Vui lòng kiểm tra lại MongoDB service hoặc cấu hình MONGODB_URI trong file .env');
    // Không exit ngay để server vẫn có thể thông báo lỗi qua giao diện nếu cần
  }
};

module.exports = connectDB;

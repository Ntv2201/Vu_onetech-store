require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 3000;

// Kết nối MongoDB và khởi động Server
const startServer = async () => {
  try {
    await connectDB();
    
    app.listen(PORT, () => {
      console.log(`=================================================`);
      console.log(`🚀 ONE TECH STORE SERVER ĐANG CHẠY TẠI:`);
      console.log(`👉 http://localhost:${PORT}`);
      console.log(`👉 Đăng nhập: http://localhost:${PORT}/login`);
      console.log(`=================================================`);
    });
  } catch (error) {
    console.error('Không thể khởi động server:', error);
    process.exit(1);
  }
};

startServer();

const express = require('express');
const path = require('path');
const morgan = require('morgan');
const session = require('express-session');
const apiRoutes = require('./routes');

const app = express();

// Middleware cơ bản
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cấu hình Session
app.use(session({
  secret: process.env.SESSION_SECRET || 'onetech_default_secret_2026',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24, // 24 giờ
    httpOnly: true,
    sameSite: 'lax'
  }
}));

// Mount toàn bộ RESTful API Routes dưới tiền tố /api
app.use('/api', apiRoutes);

// Phục vụ toàn bộ giao diện tĩnh (HTML, CSS, JS) từ thư mục public
app.use(express.static(path.join(__dirname, 'public'), {
  extensions: ['html']
}));

// Xử lý 404 cho các API endpoint không tồn tại
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint không tồn tại'
  });
});

// Xử lý 404 cho các trang giao diện
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

// Xử lý lỗi hệ thống 500
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  if (req.originalUrl.startsWith('/api')) {
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ nội bộ: ' + (process.env.NODE_ENV === 'development' ? err.message : 'Vui lòng thử lại sau')
    });
  }
  res.status(500).send('<h1>500 - Lỗi máy chủ nội bộ</h1>');
});

module.exports = app;

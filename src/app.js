const express = require('express');
const path = require('path');
const morgan = require('morgan');
const session = require('express-session');
const flash = require('connect-flash');
const methodOverride = require('method-override');
const expressLayouts = require('express-ejs-layouts');

const { attachUser } = require('./middlewares/auth');
const routes = require('./routes');

const app = express();

// Cấu hình View Engine EJS & Layouts
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.set('layout', 'layouts/main');
app.set('layout extractScripts', true);
app.set('layout extractStyles', true);

// Middleware cơ bản
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

// Cấu hình Session & Flash Messages
app.use(session({
  secret: process.env.SESSION_SECRET || 'onetech_default_secret_2026',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 // 24 giờ
  }
}));
app.use(flash());

// Gán thông tin người dùng và thông báo vào res.locals
app.use(attachUser);

// Mount toàn bộ Routes
app.use('/', routes);

// Xử lý 404 Not Found
app.use((req, res) => {
  res.status(404).render('errors/404', {
    title: '404 - Không tìm thấy trang',
    layout: false
  });
});

// Xử lý lỗi 500
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).render('errors/500', {
    title: '500 - Lỗi máy chủ',
    layout: false,
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

module.exports = app;

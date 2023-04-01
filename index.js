// express setups
const express = require('express');
const session = require('express-session');
const app = express();
const PORT = process.env.PORT || 5000;
var cors = require("cors");
const server = require('http').createServer(app);

// route
const loginRoute = require('./routes/login');
const logoutRoute = require('./routes/logout');
// const authorizeRoute = require('./middleware/authorize');

const adminRoute = require('./routes/admin');
const authorRoute = require('./routes/author');
const editorRoute = require('./routes/editor');

const accountRoute = require('./routes/account');
const majorRoute = require('./routes/major');
const universityRoute = require('./routes/university');

const profileRoute = require('./routes/profile');
const articleRoute = require('./routes/article');
const reviewRoute = require('./routes/review');
const paymentRoute = require('./routes/payment');
const pdfRoute = require('./routes/pdf');

//other
app.use(cors({ credentials: true, origin: "http://localhost:3000" }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

//Session
const KnexSessionStore = require('connect-session-knex')(session);

const Knex = require('knex');

//Local run
const knex = Knex({
  client: 'pg',
  connection: {
    host: '127.0.0.1',
    user: 'postgres',
    password: '123',
    database: 'ejournal',
  },
});

const store = new KnexSessionStore({
  knex,
  tablename: 'sessions', // optional. Defaults to 'sessions'
});

app.use(
  session({
    secret: 'EJOURNAL',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 10 * 60 * 60 * 1000,
    },
    store,
  })
);

const compression = require('compression');
app.use(compression());

app.use('/login', loginRoute);
app.use('/logout', logoutRoute);

async function checkUserSession(req, res, next) {
  try {
    if (req.session.user) {
      next();
    } else {
      res.status(400).json({ msg: 'Xin đăng nhập lại vào hệ thống' });
    }
  } catch (error) {
    console.log(error);
    res.status(400).json({ msg: 'Lỗi hệ thống' });
  }
}
app.use(checkUserSession);

app.use('/pdf', pdfRoute);
app.use('/admin', adminRoute);
// app.use('/authorize', authorizeRoute);
app.use('/author', authorRoute);
app.use('/editor', editorRoute);
app.use('/account', accountRoute);
app.use('/major', majorRoute);
app.use('/university', universityRoute);
app.use('/profile', profileRoute);
app.use('/article', articleRoute);
app.use('/review', reviewRoute);
app.use('/payment', paymentRoute);

server.listen(PORT, () => {
  console.log('Server running...');
});

const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('ejournal', 'postgres', '123', {
  host: 'localhost',
  dialect: "postgres",
});

(async () => {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
})();
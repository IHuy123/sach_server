const { Router } = require('express');
const { split } = require('lodash');
const router = Router();
const pool = require('./../db');
const helpers = require('./../utils/helpers');
const jwt = require('jsonwebtoken');
const config = require("../config/authConfig");
var nodemailer = require('nodemailer');
const sob = require('../staticObj');

async function validateUser(req, res, next) {
  try {
    const { username, password } = req.body;
    const userInformation = await pool.query(
      `SELECT A.id, A.username, A.password, A.fullname, A.email, A.avatar, A.accesstype, R.name AS role 
      FROM "account" AS A 
      JOIN "role" AS R ON A.roleid = R.id 
      WHERE A.username = $1 LIMIT 1`,
      [username]
    );
    if (userInformation.rows[0]) {
      if (
        await helpers.validatePassword(
          password,
          userInformation.rows[0].password
        )
      ) {
        const token = jwt.sign({ id: userInformation.rows[0].id }, config.secret);
        req.session.user = userInformation.rows[0];
        req.session.token = token;
        next();
      } else {
        res.status(400).json({ msg: 'Tên đăng nhập hoặc mật khẩu sai' });
      }
    } else {
      res.status(400).json({ msg: 'Tên đăng nhập hoặc mật khẩu sai' });
    }
  } catch (error) {
    console.log(error);
    res.status(400).json({ msg: 'Lỗi hệ thống' });
  }
}

var transporter = nodemailer.createTransport({
  service: sob.MAIL_SERVICE,
  auth: {
    user: sob.TRANSPORT_EMAIL,
    pass: sob.TRANSPORT_PASS
  }
});

async function sendEmail(req, res, email, title, text) {
  var mailOptions = {
    from: sob.TRANSPORT_EMAIL,
    to: email,
    subject: title,
    text: text
  };

  try {
    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log('Email sent! ');
      }
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({ msg: 'Lỗi gửi mail' });
  }
}

//Login
router.post('/', validateUser, async (req, res) => {
  try {
    //Get user information
    if (req.session.user) {
      const updateUserStatus = await pool.query(
        'Update "account" SET status = $2 WHERE id = $1',
        [
          req.session.user.id,
          sob.ONLINE
        ]
      );

      res.status(200).json({
        role: req.session.user.role,
        avatar: req.session.user.avatar,
        id: req.session.user.id,
        username: req.session.user.username,
        fullname: req.session.user.fullname,
        email: req.session.user.email,
        accessType: req.session.user.accesstype,
        accessToken: req.session.token,
      });

    } else {
      req.session.destroy();
      res.status(400).json({ msg: 'Lỗi hệ thống' });
    }
  } catch (error) {
    console.log(error);
    res.status(400).json({ msg: 'Lỗi hệ thống' });
  }
});

//Register
router.post('/register/', async (req, res) => {
  try {
    const { username, password, fullname, avatar, gender, phone, email } = req.body;

    // accesstype
    accesstype = '';
    const domain = email.split('@')[1];

    const listMailType =
      await pool.query(`SELECT mailtype 
        FROM "university" 
        WHERE mailtype = $1 
        LIMIT 1`,
        [domain]
      );

    const listEmail =
      await pool.query(`SELECT email 
        FROM "university" 
        WHERE email = $1 
        LIMIT 1`,
        [email]
      );

    if (listEmail.rows[0]) {
      accesstype = sob.UNIVERSITY;
    } else if (listMailType.rows[0]) {
      accesstype = sob.STUDENT;
    } else {
      accesstype = sob.PERSONAL;
    }
    // password
    const hashPassword = await helpers.hashPassword(password);

    // query
    const list =
      await pool.query(`INSERT INTO "account"(username,password,fullname,avatar,gender,phone,email,accesstype,status,roleid) 
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id;`,
        [
          username,
          hashPassword,
          fullname,
          avatar,
          gender,
          phone,
          email,
          accesstype,
          sob.OFFLINE,
          sob.MEMBER_ID
        ]
      );

    res.status(200).json({ msg: 'Đăng ký thành công', accesstype: accesstype });
    if (res.status(200)) {
      sendEmail(req, res,
        email,
        sob.REGISTER_MAIL_TITLE,
        sob.REGISTER_MAIL_CONTENT);
    }
  } catch (error) {
    console.log(error);
    res.status(400).json({ msg: 'Lỗi hệ thống' });
  }
});

module.exports = router;
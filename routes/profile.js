const { Router } = require('express');
const router = Router();
const pool = require('../db');
const helpers = require('./../utils/helpers');
// const { authJwt } = require("../middleware");

//Change password
router.put('/changepassword/', async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { oldPassword, newPassword } = req.body;
    const hashedNewPassword = await helpers.hashPassword(newPassword);
    const getPassword = await pool.query(
      `SELECT password FROM "account" WHERE id = $1`,
      [userId]
    );
    if (await helpers.validatePassword(oldPassword, getPassword.rows[0].password)) {
      const userChangePassword =
        await pool.query(
          `UPDATE "account" SET password = $1 WHERE id=$2`,
          [
            hashedNewPassword,
            userId
          ]
        );
      res.status(200).json({ msg: 'Đổi mật khẩu thành công' });
    } else {
      res.status(400).json({ msg: 'Lỗi hệ thống' });
    }
  } catch (error) {
    console.log(error);
    res.status(400).json({ msg: 'Lỗi hệ thống' });
  }
});

//View personal profile
router.get('/', async (req, res) => {
  try {
    const profile =
      await pool.query(
        `SELECT id, fullname, avatar, gender, phone, email 
        FROM "account" 
        WHERE id = $1
        LIMIT 1
        ;`,
        [req.session.user.id]
      );
    res.status(200).json(profile.rows);
  } catch (error) {
    console.log(error);
    res.status(400).json({ msg: 'Lỗi hệ thống!' });
  }
});

//Update personal profile
router.put('/update/', async (req, res) => {
  try {
    const { fullname, avatar, gender, phone, email } = req.body;
    const updateProfile = await pool.query(
      `UPDATE "account" 
      SET fullname = $2, avatar = $3, gender = $4, phone = $5, email = $6 
      WHERE id = $1`,
      [
        req.session.user.id,
        fullname,
        avatar,
        gender,
        phone,
        email
      ]
    );
    res.status(200).json();
  } catch (error) {
    console.log(error);
    res.status(400).json({ msg: 'Lỗi hệ thống!' });
  }
});

module.exports = router;
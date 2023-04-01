const { Router } = require('express');
const router = Router();
const pool = require('../db.js');
const helpers = require('../utils/helpers');
// const { authJwt } = require("../middleware");
const sob = require('../staticObj');

async function checkRoleAdmin(req, res, next) {
  try {
    if (req.session.user.role == sob.ADMIN) {
      next();
    } else {
      res.status(400).json({ msg: `Vai trò của người dùng không phù hợp` });
    }
  } catch (error) {
    console.log(error);
    res.status(400).json({ msg: 'Lỗi hệ thống' });
  }
}

//GET Account list
// router.get('/',authJwt.isAdmin, async (req, res) => {
router.get('/', checkRoleAdmin, async (req, res) => {
  try {
    const list =
      await pool.query(`SELECT A.id, A.fullname, A.avatar, A.gender, A.email, A.phone, R.name AS rolename, A.status
        FROM "account" AS A
        JOIN "role" AS R
        ON A.roleid = R.id
        ORDER BY id
        DESC
        ;`
      );
    res.status(200).json({ list: list.rows });
  } catch (error) {
    console.log(error);
    res.status(400).json({ msg: 'Lỗi hệ thống!' });
  }
});

//View account
router.post('/info/', checkRoleAdmin, async (req, res) => {
  try {
    const { id } = req.body;
    const list =
      await pool.query(
        `SELECT A.id, A.username, A.fullname, A.avatar, A.gender, A.phone, A.email, A.status, R.name AS role
        FROM "account" AS A
        JOIN "role" AS R ON A.roleid = R.id 
        WHERE A.id = $1
        LIMIT 1
        ;`,
        [id]
      );
    res.status(200).json(list.rows);
  } catch (error) {
    console.log(error);
    res.status(400).json({ msg: 'Lỗi hệ thống!' });
  }
});

//Update account
router.put('/update/', checkRoleAdmin, async (req, res) => {
  try {
    const { id, roleid } = req.body;
    const updateAccount = await pool.query(
      `UPDATE "account" 
      SET roleid = $2 
      WHERE id = $1`,
      [
        id,
        roleid
      ]
    );
    res.status(200).json();
  } catch (error) {
    console.log(error);
    res.status(400).json({ msg: 'Lỗi hệ thống!' });
  }
});

//Deactive account
router.put('/deactive/', checkRoleAdmin, async (req, res) => {
  try {
    const { id } = req.body;
    const deactiveAccount = await pool.query(
      `UPDATE "account" SET status = $2 WHERE id = $1`,
      [
        id,
        sob.INACTIVE
      ]
    );
    res.status(200).json();
  } catch (error) {
    console.log(error);
    res.status(400).json({ msg: 'Lỗi hệ thống!' });
  }
});

//Active account
router.put('/active/', checkRoleAdmin, async (req, res) => {
  try {
    const { id } = req.body;
    const activeAccount = await pool.query(
      `UPDATE "account" SET status = $2 WHERE id = $1`,
      [
        id,
        sob.OFFLINE
      ]
    );
    res.status(200).json();
  } catch (error) {
    console.log(error);
    res.status(400).json({ msg: 'Lỗi hệ thống!' });
  }
});

module.exports = router;
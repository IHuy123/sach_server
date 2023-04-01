const { Router } = require('express');
const router = Router();
const pool = require('../db');
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

//GET University list
// router.get('/',authJwt.isAdmin, async (req, res) => {
router.get('/', checkRoleAdmin, async (req, res) => {
  try {
    const list =
      await pool.query(`SELECT id, name, email, mailtype, status
        FROM "university"
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

//Add university
router.put('/add/', checkRoleAdmin, async (req, res) => {
  try {
    const { name, email, mailtype } = req.body;
    const newUniversity =
      await pool.query(`
      INSERT INTO "university"(name, email, mailtype, status) 
      VALUES($1, $2, $3, $4) 
      RETURNING id, name, email, mailtype, status;`,
        [
          name,
          email,
          mailtype,
          sob.ACTIVE
        ]
      );
    res.status(200).json(newUniversity.rows);
  } catch (error) {
    console.log(error);
    res.status(400).json({ msg: 'Lỗi hệ thống!' });
  }
});

//View university
router.get('/info/', checkRoleAdmin, async (req, res) => {
  try {
    const { id } = req.body;
    const list =
      await pool.query(
        `SELECT id, name, email, mailtype, status
        FROM "university"
        WHERE id = $1
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

//Update university
router.put('/update/', checkRoleAdmin, async (req, res) => {
  try {
    const { id, name, email, mailtype } = req.body;
    const updateUniversity = await pool.query(
      `UPDATE "university" 
      SET name = $2, 
      email = $3, 
      mailtype = $4 
      WHERE id = $1`,
      [
        id,
        name,
        email,
        mailtype
      ]
    );
    res.status(200).json();
  } catch (error) {
    console.log(error);
    res.status(400).json({ msg: 'Lỗi hệ thống!' });
  }
});

//Deactive university
router.put('/deactive/', checkRoleAdmin, async (req, res) => {
  try {
    const { id } = req.body;
    const deactiveUniversity = await pool.query(
      `UPDATE "university" SET status = $2 WHERE id = $1`,
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

//Active university
router.put('/active/', checkRoleAdmin, async (req, res) => {
  try {
    const { id } = req.body;
    const activeUniversity = await pool.query(
      `UPDATE "university" SET status = $2 WHERE id = $1`,
      [
        id,
        sob.ACTIVE
      ]
    );
    res.status(200).json();
  } catch (error) {
    console.log(error);
    res.status(400).json({ msg: 'Lỗi hệ thống!' });
  }
});

module.exports = router;
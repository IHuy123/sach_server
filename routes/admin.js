const { Router } = require('express');
const router = Router();
const pool = require('../db');
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

//GET Role list
// router.get('/role/',[authJwt.verifyToken, authJwt.isAdmin], async (req, res) => {
router.get('/role/', checkRoleAdmin, async (req, res) => {
  try {
    const list =
      await pool.query(`SELECT id, name
        FROM "role"
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

module.exports = router;
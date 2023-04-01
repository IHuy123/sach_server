const { Router } = require("express");
const router = Router();
const pool = require("../db");
const sob = require("../staticObj");

async function checkRoleAuthor(req, res, next) {
  try {
    if (req.session.user.role == sob.AUTHOR) {
      next();
    } else {
      res.status(400).json({ msg: `Vai trò của người dùng không phù hợp` });
    }
  } catch (error) {
    console.log(error);
    res.status(400).json({ msg: "Lỗi hệ thống" });
  }
}

async function checkCorresponding(req, res, next) {
  try {
    const correspondingAuthor = await pool.query(
      `SELECT A.iscorresponding
      FROM "articleauthor" AS A
      JOIN "account" AS U
      ON U.id = A.accountid 
      WHERE A.accountid = $1 
      AND A.iscorresponding = $2 
      LIMIT 1`,
      [req.session.user.id, true]
    );
    if (correspondingAuthor.rows[0]) {
      req.session.article = correspondingAuthor.rows[0];
      next();
    } else {
      res.status(400).json({ msg: `Vai trò của tác giả không phù hợp` });
    }
  } catch (error) {
    console.log(error);
    res.status(400).json({ msg: "Lỗi hệ thống" });
  }
}

//GET Personal article list
router.get("/article/", checkRoleAuthor, async (req, res) => {
  try {
    const list = await pool.query(
      `SELECT J.id, J.title, M.name as majorname, J.status
      FROM "article" AS J 
      JOIN "articleauthor" AS A
      ON J.id = A.articleid
      JOIN "major" AS M
      ON J.majorid = M.id
      WHERE J.status = $1 
      AND A.accountid = $3
      OR J.status = $2
      AND A.accountid = $3
      ORDER BY id
      DESC
      ;`,
      [
        sob.PUBLIC,
        sob.RESTRICTED,
        req.session.user.id
      ]
    );
    if (list.rows[0]) {
      res.status(200).json({ list: list.rows });
    } else {
      res.status(400).json({ msg: "Không tìm thấy thông tin" });
    }
  } catch (error) {
    console.log(error);
    res.status(400).json({ msg: "Lỗi hệ thống!" });
  }
});

//GET Personal manuscript list
router.get("/manuscript/", checkCorresponding, async (req, res) => {
  try {
    const list = await pool.query(
      `SELECT J.id, J.title, M.name as majorname, J.openaccess
      FROM "article" AS J 
      JOIN "articleauthor" AS A
      ON J.id = A.articleid
      JOIN "major" AS M
      ON J.majorid = M.id
      WHERE J.status != $3 
      AND J.status != $4 
      AND A.accountid = $1 
      AND A.iscorresponding = $2
      ORDER BY id
      DESC;`,
      [
        req.session.user.id,
        true,
        sob.PUBLIC,
        sob.RESTRICTED
      ]
    );
    if (list.rows[0]) {
      res.status(200).json({ list: list.rows });
    } else {
      res.status(400).json({ msg: "Không tìm thấy thông tin" });
    }
  } catch (error) {
    console.log(error);
    res.status(400).json({ msg: "Lỗi hệ thống!" });
  }
});

module.exports = router;

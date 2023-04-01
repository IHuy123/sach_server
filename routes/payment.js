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

async function checkRoleEditor(req, res, next) {
  try {
    if (req.session.user.role == sob.EDITOR ||
      req.session.user.role == sob.CEDITOR) {
      next();
    } else {
      res.status(400).json({ msg: `Vai trò của người dùng không phù hợp` });
    }
  } catch (error) {
    console.log(error);
    res.status(400).json({ msg: 'Lỗi hệ thống' });
  }
}

async function checkPersonal(req, res, next) {
  try {
    if (req.session.user.role == sob.MEMBER || req.session.user.role == sob.AUTHOR) {
      next();
    } else {
      res.status(400).json({ msg: `Vai trò của người dùng không phù hợp` });
    }
  } catch (error) {
    console.log(error);
    res.status(400).json({ msg: 'Lỗi hệ thống' });
  }
}

async function checkUniversity(req, res, next) {
  try {
    if (req.session.user.accesstype == sob.UNIVERSITY) {
      next();
    } else {
      res.status(400).json({ msg: `Vai trò của người dùng không phù hợp` });
    }
  } catch (error) {
    console.log(error);
    res.status(400).json({ msg: 'Lỗi hệ thống' });
  }
}

//Submit personal payment
router.post('/submitpersonal/', checkPersonal, async (req, res) => {
  try {
    const accountid = req.session.user.id;
    const { articleid, amount } = req.body;
    var paymentinfo =
      await pool.query(`INSERT INTO "personaltransaction"(articleid, accountid, amount, creatorid, creationtime) 
        VALUES($1,$2,$3,$4,CURRENT_TIMESTAMP)`,
        [
          articleid,
          accountid,
          amount,
          req.session.user.id
        ]
      );
    res.status(200).json({ msg: "Thanh toán thành công" });
  } catch (error) {
    console.log(error);
    res.status(400).json({ msg: 'Lỗi hệ thống' });
  }
});

//Submit university payment
router.post('/submituniversity/', checkUniversity, async (req, res) => {
  try {
    const { amount, period } = req.body;

    const universityInformation = await pool.query(
      `SELECT id FROM "university" WHERE email = $1 LIMIT 1`,
      [req.session.user.email]
    );

    var paymentinfo =
      await pool.query(`INSERT INTO "universitytransaction"(universityid, amount, expirationdate, isexpired) 
          VALUES($1,$2,CURRENT_TIMESTAMP::DATE + $3::integer,$4)`,
        [
          universityInformation.rows[0].id,
          amount,
          period,
          false
        ]
      );
    res.status(200).json({ msg: "Thanh toán thành công" });
  } catch (error) {
    console.log(error);
    res.status(400).json({ msg: 'Lỗi hệ thống' });
  }
});

//Update university payment
router.put('/updateuniversity/', checkUniversity, async (req, res) => {
  try {
    const { paymentid, amount, period } = req.body;
    // isexpired = false;

    // if (new Date(expirationdate) <= new Date()) {
    //   isexpired = true;
    // }

    var paymentinfo =
      await pool.query(`UPDATE "universitytransaction" 
          SET amount = $1,
          expirationdate = CURRENT_TIMESTAMP::DATE + $2::integer,
          isexpired = $3
          WHERE id = $4`,
        [
          amount,
          period,
          false,
          paymentid
        ]
      );
    res.status(200).json({ msg: "Thanh toán thành công" });
  } catch (error) {
    console.log(error);
    res.status(400).json({ msg: 'Lỗi hệ thống' });
  }
});

//Get list payment of current account
router.get('/mypayment/', checkPersonal, async (req, res) => {
  try {
    const list = await pool.query(
      `SELECT PT.id, PT.articleid, PT.amount, PT.creationtime, A.title AS title, U.fullname AS fullname, A.openaccess AS type
      FROM "personaltransaction" AS PT
      JOIN "article" AS A ON A.id = PT.articleid 
      JOIN "account" AS U ON U.id = PT.accountid 
      WHERE accountid = $1
      ORDER BY id
      DESC
      ;`,
      [req.session.user.id]
    );
    res.status(200).json({ list: list.rows });
  } catch (error) {
    console.log(error);
    res.status(400).json({ msg: 'Lỗi hệ thống!' });
  }
});

//Check author payment
router.post('/authorpayment/', checkRoleEditor, async (req, res) => {
  try {
    const { articleid, accountid } = req.body;
    const author = await pool.query(
      `SELECT accountid, articleid
      FROM  "articleauthor" 
      WHERE iscorresponding = $1 
      AND accountid = $2 
      AND articleid = $3 
      LIMIT 1
      ;`,
      [
        true,
        accountid,
        articleid
      ]
    );
    
    
    if (author.rows[0]) {
      const list = await pool.query(
        `SELECT PT.amount, PT.creationtime, A.title AS title, U.fullname AS fullname, A.openaccess AS type
        FROM "personaltransaction" AS PT
        JOIN "article" AS A ON A.id = PT.articleid 
        JOIN "account" AS U ON U.id = PT.accountid 
        WHERE PT.articleid = $1 
        AND PT.accountid = $2 
        AND A.openaccess = $3 
        LIMIT 1
        ;`,
        [
          articleid,
          accountid,
          true
        ]
      );

      if (list.rows[0]) {
        res.status(200).json({ list: list.rows });
      } else {
        res.status(400).json({ msg: 'Không tìm thấy thông tin' });
      }
    } else {
      res.status(400).json({ msg: 'Không tìm thấy thông tin' });
    }
  } catch (error) {
    console.log(error);
    res.status(400).json({ msg: 'Lỗi hệ thống!' });
  }
});

//Get list payment of personal account
router.get('/personalpayment/', checkRoleAdmin, async (req, res) => {
  try {
    const list =
      await pool.query(`SELECT PT.amount, PT.creationtime, A.title AS title, U.fullname AS fullname, A.openaccess AS type
        FROM "personaltransaction" AS PT
        JOIN "article" AS A ON A.id = PT.articleid 
        JOIN "account" AS U ON U.id = PT.accountid 
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

//Get list payment of the university
router.get('/universitypayment/', checkRoleAdmin, async (req, res) => {
  try {
    const list =
      await pool.query(`SELECT *
        FROM "universitytransaction"
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

//Get personal payment detail
router.get('/personalpayment/:id', checkRoleAdmin, async (req, res) => {
  try {
    // const accountid = req.session.user.id;
    const { id } = req.params;
    const payment =
      await pool.query(`SELECT PT.amount, PT.creationtime, A.title AS title, U.fullname AS fullname, A.openaccess AS type
        FROM "personaltransaction" AS PT
        JOIN "article" AS A ON A.id = PT.articleid 
        JOIN "account" AS U ON U.id = PT.accountid 
        WHERE id = $1
        LIMIT 1
        ;`,
        [id]
      );
    res.status(200).json(payment.rows[0]);
  } catch (error) {
    console.log(error);
    res.status(400).json({ msg: 'Lỗi hệ thống!' });
  }
});

//Get university payment detail
router.get('/universitypayment/:id', checkRoleAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const paymentinfo =
      await pool.query(`SELECT *
        FROM "universitytransaction"
        WHERE id = $1
        LIMIT 1
        ;`,
        [id]
      );
    res.status(200).json(paymentinfo.rows[0]);
  } catch (error) {
    console.log(error);
    res.status(400).json({ msg: 'Lỗi hệ thống!' });
  }
});

//Get university payment detail for corresponding user
router.get('/unicorresponding/', checkUniversity, async (req, res) => {
  try {
    const universityInformation = await pool.query(
      `SELECT id FROM "university" WHERE email = $1 LIMIT 1`,
      [req.session.user.email]
    );

    const paymentinfo =
      await pool.query(`SELECT *
        FROM "universitytransaction"
        WHERE universityid = $1
        LIMIT 1
        ;`,
        [universityInformation.rows[0].id]
      );

    if (paymentinfo.rows[0]) {
      if (paymentinfo.rows[0].expirationdate > Date.now()) {
        var universityTranUpdate = await pool.query(
          `UPDATE "universitytransaction" SET isexpired = $2 WHERE id = $1`,
          [
            paymentinfo.rows[0].id,
            false
          ]
        );
        paymentinfo.rows[0].isexpired = false;
      } else if (paymentinfo.rows[0].expirationdate <= Date.now()) {
        var universityTranUpdate = await pool.query(
          `UPDATE "universitytransaction" SET isexpired = $2 WHERE id = $1`,
          [
            paymentinfo.rows[0].id,
            true
          ]
        );
        paymentinfo.rows[0].isexpired = true;
      }
      res.status(200).json(paymentinfo.rows[0]);
    } else {
      res.status(200).json("Không có thông tin thanh toán");
    }
  } catch (error) {
    console.log(error);
    res.status(400).json({ msg: 'Lỗi hệ thống!' });
  }
});

module.exports = router;
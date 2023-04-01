const { Router } = require('express');
const router = Router();
const pool = require('../db');
var nodemailer = require('nodemailer');
const sob = require('../staticObj');

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

async function checkRoleViewAllReview(req, res, next) {
  try {
    if (req.session.user.role == sob.EDITOR
      || req.session.user.role == sob.CEDITOR
      || req.session.user.role == sob.AUTHOR) {
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
    if (req.session.user.role == sob.EDITOR) {
      next();
    } else {
      res.status(400).json({ msg: `Vai trò của người dùng không phù hợp` });
    }
  } catch (error) {
    console.log(error);
    res.status(400).json({ msg: 'Lỗi hệ thống' });
  }
}

async function checkRoleReviewer(req, res, next) {
  try {
    if (req.session.user.role == sob.REVIEWER) {
      next();
    } else {
      res.status(400).json({ msg: `Vai trò của người dùng không phù hợp` });
    }
  } catch (error) {
    console.log(error);
    res.status(400).json({ msg: 'Lỗi hệ thống' });
  }
}

//Assign reviewer (editor)
router.post('/assign/', checkRoleEditor, async (req, res) => {
  try {
    const creatorid = req.session.user.id;
    const { articleid, reviewerid } = req.body;

    const statusArticle =
      await pool.query(`UPDATE "article" 
        SET status = $2 
        WHERE id = $1`,
        [
          articleid,
          sob.PENDING
        ]
      );

    var createReview =
      await pool.query(`INSERT INTO "review"(articleid, accountid, creatorid, creationtime) 
        VALUES($1,$2,$3,CURRENT_TIMESTAMP) RETURNING id;`,
        [
          articleid,
          reviewerid,
          creatorid
        ]
      );

    res.status(200).json({ msg: "Assign thành công" });
  } catch (error) {
    console.log(error);
    res.status(400).json({ msg: 'Lỗi hệ thống' });
  }
});

//GET reviewer list
router.get('/listreviewers/', checkRoleEditor, async (req, res) => {
  try {
    const list =
      await pool.query(`SELECT id, fullname, avatar, gender, email, phone
        FROM account 
        WHERE roleid = $1`,
        [sob.REVIEWER_ID]
      );
    res.status(200).json({ list: list.rows });
  } catch (error) {
    console.log(error);
    res.status(400).json({ msg: 'Lỗi hệ thống!' });
  }
});

//GET Pending article list (reviewer)
router.get('/pending/', checkRoleReviewer, async (req, res) => {
  try {
    const reviewerid = req.session.user.id;

    //content
    const list =
      await pool.query(`SELECT A.id, A.title, M.name as majorname, A.status
        FROM "article" AS A
        JOIN "review" AS R ON A.id = R.articleid 
        JOIN "major" AS M ON A.majorid = M.id 
        WHERE A.status = $1 AND R.accountid = $2 AND R.suggest IS NULL
        ORDER BY id
        DESC`,
        [
          sob.PENDING,
          reviewerid
        ]
      );

    res.status(200).json({ list: list.rows });
  } catch (error) {
    console.log(error);
    res.status(400).json({ msg: 'Lỗi hệ thống!' });
  }
});

//View review (editor, author)
//# GET -> POST
router.post('/view/all/', checkRoleViewAllReview, async (req, res) => {
  try {
    const { articleid } = req.body;

    const list =
      await pool.query(`SELECT * FROM "review" WHERE articleid = $1`,
        [articleid]
      );

    res.status(200).json({ list: list.rows });
  } catch (error) {
    console.log(error);
    res.status(400).json({ msg: 'Lỗi hệ thống!' });
  }
});

//Submit review (reviewer)
router.put('/submit/', checkRoleReviewer, async (req, res) => {
  try {
    const { articleid, content, suggest } = req.body;

    var submitReview = await pool.query(
      `UPDATE "review" 
      SET content = $3, 
      suggest = $4
      WHERE articleid = $1 
      AND accountid = $2`,
      [
        articleid,
        req.session.user.id,
        content,
        suggest
      ]
    );

    //content
    var checkReview = await pool.query(
      `SELECT content, suggest
      FROM "review" 
      WHERE articleid = $1 
      AND suggest IS NULL
      LIMIT 1`,
      [articleid]
    );

    if (checkReview.rowCount <= 0) {
      var statusArticle = await pool.query(`UPDATE "article" 
        SET status = $2 
        WHERE id = $1`,
        [
          articleid,
          sob.REVIEWED
        ]
      );
    }

    var authorEmail = await pool.query(`SELECT email FROM "articleauthor" WHERE articleid = $1`,
      [articleid]
    );

    res.status(200).json({ msg: 'Gửi review thành công' });

    if (res.status(200)) {
      for (var i = 0; i < authorEmail.rows.length; i++) {
        sendEmail(req, res,
          authorEmail.rows[i].email,
          sob.REVIEWED_MAIL_TITLE,
          sob.REVIEWED_MAIL_CONTENT + content);
      }
    }
  } catch (error) {
    console.log(error);
    res.status(400).json({ msg: 'Lỗi hệ thống!' });
  }
});

//view personal review (reviewer)
router.post('/reviews/', checkRoleReviewer, async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { articleid } = req.body;

    const list =
      await pool.query(`SELECT id, content FROM "review" 
        WHERE accountid = $1
        AND articleid = $2`,
        [
          userId,
          articleid
        ]
      );

    res.status(200).json({ list: list.rows });
  } catch (error) {
    console.log(error);
    res.status(400).json({ msg: 'Lỗi hệ thống!' });
  }
});

//GET My article reviewed list (reviewer)
router.get('/articlereviewed/', checkRoleReviewer, async (req, res) => {
  try {
    const userId = req.session.user.id;

    const list =
      await pool.query(`SELECT A.id, A.title, M.name AS major, A.status, R.suggest
        FROM "article" AS A
        JOIN "major" AS M
        ON M.id = A.majorid
        JOIN "review" AS R
        ON A.id = R.articleid
        WHERE R.accountid = $1
        AND A.status = $2
        ORDER BY A.id
        DESC`,
        [
          userId,
          sob.REVIEWED
        ]
      );

    res.status(200).json({ list: list.rows });
  } catch (error) {
    console.log(error);
    res.status(400).json({ msg: 'Lỗi hệ thống!' });
  }
});

module.exports = router;
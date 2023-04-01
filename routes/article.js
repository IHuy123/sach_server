const { Router } = require("express");
const router = Router();
const pool = require("../db");
const _ = require("lodash");
const sob = require("../staticObj");
const multer = require("multer"); // for file
const PDFDocument = require("pdfkit");
const fs = require("fs");

async function checkRoleSubmit(req, res, next) {
  try {
    if (req.session.user.role == sob.AUTHOR) {
      next();
    } else if (req.session.user.role == sob.MEMBER) {
      var roleUpdate = await pool.query(
        `UPDATE "account" SET roleid = $2 WHERE id = $1`,
        [
          req.session.user.id,
          sob.AUTHOR_ID
        ]
      );
      req.session.user.role = sob.AUTHOR;
      next();
    } else {
      res.status(400).json({ msg: `Vai trò của người dùng không phù hợp` });
    }
  } catch (error) {
    console.log(error);
    res.status(400).json({ msg: "Lỗi hệ thống" });
  }
}

//* Nếu bài viết có openaccess = true, tất cả role đều xem được
async function checkOpenAccess(req, res, next) {
  try {
    const { id } = req.body;
    const openAccess = await pool.query(
      `SELECT id, openaccess
      FROM "article" 
      WHERE id = $1 
      LIMIT 1`,
      [id]
    );
    if (openAccess.rows[0].openaccess == true) {
      req.session.openAccess = true;
      next();
    } else {
      req.session.openAccess = false;
      next();
    }
  } catch (error) {
    console.log(error);
    res.status(400).json({ msg: "Lỗi hệ thống" });
  }
}

//* User thuộc trường đại học đã trả phí và còn thời hạn
//* User cá nhân đã trả phí để xem 1 bài báo xác định
async function checkAccountAccess(req, res, next) {
  try {
    const { id } = req.body;
    const access = await pool.query(
      `SELECT id, email, accesstype
      FROM "account" 
      WHERE id = $1 
      LIMIT 1`,
      [req.session.user.id]
    );

    if (access.rows[0]) {
      if (access.rows[0].accesstype == sob.STUDENT) {
        const mailType = access.rows[0].email.split("@")[1];

        const universityTran = await pool.query(
          `SELECT U.id, U.mailtype, UT.id AS tranid, UT.expirationdate AS expirationdate, UT.isexpired AS isexpired
          FROM "university" AS U
          JOIN "universitytransaction" AS UT ON UT.universityid = U.id 
          WHERE mailtype = $1
          LIMIT 1`,
          [mailType]
        );

        if (universityTran.rows[0]) {
          // req.session.universityTran = universityTran.rows[0];
          req.session.expirationdate = universityTran.rows[0].expirationdate;
          req.session.uniTranId = universityTran.rows[0].tranid;
        } else {
          req.session.universityTran = null;
        }
      } else if (access.rows[0].accesstype == sob.PERSONAL) {
        const personalTran = await pool.query(
          `SELECT * FROM  "personaltransaction" WHERE articleid = $1 AND accountid = $2 LIMIT 1`,
          [id, req.session.user.id]
        );

        if (personalTran.rows[0]) {
          // req.session.personalTran = personalTran.rows[0];
          req.session.articleTranId = personalTran.rows[0].articleid;
        } else {
          req.session.personalTran = null;
        }
      }

      next();
    } else {
      res.status(400).json({ msg: `Không tìm thấy thông tin access` });
    }
  } catch (error) {
    console.log(error);
    res.status(400).json({ msg: "Lỗi hệ thống" });
  }
}

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
    const { id, title, summary, openaccess, majorid, authorlist } =
      req.body;

    const correspondingAuthor = await pool.query(
      `SELECT AA.id, AA.articleid, AA.accountid, A.fullname AS fullname, A.email AS email, M.status AS status, AA.iscorresponding
      FROM "articleauthor" AS AA 
      JOIN "account" AS A 
      ON A.id = AA.accountid 
      JOIN "article" AS M 
      ON M.id = AA.articleid 
      WHERE AA.articleid = $1 
      AND AA.accountid = $2 
      LIMIT 1`,
      [id, req.session.user.id]
    );
    console.log(req.session.user.id);
    if (correspondingAuthor.rows[0].iscorresponding == true) {
      req.session.article = correspondingAuthor.rows[0];
      next();
    } else if (correspondingAuthor.rows[0].iscorresponding == false) {
      req.session.article = correspondingAuthor.rows[0];
      res.status(400).json({ msg: `Vai trò của tác giả không phù hợp` });
    } else {
      res.status(200).json({ msg: `Xóa bản thảo thành công` });
    }
  } catch (error) {
    console.log(error);
    res.status(400).json({ msg: "Lỗi hệ thống" });
  }
}

async function checkCorrespondingWithParams(req, res, next) {
  try {
    const { title, summary, openaccess, majorid, authorlist } = req.body;
    const { id } = req.query;
    const correspondingAuthor = await pool.query(
      `SELECT AA.id, AA.articleid, AA.accountid, A.fullname AS fullname, A.email AS email, M.status AS status, AA.iscorresponding
      FROM "articleauthor" AS AA 
      JOIN "account" AS A 
      ON A.id = AA.accountid 
      JOIN "article" AS M 
      ON M.id = AA.articleid 
      WHERE AA.articleid = $1 
      AND AA.accountid = $2 
      LIMIT 1`,
      [id, req.session.user.id]
    );
    if (correspondingAuthor.rows[0].iscorresponding == true) {
      req.session.article = correspondingAuthor.rows[0];
      next();
    } else if (correspondingAuthor.rows[0].iscorresponding == false) {
      req.session.article = correspondingAuthor.rows[0];
      res.status(400).json({ msg: `Vai trò của tác giả không phù hợp` });
    } else {
      res.status(200).json({ msg: `Xóa bản thảo thành công` });
    }
  } catch (error) {
    console.log(error);
    res.status(400).json({ msg: "Lỗi hệ thống" });
  }
}

async function checkArticleStatus(req, res, next) {
  try {
    if (
      req.session.article.status == sob.WAITING ||
      req.session.article.status == sob.REVISE
    ) {
      next();
    } else {
      res.status(400).json({ msg: `Bài báo đang được xử lí` });
    }
  } catch (error) {
    console.log(error);
    res.status(400).json({ msg: "Lỗi hệ thống" });
  }
}

async function checkArticleStatusForDelete(req, res, next) {
  try {
    if (req.session.article.status == sob.WAITING) {
      next();
    } else {
      res.status(400).json({ msg: `Bài báo đang được xử lí` });
    }
  } catch (error) {
    console.log(error);
    res.status(400).json({ msg: "Lỗi hệ thống" });
  }
}

//GET Article list (public)
router.get("/", async (req, res) => {
  try {
    const list = await pool.query(
      `SELECT A.id, A.title, M.name as majorname, A.openaccess
      FROM "article" AS A 
      JOIN "major" AS M
      ON A.majorid = M.id
      WHERE A.status = $1
      ORDER BY id
      DESC
      ;`,
      [sob.PUBLIC]
    );
    if (list.rows[0]) {
      var author = [];

      for (var i = 0; i < list.rows.length; i++) {
        var authorList = await pool.query(
          `SELECT fullname, email 
          FROM "articleauthor" 
          WHERE articleId = $1`,
          [list.rows[i].id]
        );

        author.push(
          _.merge(list.rows[i],
            { author: authorList.rows }
          )
        );
      }
      res.status(200).json({ list: list.rows });
    } else {
      res.status(400).json({ msg: "Không tìm thấy thông tin" });
    }
  } catch (error) {
    console.log(error);
    res.status(400).json({ msg: "Lỗi hệ thống!" });
  }
});

//View article details (public)
router.post("/info/", async (req, res) => {
  try {
    const { id } = req.body;
    var selectedArticle = await pool.query(
      `SELECT A.id, M.name as major, A.title, A.summary, A.openaccess, A.status
      FROM "article" AS A
      JOIN "major" AS M ON A.majorid = M.id 
      WHERE A.id = $1
      LIMIT 1
      ;`,
      [id]
    );
    if (selectedArticle.rows[0]) {
      var author = [];
      for (var i = 0; i < selectedArticle.rows.length; i++) {
        var authorList = await pool.query(
          `SELECT fullname, email 
          FROM "articleauthor" 
          WHERE articleId = $1`,
          [id]
        );

        author.push(
          _.merge(selectedArticle.rows[i],
            { author: authorList.rows }
          )
        );
      }
      res.status(200).json({ article: selectedArticle.rows });
    } else {
      res.status(400).json({ msg: "Không tìm thấy thông tin" });
    }
  } catch (error) {
    console.log(error);
    res.status(400).json({ msg: "Lỗi hệ thống!" });
  }
});

//GET Major list for submit
router.get("/submit/major", checkRoleSubmit, async (req, res) => {
  try {
    const list = await pool.query(`SELECT id, name
      FROM "major"
      ORDER BY id
      DESC
      ;`
    );
    res.status(200).json({ list: list.rows });
  } catch (error) {
    console.log(error);
    res.status(400).json({ msg: "Lỗi hệ thống!" });
  }
});

//Submit article (author)
//DONE Nếu user là member, thay đổi role của user thành author
//DONE Nếu user là author thì chỉ submit article
//* FE danh sách tác giả bắt buộc phải có 1 corresponding author chịu trách nhiệm chính
/*DONE Nếu author có tài khoản trong danh sách account thì khi điển đúng
email và fullname, hệ thống sẽ tự động thêm accountId tương ứng */
router.post("/submit/", checkRoleSubmit, async (req, res) => {
  try {
    const { title, summary, doc, openaccess, majorid, authorlist } = req.body;
    var author = [];

    var newManuscript = await pool.query(
      `INSERT INTO "article"(title,summary,doc,openaccess,creatorid,creationtime,status,majorid) 
      VALUES($1,$2,$3,$4,$5,CURRENT_TIMESTAMP,$6,$7) RETURNING id;`,
      [
        title,
        summary,
        doc,
        openaccess,
        req.session.user.id,
        sob.WAITING,
        majorid
      ]
    );

    for (var x = 0; x < authorlist.length; x++) {
      var authorItem = await pool.query(
        `SELECT id, fullname, email
        FROM "account" 
        WHERE fullname = $1 
        AND email = $2`,
        [
          authorlist[x].fullname,
          authorlist[x].email
        ]
      );

      if (authorItem.rows[0]) {
        for (var i = 0; i < authorItem.rows.length; i++) {
          var detailAccountAuthor = await pool.query(
            `INSERT INTO "articleauthor"(articleId, accountId, fullname, email, iscorresponding) VALUES($1,$2,$3,$4,$5)`,
            [
              newManuscript.rows[0].id,
              authorItem.rows[i].id,
              authorItem.rows[i].fullname,
              authorItem.rows[i].email,
              authorlist[x].iscorresponding
            ]
          );

          author.push(
            _.merge(authorItem.rows[i],
              { author: detailAccountAuthor.rows }
            )
          );
        }
      } else {
        var detailFreeAuthor = await pool.query(
          `INSERT INTO "articleauthor"(articleId, fullname, email, iscorresponding) VALUES($1,$2,$3,$4)`,
          [
            newManuscript.rows[0].id,
            authorlist[x].fullname,
            authorlist[x].email,
            authorlist[x].iscorresponding
          ]
        );

        author.push(
          _.merge(authorItem.rows[i],
            { author: detailFreeAuthor.rows }
          )
        );
      }
    }
    res.status(200).json();
  } catch (error) {
    console.log(error);
    res.status(400).json({ msg: "Lỗi hệ thống!" });
  }
});

// this apis for file
router.post("/submit-file/", checkRoleSubmit, async (req, res) => {
  try {
    const { title, summary, doc, openaccess, majorid, authorlist } = req.body;
    var author = [];

    var newManuscript = await pool.query(
      `INSERT INTO "article"(title,summary,doc,openaccess,creatorid,creationtime,status,majorid) 
      VALUES($1,$2,$3,$4,$5,CURRENT_TIMESTAMP,$6,$7) RETURNING id;`,
      [
        title,
        summary,
        doc,
        openaccess,
        req.session.user.id,
        sob.WAITING,
        majorid
      ]
    );

    for (var x = 0; x < authorlist.length; x++) {
      var authorItem = await pool.query(
        `SELECT id, fullname, email
        FROM "account"
        WHERE fullname = $1
        AND email = $2`,
        [
          authorlist[x].fullname,
          authorlist[x].email
        ]
      );

      if (authorItem.rows[0]) {
        for (var i = 0; i < authorItem.rows.length; i++) {
          var detailAccountAuthor = await pool.query(
            `INSERT INTO "articleauthor"(articleId, accountId, fullname, email, iscorresponding) VALUES($1,$2,$3,$4,$5)`,
            [
              newManuscript.rows[0].id,
              authorItem.rows[i].id,
              authorItem.rows[i].fullname,
              authorItem.rows[i].email,
              authorlist[x].iscorresponding,
            ]
          );

          author.push(
            _.merge(authorItem.rows[i],
              { author: detailAccountAuthor.rows }
            )
          );
        }
      } else {
        var detailFreeAuthor = await pool.query(
          `INSERT INTO "articleauthor"(articleId, fullname, email, iscorresponding) VALUES($1,$2,$3,$4)`,
          [
            newManuscript.rows[0].id,
            authorlist[x].fullname,
            authorlist[x].email,
            authorlist[x].iscorresponding,
          ]
        );

        author.push(
          _.merge(authorItem.rows[i],
            { author: detailFreeAuthor.rows }
          )
        );
      }
    }
    res.status(200).json();
  } catch (error) {
    console.log(error);
    res.status(400).json({ msg: "Lỗi hệ thống!" });
  }
});

//Edit manuscript (author)
//DONE chỉ cho phép chỉnh sửa bản thảo khi status là REVISE hoặc khi trạng thái là WAITING
//FE danh sách tác giả bắt buộc phải có 1 corresponding author chịu trách nhiệm chính
//DONE chỉ có corresponding author được quyền chỉnh sửa
/*DONE Nếu author có tài khoản trong danh sách account thì khi điển đúng
email và fullname, hệ thống sẽ tự động thêm accountId tương ứng */
router.put("/manuscript/update/",
  checkRoleAuthor,
  checkCorresponding,
  checkArticleStatus,
  async (req, res) => {
    try {
      var author = [];
      // const { id } = req.body;
      var selectedManuscript = await pool.query(
        `UPDATE "article" 
        SET title = $2, 
        summary = $3, 
        doc = $4,
        openaccess = $5, 
        majorid = $6, 
        status = $7 
        WHERE id = $1`,
        [
          req.body.id,
          req.body.title,
          req.body.summary,
          req.body.doc,
          req.body.openaccess,
          req.body.majorid,
          sob.WAITING,
        ]
      );

      for (var i = 0; i < req.body.authorlist.length; i++) {
        var deleteAuthor = await pool.query(
          `DELETE FROM "articleauthor" 
          WHERE articleId = $1 AND iscorresponding = $2`,
          [
            req.body.id,
            false
          ]
        );
      }
      const { authorlist } = req.body;
      const fullnameToDelete = req.session.user.fullname;

      const filteredAuthor = authorlist.filter(
        (person) => person.fullname !== fullnameToDelete
      );
      console.log(filteredAuthor);

      for (var x = 0; x < filteredAuthor.length; x++) {
        var authorItem = await pool.query(
          `SELECT id, fullname, email
          FROM "account" 
          WHERE fullname = $1 
          AND email = $2`,
          [
            filteredAuthor[x].fullname,
            filteredAuthor[x].email
          ]
        );

        if (!authorItem.rows[0]) {
          // for (var i = 0; i < authorItem.rows.length; i++) {
          var detailAccountAuthor = await pool.query(
            `INSERT INTO "articleauthor"(articleId, fullname, email, iscorresponding) VALUES($1,$2,$3,$4)`,
            [
              req.body.id,
              req.body.authorlist[x].fullname,
              req.body.authorlist[x].email,
              false,
            ]
          );

          author.push(
            _.merge(authorItem.rows[i],
              { author: detailAccountAuthor.rows }
            )
          );
          // }
        } else {
          console.log(authorlist);
          var detailFreeAuthor = await pool.query(
            `INSERT INTO "articleauthor"(articleId, fullname, email, iscorresponding) VALUES($1,$2,$3,$4)`,
            [
              req.body.id,
              req.body.authorlist[x].fullname,
              req.body.authorlist[x].email,
              false,
            ]
          );

          author.push(
            _.merge(authorItem.rows[i],
              { author: detailFreeAuthor.rows }
            )
          );
        }
      }

      res.status(200).json();
    } catch (error) {
      console.log(error);
      res.status(400).json({ msg: "Lỗi hệ thống!" });
    }
  }
);

//Delete manuscript (author)
//* chỉ cho phép xóa bản thảo khi chưa được assign reviewer
//DONE chỉ có corresponding author được quyền xóa
//Done nếu tác giả không còn bài báo trong hệ thống, role sẽ được đổi thành MEMBER
router.delete("/manuscript/delete/",
  checkRoleAuthor,
  checkCorrespondingWithParams,
  checkArticleStatusForDelete,
  async (req, res) => {
    try {
      const { id } = req.query;

      var deleteAuthor = await pool.query(
        `DELETE FROM "articleauthor" WHERE articleId = $1`,
        [id]
      );

      var deleteManuscript = await pool.query(
        `DELETE FROM "article" WHERE id = $1`,
        [id]
      );

      var author = await pool.query(
        `SELECT id, accountid FROM "articleauthor" WHERE accountid = $1`,
        [req.session.user.id]
      );

      if (author.rows.length == 0) {
        var roleUpdate = await pool.query(
          `UPDATE "account" SET roleid = $2 WHERE id = $1`,
          [
            req.session.user.id,
            sob.MEMBER_ID
          ]
        );
      }

      res.status(200).json();
    } catch (error) {
      console.log(error);
      res.status(400).json({ msg: "Lỗi hệ thống!" });
    }
  }
);

//View manuscript details (author, reviewer, editor)
router.get("/manuscript/info/", async (req, res) => {
  try {
    const { id } = req.query;
    var selectedManuscript = await pool.query(
      `SELECT A.id, M.name AS major, M.id AS majorid, A.title, A.summary, A.doc, A.openaccess, A.status
      FROM "article" AS A
      JOIN "major" AS M ON A.majorid = M.id 
      WHERE A.id = $1
      LIMIT 1
      ;`,
      [id]
    );

    if (selectedManuscript.rows[0]) {
      var author = [];
      for (var i = 0; i < selectedManuscript.rows.length; i++) {
        var authorList = await pool.query(
          `SELECT fullname, email 
          FROM "articleauthor" 
          WHERE articleId = $1`,
          [id]
        );

        author.push(
          _.merge(selectedManuscript.rows[i],
            { author: authorList.rows }
          )
        );
      }
      res.status(200).json({ article: selectedManuscript.rows });
    } else {
      res.status(400).json({ msg: "Không tìm thấy thông tin" });
    }
  } catch (error) {
    console.log(error);
    res.status(400).json({ msg: "Lỗi hệ thống!" });
  }
});

//View manuscript details (author, reviewer, editor)
router.get("/manuscript/info-file/", async (req, res) => {
  try {
    const { id } = req.body;
    var selectedManuscript = await pool.query(
      `SELECT A.id, M.name as major, A.title, A.summary, A.doc, A.openaccess, A.status
      FROM "article" AS A
      JOIN "major" AS M ON A.majorid = M.id 
      WHERE A.id = $1
      LIMIT 1
      ;`,
      [id]
    );
    if (selectedManuscript.rows[0]) {
      const pdfData = selectedManuscript.rows[0].doc;

      var author = [];
      for (var i = 0; i < selectedManuscript.rows.length; i++) {
        var authorList = await pool.query(
          `SELECT fullname, email 
          FROM "articleauthor" 
          WHERE articleId = $1`,
          [id]
        );

        author.push(
          _.merge(selectedManuscript.rows[i],
            { author: authorList.rows }
          )
        );
      }
      res.status(200).json({ article: selectedManuscript.rows });
    } else {
      res.status(400).json({ msg: "Không tìm thấy thông tin" });
    }
  } catch (error) {
    console.log(error);
    res.status(400).json({ msg: "Lỗi hệ thống!" });
  }
});

//Full text article
//* Nếu bài viết có openaccess = true, tất cả role đều xem được
//* User thuộc trường đại học đã trả phí và còn thời hạn
//* User cá nhân đã trả phí để xem 1 bài báo xác định
//* Author của bài báo và Editor được toàn quyền xem nội dung bài báo
//* Reviewer chỉ được xem nội dung bài báo mình đang review
// #GET -> POST
router.post("/public/",
  checkOpenAccess,
  checkAccountAccess,
  async (req, res) => {
    try {
      const { id } = req.body;
      const checkAuthor = await pool.query(
        `SELECT id, articleid, accountid
        FROM "articleauthor"
        WHERE articleid = $1 
        AND accountid = $2 
        LIMIT 1`,
        [
          id,
          req.session.user.id
        ]
      );

      var author = [];
      const review = await pool.query(
        `SELECT A.id, A.title
        FROM "article" AS A
        JOIN "review" AS R ON A.id = R.articleid 
        WHERE  R.accountid = $1
        ORDER BY id
        DESC`,
        [
          
          req.session.user.id
        ]
      );

      if (
        req.session.openAccess == true ||
        (req.session.openAccess == false &&
          (req.session.expirationdate > Date.now() ||
            req.session.articleTranId == id ||
            (req.session.user.role == sob.REVIEWER && review.rows[0]) ||
            req.session.user.role == sob.EDITOR ||
            req.session.user.role == sob.CEDITOR ||
            checkAuthor.rows[0]))
      ) {
        const list = await pool.query(
          `SELECT A.id, M.name as major, A.title, A.doc, A.openaccess, A.status
          FROM "article" AS A
          JOIN "major" AS M ON A.majorid = M.id 
          WHERE A.id = $1
          LIMIT 1
          ;`,
          [id]
        );

        if (list.rows[0]) {
          for (var i = 0; i < list.rows.length; i++) {
            var authorList = await pool.query(
              `SELECT fullname, email 
              FROM "articleauthor" 
              WHERE articleId = $1`,
              [id]
            );

            author.push(
              _.merge(list.rows[i],
                { author: authorList.rows }
              )
            );
          }
          res.status(200).json(list.rows);
        } else {
          res.status(400).json({ msg: "Không tìm thấy thông tin" });
        }
        // } else if (req.session.openAccess == false && (req.session.universityTran.expirationdate <= Date.now())) {
      } else if (
        req.session.openAccess == false &&
        req.session.expirationdate <= Date.now()
      ) {
        try {
          const paymentid = req.session.uniTranId;
          const date = req.session.expirationdate;

          var universityTranUpdate = await pool.query(
            `UPDATE "universitytransaction" SET isexpired = $2 WHERE id = $1`,
            [
              // req.session.universityTran.id,
              paymentid,
              true,
            ]
          );

          res.status(200).json({
            id: paymentid,
            expiredate: date,
          });
        } catch (error) {
          console.log(error);
          res.status(400).json({ msg: "Lỗi hệ thống!" });
        }
        // res.status(400).json({ msg: 'Quyền truy cập của bạn đã quá hạn' });
      } else if (
        req.session.openAccess == false &&
        req.session.universityTran == null
      ) {
        res.status(200).json({ msg: "payment screen" });
      } else if (
        req.session.openAccess == false &&
        req.session.personalTran == null
      ) {
        res.status(200).json({ msg: "payment screen" });
      } else {
        res.status(400).json({ msg: `Vai trò của người dùng không phù hợp` });
      }
    } catch (error) {
      console.log(error);
      res.status(400).json({ msg: "Lỗi hệ thống!" });
    }
  }
);

//Full text article for file
router.post("/public-file/", async (req, res) => {
  try {
    const { id } = req.body;
    const list = await pool.query(
      `SELECT A.id, M.name as major, A.title, A.doc, A.openaccess, A.status
      FROM "article" AS A
      JOIN "major" AS M ON A.majorid = M.id 
      WHERE A.id = $1
      LIMIT 1
      ;`,
      [id]
    );
    if (list.rows[0]) {
      var author = [];

      for (var i = 0; i < list.rows.length; i++) {
        var authorList = await pool.query(
          `SELECT fullname, email 
          FROM "articleauthor" 
          WHERE articleId = $1`,
          [id]
        );

        author.push(
          _.merge(list.rows[i],
            { author: authorList.rows }
          )
        );
      }
      res.status(200).json(list.rows);
    } else {
      res.status(400).json({ msg: "Không tìm thấy thông tin" });
    }
  } catch (error) {
    console.log(error);
    res.status(400).json({ msg: "Lỗi hệ thống!" });
  }
});

module.exports = router;

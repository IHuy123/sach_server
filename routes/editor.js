const { Router } = require('express');
const router = Router();
const pool = require('../db');
var nodemailer = require('nodemailer');
const _ = require('lodash');
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

async function checkRoleEditor(req, res, next) {
    try {
        if (req.session.user.role == sob.EDITOR
            || req.session.user.role == sob.CEDITOR) {
            next();
        } else {
            res.status(400).json({ msg: `Vai trò của người dùng không phù hợp` });
        }
    } catch (error) {
        console.log(error);
        res.status(400).json({ msg: 'Lỗi hệ thống' });
    }
}

async function checkRoleEditorInChief(req, res, next) {
    try {
        if (req.session.user.role == sob.CEDITOR) {
            next();
        } else {
            res.status(400).json({ msg: `Vai trò của người dùng không phù hợp` });
        }
    } catch (error) {
        console.log(error);
        res.status(400).json({ msg: 'Lỗi hệ thống' });
    }
}

async function checkArticleStatus(req, res, next) {
    try {
        const { id } = req.body;
        var manuscript = await pool.query(
            `SELECT status FROM "article" WHERE id = $1 LIMIT 1`,
            [id]
        );
        if (manuscript.rows[0].status == sob.REVIEWED) {
            next();
        } else {
            res.status(400).json({ msg: `Thao tác không hợp lệ` });
        }
    } catch (error) {
        console.log(error);
        res.status(400).json({ msg: 'Lỗi hệ thống' });
    }
}

async function checkArticleStatusForChief(req, res, next) {
    try {
        const { id } = req.body;
        var manuscript = await pool.query(
            `SELECT status FROM "article" WHERE id = $1 LIMIT 1`,
            [id]
        );
        if (
            manuscript.rows[0].status == sob.ACCEPTED ||
            manuscript.rows[0].status == sob.PUBLIC ||
            manuscript.rows[0].status == sob.RESTRICTED
        ) {
            next();
        } else {
            res.status(400).json({ msg: `Thao tác không hợp lệ` });
        }
    } catch (error) {
        console.log(error);
        res.status(400).json({ msg: 'Lỗi hệ thống' });
    }
}

//GET Manuscript list (Editor)
router.get('/manuscript/', checkRoleEditor, async (req, res) => {
    try {
        const list = await pool.query(`SELECT J.id, J.title, M.name as majorname, J.status, AA.accountid, J.openaccess
            FROM "article" AS J 
            JOIN "major" AS M
            ON J.majorid = M.id
            JOIN "articleauthor" AS AA
            ON AA.articleid = J.id
            WHERE J.status != $1 
            AND J.status != $2
            AND AA.isCorresponding = $3
            ORDER BY id
            DESC
            ;`,
            [
                sob.PUBLIC,
                sob.RESTRICTED,
                true
            ]
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
            res.status(400).json({ msg: 'Không tìm thấy thông tin' });
        }
    } catch (error) {
        console.log(error);
        res.status(400).json({ msg: 'Lỗi hệ thống!' });
    }
});

//GET Article list (Editor-in-chief)
router.get('/article/', checkRoleEditorInChief, async (req, res) => {
    try {
        const list = await pool.query(`SELECT J.id, J.title, M.name as majorname, J.status
            FROM "article" AS J 
            JOIN "major" AS M
            ON J.majorid = M.id
            WHERE J.status = $1 
            OR J.status = $2
            ORDER BY id
            DESC
            ;`,
            [
                sob.PUBLIC,
                sob.RESTRICTED,
            ]
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
            res.status(400).json({ msg: 'Không tìm thấy thông tin' });
        }
    } catch (error) {
        console.log(error);
        res.status(400).json({ msg: 'Lỗi hệ thống!' });
    }
});

//Accept article (Editor)
router.put('/accept/',
    checkRoleEditor,
    checkArticleStatus,
    async (req, res) => {
        try {
            var authorEmail = await pool.query(
                `SELECT email FROM "articleauthor" WHERE articleid = $1`,
                [req.body.id]
            );

            var acceptManuscript = await pool.query(
                `UPDATE "article" SET status = $2 WHERE id = $1`,
                [
                    req.body.id,
                    sob.ACCEPTED,
                ]
            );

            var title = await pool.query(
                `SELECT title
                FROM "article" 
                WHERE id = $1 
                LIMIT 1`,
                [req.body.id]
            );

            res.status(200).json();

            if (res.status(200)) {
                for (var i = 0; i < authorEmail.rows.length; i++) {
                    sendEmail(req, res,
                        authorEmail.rows[i].email,
                        sob.ACCEPT_MAIL_TITLE,
                        sob.ACCEPT_MAIL_CONTENT + title.rows[0].title + sob.LAST_MINE_MAIL_CONTENT);
                }
            }
        } catch (error) {
            console.log(error);
            res.status(400).json({ msg: 'Lỗi hệ thống!' });
        }
    }
);

//Reject article (Editor)
router.put('/reject/',
    checkRoleEditor,
    checkArticleStatus,
    async (req, res) => {
        try {
            var authorEmail = await pool.query(
                `SELECT email FROM "articleauthor" WHERE articleid = $1`,
                [req.body.id]
            );

            var rejectManuscript = await pool.query(
                `UPDATE "article" SET status = $2 WHERE id = $1`,
                [
                    req.body.id,
                    sob.REJECTED,
                ]
            );

            var title = await pool.query(
                `SELECT title
                FROM "article" 
                WHERE id = $1 
                LIMIT 1`,
                [req.body.id]
            );

            res.status(200).json();

            if (res.status(200)) {
                for (var i = 0; i < authorEmail.rows.length; i++) {
                    sendEmail(req, res,
                        authorEmail.rows[i].email,
                        sob.REJECT_MAIL_TITLE,
                        sob.REJECT_MAIL_CONTENT + title.rows[0].title + sob.LAST_MINE_MAIL_CONTENT);
                }
            }
        } catch (error) {
            console.log(error);
            res.status(400).json({ msg: 'Lỗi hệ thống!' });
        }
    }
);

//Revise article (Editor)
router.put('/revise/',
    checkRoleEditor,
    checkArticleStatus,
    async (req, res) => {
        try {
            var authorEmail = await pool.query(
                `SELECT email FROM "articleauthor" WHERE articleid = $1`,
                [req.body.id]
            );

            var reviseManuscript = await pool.query(
                `UPDATE "article" SET status = $2 WHERE id = $1`,
                [
                    req.body.id,
                    sob.REVISE,
                ]
            );

            var title = await pool.query(
                `SELECT title
                FROM "article" 
                WHERE id = $1 
                LIMIT 1`,
                [req.body.id]
            );

            res.status(200).json();

            if (res.status(200)) {
                for (var i = 0; i < authorEmail.rows.length; i++) {
                    sendEmail(req, res,
                        authorEmail.rows[i].email,
                        sob.REVISE_MAIL_TITLE,
                        sob.REVISE_FIRST_MAIL_CONTENT + title.rows[0].title + sob.REVISE_LAST_MAIL_CONTENT);
                }
            }
        } catch (error) {
            console.log(error);
            res.status(400).json({ msg: 'Lỗi hệ thống!' });
        }
    }
);

//Public article (Editor-in-chief)
router.put('/public/',
    checkRoleEditorInChief,
    checkArticleStatusForChief,
    async (req, res) => {
        try {
            var authorEmail = await pool.query(
                `SELECT email FROM "articleauthor" WHERE articleid = $1`,
                [req.body.id]
            );

            var publicManuscript = await pool.query(
                `UPDATE "article" SET status = $2 WHERE id = $1`,
                [
                    req.body.id,
                    sob.PUBLIC,
                ]
            );

            var title = await pool.query(
                `SELECT title
                FROM "article" 
                WHERE id = $1 
                LIMIT 1`,
                [req.body.id]
            );

            res.status(200).json();

            if (res.status(200)) {
                for (var i = 0; i < authorEmail.rows.length; i++) {
                    sendEmail(req, res,
                        authorEmail.rows[i].email,
                        sob.PUBLIC_MAIL_TITLE,
                        sob.CHIEF_FIRST_MAIL_CONTENT + title.rows[0].title + sob.PUBLIC_LAST_MAIL_CONTENT);
                }
            }
        } catch (error) {
            console.log(error);
            res.status(400).json({ msg: 'Lỗi hệ thống!' });
        }
    }
);

//Restricted article (Editor-in-chief)
router.put('/restricted/',
    checkRoleEditorInChief,
    checkArticleStatusForChief,
    async (req, res) => {
        try {
            var authorEmail = await pool.query(
                `SELECT email FROM "articleauthor" WHERE articleid = $1`,
                [req.body.id]
            );

            var publicManuscript = await pool.query(
                `UPDATE "article" SET status = $2 WHERE id = $1`,
                [
                    req.body.id,
                    sob.RESTRICTED,
                ]
            );

            var title = await pool.query(
                `SELECT title
                FROM "article" 
                WHERE id = $1 
                LIMIT 1`,
                [req.body.id]
            );

            res.status(200).json();

            if (res.status(200)) {
                for (var i = 0; i < authorEmail.rows.length; i++) {
                    sendEmail(req, res,
                        authorEmail.rows[i].email,
                        sob.RESTRICTED_MAIL_TITLE,
                        sob.CHIEF_FIRST_MAIL_CONTENT + title.rows[0].title + sob.RESTRICTED_LAST_MAIL_CONTENT);
                }
            }
        } catch (error) {
            console.log(error);
            res.status(400).json({ msg: 'Lỗi hệ thống!' });
        }
    }
);

module.exports = router;
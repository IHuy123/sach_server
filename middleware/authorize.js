const { Router } = require('express');
const { authJwt } = require(".");
const controller = require("../controllers/accountController");
const router = Router();

async function headerCross(req, res, next) {
  res.header(
    "Access-Control-Allow-Headers",
    "x-access-token, Origin, Content-Type, Accept"
  );
  next();
};

router.get("/api/all", headerCross, controller.allAccess);

router.get("/api/admin", headerCross, [authJwt.verifyToken, authJwt.isAdmin], controller.adminBoard);
router.get("/api/member", headerCross, [authJwt.verifyToken, authJwt.isMember], controller.memberBoard);
router.get("/api/author", headerCross, [authJwt.verifyToken, authJwt.isAuthor], controller.authorBoard);
router.get("/api/reviewer", headerCross, [authJwt.verifyToken, authJwt.isReviewer], controller.reviewerBoard);
router.get("/api/editor", headerCross, [authJwt.verifyToken, authJwt.isEditor], controller.editorBoard);
router.get("/api/editor-in-chief", headerCross, [authJwt.verifyToken, authJwt.isEditorInChief], controller.editorInChiefBoard);

module.exports = router;
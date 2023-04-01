const jwt = require("jsonwebtoken");
const config = require("../config/authConfig.js");
const db = require("../models");
// const Account = db.account;
const pool = require('../db');
// const helpers = require('./../utils/helpers');

verifyToken = (req, res, next) => {
  let token = req.headers["x-access-token"];

  if (!token) {
    return res.status(403).send({
      message: "No token provided!"
    });
  }
  jwt.verify(token, config.secret, (err, decoded) => {
    if (err) {
      return res.status(401).send({
        message: "Unauthorized!"
      });
    }
    req.userId = decoded.id;
    next();
  });
};

// isAdmin = (req, res, next) => {
//   const { username, password } = req.body;
//   const role = pool.query(
//     `SELECT R.name As role
//     FROM "account" AS A JOIN "role" AS R ON A.roleid = R.id
//     WHERE A.username = $1 LIMIT 1`, [username]
//   );
//     if(role.row[0]){
//       for(var i = 0; i <= role.length; i++){
//         if(role[i] === "ADMIN"){
//           next();
//           return;
//         }

//       }
//       res.status(401).send("Accessdenied");
//     } else {
//       // if the account doesn't exist, you can send a response to the client indicating that the account doesn't exist
//       res.status(404).send("Account not found");
//     }
//   // .catch(error => {
//   //   // handle any other errors that may occur
//   //   console.error(error);
//   //   res.status(500).send("An error occurred");
//   // });



// //   Account.findByPk(req.accountID).then(account => {
// //   if (account) { // check if account exists
// //     account.getRoles().then(roles => {
// //       for (let i = 0; i < roles.length; i++) {
// //         if (roles[i].name === "ADMIN") {
// //           next();
// //           return;
// //         }
// //       }
// //       // if the loop doesn't find an "ADMIN" role, you can send a response to the client indicating that access is denied
// //       res.status(403).send("Access denied");
// //     });
// //   } else {
// //     // if the account doesn't exist, you can send a response to the client indicating that the account doesn't exist
// //     res.status(404).send("Account not found");
// //   }
// // }).catch(error => {
// //   // handle any other errors that may occur
// //   console.error(error);
// //   res.status(500).send("An error occurred");
// // });

//   //       res.status(403).send({
//   //         message: "Require Admin Role!"
//   //       });
//   //       return;
//   //     });
//   //   });
//    };

isAdmin = async (req, res, next) => {
  const { username, password } = req.body;
  const result = await pool.query(
    `SELECT R.name As role
          FROM "account" AS A JOIN "role" AS R ON A.roleid = R.id
          WHERE A.username = $1 LIMIT 1`, [username]
        );
        const role = result.rows[0]?.role; // use optional chaining to avoid null/undefined errors
        
        if(role && role === "ADMIN"){
          next();
        } 
        
        
        else {
          res.status(401).send("Vai trò của người dùng không phù hợp");
        }
      }


isMember = async (req, res, next) => {
  const { username, password } = req.body;
  const result = await pool.query(
    `SELECT R.name As role
          FROM "account" AS A JOIN "role" AS R ON A.roleid = R.id
          WHERE A.username = $1 LIMIT 1`, [username]
        );
        const role = result.rows[0]?.role; // use optional chaining to avoid null/undefined errors
        
        if(role && role === "MEMBER"){
          next();
        } 
        
        
        else {
          res.status(401).send("Vai trò của người dùng không phù hợp");
        }
      }


isAuthor = async (req, res, next) => {
  const { username, password } = req.body;
  const result = await pool.query(
    `SELECT R.name As role
          FROM "account" AS A JOIN "role" AS R ON A.roleid = R.id
          WHERE A.username = $1 LIMIT 1`, [username]
        );
        const role = result.rows[0]?.role; // use optional chaining to avoid null/undefined errors
        
        if(role && role === "AUTHOR"){
          next();
        } 
        
        
        else {
          res.status(401).send("vai trò người dùng không phù hợp");
        }

  if (role && role === "AUTHOR") {
    next();
  }

  else {
    res.status(401).send("Access denied");
  }

}



isReviewer = async (req, res, next) => {
  const { username, password } = req.body;
  const result = await pool.query(
    `SELECT R.name As role
          FROM "account" AS A JOIN "role" AS R ON A.roleid = R.id
          WHERE A.username = $1 LIMIT 1`, [username]
        );
        const role = result.rows[0]?.role; // use optional chaining to avoid null/undefined errors
        
        if(role && role === "REVIEWER"){
          next();
        } 
        
        
        else {
          res.status(401).send("Vai trò của người dùng không phù hợp");
        }
      }



isEditor = async (req, res, next) => {
  const { username, password } = req.body;
  const result = await pool.query(
    `SELECT R.name As role
          FROM "account" AS A JOIN "role" AS R ON A.roleid = R.id
          WHERE A.username = $1 LIMIT 1`, [username]
        );
        const role = result.rows[0]?.role; // use optional chaining to avoid null/undefined errors
        
        if(role && role === "EDITOR"){
          next();
        } 
        
        
        else {
          res.status(401).send("Vai trò của người dùng không phù hợp");
        }
      }


isEditorInChief = async (req, res, next) => {
  const { username, password } = req.body;
  const result = await pool.query(
    `SELECT R.name As role
          FROM "account" AS A JOIN "role" AS R ON A.roleid = R.id
          WHERE A.username = $1 LIMIT 1`, [username]
        );
        const role = result.rows[0]?.role; // use optional chaining to avoid null/undefined errors
        
        if(role && role === "EDITOR_IN_CHEIF"){
          next();
        } 
        
        
        else {
          res.status(401).send("Vai trò của người dùng không phù hợp");
        }
      }




const authJwt = {
  verifyToken: verifyToken,
  isAdmin: isAdmin,
  isMember: isMember,
  isAuthor: isAuthor,
  isReviewer: isReviewer,
  isEditor: isEditor,
  isEditorInChief: isEditorInChief,
  // isModerator: isModerator,
  // isModeratorOrAdmin: isModeratorOrAdmin
};
module.exports = authJwt;
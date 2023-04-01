const db = require("../models/index");
const config = require("../config/authConfig");
const Account = db.account;
const Role = db.role;

const Op = db.Sequelize.Op;
helpers = require('../utils/helpers');
var jwt = require("jsonwebtoken");
var bcrypt = require("bcryptjs");


exports.signup = (req, res) => {
  // Save User to Database
  Account.create({
    username: req.body.username,
    password: bcrypt.hashSync(req.body.password, 8),
    fullname: req.body.fullname,
    avatar: req.body.avatar,
    gender: req.body.gender,
    phone: req.body.phone,
    email: req.body.email,
  })
    .then(account => {
      if (req.body.roles) {
        Role.findAll({
          where: {
            name: {
              [Op.or]: req.body.roles
            }
          }
        }).then(roles => {
          account.setRoles(roles).then(() => {
            res.send({ message: "User was registered successfully!" });
          });
        });
      } else {
        // user role = 1
        account.setRoles([1]).then(() => {
          res.send({ message: "User was registered successfully!" });
        });
      }
    })
    .catch(err => {
      res.status(500).send({ message: err.message });
    });
};



exports.signin = (req, res) => {
  Account.findOne({
    where: {
      username: req.body.username
    }
  })
    .then(account => {
      if (!account) {
        return res.status(404).send({ message: "User Not found." });
      }

      var passwordIsValid = bcrypt.compareSync(
        req.body.password,
        account.password
      );

      // var passwordIsValid = helpers.validatePassword(
      //   req.body.password,
      //   account.password
      // )

      if (!passwordIsValid) {
        return res.status(401).send({
          accessToken: null,
          message: "Invalid Password!"
        });
      }

      var token = jwt.sign({ id: account.id }, config.secret, {
        expiresIn: 86400 // 24 hours
      });

      var authorities = [];
      account.getRoles().then(roles => {
        for (let i = 0; i < roles.length; i++) {
          authorities.push("ROLE_" + roles[i].name.toUpperCase());
        }
        res.status(200).send({
          id: account.id,
          username: account.userName,
          email: account.email,
          roles: authorities,
          accessToken: token
        });
      });
    })
    
    .catch(err => {
      res.status(500).send({ message: err.message });
    });
};
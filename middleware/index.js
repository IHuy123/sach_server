const { Model } = require("sequelize");
const authJwt = require("./authJWT.js");
const verifySignUp = require("./verifySignUp");

module.exports = {
    authJwt,
    verifySignUp
};
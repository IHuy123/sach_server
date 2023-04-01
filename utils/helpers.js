const bcrypt = require('bcryptjs');
const _ = require('lodash');
const pool = require('../db');

const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt();
  return bcrypt.hash(password, salt);
};

const validatePassword = async (raw, hash) => {
  const result = await bcrypt.compare(raw, hash);
  return result;
};

const errorMsgHandler = (err) => {
  console.log(err);
  let validationErrors;
  if (err) {
    validationErrors = {};
    err.forEach((error) => {
      validationErrors[error.param] = error.msg;
    });
  }
  return validationErrors;
};

module.exports = {
  hashPassword,
  errorMsgHandler,
  validatePassword,
};

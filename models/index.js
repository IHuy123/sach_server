const config = require("../db");


const Sequelize = require("sequelize");
const sequelize = new Sequelize(
  config.DB,
  config.USER,
  config.PASSWORD,
  {
    host: config.HOST,
    //port: config.PORT,
    dialect: config.dialect,
    operatorsAliases: false,
  }

  // HOST: "localhost",
  // USER: "postgres",
  // PASSWORD: "123",
  // DB: "testdb",
  // dialect: "postgres",
  // pool: {
  //   max: 5,
  //   min: 0,
  //   acquire: 30000,
  //   idle: 10000
  // }

  //     user: 'postgres',
  //   password: '54321',
  //   host: 'localhost',
  //   port: 5432,
  //   database: 'ejournal',
);

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.account = require("../models/accountModel.js")(sequelize, Sequelize);
db.role = require("../models/roleModel.js")(sequelize, Sequelize);

db.account.belongsTo(db.role, {
  through: "account_roles",
  foreignKey: "roleId",
});

db.ROLES = [
  "ADMIN",
  "MEMBER",
  "AUTHOR",
  "REVIEWER",
  "EDITOR",
  "EDITOR_IN_CHIEF",
];

module.exports = db;

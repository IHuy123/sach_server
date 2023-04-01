

module.exports = (sequelize, Sequelize) => {
    const Account = sequelize.define("account", {
        id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true,
          },
          username: {
            type: Sequelize.STRING
          },
          password: {
            type: Sequelize.STRING
          },
          fullName: {
            type: Sequelize.STRING
          },
          avatar: {
            type: Sequelize.STRING
          },
          gender: {
            type: Sequelize.BOOLEAN
          },
          phone: {
            type: Sequelize.STRING
          },
          email: {
            type: Sequelize.STRING
          },
          accessType: {
            type: Sequelize.ENUM('UNIVERSITY', 'PERSONAL', 'STUDENT'),
            defaultValue: "PERSONAL",
          },
          status: {
            type: Sequelize.ENUM('ONLINE', 'OFFLINE', 'INACTIVE'),
            defaultValue: "OFFLINE",
          },
        
    });
    

    return Account;
}


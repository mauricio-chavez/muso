const Sequelize = require('sequelize');

function getConnection() {
  const sequelize = new Sequelize(
    process.env.DATABASE_URL || 'postgres:///muso',
    { logging: false }
  );
  sequelize.authenticate().catch(error => {
    console.error('Unable to connect to the database:', error);
  });
  return sequelize;
}

module.exports = getConnection();

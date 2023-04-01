const Pool = require('pg').Pool;

//Local run
const pool = new Pool({
  user: 'postgres',
  password: '123',
  host: 'localhost',
  port: 5432,
  database: 'ejournal',
});

module.exports = pool;

require('dotenv').config();
const Pool = require('pg').Pool;
const password = process.env.DATABASE_PASSWORD;

const pool = new Pool({
    user: "postgres",
    password: password,
    host: "localhost",
    port: 5432,
    database: "todo"
});

module.exports = pool;
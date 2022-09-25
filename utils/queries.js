const Pool = require('pg').Pool
require('dotenv').config();


const pool = new Pool({
    // user: 'postgres',
    // host: 'localhost',
    // database: 'ecommerce',
    // password: 'postgres',
    host: process.env.PGHOST,
    user: process.env.PGUSER,
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    port: 5432,
});

const getProducts = (request, response) => {
    pool.query('SELECT * FROM "product"', (error, results) => {
        if (error) {
            throw error
        }
        response.status(200).json(results.rows)
    })
}

module.exports = pool
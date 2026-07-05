const { Pool } = require('pg');

// Test with the URL-encoded version (what Railway has)
const encodedUrl = 'postgresql://postgres:Kanishka%40123@db.txsotycqqrxbrqoxpowo.supabase.co:5432/postgres';

console.log('Testing with URL-encoded password (%40 for @)...');
console.log('Connection string:', encodedUrl.replace(/:[^:@]+@/, ':****@'));

const pool = new Pool({
    connectionString: encodedUrl,
    ssl: { rejectUnauthorized: false },
});

pool.query('SELECT COUNT(*) AS count FROM jobs')
    .then(r => {
        console.log('SUCCESS! Jobs count:', r.rows[0].count);
        pool.end();
    })
    .catch(e => {
        console.error('FAILED:', e.message);
        pool.end();
    });

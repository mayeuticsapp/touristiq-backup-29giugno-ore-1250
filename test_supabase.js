const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:TouristIQ2025!@db.knyzxahytahokggrilbs.supabase.co:5432/postgres',
  ssl: {
    rejectUnauthorized: false
  }
});

async function testConnection() {
  try {
    console.log('🔄 Tentativo connessione Supabase...');
    const client = await pool.connect();
    console.log('✅ Connessione riuscita!');
    
    const result = await client.query('SELECT COUNT(*) FROM iq_codes');
    console.log('📊 Codici IQ nel database:', result.rows[0].count);
    
    const adminCheck = await client.query("SELECT code, credits_remaining FROM admin_credits WHERE admin_code = 'TIQ-IT-ADMIN'");
    if (adminCheck.rows.length > 0) {
      console.log('👑 Admin trovato:', adminCheck.rows[0].code, 'con', adminCheck.rows[0].credits_remaining, 'crediti');
    }
    
    client.release();
    await pool.end();
    console.log('✅ Test completato con successo!');
  } catch (err) {
    console.log('❌ Errore:', err.message);
    await pool.end();
  }
}

testConnection();

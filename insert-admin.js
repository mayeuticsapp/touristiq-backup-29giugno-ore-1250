import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

async function insertAdmin() {
  try {
    await client.connect();
    console.log('✅ Connesso al database');
    
    // Verifica se admin esiste già
    const checkResult = await client.query(
      "SELECT * FROM iq_codes WHERE code = 'TIQ-IT-ADMIN'"
    );
    
    if (checkResult.rows.length > 0) {
      console.log('✅ Codice admin già esistente');
    } else {
      // Inserisci codice admin
      await client.query(
        "INSERT INTO iq_codes (code, role, is_active, created_at) VALUES ($1, $2, $3, $4)",
        ['TIQ-IT-ADMIN', 'admin', true, new Date()]
      );
      console.log('✅ Codice admin inserito con successo');
    }
    
    // Mostra tutti i codici
    const allCodes = await client.query("SELECT code, role, is_active FROM iq_codes");
    console.log('\n📋 Codici presenti nel database:');
    allCodes.rows.forEach(row => {
      console.log(`  - ${row.code} (${row.role}) - ${row.is_active ? 'Attivo' : 'Non attivo'}`);
    });
    
  } catch (error) {
    console.error('❌ Errore:', error.message);
  } finally {
    await client.end();
  }
}

insertAdmin();

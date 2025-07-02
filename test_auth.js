// Test per verificare il flusso di autenticazione
console.log("Test autenticazione");

// 1. Login
fetch('/api/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ iqCode: 'TIQ-IT-ADMIN' }),
  credentials: 'include'
})
.then(res => res.json())
.then(data => {
  console.log("Login response:", data);
  
  // 2. Verifica sessione
  return fetch('/api/auth/me', {
    credentials: 'include'
  });
})
.then(res => res.json())
.then(data => {
  console.log("Auth me response:", data);
})
.catch(err => {
  console.error("Errore:", err);
});
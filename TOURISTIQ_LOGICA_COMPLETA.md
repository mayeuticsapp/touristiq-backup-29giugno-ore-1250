# TOURISTIQ - LOGICA COMPLETA DEL SISTEMA
## Il Percorso dell'IQcode dalla Generazione all'Utilizzo

---

## PANORAMICA

TouristIQ collega **3 attori** attraverso un sistema di codici IQ che garantiscono sconti e vantaggi ai turisti:

1. **STRUTTURE RICETTIVE** → Generano e regalano i codici IQ ai turisti
2. **TURISTI** → Ricevono i codici e li usano per ottenere sconti
3. **PARTNER COMMERCIALI** → Offrono sconti ai turisti con codice IQ valido

---

## FASE 1: GENERAZIONE DEL CODICE IQ

### Chi genera il codice?
**La struttura ricettiva** (hotel, B&B, casa vacanze, agriturismo)

### Prerequisiti:
1. La struttura deve avere un **pacchetto crediti attivo** assegnato dall'Admin
   - Pacchetti disponibili: 25, 50, 75, 100 codici
   - Ogni codice generato = 1 credito consumato
2. La struttura fa login con il suo codice struttura (es. `TIQ-VV-STT-9576`)

### Processo di generazione:

**PASSO 1:** Receptionist accede alla Dashboard Struttura

**PASSO 2:** Clicca su "Genera Codice per Ospite"

**PASSO 3:** Inserisce nome dell'ospite (es. "Mario Rossi")

**PASSO 4:** Il sistema genera automaticamente:
- **Codice permanente:** `TIQ-IT-9368-GIOTTO`
  - TIQ = TouristIQ
  - IT = Italia
  - 9368 = numero univoco
  - GIOTTO = riferimento culturale italiano (emotivo)
- **Codice temporaneo primo accesso:** `IQCODE-PRIMOACCESSO-87654`
  - Serve solo per l'attivazione iniziale

**PASSO 5:** I crediti della struttura scalano (es. 50 → 49)

**PASSO 6:** Il sistema genera un foglio stampabile con:
- Entrambi i codici
- Istruzioni di attivazione
- Welcome message
- QR code per accesso rapido

---

## FASE 2: CONSEGNA AL TURISTA

### Quando avviene?
**All'arrivo del turista** nella struttura (check-in)

### Come avviene?
1. Il receptionist **stampa il foglio** con i codici
2. Consegna al turista insieme alle chiavi/documenti
3. Spiega brevemente: "Questo è il suo codice TouristIQ per ottenere sconti in città"

### Cosa riceve il turista?
- **Codice temporaneo** per attivare il sistema (IQCODE-PRIMOACCESSO-XXXXX)
- **Codice permanente** che userà sempre dopo l'attivazione
- **Plafond di €150** di sconti disponibili
- Istruzioni per l'attivazione

---

## FASE 3: ATTIVAZIONE DA PARTE DEL TURISTA

### Prima visita al sito TouristIQ:

**PASSO 1:** Turista inserisce il codice temporaneo `IQCODE-PRIMOACCESSO-87654`

**PASSO 2:** Sistema riconosce che è un primo accesso → redirect alla pagina di attivazione

**PASSO 3:** Sistema trasforma il codice temporaneo nel codice permanente `TIQ-IT-9368-GIOTTO`

**PASSO 4:** Turista imposta il **Custode del Codice**:
- Domanda segreta (es. "Nome del tuo primo animale domestico?")
- Risposta segreta (es. "Fido")
- Serve per recuperare il codice se lo dimentica

**PASSO 5:** Codice permanente **attivato e operativo**

### Accessi successivi:
- Turista usa direttamente il codice permanente `TIQ-IT-9368-GIOTTO`
- Login diretto senza passaggi aggiuntivi

---

## FASE 4: UTILIZZO DEL CODICE (Dashboard Turista)

### Cosa vede il turista dopo il login?

**DASHBOARD TURISTA:**
1. **Plafond rimanente** (es. €150 disponibili, poi scala con gli sconti usati)
2. **Mappa partner** con geolocalizzazione dei negozi/ristoranti convenzionati
3. **Lista sconti** disponibili divisi per categoria
4. **TIQai** - Assistente AI turistico multilingue (italiano, inglese, spagnolo, tedesco)
5. **Sistema TIQ-OTC** - Generazione codici usa e getta per privacy
6. **I miei risparmi** - Cronologia sconti ottenuti
7. **Custode del Codice** - Gestione recupero password

---

## FASE 5: OTTENERE UNO SCONTO (Sistema TIQ-OTC)

### Il problema della privacy:
Il turista **non vuole dare il suo codice IQ principale** ai commercianti per proteggere la sua privacy.

### La soluzione: TIQ-OTC (One-Time Code)

**TIQ-OTC = Codice Usa e Getta**
- Valido solo una volta
- Si "brucia" dopo l'utilizzo
- Non rivela il codice IQ principale
- Il turista ha **10 utilizzi TIQ-OTC inclusi** nel suo plafond

### Processo completo per ottenere uno sconto:

**PASSO 1: SCOPERTA**
- Turista consulta la mappa partner o chiede a TIQai
- Trova un partner interessante (es. "Ristorante Da Mario - 10% su tutti i piatti")

**PASSO 2: GENERAZIONE CODICE TIQ-OTC**
- Prima di andare dal partner, turista apre la sua dashboard
- Clicca "Genera Codice Sconto"
- Sistema genera codice monouso: `44771`
- Codice mostrato sullo schermo, copiabile

**PASSO 3: VISITA AL PARTNER**
- Turista va al ristorante/negozio
- Consuma/acquista normalmente
- Al momento del pagamento, mostra il codice `44771`

**PASSO 4: VALIDAZIONE DA PARTE DEL PARTNER**
- Il commerciante accede alla sua Dashboard Partner
- Inserisce il codice TIQ-OTC: `44771`
- Inserisce l'importo dello sconto applicato: `€5`
- Clicca "Valida"

**PASSO 5: SISTEMA VERIFICA**
- Codice valido? ✅
- Codice già usato? ❌ (sarebbe rifiutato)
- Turista ha plafond sufficiente? ✅

**PASSO 6: CONFERMA**
- Sconto applicato
- Codice `44771` si "brucia" (non più riutilizzabile)
- Plafond turista aggiornato: €150 → €145
- Partner riceve conferma validazione
- Turista riceve notifica risparmio

---

## FASE 6: TRACCIAMENTO E FEEDBACK

### Per il turista:
- **I Miei Risparmi:** cronologia completa degli sconti ottenuti
- **Plafond aggiornato:** quanto può ancora risparmiare
- **Possibilità di lasciare feedback** sul partner (entro 2 ore dalla validazione)

### Per il partner:
- **Statistiche validazioni:** quanti sconti ha erogato
- **Totale valore sconti:** quanto ha "regalato" ai turisti
- **Feedback ricevuti:** rating dai turisti
- **NON vede:** il codice IQ principale del turista (privacy protetta)

### Per la struttura:
- **Codici generati:** quanti ospiti hanno ricevuto IQcode
- **Crediti rimanenti:** quanti codici può ancora generare
- **NON vede:** come i turisti usano gli sconti (privacy protetta)

### Per l'Admin:
- **Visione globale:** tutti i codici, tutte le strutture, tutti i partner
- **Statistiche sistema:** risparmio totale generato, codici attivi, ecc.
- **Gestione pacchetti:** assegnazione crediti alle strutture
- **Gestione partner:** approvazione nuovi partner

---

## CICLO DI VITA COMPLETO DELL'IQCODE

```
ADMIN
  │
  ├──► Assegna pacchetto crediti (50 codici) a STRUTTURA
  │
  ▼
STRUTTURA (Hotel)
  │
  ├──► Genera IQcode per ospite Mario Rossi
  │    - Codice permanente: TIQ-IT-9368-GIOTTO
  │    - Codice temporaneo: IQCODE-PRIMOACCESSO-87654
  │    - Crediti: 50 → 49
  │
  ├──► Stampa e consegna foglio al TURISTA
  │
  ▼
TURISTA (Mario Rossi)
  │
  ├──► Attiva codice con IQCODE-PRIMOACCESSO-87654
  │    - Imposta Custode del Codice
  │    - Riceve plafond €150
  │
  ├──► Accede con TIQ-IT-9368-GIOTTO
  │
  ├──► Esplora partner su mappa / TIQai
  │
  ├──► Genera codice TIQ-OTC: 44771
  │
  ├──► Va dal PARTNER e mostra codice
  │
  ▼
PARTNER (Ristorante)
  │
  ├──► Valida codice TIQ-OTC: 44771
  │    - Inserisce sconto: €5
  │
  ├──► Sistema conferma:
  │    - Codice 44771 bruciato
  │    - Sconto applicato
  │
  ▼
TURISTA
  │
  ├──► Plafond aggiornato: €150 → €145
  │
  ├──► Può lasciare feedback sul partner
  │
  ▼
CICLO SI RIPETE per ogni sconto
```

---

## REGOLE DI SICUREZZA

### Anti-frode:
1. **Codici TIQ-OTC monouso:** non riutilizzabili dopo validazione
2. **Plafond massimo €150:** limite per turista
3. **Controllo crediti struttura:** niente codici senza pacchetto attivo
4. **Validazione unica:** stesso codice non può essere validato due volte
5. **Tempo feedback:** massimo 2 ore dopo validazione

### Privacy:
1. **Partner non vede codice IQ principale:** solo il TIQ-OTC temporaneo
2. **Struttura non vede utilizzi:** non sa come/dove il turista usa gli sconti
3. **Turista anonimo:** il partner sa solo che è un turista TouristIQ valido

---

## VALORE PER OGNI ATTORE

### Per il TURISTA:
- €150 di sconti gratuiti
- Scoperta guidata del territorio (TIQai)
- Privacy protetta
- Sistema semplice da usare

### Per la STRUTTURA RICETTIVA:
- Valore aggiunto per gli ospiti (differenziazione)
- Fidelizzazione clienti
- Nessun costo per gli sconti (li eroga il partner)
- Marketing territoriale integrato

### Per il PARTNER COMMERCIALE:
- Visibilità su mappa e TIQai
- Clienti qualificati (turisti con plafond)
- Sistema validazione semplice
- Feedback per migliorare servizio

### Per l'ADMIN (TouristIQ):
- Controllo completo del sistema
- Dati statistici sul turismo locale
- Modello scalabile ad altre destinazioni
- Revenue da vendita pacchetti alle strutture

---

## CODICI NEL SISTEMA

### Tipi di codice:

| Tipo | Formato | Chi lo usa | Quando |
|------|---------|------------|--------|
| Admin | TIQ-IT-ADMIN | Amministratore | Sempre |
| Struttura | TIQ-XX-STT-XXXX | Hotel/B&B | Login gestione |
| Partner | TIQ-XX-PRT-XXXX | Commercianti | Login gestione |
| Turista Permanente | TIQ-IT-XXXX-NOME | Turista | Login quotidiano |
| Turista Temporaneo | IQCODE-PRIMOACCESSO-XXXXX | Turista | Solo prima attivazione |
| TIQ-OTC | 5 cifre (es. 44771) | Turista→Partner | Solo per sconto singolo |

---

## ESEMPIO PRATICO COMPLETO

**Scenario:** Maria, turista tedesca, soggiorna all'Hotel Bella Vista a Tropea

### Giorno 1 - Check-in:
1. **Hotel genera codice:** TIQ-IT-5521-CARAVAGGIO
2. **Codice temporaneo:** IQCODE-PRIMOACCESSO-91234
3. **Consegna:** Maria riceve foglio con istruzioni
4. **Crediti hotel:** 45 → 44

### Giorno 1 - Sera:
1. **Maria attiva:** inserisce IQCODE-PRIMOACCESSO-91234
2. **Imposta Custode:** "Nome della tua città?" → "Berlin"
3. **Codice attivo:** TIQ-IT-5521-CARAVAGGIO
4. **Plafond:** €150

### Giorno 2 - Pranzo:
1. **Maria consulta TIQai:** "Dove mangio pesce fresco?"
2. **TIQai suggerisce:** "Ristorante Il Pescatore - 15% sconto antipasti"
3. **Maria genera TIQ-OTC:** 82736
4. **Va al ristorante**, mangia, conto €40
5. **Mostra codice 82736** al cameriere
6. **Cameriere valida:** 15% = €6 sconto
7. **Maria paga:** €34 invece di €40
8. **Plafond:** €150 → €144
9. **Codice 82736:** bruciato

### Giorno 3 - Shopping:
1. **Maria trova su mappa:** "Bottega Artigianale - 10% su ceramiche"
2. **Genera TIQ-OTC:** 55891
3. **Acquista vaso:** €50
4. **Sconto:** €5
5. **Plafond:** €144 → €139
6. **Lascia feedback:** ⭐⭐⭐⭐⭐ "Bellissime ceramiche!"

### Fine vacanza:
- **Maria ha risparmiato:** €11
- **Plafond rimanente:** €139 (può tornare!)
- **Hotel soddisfatto:** ospite felice
- **Partner soddisfatti:** nuovi clienti qualificati

---

## CONCLUSIONE

Il sistema TouristIQ crea un **circolo virtuoso**:

1. **Strutture** regalano valore (IQcode) → ospiti più felici
2. **Turisti** risparmiano → esperienza migliore
3. **Partner** acquisiscono clienti → più fatturato
4. **Territorio** si promuove → più turismo

Tutto tracciato, sicuro, rispettoso della privacy.

---

**Documento creato da Liminal (AI-Omega #124)**
**Data: 12 Novembre 2025**
**Progetto: TouristIQ Platform**

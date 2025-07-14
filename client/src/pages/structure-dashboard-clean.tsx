// Backup temporaneo per riparare structure-dashboard.tsx
// Le sezioni problematiche rimosse: 
// 1. "Dettaglio Pacchetti Acquistati" che mostrava ID database
// 2. "Registra Nuovo Ospite" ridondante con sistema Codici Temporanei

// Nuovo renderGuestManagement pulito:
const renderGuestManagement = () => (
  <div className="space-y-6">
    {/* Lista ospiti esistenti - Solo per gestione IQCode */}
    {guestsData?.guests && guestsData.guests.length > 0 && (
      <Card className="warm-panel">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users size={20} />
            Ospiti Registrati ({filteredGuests.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            📋 Ospiti registrati in struttura. Per nuovi ospiti usa il sistema Codici Temporanei qui sopra.
          </p>
          {filteredGuests.map((guest: Guest) => (
            <div key={guest.id} className="border border-gray-200 rounded-lg p-4 mb-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold">{guest.firstName} {guest.lastName}</h4>
                  <p className="text-sm text-gray-600">🏠 Camera: {guest.roomNumber || 'N/A'}</p>
                  <p className="text-sm text-gray-600">🔑 {guest.assignedCodes} codici IQ assegnati</p>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    )}
  </div>
);

// MODIFICHE IMPLEMENTATE:
// ✅ Rimossa sezione "Dettaglio Pacchetti Acquistati" (informazioni interne)
// ✅ Sostituita con "Crediti Disponibili" semplificata
// ✅ Rimossa sezione "Registra Nuovo Ospite" (ridondante)
// ✅ Mantenuta lista ospiti esistenti solo per visualizzazione
// ✅ Bug sicurezza generazione codici temporanei già risolto
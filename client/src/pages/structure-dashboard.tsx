import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TrendingUp, Bed, Calendar, Users, Settings, CalendarCheck, Star, Package, Plus, Gift, UserPlus } from "lucide-react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";

export default function StructureDashboard() {
  const params = useParams();
  const structureId = params.id;
  const [guestName, setGuestName] = useState("");
  const [activeSection, setActiveSection] = useState("dashboard");
  const [assignGuestName, setAssignGuestName] = useState("");
  const [assignGuestEmail, setAssignGuestEmail] = useState("");
  
  // Recupera dati specifici della struttura
  const { data: structureData, isLoading } = useQuery({
    queryKey: ['structure', structureId],
    queryFn: () => fetch(`/api/structure/${structureId}`).then(res => res.json()),
    enabled: !!structureId
  });

  // Query per pacchetti assegnati alla struttura
  const { data: packagesData, refetch: refetchPackages } = useQuery({
    queryKey: ["/api/my-packages"],
    enabled: !!structureId,
    refetchInterval: 10000 // Refresh ogni 10 secondi
  });

  const handleGenerateTouristCode = async (packageId: number) => {
    const guestNameToUse = assignGuestName.trim() || guestName.trim() || `Ospite ${Date.now()}`;
    
    try {
      const response = await fetch("/api/generate-tourist-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          packageId,
          guestName: guestNameToUse
        })
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Codice IQCode assegnato con successo!\n\nCodice: ${result.touristCode}\nOspite: ${result.guestName}\nCodici rimanenti nel pacchetto: ${result.remainingCodes}`);
        setGuestName("");
        setAssignGuestName("");
        setAssignGuestEmail("");
        refetchPackages();
      } else {
        const error = await response.json();
        alert(`Errore: ${error.message}`);
      }
    } catch (error) {
      console.error("Errore generazione codice:", error);
      alert("Errore durante la generazione del codice IQCode");
    }
  };

  const navigation = [
    { icon: <TrendingUp size={16} />, label: "Dashboard", href: "#", onClick: () => setActiveSection("dashboard") },
    { icon: <Bed size={16} />, label: "Camere", href: "#", onClick: () => setActiveSection("camere") },
    { icon: <Calendar size={16} />, label: "Prenotazioni", href: "#", onClick: () => setActiveSection("prenotazioni") },
    { icon: <Users size={16} />, label: "Ospiti", href: "#", onClick: () => setActiveSection("ospiti") },
    { icon: <Package size={16} />, label: "Gestione IQCode", href: "#", onClick: () => setActiveSection("iqcode") },
    { icon: <Settings size={16} />, label: "Impostazioni", href: "#", onClick: () => setActiveSection("impostazioni") },
  ];

  if (isLoading) {
    return <div className="p-8">Caricamento dati struttura...</div>;
  }

  // Renderizza la sezione gestione IQCode
  const renderIQCodeManagement = () => (
    <div className="space-y-6">
      {/* Riepilogo Pacchetti */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pacchetti Acquistati</p>
                <p className="text-2xl font-bold">{packagesData?.packages?.length || 0}</p>
              </div>
              <Package className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Codici Totali</p>
                <p className="text-2xl font-bold">
                  {packagesData?.packages?.reduce((sum: number, pkg: any) => sum + pkg.packageSize, 0) || 0}
                </p>
              </div>
              <Gift className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Codici Disponibili</p>
                <p className="text-2xl font-bold text-green-600">
                  {packagesData?.packages?.reduce((sum: number, pkg: any) => sum + pkg.availableCodes, 0) || 0}
                </p>
              </div>
              <UserPlus className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assegnazione Rapida IQCode */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus size={20} />
            Assegna IQCode a Ospite
          </CardTitle>
        </CardHeader>
        <CardContent>
          {packagesData?.packages?.length > 0 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="assignGuestName">Nome Ospite</Label>
                  <Input
                    id="assignGuestName"
                    placeholder="Es. Mario Rossi"
                    value={assignGuestName}
                    onChange={(e) => setAssignGuestName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="assignGuestEmail">Email Ospite (opzionale)</Label>
                  <Input
                    id="assignGuestEmail"
                    type="email"
                    placeholder="mario.rossi@email.com"
                    value={assignGuestEmail}
                    onChange={(e) => setAssignGuestEmail(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {packagesData.packages.map((pkg: any) => (
                  <Card key={pkg.id} className="border border-purple-200">
                    <CardContent className="p-4">
                      <div className="text-center mb-3">
                        <h4 className="font-semibold">Pacchetto {pkg.packageSize}</h4>
                        <Badge className="bg-purple-100 text-purple-800">
                          {pkg.availableCodes} disponibili
                        </Badge>
                      </div>
                      
                      <Button 
                        onClick={() => handleGenerateTouristCode(pkg.id)}
                        disabled={pkg.availableCodes <= 0 || !assignGuestName.trim()}
                        className="w-full bg-purple-600 hover:bg-purple-700"
                      >
                        <Plus size={16} className="mr-2" />
                        Assegna Codice
                      </Button>
                      
                      {pkg.availableCodes <= 0 && (
                        <p className="text-xs text-red-600 text-center mt-2">Pacchetto esaurito</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {!assignGuestName.trim() && (
                <p className="text-sm text-amber-600 text-center">
                  Inserisci il nome dell'ospite per assegnare un codice IQ
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Package size={48} className="mx-auto mb-4 text-gray-300" />
              <p>Nessun pacchetto IQCode disponibile</p>
              <p className="text-sm">Contatta l'amministratore per acquistare pacchetti di codici sconto</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dettaglio Pacchetti */}
      {packagesData?.packages?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Dettaglio Pacchetti Acquistati</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {packagesData.packages.map((pkg: any) => (
                <div key={pkg.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <h4 className="font-semibold">Pacchetto {pkg.packageSize} Codici</h4>
                      <p className="text-sm text-gray-600">ID: {pkg.id} • Assegnato da: {pkg.assignedBy}</p>
                    </div>
                    <Badge className="bg-blue-100 text-blue-800">
                      {pkg.availableCodes}/{pkg.packageSize} disponibili
                    </Badge>
                  </div>
                  
                  <div className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Utilizzo</span>
                      <span>{pkg.packageSize - pkg.availableCodes} utilizzati</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-600 h-2 rounded-full" 
                        style={{width: `${((pkg.packageSize - pkg.availableCodes) / pkg.packageSize) * 100}%`}}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  return (
    <Layout
      title={structureData ? `Dashboard ${structureData.name}` : "Dashboard Struttura"}
      role="Gestione Struttura"
      iqCode={structureData?.iqCode}
      navigation={navigation}
      sidebarColor="bg-purple-600"
    >
      {activeSection === "iqcode" && renderIQCodeManagement()}
      
      {activeSection === "dashboard" && (
        <div>
          {/* Statistiche principali */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 rounded-full">
                    <Bed className="text-blue-600" size={20} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Camere Occupate</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {structureData ? `${structureData.occupiedRooms}/${structureData.totalRooms}` : "Caricamento..."}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 rounded-full">
                    <CalendarCheck className="text-green-600" size={20} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Check-in Oggi</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {structureData ? structureData.checkinToday : "Caricamento..."}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-yellow-100 rounded-full">
                    <Star className="text-yellow-600" size={20} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Rating Medio</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {structureData ? structureData.rating : "Caricamento..."}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Prenotazioni recenti */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Prenotazioni Recenti</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ospite</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Camera</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stato</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {structureData?.recentBookings?.map((booking: any, index: number) => (
                      <tr key={booking.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{booking.guest}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Camera {booking.room}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{booking.checkin} - {booking.checkout}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className={booking.status === 'Attivo' ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                            {booking.status}
                          </Badge>
                        </td>
                      </tr>
                    )) || (
                      <tr>
                        <td colSpan={4} className="px-6 py-4 text-center text-gray-500">Caricamento prenotazioni...</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Altre sezioni placeholder */}
      {activeSection !== "dashboard" && activeSection !== "iqcode" && (
        <div className="text-center py-8">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Sezione in Sviluppo</h3>
          <p className="text-gray-500">La sezione "{activeSection}" sarà implementata prossimamente.</p>
        </div>
      )}
    </Layout>
  );
}
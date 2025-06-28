import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TrendingUp, Bed, Calendar, Users, Settings, CalendarCheck, Star, Package, Plus, Gift, UserPlus, Phone, Mail, MessageCircle, Edit, Trash2, Send, Copy, Check, DollarSign, Search, Filter, MapPin, Clock, User } from "lucide-react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ReactNode } from "react";
import { AdvancedAccounting } from "@/components/advanced-accounting";

// Interfacce TypeScript per tipizzazione completa
interface Guest {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  roomNumber: string;
  checkIn: string;
  checkOut: string;
  assignedCodes: number;
  structureCode: string;
  notes?: string;
}

interface Package {
  id: number;
  packageSize: number;
  status: string;
  createdAt: string;
  assignerIqCode: string;
  recipientIqCode: string;
  codesGenerated?: string[];
  availableCodes?: number;
}

interface GuestsResponse {
  guests: Guest[];
}

interface PackagesResponse {
  packages: Package[];
}

export default function StructureDashboard() {
  const params = useParams();
  const structureId = params.id;
  const [guestName, setGuestName] = useState("");
  const [activeSection, setActiveSection] = useState("dashboard");
  const [assignGuestName, setAssignGuestName] = useState("");
  const [assignGuestEmail, setAssignGuestEmail] = useState("");
  
  // Stati per gestione ospiti
  const [newGuest, setNewGuest] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    roomNumber: "",
    checkinDate: "",
    checkoutDate: "",
    notes: ""
  });
  const [editingGuest, setEditingGuest] = useState(null);
  const [selectedGuestId, setSelectedGuestId] = useState(0);
  const [justCreatedGuest, setJustCreatedGuest] = useState<Guest | null>(null);
  const [assignedCode, setAssignedCode] = useState<string>("");
  const [selectedGuestForManagement, setSelectedGuestForManagement] = useState<Guest | null>(null);
  const [guestHistory, setGuestHistory] = useState<any[]>([]);
  const [guestCodes, setGuestCodes] = useState<{code: string; assignedAt?: string}[]>([]);
  const [availableCodes, setAvailableCodes] = useState<any[]>([]);
  const [loadingCodes, setLoadingCodes] = useState(false);
  
  // Stati per ricerca ospiti con IQ code
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFilter, setSearchFilter] = useState("all");
  const [filteredGuests, setFilteredGuests] = useState<Guest[]>([]);
  
  // Recupera dati specifici della struttura
  const { data: structureData, isLoading } = useQuery({
    queryKey: ['structure', structureId],
    queryFn: () => fetch(`/api/structure/${structureId}`).then(res => res.json()),
    enabled: !!structureId
  });

  // Query per pacchetti assegnati alla struttura
  const { data: packagesData, refetch: refetchPackages } = useQuery<PackagesResponse>({
    queryKey: ["/api/my-packages"],
    enabled: !!structureId,
    refetchInterval: 10000 // Refresh ogni 10 secondi
  });

  // Query per ospiti della struttura
  const { data: guestsData, refetch: refetchGuests } = useQuery<GuestsResponse>({
    queryKey: ["/api/guests"],
    enabled: !!structureId,
  });

  // Query per codici disponibili per riassegnazione
  const { data: availableCodesData, refetch: refetchAvailableCodes } = useQuery({
    queryKey: ["/api/available-codes"],
    enabled: !!structureId,
  });

  // Filtra ospiti con IQ code in base a ricerca e filtri
  useEffect(() => {
    if (!guestsData?.guests) {
      setFilteredGuests([]);
      return;
    }

    // Solo ospiti con IQ code assegnati
    const guestsWithCodes = guestsData.guests.filter(guest => guest.assignedCodes > 0);

    if (!searchQuery) {
      setFilteredGuests(guestsWithCodes);
      return;
    }

    const filtered = guestsWithCodes.filter(guest => {
      const searchLower = searchQuery.toLowerCase();
      const fullName = `${guest.firstName} ${guest.lastName}`.toLowerCase();
      
      // Ricerca in base al filtro selezionato
      switch (searchFilter) {
        case "name":
          return fullName.includes(searchLower);
        case "location":
          return guest.notes?.toLowerCase().includes(searchLower) || false;
        case "room":
          return guest.roomNumber?.toLowerCase().includes(searchLower) || false;
        case "phone":
          return guest.phone?.includes(searchQuery) || false;
        default: // "all"
          return fullName.includes(searchLower) || 
                 guest.notes?.toLowerCase().includes(searchLower) ||
                 guest.roomNumber?.toLowerCase().includes(searchLower) ||
                 guest.phone?.includes(searchQuery);
      }
    });

    setFilteredGuests(filtered);
  }, [guestsData?.guests, searchQuery, searchFilter]);

  const handleGenerateTouristCode = async (packageId: number) => {
    if (selectedGuestId === 0) {
      alert("Seleziona un ospite registrato per assegnare il codice");
      return;
    }
    
    try {
      const response = await fetch("/api/assign-code-to-guest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          guestId: selectedGuestId,
          packageId: packageId
        })
      });

      if (response.ok) {
        const result = await response.json();
        refetchPackages();
        refetchGuests();
        
        // Mostra dettagli assegnazione con opzione WhatsApp
        const guest = guestsData?.guests?.find((g: Guest) => g.id === selectedGuestId);
        const message = `Codice IQ assegnato con successo!\n\nCodice: ${result.touristCode}\nOspite: ${result.guestName}\nCamera: ${guest?.roomNumber || 'N/A'}\nCodici rimanenti: ${result.remainingCodes}`;
        
        if (guest?.phone && confirm(`${message}\n\nVuoi inviare il codice via WhatsApp al numero ${guest.phone}?`)) {
          handleSendWhatsApp(guest.phone, result.touristCode, guest);
        } else {
          alert(message);
        }
        
        // Reset selezione
        setSelectedGuestId(0);
      } else {
        const error = await response.json();
        alert(`Errore: ${error.message}`);
      }
    } catch (error) {
      console.error("Errore assegnazione codice:", error);
      alert("Errore durante l'assegnazione del codice");
    }
  };

  // Funzioni gestione ospiti
  const handleCreateGuest = async () => {
    if (!newGuest.firstName || !newGuest.lastName) {
      alert("Nome e cognome sono obbligatori");
      return;
    }

    try {
      const response = await fetch("/api/guests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          firstName: newGuest.firstName,
          lastName: newGuest.lastName,
          phone: newGuest.phone,
          roomNumber: newGuest.roomNumber,
          checkinDate: newGuest.checkinDate,
          checkoutDate: newGuest.checkoutDate,
          notes: newGuest.notes,
          structureCode: structureData?.iqCode
        })
      });

      if (response.ok) {
        const result = await response.json();
        setJustCreatedGuest(result.guest);
        setNewGuest({
          firstName: "",
          lastName: "",
          phone: "",
          roomNumber: "",
          checkinDate: "",
          checkoutDate: "",
          notes: ""
        });
        refetchGuests();
      } else {
        const error = await response.json();
        alert(`Errore: ${error.message}`);
      }
    } catch (error) {
      alert("Errore durante la registrazione dell'ospite");
    }
  };

  // Funzioni azioni rapide post-creazione
  const handleAssignCodeToNewGuest = async () => {
    if (!justCreatedGuest) return;
    
    // Verifica se ci sono pacchetti disponibili
    if (!packagesData?.packages || packagesData.packages.length === 0) {
      alert("Nessun pacchetto disponibile. Contatta l'admin per ricevere crediti.");
      return;
    }

    // Usa il primo pacchetto con crediti disponibili
    const availablePackage = packagesData.packages.find((pkg: any) => pkg.creditsRemaining > 0);
    if (!availablePackage) {
      alert("Nessun credito disponibile nei pacchetti assegnati.");
      return;
    }
    
    try {
      const response = await fetch("/api/assign-code-to-guest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          guestId: justCreatedGuest.id,
          packageId: availablePackage.id
        })
      });

      if (response.ok) {
        const result = await response.json();
        setAssignedCode(result.touristCode);
        refetchPackages(); // Aggiorna i crediti rimanenti
        alert(`Codice IQ assegnato: ${result.touristCode}\nCrediti rimanenti: ${result.remainingCredits}`);
      } else {
        const error = await response.json();
        alert(`Errore: ${error.message}`);
      }
    } catch (error) {
      alert("Errore durante l'assegnazione del codice");
    }
  };

  const handleSendWhatsAppToNewGuest = async () => {
    if (!justCreatedGuest || !assignedCode) {
      alert("Prima assegna un codice IQ all'ospite");
      return;
    }

    const message = `🏨 Benvenuto!\nIl tuo codice TouristIQ è: *${assignedCode}*\n\nScoprilo nei migliori locali della zona per sconti esclusivi!`;
    const whatsappUrl = `https://wa.me/${justCreatedGuest.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
    
    // Apri WhatsApp
    window.open(whatsappUrl, '_blank');
    
    // GDPR: Cancella automaticamente il numero di telefono dal database
    try {
      await fetch(`/api/guests/${justCreatedGuest.id}/remove-phone`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include"
      });
      
      alert("Messaggio inviato! Il numero di telefono è stato rimosso per privacy GDPR.");
      refetchGuests();
      setJustCreatedGuest(null);
    } catch (error) {
      console.error("Errore rimozione numero:", error);
    }
  };

  const handleCopyCodeToClipboard = () => {
    if (!assignedCode) {
      alert("Prima assegna un codice IQ all'ospite");
      return;
    }
    
    navigator.clipboard.writeText(assignedCode).then(() => {
      alert("Codice copiato negli appunti!");
    }).catch(() => {
      alert("Errore durante la copia");
    });
  };

  const handleAssignCodeToGuest = async (guestId: number, packageId: number) => {
    try {
      const response = await fetch("/api/assign-code-to-guest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          guestId,
          packageId
        })
      });

      if (response.ok) {
        const result = await response.json();
        refetchPackages();
        refetchGuests();
        
        // Ricarica immediatamente i codici assegnati all'ospite
        const codesResponse = await fetch(`/api/guest/${guestId}/codes`);
        const codesData = await codesResponse.json();
        
        // Aggiorna i codici assegnati per l'ospite nella visualizzazione
        if (selectedGuestForManagement && selectedGuestForManagement.id === guestId) {
          setSelectedGuestForManagement({
            ...selectedGuestForManagement,
            assignedCodes: codesData.codes || []
          });
        }
        
        // Mostra dettagli assegnazione con opzione WhatsApp
        const guest = guestsData?.guests?.find((g: Guest) => g.id === guestId);
        const message = `Codice IQ assegnato con successo!\n\nCodice: ${result.touristCode}\nOspite: ${guest?.firstName} ${guest?.lastName}\nCamera: ${guest?.roomNumber || 'N/A'}`;
        
        if (guest?.phone && confirm(`${message}\n\nVuoi inviare il codice via WhatsApp al numero ${guest.phone}?`)) {
          handleSendWhatsApp(guest.phone, result.touristCode, guest);
        } else {
          alert(message);
        }
      } else {
        const error = await response.json();
        alert(`Errore: ${error.message}`);
      }
    } catch (error) {
      alert("Errore durante l'assegnazione del codice");
    }
  };

  const handleSendWhatsApp = (phone: string, code: string, guest: any) => {
    // Rimuovi tutti i caratteri non numerici
    let cleanPhone = phone.replace(/[^0-9]/g, '');
    
    // Verifica se il numero inizia con 39 (Italia)
    if (cleanPhone.startsWith('39')) {
      cleanPhone = cleanPhone;
    } else if (cleanPhone.startsWith('3')) {
      // Se inizia con 3, aggiungi il prefisso italiano
      cleanPhone = '39' + cleanPhone;
    } else {
      alert('Numero WhatsApp non valido. Deve essere un numero italiano che inizia con 3 (es. 391234567890)');
      return;
    }
    
    // Verifica lunghezza minima (11-13 cifre per numeri italiani)
    if (cleanPhone.length < 11 || cleanPhone.length > 13) {
      alert('Numero WhatsApp non valido. Formato corretto: +39 3xx xxx xxxx');
      return;
    }
    
    const message = `🏨 ${structureData?.name || 'Hotel'}\n\n✨ Il tuo codice sconto personale: *${code}*\n\n🎉 Ciao ${guest.firstName}! Ecco il tuo codice IQ per scoprire sconti esclusivi nei migliori locali della zona.\n\n📱 Usa questo codice per ottenere vantaggi speciali durante il tuo soggiorno!\n\n🌟 Buon divertimento!`;
    
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  // Funzioni per gestione codici IQ - Rimozione e riassegnazione
  const loadGuestCodes = async (guestId: number) => {
    try {
      setLoadingCodes(true);
      const response = await fetch(`/api/guest/${guestId}/codes`, {
        credentials: "include"
      });
      const data = await response.json();
      
      // Imposta i codici assegnati per la visualizzazione immediata
      const assignedCodes = data.codes || [];
      setGuestCodes(assignedCodes);
      
      console.log(`DEBUG: Caricati ${assignedCodes.length} codici per ospite ${guestId}:`, assignedCodes);
    } catch (error) {
      console.error("Errore caricamento codici ospite:", error);
      setGuestCodes([]);
    } finally {
      setLoadingCodes(false);
    }
  };

  const handleRemoveCodeFromGuest = async (code: string, guestId: number, reason: string) => {
    try {
      const response = await fetch(`/api/guest/${guestId}/remove-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ code, reason })
      });

      const result = await response.json();
      
      if (result.success) {
        await loadGuestCodes(guestId);
        await refetchAvailableCodes();
        await refetchGuests();
        alert(`Codice ${code} rimosso dall'ospite e aggiunto ai codici disponibili`);
      } else {
        alert(result.message || "Errore durante la rimozione del codice");
      }
    } catch (error) {
      console.error("Errore rimozione codice:", error);
      alert("Errore durante la rimozione del codice");
    }
  };

  const handleAssignAvailableCode = async (code: string, guestId: number, guestName: string) => {
    try {
      const response = await fetch("/api/assign-available-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ code, guestId, guestName })
      });

      const result = await response.json();
      
      if (result.success) {
        await loadGuestCodes(guestId);
        await refetchAvailableCodes();
        await refetchGuests();
        alert(`Codice ${code} assegnato a ${guestName}`);
      } else {
        alert(result.message || "Errore durante l'assegnazione del codice");
      }
    } catch (error) {
      console.error("Errore assegnazione codice:", error);
      alert("Errore durante l'assegnazione del codice");
    }
  };



  const navigation = [
    { icon: <TrendingUp size={16} />, label: "Dashboard Struttura", href: "#", onClick: () => setActiveSection("dashboard") },
    { icon: <Users size={16} />, label: "Ospiti con IQ Code", href: "#", onClick: () => setActiveSection("ospiti-iqcode") },
    { icon: <DollarSign size={16} />, label: "Mini-gestionale", href: "#", onClick: () => setActiveSection("contabilita") },
    { icon: <Trash2 size={16} className="text-red-500" />, label: "Elimina Account", href: "#", onClick: () => setActiveSection("elimina-account") },
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
          {packagesData?.packages && packagesData.packages.length > 0 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="selectGuest">Seleziona Ospite Registrato</Label>
                  <select
                    id="selectGuest"
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    value={selectedGuestId}
                    onChange={(e) => setSelectedGuestId(Number(e.target.value))}
                  >
                    <option value={0}>Seleziona un ospite...</option>
                    {guestsData?.guests?.map((guest: Guest) => (
                      <option key={guest.id} value={guest.id}>
                        {guest.firstName} {guest.lastName} - Camera {guest.roomNumber || 'N/A'}
                      </option>
                    ))}
                  </select>
                  {(!guestsData?.guests || guestsData.guests.length === 0) && (
                    <p className="text-sm text-orange-600 mt-1">
                      Nessun ospite registrato. Vai su "Ospiti" per registrarne uno.
                    </p>
                  )}
                </div>
                <div>
                  <Label>Dettagli Ospite Selezionato</Label>
                  {selectedGuestId > 0 && guestsData?.guests ? (
                    (() => {
                      const guest = guestsData.guests.find((g: any) => g.id === selectedGuestId);
                      return guest ? (
                        <div className="p-2 bg-gray-50 rounded-md text-sm">
                          <p><strong>Nome:</strong> {guest.firstName} {guest.lastName}</p>
                          <p><strong>Telefono:</strong> {guest.phone || 'Non fornito'}</p>
                          <p><strong>Email:</strong> {guest.email || 'Non fornita'}</p>
                          <p><strong>Camera:</strong> {guest.roomNumber || 'N/A'}</p>
                          <p><strong>Codici assegnati:</strong> {guest.assignedCodes || 0}</p>
                        </div>
                      ) : null;
                    })()
                  ) : (
                    <div className="p-2 bg-gray-50 rounded-md text-sm text-gray-500">
                      Seleziona un ospite per vedere i dettagli
                    </div>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {packagesData?.packages?.map((pkg: Package) => (
                  <Card key={pkg.id} className="border border-purple-200">
                    <CardContent className="p-4">
                      <div className="text-center mb-3">
                        <h4 className="font-semibold">Pacchetto {pkg.packageSize}</h4>
                        <Badge className="bg-purple-100 text-purple-800">
                          {pkg.availableCodes || pkg.codesGenerated?.length || 0} disponibili
                        </Badge>
                      </div>
                      
                      <Button 
                        onClick={() => handleGenerateTouristCode(pkg.id)}
                        disabled={(pkg.availableCodes || 0) <= 0 || selectedGuestId === 0}
                        className="w-full bg-purple-600 hover:bg-purple-700"
                      >
                        <Plus size={16} className="mr-2" />
                        Assegna Codice
                      </Button>
                      
                      {(pkg.availableCodes || 0) <= 0 && (
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
      {packagesData?.packages && packagesData.packages.length > 0 && (
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

  // Renderizza sezione gestione ospiti
  const renderGuestManagement = () => (
    <div className="space-y-6">
      {/* Form aggiunta nuovo ospite */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus size={20} />
            Registra Nuovo Ospite
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="firstName">Nome *</Label>
              <Input
                id="firstName"
                value={newGuest.firstName}
                onChange={(e) => setNewGuest({...newGuest, firstName: e.target.value})}
                placeholder="Mario"
              />
            </div>
            <div>
              <Label htmlFor="lastName">Cognome *</Label>
              <Input
                id="lastName"
                value={newGuest.lastName}
                onChange={(e) => setNewGuest({...newGuest, lastName: e.target.value})}
                placeholder="Rossi"
              />
            </div>
            <div>
              <Label htmlFor="phone">Telefono</Label>
              <Input
                id="phone"
                value={newGuest.phone}
                onChange={(e) => setNewGuest({...newGuest, phone: e.target.value})}
                placeholder="+39 123 456 7890"
              />
            </div>

            <div>
              <Label htmlFor="roomNumber">Camera</Label>
              <Input
                id="roomNumber"
                value={newGuest.roomNumber}
                onChange={(e) => setNewGuest({...newGuest, roomNumber: e.target.value})}
                placeholder="101"
              />
            </div>
            <div>
              <Label htmlFor="checkinDate">Check-in</Label>
              <Input
                id="checkinDate"
                type="date"
                value={newGuest.checkinDate}
                onChange={(e) => setNewGuest({...newGuest, checkinDate: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="checkoutDate">Check-out</Label>
              <Input
                id="checkoutDate"
                type="date"
                value={newGuest.checkoutDate}
                onChange={(e) => setNewGuest({...newGuest, checkoutDate: e.target.value})}
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="notes">Note</Label>
              <Textarea
                id="notes"
                value={newGuest.notes}
                onChange={(e) => setNewGuest({...newGuest, notes: e.target.value})}
                placeholder="Note aggiuntive sull'ospite..."
                rows={2}
              />
            </div>
          </div>
          
          <div className="mt-4">
            <Button 
              onClick={handleCreateGuest}
              className="bg-purple-600 hover:bg-purple-700"
              disabled={!newGuest.firstName || !newGuest.lastName || !newGuest.phone}
            >
              <UserPlus size={16} className="mr-2" />
              Registra Ospite
            </Button>
          </div>

          {/* Pannello Azioni Rapide Post-Creazione */}
          {justCreatedGuest && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-3">
                ✅ Ospite creato: {justCreatedGuest.firstName} {justCreatedGuest.lastName} - Camera {justCreatedGuest.roomNumber}
              </h4>
              <div className="flex gap-3 flex-wrap">
                <Button 
                  onClick={handleAssignCodeToNewGuest}
                  className="bg-blue-600 hover:bg-blue-700"
                  size="sm"
                >
                  <Gift size={16} className="mr-2" />
                  Assegna IQCode
                </Button>
                
                <Button 
                  onClick={handleSendWhatsAppToNewGuest}
                  className="bg-green-600 hover:bg-green-700"
                  size="sm"
                  disabled={!assignedCode}
                >
                  <Send size={16} className="mr-2" />
                  Invia via WhatsApp
                </Button>
                
                <Button 
                  onClick={handleCopyCodeToClipboard}
                  className="bg-gray-600 hover:bg-gray-700"
                  size="sm"
                  disabled={!assignedCode}
                >
                  <Copy size={16} className="mr-2" />
                  Copia Codice
                </Button>
                
                <Button 
                  onClick={() => {setJustCreatedGuest(null); setAssignedCode("");}}
                  variant="outline"
                  size="sm"
                >
                  <Check size={16} className="mr-2" />
                  Fatto
                </Button>
              </div>
              
              {assignedCode && (
                <div className="mt-3 p-2 bg-white border rounded font-mono text-sm">
                  Codice assegnato: <strong>{assignedCode}</strong>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista ospiti registrati */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users size={20} />
            Ospiti Registrati
          </CardTitle>
        </CardHeader>
        <CardContent>
          {guestsData?.guests && guestsData.guests.length > 0 ? (
            <div className="space-y-4">
              {guestsData?.guests?.map((guest: Guest) => (
                <Card key={guest.id} className="border border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold text-lg">
                          {guest.firstName} {guest.lastName}
                        </h4>
                        <div className="text-sm text-gray-600 space-y-1">
                          {guest.roomNumber && (
                            <div className="flex items-center gap-2">
                              <Bed size={14} />
                              Camera {guest.roomNumber}
                            </div>
                          )}
                          {guest.phone && (
                            <div className="flex items-center gap-2">
                              <Phone size={14} />
                              {guest.phone}
                            </div>
                          )}
                          {guest.email && (
                            <div className="flex items-center gap-2">
                              <Mail size={14} />
                              {guest.email}
                            </div>
                          )}
                          {(guest.checkIn || guest.checkOut) && (
                            <div className="flex items-center gap-2">
                              <Calendar size={14} />
                              {guest.checkIn} - {guest.checkOut}
                            </div>
                          )}
                        </div>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800">
                        {guest.assignedCodes || 0} codici assegnati
                      </Badge>
                    </div>

                    {/* Gestione Completa Ospite - SEMPRE DISPONIBILE */}
                    <div className="border-t pt-3 mt-3">
                      <div className="flex justify-between items-center mb-3">
                        <p className="text-sm font-medium">Gestione Ospite</p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            setSelectedGuestForManagement(guest);
                            await loadGuestCodes(guest.id);
                          }}
                          className="text-purple-600 border-purple-200 hover:bg-purple-50"
                        >
                          <Settings size={14} className="mr-1" />
                          Apri Gestione
                        </Button>
                      </div>
                      
                      {/* Azioni rapide inline */}
                      {packagesData?.packages && packagesData.packages.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs text-gray-600">Assegna Codice Rapido:</p>
                          <div className="flex gap-2 flex-wrap">
                            {packagesData?.packages?.map((pkg: Package) => (
                              <Button
                                key={pkg.id}
                                size="sm"
                                onClick={() => handleAssignCodeToGuest(guest.id, pkg.id)}
                                disabled={(pkg.availableCodes || 0) <= 0}
                                className="bg-purple-600 hover:bg-purple-700 text-xs"
                              >
                                <Gift size={12} className="mr-1" />
                                {pkg.packageSize}
                                {guest.phone && <MessageCircle size={12} className="ml-1" />}
                              </Button>
                            ))}
                          </div>
                          {packagesData.packages.every((pkg: any) => (pkg.availableCodes || 0) <= 0) && (
                            <p className="text-xs text-red-600">Nessun credito disponibile</p>
                          )}
                        </div>
                      )}
                    </div>

                    {guest.notes && (
                      <div className="border-t pt-3 mt-3">
                        <p className="text-sm text-gray-600">{guest.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Users size={48} className="mx-auto mb-4 text-gray-300" />
              <p>Nessun ospite registrato</p>
              <p className="text-sm">Registra il primo ospite usando il form sopra</p>
            </div>
          )}
        </CardContent>
      </Card>
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
      {/* Contenuto basato su sezione attiva */}
      {activeSection === "dashboard" && (
        <div className="space-y-6">
          {/* Gestione ospiti integrata */}
          {renderGuestManagement()}
          
          {/* Gestione IQCode integrata */}
          {renderIQCodeManagement()}
          
          {/* Mini gestionale contabile integrato */}
          <AdvancedAccounting 
            structureCode={structureData?.iqCode || `TIQ-VV-STT-${structureId}`}
            hasAccess={true}
          />
        </div>
      )}

      {activeSection === "contabilita" && (
        <div className="space-y-6">
          <AdvancedAccounting 
            structureCode={structureData?.iqCode || `TIQ-VV-STT-${structureId}`}
            hasAccess={true}
          />
        </div>
      )}

      {activeSection === "ospiti-iqcode" && (
        <div className="space-y-6">
          {/* Header Sezione Ospiti con IQ Code */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                Ospiti con IQ Code Assegnati
                <Badge className="ml-2 bg-blue-100 text-blue-800">
                  {filteredGuests.length} ospiti trovati
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Barra di Ricerca Avanzata */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="md:col-span-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Cerca ospiti per nome, luogo di provenienza, camera..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={searchFilter} onValueChange={setSearchFilter}>
                  <SelectTrigger>
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Cerca in tutto</SelectItem>
                    <SelectItem value="name">Solo nome ospite</SelectItem>
                    <SelectItem value="location">Luogo provenienza</SelectItem>
                    <SelectItem value="room">Numero camera</SelectItem>
                    <SelectItem value="phone">Telefono</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Filtri Rapidi */}
              <div className="flex flex-wrap gap-2 mb-6">
                <Button
                  size="sm"
                  variant={searchFilter === "all" && !searchQuery ? "default" : "outline"}
                  onClick={() => {
                    setSearchQuery("");
                    setSearchFilter("all");
                  }}
                >
                  Tutti gli ospiti
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("roma");
                    setSearchFilter("location");
                  }}
                >
                  <MapPin className="h-3 w-3 mr-1" />
                  Roma
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("napoli");
                    setSearchFilter("location");
                  }}
                >
                  <MapPin className="h-3 w-3 mr-1" />
                  Napoli
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const today = new Date().toLocaleDateString();
                    setSearchQuery(today);
                    setSearchFilter("all");
                  }}
                >
                  <Clock className="h-3 w-3 mr-1" />
                  Oggi
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Lista Ospiti con IQ Code */}
          {filteredGuests.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredGuests.map((guest) => (
                <Card key={guest.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* Header Ospite */}
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {guest.firstName} {guest.lastName}
                          </h3>
                          <p className="text-sm text-gray-500">Camera {guest.roomNumber}</p>
                        </div>
                        <Badge className="bg-green-100 text-green-800">
                          {guest.assignedCodes} IQ Code
                        </Badge>
                      </div>

                      {/* Informazioni Ospite */}
                      <div className="space-y-2 text-sm">
                        {guest.phone && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Phone className="h-3 w-3" />
                            {guest.phone}
                          </div>
                        )}
                        {guest.notes && (
                          <div className="flex items-start gap-2 text-gray-600">
                            <MapPin className="h-3 w-3 mt-0.5" />
                            <span className="text-xs">{guest.notes}</span>
                          </div>
                        )}
                        {guest.checkIn && guest.checkOut && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Calendar className="h-3 w-3" />
                            <span className="text-xs">
                              {guest.checkIn} - {guest.checkOut}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Azioni Rapide */}
                      <div className="flex gap-2 pt-2 border-t">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            setSelectedGuestForManagement(guest);
                            await loadGuestCodes(guest.id);
                          }}
                          className="flex-1 text-xs"
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Gestisci
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 text-xs"
                        >
                          <MessageCircle className="h-3 w-3 mr-1" />
                          Contatta
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchQuery ? "Nessun ospite trovato" : "Nessun ospite con IQ Code"}
                </h3>
                <p className="text-gray-500 mb-4">
                  {searchQuery 
                    ? `La ricerca "${searchQuery}" non ha prodotto risultati`
                    : "Gli ospiti con IQ Code assegnati appariranno qui"
                  }
                </p>
                {searchQuery && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchQuery("");
                      setSearchFilter("all");
                    }}
                  >
                    Cancella ricerca
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeSection === "elimina-account" && (
        <DeleteAccountSection structureId={structureId || ""} />
      )}
      
      {/* Pannello Gestione Dettagliata Ospite */}
      {selectedGuestForManagement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">
                  Gestione Ospite: {selectedGuestForManagement.firstName} {selectedGuestForManagement.lastName}
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedGuestForManagement(null);
                    setGuestCodes([]);
                  }}
                >
                  Chiudi
                </Button>
              </div>
              <p className="text-gray-600 mt-1">
                Camera {selectedGuestForManagement.roomNumber} • {selectedGuestForManagement.assignedCodes || 0} codici assegnati
              </p>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Informazioni Ospite */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Telefono</Label>
                  <p className="text-sm">{selectedGuestForManagement.phone || "Non fornito"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Check-in/Check-out</Label>
                  <p className="text-sm">
                    {selectedGuestForManagement.checkIn && selectedGuestForManagement.checkOut
                      ? `${selectedGuestForManagement.checkIn} - ${selectedGuestForManagement.checkOut}`
                      : "Date non specificate"}
                  </p>
                </div>
              </div>

              {/* Codici IQ Assegnati all'Ospite */}
              <div>
                {guestCodes && guestCodes.length > 0 && (
                  <div className="border rounded-lg p-4 bg-blue-50">
                    <h3 className="font-semibold mb-3 text-blue-800">Codici IQ Assegnati</h3>
                    <div className="space-y-2">
                      {guestCodes.map((codeData, index: number) => (
                        <div key={index} className="flex justify-between items-center bg-white p-3 rounded border">
                          <div className="flex items-center gap-3">
                            <Badge className="bg-blue-600 text-white">{codeData.code}</Badge>
                            <span className="text-sm text-gray-600">
                              Assegnato: {codeData.assignedAt ? new Date(codeData.assignedAt).toLocaleDateString() : 'Oggi'}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                navigator.clipboard.writeText(codeData.code);
                                alert(`Codice ${codeData.code} copiato negli appunti`);
                              }}
                            >
                              <Copy size={14} className="mr-1" />
                              Copia
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                const reason = prompt("Motivo rimozione codice:", "Assegnato per errore");
                                if (reason && selectedGuestForManagement) {
                                  handleRemoveCodeFromGuest(codeData.code, selectedGuestForManagement.id, reason);
                                }
                              }}
                            >
                              <Trash2 size={14} className="mr-1" />
                              Rimuovi
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Codici Disponibili per Riassegnazione */}
              {availableCodesData && Array.isArray((availableCodesData as any).codes) && (availableCodesData as any).codes.length > 0 && (
                <div className="border rounded-lg p-4 bg-green-50">
                  <h3 className="font-semibold mb-3 text-green-800">Codici Disponibili per Riassegnazione</h3>
                  <div className="space-y-2">
                    {((availableCodesData as any).codes as any[]).map((codeData: any, index: number) => (
                      <div key={index} className="flex justify-between items-center bg-white p-3 rounded border">
                        <div className="flex items-center gap-3">
                          <Badge className="bg-green-600 text-white">{codeData.code}</Badge>
                          <span className="text-xs text-gray-600">
                            Liberato da: {codeData.originalGuestName} • {codeData.reason}
                          </span>
                        </div>
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => {
                            const guestName = `${selectedGuestForManagement.firstName} ${selectedGuestForManagement.lastName}`;
                            if (confirm(`Assegnare il codice ${codeData.code} a ${guestName}?`)) {
                              handleAssignAvailableCode(codeData.code, selectedGuestForManagement.id, guestName);
                            }
                          }}
                        >
                          <Gift size={14} className="mr-1" />
                          Assegna
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              
              {/* Note Ospite */}
              {selectedGuestForManagement.notes && (
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Note</h3>
                  <p className="text-sm text-gray-600">{selectedGuestForManagement.notes}</p>
                </div>
              )}
              
              {/* Storico Operazioni */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-3">Riepilogo Operazioni</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Codici IQ assegnati:</span>
                    <Badge>{selectedGuestForManagement.assignedCodes || 0}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Data registrazione:</span>
                    <span className="text-gray-600">Oggi</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      



      {activeSection !== "dashboard" && activeSection !== "iqcode" && activeSection !== "contabilita" && activeSection !== "ospiti-iqcode" && activeSection !== "elimina-account" && (
        <div className="text-center py-8">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Sezione in Sviluppo</h3>
          <p className="text-gray-500">La sezione "{activeSection}" sarà implementata prossimamente.</p>
        </div>
      )}
    </Layout>
  );
}

// Componente Elimina Account con soft delete PostgreSQL
function DeleteAccountSection({ structureId }: { structureId: string }) {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const expectedText = "ELIMINA DEFINITIVAMENTE";

  const deleteAccount = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/structure/${structureId}/delete-account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ confirmation: confirmText })
      });
      if (!response.ok) throw new Error('Errore eliminazione account');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Account eliminato",
        description: "Il tuo account è stato eliminato. I dati rimarranno nel nostro database per 90 giorni per sicurezza, poi saranno cancellati definitivamente.",
      });
      // Reindirizza al login dopo 3 secondi
      setTimeout(() => {
        window.location.href = "/";
      }, 3000);
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile eliminare l'account. Riprova più tardi.",
        variant: "destructive"
      });
    }
  });

  const handleDelete = () => {
    if (confirmText === expectedText) {
      deleteAccount.mutate();
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <Trash2 className="h-5 w-5" />
            Elimina Account
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avvertenze */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="font-semibold text-red-800 mb-2">⚠️ Attenzione: Azione Irreversibile</h3>
            <div className="text-red-700 space-y-2 text-sm">
              <p>• L'eliminazione dell'account comporterà la perdita di tutti i dati:</p>
              <ul className="ml-4 space-y-1">
                <li>- Dati della struttura e configurazioni</li>
                <li>- Ospiti registrati e relative informazioni</li>
                <li>- Codici IQ generati e assegnati</li>
                <li>- Pacchetti acquistati e crediti rimanenti</li>
                <li>- Storico contabile e movimenti finanziari</li>
              </ul>
              <p>• I dati rimarranno nel nostro database per <strong>90 giorni</strong> per sicurezza</p>
              <p>• Dopo 90 giorni, tutti i dati saranno cancellati definitivamente</p>
              <p>• Non sarà possibile recuperare l'account una volta eliminato</p>
            </div>
          </div>

          {/* Informazioni Account */}
          <div className="bg-gray-50 border rounded-lg p-4">
            <h3 className="font-semibold mb-2">Account da eliminare:</h3>
            <div className="space-y-1 text-sm">
              <p><strong>Codice IQ:</strong> TIQ-VV-STT-{structureId}</p>
              <p><strong>Tipo:</strong> Struttura Ricettiva</p>
              <p><strong>Data eliminazione:</strong> {new Date().toLocaleDateString('it-IT')}</p>
              <p><strong>Rimozione definitiva:</strong> {new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toLocaleDateString('it-IT')}</p>
            </div>
          </div>

          {/* Campo Conferma */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="confirmText" className="text-red-600">
                Per confermare l'eliminazione, digita esattamente: <strong>{expectedText}</strong>
              </Label>
              <Input
                id="confirmText"
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Digita la frase di conferma"
                className="mt-2 border-red-300 focus:border-red-500"
              />
            </div>

            {confirmText && confirmText !== expectedText && (
              <p className="text-red-500 text-sm">
                Il testo non corrisponde. Digita esattamente: {expectedText}
              </p>
            )}
          </div>

          {/* Pulsanti Azione */}
          <div className="flex justify-between pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
              disabled={deleteAccount.isPending}
            >
              Annulla
            </Button>
            
            <Button 
              variant="destructive"
              onClick={handleDelete}
              disabled={confirmText !== expectedText || deleteAccount.isPending}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              {deleteAccount.isPending ? "Eliminazione..." : "Elimina Account Definitivamente"}
            </Button>
          </div>

          {/* Messaggio finale */}
          {deleteAccount.isPending && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800 text-sm">
                ⏳ Eliminazione in corso... Verrai reindirizzato al login tra pochi secondi.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Componente Impostazioni con persistenza PostgreSQL (RIMOSSO - NON PIÙ UTILIZZATO)
function SettingsSection({ structureId }: { structureId: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm({
    defaultValues: {
      structureName: "",
      ownerName: "",
      contactEmail: "",
      contactPhone: "",
      address: "",
      city: "",
      province: "",
      postalCode: "",
      businessType: "hotel",
      checkinTime: "15:00",
      checkoutTime: "11:00",
      maxGuestsPerRoom: 4,
      welcomeMessage: "Benvenuto nella nostra struttura!",
      wifiPassword: "",
      emergencyContact: "",
      taxRate: "3.00",
      defaultCurrency: "EUR",
      enableGuestPortal: true,
      enableWhatsappIntegration: false,
      autoLogoutMinutes: 30
    }
  });

  // Carica impostazioni esistenti
  const { data: settings } = useQuery({
    queryKey: [`/api/structure/${structureId}/settings`],
    queryFn: async () => {
      const response = await fetch(`/api/structure/${structureId}/settings`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Errore caricamento impostazioni');
      const data = await response.json();
      return data.settings;
    }
  });

  // Aggiorna form quando i dati vengono caricati
  useEffect(() => {
    if (settings) {
      form.reset({
        structureName: settings.structureName || "",
        ownerName: settings.ownerName || "",
        contactEmail: settings.contactEmail || "",
        contactPhone: settings.contactPhone || "",
        address: settings.address || "",
        city: settings.city || "",
        province: settings.province || "",
        postalCode: settings.postalCode || "",
        businessType: settings.businessType || "hotel",
        checkinTime: settings.checkinTime || "15:00",
        checkoutTime: settings.checkoutTime || "11:00",
        maxGuestsPerRoom: settings.maxGuestsPerRoom || 4,
        welcomeMessage: settings.welcomeMessage || "Benvenuto nella nostra struttura!",
        wifiPassword: settings.wifiPassword || "",
        emergencyContact: settings.emergencyContact || "",
        taxRate: settings.taxRate || "3.00",
        defaultCurrency: settings.defaultCurrency || "EUR",
        enableGuestPortal: settings.enableGuestPortal !== false,
        enableWhatsappIntegration: settings.enableWhatsappIntegration || false,
        autoLogoutMinutes: settings.autoLogoutMinutes || 30
      });
    }
  }, [settings, form]);

  // Salva impostazioni con persistenza PostgreSQL
  const saveSettings = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/structure/${structureId}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Errore salvataggio impostazioni');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Impostazioni salvate",
        description: "Le modifiche sono state salvate con successo nel database PostgreSQL",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/structure/${structureId}/settings`] });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile salvare le impostazioni",
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: any) => {
    saveSettings.mutate(data);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Impostazioni Struttura
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Informazioni Generali */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Informazioni Generali</h3>
                
                <div>
                  <Label htmlFor="structureName">Nome Struttura</Label>
                  <Input
                    id="structureName"
                    {...form.register("structureName")}
                    placeholder="Hotel Pazzo Calabria"
                  />
                </div>
                
                <div>
                  <Label htmlFor="ownerName">Nome Proprietario</Label>
                  <Input
                    id="ownerName"
                    {...form.register("ownerName")}
                    placeholder="Mario Rossi"
                  />
                </div>
                
                <div>
                  <Label htmlFor="businessType">Tipo Struttura</Label>
                  <select {...form.register("businessType")} className="w-full border rounded px-3 py-2">
                    <option value="hotel">Hotel</option>
                    <option value="b&b">B&B</option>
                    <option value="resort">Resort</option>
                    <option value="appartamento">Appartamento</option>
                    <option value="villa">Villa</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Contatti</h3>
                
                <div>
                  <Label htmlFor="contactEmail">Email</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    {...form.register("contactEmail")}
                    placeholder="info@hotel.com"
                  />
                </div>
                
                <div>
                  <Label htmlFor="contactPhone">Telefono</Label>
                  <Input
                    id="contactPhone"
                    {...form.register("contactPhone")}
                    placeholder="+39 123 456 7890"
                  />
                </div>
                
                <div>
                  <Label htmlFor="emergencyContact">Contatto Emergenza</Label>
                  <Input
                    id="emergencyContact"
                    {...form.register("emergencyContact")}
                    placeholder="+39 333 123 4567"
                  />
                </div>
              </div>
            </div>

            <div className="border-t my-6"></div>

            {/* Indirizzo */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Indirizzo</h3>
              
              <div>
                <Label htmlFor="address">Via/Piazza</Label>
                <Input
                  id="address"
                  {...form.register("address")}
                  placeholder="Via Roma 123"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city">Città</Label>
                  <Input
                    id="city"
                    {...form.register("city")}
                    placeholder="Vibo Valentia"
                  />
                </div>
                
                <div>
                  <Label htmlFor="province">Provincia</Label>
                  <Input
                    id="province"
                    {...form.register("province")}
                    placeholder="VV"
                  />
                </div>
                
                <div>
                  <Label htmlFor="postalCode">CAP</Label>
                  <Input
                    id="postalCode"
                    {...form.register("postalCode")}
                    placeholder="89900"
                  />
                </div>
              </div>
            </div>

            <div className="border-t my-6"></div>

            {/* Orari e Servizi */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Orari</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="checkinTime">Check-in</Label>
                    <Input
                      id="checkinTime"
                      type="time"
                      {...form.register("checkinTime")}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="checkoutTime">Check-out</Label>
                    <Input
                      id="checkoutTime"
                      type="time"
                      {...form.register("checkoutTime")}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="maxGuestsPerRoom">Max Ospiti per Camera</Label>
                  <Input
                    id="maxGuestsPerRoom"
                    type="number"
                    min="1"
                    max="10"
                    {...form.register("maxGuestsPerRoom")}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Servizi</h3>
                
                <div>
                  <Label htmlFor="wifiPassword">Password WiFi</Label>
                  <Input
                    id="wifiPassword"
                    {...form.register("wifiPassword")}
                    placeholder="Password123"
                  />
                </div>
                
                <div>
                  <Label htmlFor="taxRate">Tassa di Soggiorno (€)</Label>
                  <Input
                    id="taxRate"
                    {...form.register("taxRate")}
                    placeholder="3.00"
                  />
                </div>

                <div>
                  <Label htmlFor="autoLogoutMinutes">Auto-logout (minuti)</Label>
                  <Input
                    id="autoLogoutMinutes"
                    type="number"
                    min="5"
                    max="120"
                    {...form.register("autoLogoutMinutes")}
                  />
                </div>
              </div>
            </div>

            <div className="border-t my-6"></div>

            {/* Messaggio Benvenuto */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Messaggio di Benvenuto</h3>
              <div>
                <Label htmlFor="welcomeMessage">Testo personalizzato per gli ospiti</Label>
                <Textarea
                  id="welcomeMessage"
                  rows={3}
                  {...form.register("welcomeMessage")}
                  placeholder="Benvenuto nella nostra struttura! Siamo felici di ospitarvi..."
                />
              </div>
            </div>

            {/* Pulsante Salva */}
            <div className="flex justify-end pt-6">
              <Button 
                type="submit" 
                disabled={saveSettings.isPending}
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                {saveSettings.isPending ? "Salvataggio..." : "Salva Impostazioni"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
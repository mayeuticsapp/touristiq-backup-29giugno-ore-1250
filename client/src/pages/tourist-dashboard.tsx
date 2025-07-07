import { Layout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TIQaiChat } from "@/components/tiqai-chat";
import { IQCodeValidation } from "@/components/iqcode-validation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tags, Utensils, Check, MessageCircle, QrCode, MapPin, Heart, Phone, Navigation, ExternalLink, Mail, Shield, Info } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCurrentUser } from "@/lib/auth";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function TouristDashboard() {
  const [showValidationDialog, setShowValidationDialog] = useState(false);
  const [showLocationSearch, setShowLocationSearch] = useState(false);
  const [searchCity, setSearchCity] = useState("");
  const [locationOffers, setLocationOffers] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchMode, setSearchMode] = useState<"default" | "city" | "geolocation">("default");
  
  // Stati per scheda dettagliata partner
  const [showPartnerDetail, setShowPartnerDetail] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<any>(null);
  
  // Stati per "Custode del Codice"
  const [showCustodeForm, setShowCustodeForm] = useState(false);
  const [showUpdateCustodeForm, setShowUpdateCustodeForm] = useState(false);
  const [secretWord, setSecretWord] = useState("");
  const [birthDate, setBirthDate] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: user } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: getCurrentUser,
  });

  const { data: custodeStatus } = useQuery({
    queryKey: ["/api/check-custode-status"],
  });

  // Query per informazioni entità (nome turista)
  const { data: entityInfo } = useQuery({
    queryKey: ['/api/entity-info'],
    queryFn: () => fetch('/api/entity-info', { credentials: 'include' }).then(res => res.json()),
    enabled: !!user
  });

  // Query per offerte reali basate su validazioni
  const { data: realOffers, isLoading: isLoadingOffers } = useQuery({
    queryKey: ["/api/tourist/real-offers"],
    enabled: !!user,
  });

  // Mutation per salvare dati "Custode del Codice"
  const custodeMutation = useMutation({
    mutationFn: async (data: { secretWord: string; birthDate: string }) => {
      return await apiRequest("POST", "/api/activate-custode", data);
    },
    onSuccess: () => {
      toast({
        title: "Custode del Codice attivato!",
        description: "I tuoi dati di recupero sono stati salvati in modo sicuro.",
      });
      setShowCustodeForm(false);
      setSecretWord("");
      setBirthDate("");
      // Aggiorna lo stato del custode
      queryClient.invalidateQueries({ queryKey: ["/api/check-custode-status"] });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Errore nel salvataggio dei dati di recupero",
        variant: "destructive",
      });
    },
  });

  // Mutation per aggiornare dati "Custode del Codice"
  const updateCustodeMutation = useMutation({
    mutationFn: async (data: { secretWord: string; birthDate: string }) => {
      return await apiRequest("POST", "/api/update-custode", data);
    },
    onSuccess: () => {
      toast({
        title: "✅ Custode del Codice aggiornato!",
        description: "Dati aggiornati correttamente. Ricorda che non possiamo recuperare queste informazioni: custodiscile bene!",
      });
      setShowUpdateCustodeForm(false);
      setSecretWord("");
      setBirthDate("");
      queryClient.invalidateQueries({ queryKey: ["/api/check-custode-status"] });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Errore nell'aggiornamento dei dati di recupero",
        variant: "destructive",
      });
    },
  });

  // Funzione per aprire scheda dettagliata partner
  const handleOpenPartnerDetail = (offer: any) => {
    setSelectedPartner(offer);
    setShowPartnerDetail(true);
  };

  // Gestore per salvare i dati del "Custode del Codice"
  const handleSaveCustode = () => {
    if (!secretWord.trim() || !birthDate.trim()) {
      toast({
        title: "Campi obbligatori",
        description: "Inserisci sia la parola segreta che la data di nascita",
        variant: "destructive",
      });
      return;
    }

    custodeMutation.mutate({
      secretWord: secretWord.trim(),
      birthDate: birthDate.trim(),
    });
  }

  // Gestore per aprire il form "Custode del Codice"
  const handleOpenCustodeForm = () => {
    setShowCustodeForm(true);
  };

  // Gestore per aggiornare i dati del "Custode del Codice"
  const handleUpdateCustode = () => {
    if (!secretWord.trim() || !birthDate.trim()) {
      toast({
        title: "Campi obbligatori",
        description: "Inserisci sia la parola segreta che la data di nascita",
        variant: "destructive",
      });
      return;
    }

    updateCustodeMutation.mutate({
      secretWord: secretWord.trim(),
      birthDate: birthDate.trim(),
    });
  };

  // Gestore per aprire il form di modifica "Custode del Codice"
  const handleOpenUpdateCustodeForm = () => {
    setSecretWord("");
    setBirthDate("");
    setShowUpdateCustodeForm(true);
  };

  // Funzione per cercare offerte per città
  const handleCitySearch = async () => {
    if (!searchCity.trim()) return;
    
    setIsSearching(true);
    try {
      const response = await fetch(`/api/tourist/offers-by-city?city=${encodeURIComponent(searchCity.trim())}`);
      const data = await response.json();
      
      if (response.ok) {
        setLocationOffers(data.offers || []);
        setSearchMode("city");
      } else {
        setLocationOffers([]);
      }
    } catch (error) {
      console.error("Errore ricerca città:", error);
      setLocationOffers([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Funzione per geolocalizzazione
  const handleGeolocationSearch = () => {
    if (!navigator.geolocation) {
      alert("Geolocalizzazione non supportata dal browser");
      return;
    }

    setIsSearching(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          const response = await fetch(`/api/tourist/offers-nearby?lat=${latitude}&lng=${longitude}&radius=2`);
          const data = await response.json();
          
          if (response.ok) {
            setLocationOffers(data.offers || []);
            setSearchMode("geolocation");
          } else {
            setLocationOffers([]);
          }
        } catch (error) {
          console.error("Errore ricerca geolocalizzazione:", error);
          setLocationOffers([]);
        } finally {
          setIsSearching(false);
        }
      },
      (error) => {
        console.error("Errore geolocalizzazione:", error);
        alert("Impossibile ottenere la posizione. Verifica le autorizzazioni del browser.");
        setIsSearching(false);
      }
    );
  };

  // Determina quali offerte mostrare
  const offersToShow = searchMode === "default" ? (realOffers as any)?.discounts || [] : locationOffers;
  
  const navigation = [
    { icon: <Tags size={16} />, label: "I Miei Sconti", href: "#" },
    { icon: <MessageCircle size={16} />, label: "TIQai Chat", href: "#" },
    { 
      icon: <QrCode size={16} />, 
      label: "Validazione IQCode", 
      href: "#",
      onClick: () => setShowValidationDialog(true)
    },
  ];

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Caricamento...</h2>
          <p className="text-gray-600">Sto caricando il tuo dashboard turista</p>
        </div>
      </div>
    );
  }

  return (
    <Layout
      title="Benvenuto, Turista!"
      role="Area Turista"
      iqCode={user.iqCode}
      navigation={navigation}
      sidebarColor="bg-tourist-green"
    >
      {/* Saluto personalizzato */}
      <div className="bg-white border-b border-gray-100 px-6 py-3 mb-6">
        <div className="flex items-center">
          <h2 className="text-lg font-medium text-gray-800">
            👋 Benvenuto{entityInfo?.name ? `, ${entityInfo.name}` : ' nel tuo spazio turistico'}!
          </h2>
        </div>
      </div>

      <div className="mb-8">
        <Card className="bg-gradient-to-r from-tourist-green to-green-400 text-white">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-2 text-white">Il tuo Codice IQ</h2>
            <div className="bg-white/30 rounded-lg p-4 text-center border-2 border-white/20">
              <span className="text-2xl font-bold tracking-wider text-gray-900">{user.iqCode}</span>
            </div>
            <p className="mt-3 text-white font-medium">Mostra questo codice ai partner per ottenere sconti esclusivi!</p>
          </CardContent>
        </Card>
      </div>

      {/* Blocco "Custode del Codice" */}
      <div className="mb-8">
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="w-6 h-6 text-blue-600" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Custode del Codice</h3>
                  <p className="text-sm text-gray-600">Proteggi il tuo accesso con un sistema di recupero sicuro</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative group">
                  <Info className="w-5 h-5 text-blue-600 cursor-help" />
                  <div className="absolute right-0 bottom-full mb-2 w-72 p-3 bg-gray-900 text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                    {custodeStatus?.hasRecoveryData 
                      ? "Modifica la parola segreta e la data di nascita associate al tuo IQCode per un futuro recupero. I dati restano anonimi e non recuperabili dal nostro sistema."
                      : "Il Custode del Codice ti aiuta a recuperare il tuo IQCode se lo dimentichi. Salva ora una parola segreta e una data speciale: saranno usate in sicurezza solo da te."}
                  </div>
                </div>
                {custodeStatus?.hasRecoveryData ? (
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-green-600">
                      <Check className="w-5 h-5" />
                      <span className="font-medium">Custode già attivato</span>
                    </div>
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={handleOpenUpdateCustodeForm}
                      className="text-blue-600 border-blue-300 hover:bg-blue-50"
                    >
                      Gestisci Custode del Codice
                    </Button>
                  </div>
                ) : (
                  <Button 
                    onClick={handleOpenCustodeForm}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Attiva il Custode del Codice
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Sconti Disponibili</h3>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowLocationSearch(!showLocationSearch)}
              >
                <MapPin className="w-4 h-4 mr-2" />
                Cerca per località
              </Button>
            </div>
            
            {showLocationSearch && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cerca partner in un comune
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="es. Pizzo, Tropea, Briatico..."
                        value={searchCity}
                        onChange={(e) => setSearchCity(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <Button onClick={handleCitySearch} disabled={!searchCity.trim()}>
                        Cerca
                      </Button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Offerte vicino a te
                    </label>
                    <Button 
                      onClick={handleGeolocationSearch}
                      variant="outline"
                      className="w-full"
                    >
                      <MapPin className="w-4 h-4 mr-2" />
                      Usa la mia posizione (2km)
                    </Button>
                  </div>
                </div>
              </div>
            )}
            {/* Indicatore modalità di ricerca */}
            {searchMode !== "default" && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-blue-700">
                    {searchMode === "city" && `Risultati per: ${searchCity}`}
                    {searchMode === "geolocation" && "Offerte nel raggio di 2km dalla tua posizione"}
                  </p>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      setSearchMode("default");
                      setLocationOffers([]);
                      setSearchCity("");
                    }}
                  >
                    Torna alle offerte personali
                  </Button>
                </div>
              </div>
            )}

            {(isLoadingOffers || isSearching) ? (
              <div className="text-center py-4">
                <p className="text-gray-500">
                  {isSearching ? "Ricerca in corso..." : "Caricamento offerte..."}
                </p>
              </div>
            ) : offersToShow?.length > 0 ? (
              <div className="space-y-3">
                {(() => {
                  // Raggruppa offerte per partner - CONTROLLO CRITICO PARTNERCODE
                  const groupedOffers = offersToShow.reduce((acc: any, offer: any) => {
                    const partnerKey = offer.partnerCode; // Usa solo partnerCode come chiave univoca
                    
                    if (!acc[partnerKey]) {
                      acc[partnerKey] = {
                        partner: offer,
                        offers: []
                      };
                    }
                    
                    // VERIFICA CRITICA: aggiungi SOLO se partnerCode corrisponde esattamente
                    if (offer.partnerCode === partnerKey) {
                      acc[partnerKey].offers.push(offer);
                    }
                    return acc;
                  }, {});

                  return Object.values(groupedOffers).map((group: any, groupIndex: number) => {
                    const partner = group.partner;
                    const offers = group.offers;
                    
                    return (
                      <div key={groupIndex} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                        {/* Header Partner - compatto */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center cursor-pointer flex-1" onClick={() => handleOpenPartnerDetail(partner)}>
                            <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                              <Utensils className="text-red-600" size={16} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-gray-900 hover:text-blue-600 transition-colors truncate">{partner.partnerName}</p>
                              <p className="text-sm text-gray-600">{partner.businessType}</p>
                            </div>
                          </div>
                          
                          {/* Conteggio offerte */}
                          <div className="text-sm text-gray-500 ml-2">
                            {offers.length} offert{offers.length === 1 ? 'a' : 'e'}
                          </div>
                        </div>

                        {/* Lista offerte compatta */}
                        <div className="space-y-2 mb-3">
                          {offers.map((offer: any, offerIndex: number) => (
                            <div key={offerIndex} className="flex items-center justify-between p-2 bg-gray-50 rounded border-l-4 border-l-blue-500">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 text-sm truncate">{offer.title}</p>
                                <p className="text-xs text-gray-600 truncate">{offer.description}</p>
                                {offer.validUntil && (
                                  <p className="text-xs text-gray-500">
                                    Valido fino al {new Date(offer.validUntil).toLocaleDateString('it-IT')}
                                  </p>
                                )}
                              </div>
                              <Badge className="bg-green-100 text-green-800 font-bold ml-2 flex-shrink-0">
                                -{offer.discountPercentage}%
                              </Badge>
                            </div>
                          ))}
                        </div>
                        
                        {/* Indirizzo compatto */}
                        {partner.address && (
                          <div className="flex items-center text-sm text-gray-600 mb-2">
                            <MapPin className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                            <span className="truncate">{partner.address}, {partner.city} ({partner.province})</span>
                          </div>
                        )}
                        
                        {/* Azioni rapide compatte */}
                        <div className="flex gap-1 flex-wrap">
                          {partner.phone && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => window.open(`https://wa.me/${partner.phone.replace(/[^0-9]/g, '')}?text=Ciao! Ho visto le vostre offerte su TouristIQ. Vorrei avere maggiori informazioni.`, '_blank')}
                              className="text-green-600 hover:bg-green-50 text-xs"
                            >
                              <Phone className="w-3 h-3 mr-1" />
                              WhatsApp
                            </Button>
                          )}
                          
                          {partner.address && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(partner.address + ', ' + partner.city)}`, '_blank')}
                              className="text-blue-600 hover:bg-blue-50 text-xs"
                            >
                              <Navigation className="w-3 h-3 mr-1" />
                              Naviga
                            </Button>
                          )}
                          
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleOpenPartnerDetail(partner)}
                            className="text-purple-600 hover:bg-purple-50 text-xs"
                          >
                            <ExternalLink className="w-3 h-3 mr-1" />
                            Dettagli
                          </Button>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            ) : (
              <div className="text-center py-8">
                <Tags className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500 mb-2">Nessuna offerta disponibile</p>
                <p className="text-sm text-gray-400">Valida alcuni partner per vedere le offerte!</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Attività Recenti</h3>
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <Check className="text-green-600" size={12} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Sconto utilizzato</p>
                  <p className="text-xs text-gray-500">Pizzeria Da Mario - 15% di sconto</p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <Heart className="text-blue-600" size={12} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Aggiunto ai preferiti</p>
                  <p className="text-xs text-gray-500">Ristorante Il Borgo</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <TIQaiChat />
          </CardContent>
        </Card>
      </div>

      {/* Dialog Validazione IQCode */}
      <Dialog open={showValidationDialog} onOpenChange={setShowValidationDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5" />
              Richieste di Validazione IQCode
            </DialogTitle>
          </DialogHeader>
          <IQCodeValidation userRole="tourist" />
        </DialogContent>
      </Dialog>



      {/* Dialog Custode del Codice - Form */}
      <Dialog open={showCustodeForm} onOpenChange={setShowCustodeForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              Custode del Codice
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="secretWord">Parola segreta</Label>
              <Input
                id="secretWord"
                type="text"
                value={secretWord}
                onChange={(e) => setSecretWord(e.target.value)}
                placeholder="Inserisci una parola che ricorderai"
              />
            </div>
            <div>
              <Label htmlFor="birthDate">Data di nascita</Label>
              <Input
                id="birthDate"
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
              />
            </div>
            <Button 
              onClick={handleSaveCustode}
              disabled={custodeMutation.isPending}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {custodeMutation.isPending ? "Salvando..." : "Salva e attiva il custode"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Modifica Custode del Codice */}
      <Dialog open={showUpdateCustodeForm} onOpenChange={setShowUpdateCustodeForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              Modifica Custode del Codice
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Aggiorna i tuoi dati di recupero. I vecchi dati saranno sostituiti con i nuovi. Ricorda che non possiamo recuperare queste informazioni: custodiscile bene!
            </p>
            <div>
              <Label htmlFor="updateSecretWord">Nuova parola segreta</Label>
              <Input
                id="updateSecretWord"
                type="text"
                value={secretWord}
                onChange={(e) => setSecretWord(e.target.value)}
                placeholder="Inserisci una nuova parola che ricorderai"
              />
            </div>
            <div>
              <Label htmlFor="updateBirthDate">Nuova data di nascita</Label>
              <Input
                id="updateBirthDate"
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
              />
            </div>
            <Button 
              onClick={handleUpdateCustode}
              disabled={updateCustodeMutation.isPending}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {updateCustodeMutation.isPending ? "Aggiornando..." : "Aggiorna dati di recupero"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Scheda Dettagliata Partner */}
      <Dialog open={showPartnerDetail} onOpenChange={setShowPartnerDetail}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
                <Utensils className="text-red-600" size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selectedPartner?.partnerName}</h2>
                <p className="text-sm text-gray-600">{selectedPartner?.businessType}</p>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          {selectedPartner && (
            <div className="space-y-6">
              {/* Offerta Principale */}
              <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-green-800">{selectedPartner.title}</h3>
                  <Badge className="bg-green-100 text-green-800 text-lg font-bold">
                    -{selectedPartner.discountPercentage}%
                  </Badge>
                </div>
                <p className="text-green-700">{selectedPartner.description}</p>
              </div>
              
              {/* Informazioni di Base */}
              {selectedPartner.address && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-blue-600" />
                    Dove siamo
                  </h4>
                  <p className="text-gray-700 mb-3">
                    {selectedPartner.address}, {selectedPartner.city} ({selectedPartner.province})
                  </p>
                  <Button 
                    onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(selectedPartner.address + ', ' + selectedPartner.city)}`, '_blank')}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Navigation className="w-4 h-4 mr-2" />
                    Apri in Google Maps - Inizia la navigazione
                  </Button>
                </div>
              )}
              
              {/* Contatti */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Contatti</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedPartner.phone && (
                    <Button 
                      variant="outline"
                      onClick={() => window.open(`https://wa.me/${selectedPartner.phone.replace(/[^0-9]/g, '')}?text=Ciao! Ho visto la vostra offerta "${selectedPartner.title}" su TouristIQ. Vorrei avere maggiori informazioni.`, '_blank')}
                      className="text-green-600 hover:bg-green-50 border-green-300"
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      Contatta su WhatsApp
                    </Button>
                  )}
                  
                  {selectedPartner.website && (
                    <Button 
                      variant="outline"
                      onClick={() => window.open(selectedPartner.website, '_blank')}
                      className="text-purple-600 hover:bg-purple-50 border-purple-300"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Visita il sito web
                    </Button>
                  )}
                  
                  {selectedPartner.email && (
                    <Button 
                      variant="outline"
                      onClick={() => window.open(`mailto:${selectedPartner.email}?subject=Informazioni offerta ${selectedPartner.title}`, '_blank')}
                      className="text-blue-600 hover:bg-blue-50 border-blue-300"
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Invia una email
                    </Button>
                  )}
                </div>
              </div>
              
              {/* Accessibilità e Servizi */}
              {(selectedPartner.wheelchairAccessible || selectedPartner.childFriendly || selectedPartner.glutenFree) && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Servizi e Accessibilità</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedPartner.wheelchairAccessible && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        ♿ Accessibile
                      </Badge>
                    )}
                    {selectedPartner.childFriendly && (
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                        👶 Family Friendly
                      </Badge>
                    )}
                    {selectedPartner.glutenFree && (
                      <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                        🌾 Gluten Free
                      </Badge>
                    )}
                  </div>
                </div>
              )}
              
              {/* Note di validazione */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Come utilizzare lo sconto</h4>
                <p className="text-sm text-gray-600">
                  📱 Mostra il tuo <strong>Codice IQ</strong> al partner per ottenere lo sconto. 
                  Il partner può validare il codice tramite l'app TouristIQ.
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}

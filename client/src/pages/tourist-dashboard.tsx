import { Layout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TIQaiChat } from "@/components/tiqai-chat";
import { IQCodeValidation } from "@/components/iqcode-validation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tags, Utensils, Check, MessageCircle, QrCode, MapPin, Heart, Phone, Navigation, ExternalLink, Mail } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getCurrentUser } from "@/lib/auth";
import { useState } from "react";

export default function TouristDashboard() {
  const [showValidationDialog, setShowValidationDialog] = useState(false);
  const [showLocationSearch, setShowLocationSearch] = useState(false);
  const [showPartnerDialog, setShowPartnerDialog] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<any>(null);
  const [searchCity, setSearchCity] = useState("");
  const [locationOffers, setLocationOffers] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchMode, setSearchMode] = useState<"default" | "city" | "geolocation">("default");
  
  const { data: user } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: getCurrentUser,
  });

  // Query per offerte reali basate su validazioni
  const { data: realOffers, isLoading: isLoadingOffers } = useQuery({
    queryKey: ["/api/tourist/real-offers"],
    enabled: !!user,
  });

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
  
  // Funzione per aprire scheda partner
  const handlePartnerClick = (offer: any) => {
    setSelectedPartner(offer);
    setShowPartnerDialog(true);
  };
  
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
              <div className="space-y-4">
                {offersToShow.map((offer: any, index: number) => (
                  <div 
                    key={index} 
                    className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handlePartnerClick(offer)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center">
                        <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                          <Utensils className="text-red-600" size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{offer.partnerName}</p>
                          <p className="text-sm text-gray-600">{offer.businessType}</p>
                          <p className="text-sm font-medium text-blue-600 mt-1">{offer.title}</p>
                          <p className="text-xs text-gray-500 line-clamp-2">{offer.description}</p>
                          <p className="text-xs text-blue-500 mt-1 font-medium">👆 Clicca per vedere dettagli</p>
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-green-800 text-lg font-bold">
                        -{offer.discountPercentage}%
                      </Badge>
                    </div>
                    
                    {/* Anteprima indirizzo */}
                    {offer.address && (
                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                        <span>{offer.city} ({offer.province})</span>
                      </div>
                    )}

                    {/* Validità offerta */}
                    {offer.validUntil && (
                      <div className="text-xs text-gray-500 mt-2">
                        Valido fino al {new Date(offer.validUntil).toLocaleDateString('it-IT')}
                      </div>
                    )}
                  </div>
                ))}
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

      {/* Dialog Scheda Partner */}
      <Dialog open={showPartnerDialog} onOpenChange={setShowPartnerDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Utensils className="w-5 h-5" />
              {selectedPartner?.partnerName}
            </DialogTitle>
          </DialogHeader>
          
          {selectedPartner && (
            <div className="space-y-6">
              {/* Offerta principale */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border-l-4 border-green-500">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">{selectedPartner.title}</h3>
                    <p className="text-gray-700 mt-1">{selectedPartner.description}</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800 text-xl font-bold px-3 py-1">
                    -{selectedPartner.discountPercentage}%
                  </Badge>
                </div>
                {selectedPartner.validUntil && (
                  <p className="text-sm text-gray-600 mt-2">
                    ⏰ Valido fino al {new Date(selectedPartner.validUntil).toLocaleDateString('it-IT')}
                  </p>
                )}
              </div>

              {/* Informazioni business */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">📍 Informazioni</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Tipo:</span> {selectedPartner.businessType}</p>
                    {selectedPartner.address && (
                      <p><span className="font-medium">Indirizzo:</span> {selectedPartner.address}</p>
                    )}
                    <p><span className="font-medium">Città:</span> {selectedPartner.city} ({selectedPartner.province})</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">♿ Servizi</h4>
                  <div className="space-y-1 text-sm">
                    {selectedPartner.wheelchairAccessible && (
                      <p className="text-green-600">✅ Accessibile disabili</p>
                    )}
                    {selectedPartner.childFriendly && (
                      <p className="text-blue-600">👶 Child friendly</p>
                    )}
                    {selectedPartner.glutenFree && (
                      <p className="text-orange-600">🌾 Opzioni senza glutine</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Azioni principali */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {selectedPartner.phone && (
                  <Button 
                    onClick={() => window.open(`https://wa.me/${selectedPartner.phone.replace(/[^0-9]/g, '')}?text=Ciao! Ho visto la vostra offerta "${selectedPartner.title}" su TouristIQ. Vorrei prenotare e usufruire dello sconto del ${selectedPartner.discountPercentage}%.`, '_blank')}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Contatta su WhatsApp
                  </Button>
                )}
                
                {selectedPartner.address && (
                  <Button 
                    variant="outline"
                    onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(selectedPartner.address + ', ' + selectedPartner.city)}`, '_blank')}
                    className="border-blue-500 text-blue-600 hover:bg-blue-50"
                  >
                    <Navigation className="w-4 h-4 mr-2" />
                    Apri in Maps
                  </Button>
                )}
              </div>

              {/* Azioni secondarie */}
              <div className="flex gap-2 flex-wrap">
                {selectedPartner.website && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.open(selectedPartner.website, '_blank')}
                    className="text-purple-600 hover:bg-purple-50"
                  >
                    <ExternalLink className="w-4 h-4 mr-1" />
                    Sito Web
                  </Button>
                )}
                
                {selectedPartner.email && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.open(`mailto:${selectedPartner.email}?subject=Richiesta informazioni offerta ${selectedPartner.title}&body=Salve, ho visto la vostra offerta su TouristIQ e vorrei maggiori informazioni per usufruire dello sconto del ${selectedPartner.discountPercentage}%.`, '_blank')}
                    className="text-gray-600 hover:bg-gray-50"
                  >
                    <Mail className="w-4 h-4 mr-1" />
                    Invia Email
                  </Button>
                )}

                {selectedPartner.phone && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.open(`tel:${selectedPartner.phone}`, '_blank')}
                    className="text-blue-600 hover:bg-blue-50"
                  >
                    <Phone className="w-4 h-4 mr-1" />
                    Chiama
                  </Button>
                )}
              </div>

              {/* Note importanti */}
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <h4 className="font-semibold text-yellow-800 mb-2">💡 Come usufruire dello sconto</h4>
                <p className="text-yellow-700 text-sm">
                  Mostra il tuo <strong>IQCode {user?.iqCode}</strong> al momento del pagamento per ottenere lo sconto del {selectedPartner.discountPercentage}%. 
                  Ti consigliamo di contattare prima il partner per confermare disponibilità e prenotazione.
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}

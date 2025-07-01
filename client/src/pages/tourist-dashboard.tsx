import { Layout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TIQaiChat } from "@/components/tiqai-chat";
import { IQCodeValidation } from "@/components/iqcode-validation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Compass, Tags, History, Heart, User, Utensils, Check, MessageCircle, QrCode, MapPin } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getCurrentUser } from "@/lib/auth";
import { useState } from "react";

export default function TouristDashboard() {
  const [showValidationDialog, setShowValidationDialog] = useState(false);
  const [showLocationSearch, setShowLocationSearch] = useState(false);
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
  const offersToShow = searchMode === "default" ? realOffers?.discounts || [] : locationOffers;
  
  const navigation = [
    { icon: <Compass size={16} />, label: "Esplora", href: "#" },
    { icon: <Tags size={16} />, label: "I Miei Sconti", href: "#" },
    { icon: <MessageCircle size={16} />, label: "TIQai Chat", href: "#" },
    { 
      icon: <QrCode size={16} />, 
      label: "Validazione IQCode", 
      href: "#",
      onClick: () => setShowValidationDialog(true)
    },
    { icon: <History size={16} />, label: "Cronologia", href: "#" },
    { icon: <Heart size={16} />, label: "Preferiti", href: "#" },
    { icon: <User size={16} />, label: "Profilo", href: "#" },
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
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center">
                      <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                        <Utensils className="text-red-600" size={20} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{offer.partnerName}</p>
                        <p className="text-sm text-gray-500">{offer.title}</p>
                        {offer.city && (
                          <p className="text-xs text-gray-400 flex items-center mt-1">
                            <MapPin className="w-3 h-3 mr-1" />
                            {offer.city}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-800">-{offer.discountPercentage}%</Badge>
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
    </Layout>
  );
}

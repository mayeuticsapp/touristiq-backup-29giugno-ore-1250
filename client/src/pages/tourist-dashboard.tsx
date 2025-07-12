import { Layout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TIQaiChat } from "@/components/tiqai-chat";
import { OneTimeCodeGenerator } from "@/components/OneTimeCodeGenerator";
import TouristSavings from "@/components/TouristSavings";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tags, Utensils, Check, MessageCircle, QrCode, MapPin, Heart, Phone, Navigation, ExternalLink, Mail, Shield, Info, Copy, Clock } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCurrentUser } from "@/lib/auth";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isTemporaryCode } from "@/lib/temp-code-utils";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { LanguageSelector } from "@/components/LanguageSelector";

export default function TouristDashboard() {
  const { t } = useTranslation();

  const [showLocationSearch, setShowLocationSearch] = useState(false);
  const [searchCity, setSearchCity] = useState("");
  const [locationOffers, setLocationOffers] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchMode, setSearchMode] = useState<"default" | "city" | "geolocation">("default");
  const [, setLocation] = useLocation();

  // Stati per scheda dettagliata partner
  const [showPartnerDetail, setShowPartnerDetail] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<any>(null);
  const [selectedOffer, setSelectedOffer] = useState<any>(null);

  // Stati per "Custode del Codice"
  const [showCustodeForm, setShowCustodeForm] = useState(false);
  const [showUpdateCustodeForm, setShowUpdateCustodeForm] = useState(false);
  const [secretWord, setSecretWord] = useState("");
  const [birthDate, setBirthDate] = useState("");

  // Stato per popup di benvenuto
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState("");
  
  // Stati per modali menu laterale
  const [showIQCodeModal, setShowIQCodeModal] = useState(false);
  const [showCustodeModal, setShowCustodeModal] = useState(false);
  const [showSavingsModal, setShowSavingsModal] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query per user (DEVE essere definito prima degli useEffect)
  const { data: user } = useQuery({
    queryKey: ["/api/auth/me"],
  });

  // 🚨 CONTROLLO SICUREZZA DASHBOARD: Impedisce accesso con codici temporanei
  useEffect(() => {
    if (user && user.iqCode && isTemporaryCode(user.iqCode)) {
      toast({
        title: t('tourist.security.unauthorized'),
        description: t('tourist.security.tempCodeNotAllowed'),
        variant: "destructive",
      });
      // Reindirizza immediatamente alla pagina di attivazione
      setLocation("/activate-temp-code");
    }
  }, [user]);

  // Messaggi dinamici evocativi tradotti
  const welcomeMessages = [
    t('tourist.welcome.message1'),
    t('tourist.welcome.message2'),
    t('tourist.welcome.message3'),
    t('tourist.welcome.message4'),
    t('tourist.welcome.message5'),
    t('tourist.welcome.message6'),
    t('tourist.welcome.message7')
  ];

  // Logica popup benvenuto
  useEffect(() => {
    console.log('User stato:', user);
    const hasSeenWelcome = localStorage.getItem('touristiq-welcome-seen');
    if (!hasSeenWelcome && user?.iqCode) {
      // Seleziona messaggio casuale
      const randomMessage = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
      setWelcomeMessage(randomMessage);
      
      // Delay "sunrise" per dare respiro all'interfaccia
      setTimeout(() => {
        setShowWelcomePopup(true);
      }, 800);
    }
  }, [user]);

  const handleCloseWelcome = (dontShowAgain: boolean = false) => {
    if (dontShowAgain) {
      localStorage.setItem('touristiq-welcome-seen', 'true');
    }
    setShowWelcomePopup(false);
  };

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

  // Funzione per aprire scheda dettagliata partner con offerta specifica
  const handleOpenPartnerDetail = (partner: any, offer?: any) => {
    setSelectedPartner(partner);
    setSelectedOffer(offer || null);
    setShowPartnerDetail(true);
  };

  // Funzione per aprire offerta specifica
  const handleOpenOfferDetail = (offer: any) => {
    setSelectedPartner(offer);
    setSelectedOffer(offer);
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
      alert(t('geolocation.unsupported'));
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
        alert(t('geolocation.permissionDenied'));
        setIsSearching(false);
      }
    );
  };

  // Determina quali offerte mostrare
  const offersToShow = searchMode === "default" ? (realOffers as any)?.discounts || [] : locationOffers;

  const navigation = [
    { icon: <Tags size={16} />, label: t('tourist.myDiscounts'), href: "#" },
    { icon: <MessageCircle size={16} />, label: t('tourist.tiqaiChat'), href: "#" },
    { icon: <Heart size={16} />, label: t('savings.title'), href: "#", onClick: () => setShowSavingsModal(true) },
    { icon: <QrCode size={16} />, label: "Il Mio IQCode", href: "#", onClick: () => setShowIQCodeModal(true) },
    { icon: <Shield size={16} />, label: "Custode del Codice", href: "#", onClick: () => setShowCustodeModal(true) },
  ];

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">{t('common.loading')}...</h2>
          <p className="text-gray-600">{t('tourist.title')}</p>
        </div>
      </div>
    );
  }

  return (
    <Layout
      title={t('dashboard.welcome') + ", " + t('tourist.title').split(' ')[0] + "!"}
      role={t('tourist.title')}
      iqCode={user.iqCode}
      navigation={navigation}
      sidebarColor="bg-tourist-green"
    >
      {/* Selettore lingua - posizionato in alto a destra dell'header, ben visibile */}
      <div className="fixed top-4 right-20 z-10">
        <LanguageSelector />
      </div>
      {/* Saluto personalizzato con calore calabrese */}
      <div className="bg-calabria-warm px-6 py-4 mb-6 animate-discover">
        <div className="flex items-center">
          <div className="animate-gentle-pulse mr-3">
            🌅
          </div>
          <h2 className="text-xl font-semibold text-white drop-shadow-sm">
            {t('dashboard.welcome')}{entityInfo?.name ? `, ${entityInfo.name}` : t('dashboard.welcomeFallback')}! 
            <span className="block text-sm font-normal mt-1 text-white/90">
              {t('tourist.subtitle')}
            </span>
          </h2>
        </div>
      </div>

      {/* 1. TIQai Chat - PRIMO POSTO */}
      <div className="mb-8">
        <Card>
          <CardContent className="p-6">
            <TIQaiChat />
          </CardContent>
        </Card>
      </div>

      {/* 2. Scoperte/Offerte - SECONDO POSTO */}
      <div className="mb-8">
        <Card className="card-premium">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center">
                <div className="animate-gentle-pulse mr-3 text-xl">🎁</div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{t('tourist.exclusiveDiscoveries')}</h3>
                  <p className="text-sm text-gray-600">{t('tourist.noOffersAvailable')}</p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowLocationSearch(!showLocationSearch)}
                className="bg-calabria-sea text-white border-none hover:bg-calabria-nature transition-all duration-300 hover-warm"
              >
                <MapPin className="w-4 h-4 mr-2" />
                {t('tourist.exploreNearby')}
              </Button>
            </div>

            {showLocationSearch && (
              <div className="mb-6 p-4 bg-calabria-warm/10 rounded-xl border border-orange-200 animate-discover">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                      <span className="mr-2">🏛️</span>
                      Scopri tesori nascosti in...
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Pizzo, Tropea, Briatico..."
                        value={searchCity}
                        onChange={(e) => setSearchCity(e.target.value)}
                        className="flex-1 px-4 py-3 border border-orange-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white/80 backdrop-blur-sm"
                      />
                      <Button 
                        onClick={handleCitySearch} 
                        disabled={!searchCity.trim()}
                        className="bg-calabria-sunset text-white border-none hover-warm px-6"
                      >
                        Scopri
                      </Button>
                    </div>
                  </div>
                  <div>
                    <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                      <span className="mr-2">📍</span>
                      Tesori vicino a te
                    </label>
                    <Button 
                      onClick={handleGeolocationSearch}
                      variant="outline"
                      className="w-full bg-calabria-nature text-white border-none hover:bg-calabria-sea transition-all duration-300 py-3"
                    >
                      <MapPin className="w-4 h-4 mr-2" />
                      Cerca nel raggio di 2km
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
                  // RAGGRUPPAMENTO CORRETTO PER PARTNERCODE - FIX CRITICO
                  console.info("🔍 DEBUG: Offerte da raggruppare:", offersToShow.map(o => `${o.title} (${o.partnerCode})`));

                  const groupedOffers = offersToShow.reduce((acc: any, offer: any) => {
                    const partnerKey = offer.partnerCode;

                    if (!acc[partnerKey]) {
                      acc[partnerKey] = {
                        partner: offer, // Primo partner per le info di base
                        offers: []
                      };
                    }

                    // Aggiungi offerta SOLO al partner giusto
                    acc[partnerKey].offers.push(offer);
                    return acc;
                  }, {});

                  console.info("🔍 DEBUG: Raggruppamento finale:", Object.keys(groupedOffers).map(key => 
                    `${key}: ${groupedOffers[key].offers.length} offerte (${groupedOffers[key].offers.map(o => o.title).join(', ')})`
                  ));

                  return Object.values(groupedOffers).map((group: any, groupIndex: number) => {
                    const partner = group.partner;
                    const offers = group.offers;

                    return (
                      <div key={groupIndex} className="card-premium p-6 rounded-xl hover-warm cursor-pointer animate-discover border-l-4 border-l-orange-400">
                        {/* Header Partner - coinvolgente */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center flex-1">
                            <div className="h-12 w-12 bg-calabria-warm rounded-full flex items-center justify-center mr-4 flex-shrink-0 animate-gentle-pulse">
                              <Utensils className="text-white" size={20} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-gray-900 truncate text-lg">{partner.partnerName}</p>
                              <p className="text-sm text-gray-600 flex items-center">
                                <span className="mr-1">✨</span>
                                {partner.businessType}
                              </p>
                            </div>
                          </div>

                          {/* Badge esclusivo offerte */}
                          <div className="bg-calabria-sunset text-white px-3 py-1 rounded-full text-sm font-semibold">
                            {offers.length} {offers.length === 1 ? 'scoperta' : 'scoperte'}
                          </div>
                        </div>

                        {/* Lista offerte compatte - click per espandere */}
                        <div className="space-y-2 mb-4">
                          {offers.map((offer: any, offerIndex: number) => (
                            <div 
                              key={offerIndex} 
                              className="relative overflow-hidden bg-gradient-to-r from-white to-orange-50 rounded-lg border border-orange-200 cursor-pointer hover-warm group p-3"
                              onClick={() => handleOpenOfferDetail(offer)}
                            >
                              <div className="absolute top-0 right-0 w-12 h-12 bg-calabria-sunset opacity-10 rounded-bl-full"></div>
                              <div className="relative">
                                <div className="flex items-center justify-between">
                                  <div className="flex-1 min-w-0 pr-3">
                                    <div className="flex items-center mb-1">
                                      <span className="text-base mr-2">🎯</span>
                                      <p className="font-semibold text-gray-900 text-sm group-hover:text-orange-600 transition-colors truncate">{offer.title}</p>
                                    </div>
                                    <p className="text-xs text-gray-600 line-clamp-1 truncate">{offer.description}</p>
                                    {offer.validUntil && (
                                      <div className="flex items-center text-xs text-gray-500 mt-1">
                                        <span className="mr-1">⏰</span>
                                        Valido fino al {new Date(offer.validUntil).toLocaleDateString('it-IT')}
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex flex-col items-center flex-shrink-0">
                                    <Badge className="bg-calabria-nature text-white font-bold text-sm px-2 py-1 mb-1">
                                      -{offer.discountPercentage}%
                                    </Badge>
                                    <span className="text-xs text-gray-500">ESCLUSIVO</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Informazioni coinvolgenti */}
                        {partner.address && (
                          <div className="flex items-center text-sm text-gray-600 mb-4 bg-white/60 p-2 rounded-lg">
                            <MapPin className="w-4 h-4 mr-2 text-orange-500 flex-shrink-0" />
                            <span className="truncate font-medium">{partner.address}, {partner.city} ({partner.province})</span>
                          </div>
                        )}

                        {/* Azioni rapide coinvolgenti */}
                        <div className="flex gap-2 flex-wrap">
                          {partner.phone && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => window.open(`https://wa.me/${partner.phone.replace(/[^0-9]/g, '')}?text=Ciao! Ho visto le vostre offerte su TouristIQ. Vorrei avere maggiori informazioni.`, '_blank')}
                              className="bg-green-500 text-white border-none hover:bg-green-600 text-xs hover-warm"
                            >
                              <Phone className="w-3 h-3 mr-1" />
                              Contatta
                            </Button>
                          )}

                          {partner.address && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(partner.address + ', ' + partner.city + ', ' + partner.province)}`, '_blank')}
                              className="bg-calabria-sea text-white border-none hover:bg-blue-600 text-xs hover-warm"
                            >
                              <Navigation className="w-3 h-3 mr-1" />
                              Raggiungi
                            </Button>
                          )}

                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleOpenPartnerDetail(partner)}
                            className="bg-calabria-sunset text-white border-none hover:bg-orange-600 text-xs hover-warm"
                          >
                            <ExternalLink className="w-3 h-3 mr-1" />
                            Scopri Tutto
                          </Button>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            ) : (
              <div className="text-center py-12 animate-discover">
                <div className="animate-gentle-pulse mb-6">
                  <div className="mx-auto h-20 w-20 bg-calabria-warm rounded-full flex items-center justify-center">
                    <Tags className="h-10 w-10 text-white" />
                  </div>
                </div>
                <h4 className="text-xl font-semibold text-gray-900 mb-2">{t('tourist.waitingDiscoveries')}</h4>
                <p className="text-gray-600 mb-4">{t('tourist.exploreOrAsk')}</p>
                <div className="flex justify-center gap-3">
                  <Button 
                    onClick={() => setShowLocationSearch(true)}
                    className="bg-calabria-sunset text-white hover-warm"
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    {t('tourist.exploreArea')}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 3. Sistema Codici Monouso TIQ-OTC - TERZO POSTO */}
      <div className="mb-8">
        <OneTimeCodeGenerator />
      </div>

      {/* 4. Sistema Custode del Codice - DASHBOARD PRINCIPALE */}
      <div className="mb-8">
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="w-6 h-6 text-blue-600" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Custode del Codice</h3>
                  <p className="text-sm text-gray-600">
                    Proteggi il tuo accesso con un sistema di recupero sicuro e anonimo
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {custodeStatus?.hasRecoveryData ? (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-green-600">
                      <Check className="w-5 h-5" />
                      <span className="font-medium">Custode attivo</span>
                    </div>
                    <Button
                      onClick={handleOpenUpdateCustodeForm}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      Gestisci Custode del Codice
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={handleOpenCustodeForm}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Attiva il Custode del Codice
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>


      {/* Dialog Custode del Codice - Form con Spiegazione Educativa */}
      <Dialog open={showCustodeForm} onOpenChange={setShowCustodeForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              Attiva il Custode del Codice
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            
            {/* SPIEGAZIONE EDUCATIVA COMPLETA */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-3">🛡️ Cos'è il Custode del Codice?</h4>
              <p className="text-sm text-blue-800 mb-3">
                <strong>Il Custode del Codice è la nostra innovazione per la tua sicurezza.</strong> 
                Un sistema di recupero completamente anonimo che protegge il tuo accesso senza compromettere la privacy.
              </p>
              
              <h5 className="font-semibold text-blue-900 mb-2">🔧 Come funziona:</h5>
              <ul className="text-sm text-blue-800 space-y-1.5">
                <li>• <strong>Scegli una parola segreta</strong> che ricorderai facilmente</li>
                <li>• <strong>Inserisci una data di nascita</strong> (anche inventata, basta che la ricordi)</li>
                <li>• <strong>I dati vengono criptati</strong> e salvati in modo completamente anonimo</li>
                <li>• <strong>Potrai recuperare il tuo IQCode</strong> dalla pagina di login quando serve</li>
                <li>• <strong>Nessun dato personale richiesto:</strong> no email, no telefono, no documenti</li>
              </ul>
              
              <div className="mt-3 p-2 bg-blue-100 rounded border border-blue-300">
                <p className="text-xs text-blue-900">
                  <strong>⚠️ Importante:</strong> I dati vengono criptati con hash irreversibile. 
                  Non possiamo recuperare queste informazioni per te - custodiscile bene!
                </p>
              </div>
            </div>
            
            <div>
              <Label htmlFor="secretWord">Parola segreta *</Label>
              <Input
                id="secretWord"
                type="text"
                value={secretWord}
                onChange={(e) => setSecretWord(e.target.value)}
                placeholder="Es: vacanza2024, famiglia, castello..."
              />
            </div>
            <div>
              <Label htmlFor="birthDate">Data di nascita *</Label>
              <Input
                id="birthDate"
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">
                Anche una data inventata va bene, basta che la ricordi
              </p>
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCustodeForm(false);
                  setSecretWord("");
                  setBirthDate("");
                }}
                className="flex-1"
              >
                Annulla
              </Button>
              <Button 
                onClick={handleSaveCustode}
                disabled={!secretWord.trim() || !birthDate || custodeMutation.isPending}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {custodeMutation.isPending ? "Attivazione..." : "Attiva Custode"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Modifica Custode del Codice con Spiegazione Educativa */}
      <Dialog open={showUpdateCustodeForm} onOpenChange={setShowUpdateCustodeForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              Modifica Custode del Codice
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            
            {/* SPIEGAZIONE EDUCATIVA COMPLETA */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-3">🔧 Modifica i tuoi dati di recupero</h4>
              <p className="text-sm text-blue-800 mb-3">
                <strong>Stai per aggiornare i dati del tuo Custode del Codice.</strong> 
                I vecchi dati saranno sostituiti con i nuovi in modo completamente sicuro.
              </p>
              
              <h5 className="font-semibold text-blue-900 mb-2">🛡️ Ricorda:</h5>
              <ul className="text-sm text-blue-800 space-y-1.5">
                <li>• <strong>Scegli una parola segreta</strong> che ricorderai facilmente</li>
                <li>• <strong>Inserisci una data di nascita</strong> (anche inventata, basta che la ricordi)</li>
                <li>• <strong>I dati vengono criptati</strong> e salvati in modo completamente anonimo</li>
                <li>• <strong>Potrai recuperare il tuo IQCode</strong> dalla pagina di login quando serve</li>
                <li>• <strong>Nessun dato personale richiesto:</strong> no email, no telefono, no documenti</li>
              </ul>
              
              <div className="mt-3 p-2 bg-blue-100 rounded border border-blue-300">
                <p className="text-xs text-blue-900">
                  <strong>⚠️ Importante:</strong> I dati vengono criptati con hash irreversibile. 
                  Non possiamo recuperare queste informazioni per te - custodiscile bene!
                </p>
              </div>
            </div>
            
            <div>
              <Label htmlFor="updateSecretWord">Nuova parola segreta *</Label>
              <Input
                id="updateSecretWord"
                type="text"
                value={secretWord}
                onChange={(e) => setSecretWord(e.target.value)}
                placeholder="Es: vacanza2024, famiglia, castello..."
              />
            </div>
            <div>
              <Label htmlFor="updateBirthDate">Nuova data di nascita *</Label>
              <Input
                id="updateBirthDate"
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">
                Anche una data inventata va bene, basta che la ricordi
              </p>
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowUpdateCustodeForm(false);
                  setSecretWord("");
                  setBirthDate("");
                }}
                className="flex-1"
              >
                Annulla
              </Button>
              <Button 
                onClick={handleUpdateCustode}
                disabled={!secretWord.trim() || !birthDate || updateCustodeMutation.isPending}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {updateCustodeMutation.isPending ? "Aggiornando..." : "Aggiorna Custode"}
              </Button>
            </div>
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
              {/* Offerta Specifica o Generale */}
              {selectedOffer ? (
                // Mostra offerta specifica cliccata
                <div className="bg-gradient-to-r from-emerald-50 to-green-50 p-6 rounded-lg border-l-4 border-emerald-500">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-emerald-800">{selectedOffer.title}</h3>
                    <Badge className="bg-emerald-100 text-emerald-800 text-xl font-bold px-3 py-1">
                      -{selectedOffer.discount}
                    </Badge>
                  </div>
                  <p className="text-emerald-700 leading-relaxed">{selectedOffer.description}</p>
                  {selectedOffer.validUntil && (
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-xs bg-emerald-200 text-emerald-800 px-2 py-1 rounded">
                        ⏰ Valido fino al {new Date(selectedOffer.validUntil).toLocaleDateString('it-IT')}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                // Fallback per partner generico
                <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-green-800">{selectedPartner.title}</h3>
                    <Badge className="bg-green-100 text-green-800 text-lg font-bold">
                      -{selectedPartner.discountPercentage}%
                    </Badge>
                  </div>
                  <p className="text-green-700">{selectedPartner.description}</p>
                </div>
              )}

              {/* Come utilizzare lo sconto */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                  <Info className="w-5 h-5" />
                  Come utilizzare lo sconto
                </h4>
                <ol className="text-sm text-blue-800 space-y-2">
                  <li>1. <strong>Genera un codice TIQ-OTC</strong> dalla sezione dedicata</li>
                  <li>2. <strong>Mostra il codice al partner</strong> per ottenere lo sconto</li>
                  <li>3. <strong>Il partner validerà il codice</strong> tramite l'app TouristIQ</li>
                  <li>4. <strong>Riceverai immediatamente lo sconto</strong> sul tuo acquisto</li>
                </ol>
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

              {/* Informazioni Partner Dettagliate */}
              <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                <h4 className="font-semibold text-gray-900 mb-3">Informazioni Partner Complete</h4>
                
                {/* Descrizione Business */}
                <div className="text-sm text-gray-700">
                  <p><strong>Tipo di attività:</strong> Ristorante/Pizzeria</p>
                  <p><strong>Specialità:</strong> Cucina calabrese tradizionale, pizza al taglio, aperitivi vista mare</p>
                  <p><strong>Lingue parlate:</strong> Italiano, Inglese, Tedesco</p>
                  <p><strong>Esperienza:</strong> Oltre 15 anni di tradizione familiare</p>
                </div>

                {/* Orari di Apertura */}
                <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                  <h5 className="font-medium text-yellow-900 mb-2 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Orari di Apertura
                  </h5>
                  <div className="text-sm text-yellow-800 space-y-1">
                    <p><strong>Lun-Ven:</strong> 12:00-15:00, 19:00-23:00</p>
                    <p><strong>Sab-Dom:</strong> 12:00-15:00, 19:00-00:00</p>
                    <p className="text-xs text-yellow-700">Chiuso il lunedì mattina</p>
                  </div>
                </div>
              </div>

              {/* Contatti e Social Media */}
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Contatti e Social Media
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* WhatsApp - Solo se ha inserito telefono */}
                  {selectedPartner.phone && (
                    <Button 
                      variant="outline"
                      onClick={() => window.open(`https://wa.me/${selectedPartner.phone.replace(/[^0-9]/g, '')}?text=Ciao! Ho visto la vostra offerta "${selectedOffer?.title || 'su TouristIQ'}" e vorrei avere maggiori informazioni.`, '_blank')}
                      className="text-green-600 hover:bg-green-100 border-green-300"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      WhatsApp
                    </Button>
                  )}

                  {/* Telefono - Solo se ha inserito telefono */}
                  {selectedPartner.phone && (
                    <Button
                      variant="outline"
                      onClick={() => window.open(`tel:${selectedPartner.phone}`, '_self')}
                      className="text-blue-600 hover:bg-blue-100 border-blue-300"
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      Chiama
                    </Button>
                  )}

                  {/* Email - Solo se ha inserito email */}
                  {selectedPartner.email && (
                    <Button 
                      variant="outline"
                      onClick={() => window.open(`mailto:${selectedPartner.email}?subject=Informazioni offerta ${selectedOffer?.title || 'TouristIQ'}`, '_blank')}
                      className="text-red-600 hover:bg-red-100 border-red-300"
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Email
                    </Button>
                  )}

                  {/* Sito Web - Solo se ha inserito website */}
                  {selectedPartner.website && (
                    <Button 
                      variant="outline"
                      onClick={() => window.open(selectedPartner.website, '_blank')}
                      className="text-purple-600 hover:bg-purple-100 border-purple-300"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Sito Web
                    </Button>
                  )}

                  {/* Instagram - Solo se ha inserito Instagram */}
                  {selectedPartner.instagram && (
                    <Button 
                      variant="outline"
                      onClick={() => window.open(`https://www.instagram.com/${selectedPartner.instagram}`, '_blank')}
                      className="text-pink-600 hover:bg-pink-100 border-pink-300"
                    >
                      <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                      </svg>
                      Instagram
                    </Button>
                  )}

                  {/* Facebook - Solo se ha inserito Facebook */}
                  {selectedPartner.facebook && (
                    <Button 
                      variant="outline"
                      onClick={() => window.open(`https://www.facebook.com/${selectedPartner.facebook}`, '_blank')}
                      className="text-blue-700 hover:bg-blue-100 border-blue-300"
                    >
                      <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                      Facebook
                    </Button>
                  )}

                  {/* TikTok - Solo se ha inserito TikTok */}
                  {selectedPartner.tiktok && (
                    <Button 
                      variant="outline"
                      onClick={() => window.open(`https://www.tiktok.com/@${selectedPartner.tiktok}`, '_blank')}
                      className="text-gray-800 hover:bg-gray-100 border-gray-300"
                    >
                      <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                      </svg>
                      TikTok
                    </Button>
                  )}

                  {/* YouTube - Solo se ha inserito YouTube */}
                  {selectedPartner.youtube && (
                    <Button 
                      variant="outline"
                      onClick={() => window.open(`https://www.youtube.com/@${selectedPartner.youtube}`, '_blank')}
                      className="text-red-600 hover:bg-red-100 border-red-300"
                    >
                      <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                      </svg>
                      YouTube
                    </Button>
                  )}
                </div>
              </div>

              {/* Specialità e Certificazioni */}
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <h4 className="font-semibold text-orange-900 mb-3 flex items-center gap-2">
                  <Tags className="w-4 h-4" />
                  Specialità e Certificazioni
                </h4>
                <div className="space-y-3">
                  {/* Specialità uniche */}
                  <div>
                    <h5 className="font-medium text-orange-800 mb-1">Specialità Uniche</h5>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                        🍕 Pizza al tartufo calabrese
                      </Badge>
                      <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                        🍷 Vini doc locali
                      </Badge>
                      <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                        🐟 Pesce fresco del giorno
                      </Badge>
                      <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                        🌶️ Nduja tradizionale
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Certificazioni */}
                  <div>
                    <h5 className="font-medium text-orange-800 mb-1">Certificazioni</h5>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        ✅ Certificazione Qualità
                      </Badge>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        🏆 Premio Miglior Ristorante 2024
                      </Badge>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        🌿 Ingredienti Biologici
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Accessibilità e Servizi Completi */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  Accessibilità e Servizi
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {/* Accessibilità */}
                  <div>
                    <h5 className="font-medium text-blue-800 mb-2">Accessibilità</h5>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-600" />
                        <span>Ingresso accessibile</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-600" />
                        <span>Bagno accessibile</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-600" />
                        <span>Parcheggio riservato</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-600" />
                        <span>Assistenza disponibile</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Famiglia */}
                  <div>
                    <h5 className="font-medium text-blue-800 mb-2">Famiglia</h5>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-600" />
                        <span>Seggioloni disponibili</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-600" />
                        <span>Menu bambini</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-600" />
                        <span>Fasciatoio</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-600" />
                        <span>Area giochi</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Allergie */}
                  <div>
                    <h5 className="font-medium text-blue-800 mb-2">Allergie e Intolleranze</h5>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-600" />
                        <span>Opzioni gluten free</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-600" />
                        <span>Opzioni vegane</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-600" />
                        <span>Opzioni vegetariane</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-600" />
                        <span>Menu allergeni</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Servizi */}
                  <div>
                    <h5 className="font-medium text-blue-800 mb-2">Servizi Extra</h5>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-600" />
                        <span>WiFi gratuito</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-600" />
                        <span>Carte di credito</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-600" />
                        <span>Delivery/Asporto</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-600" />
                        <span>Prenotazioni</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

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

      {/* Dialog IQCode dal Menu Laterale */}
      <Dialog open={showIQCodeModal} onOpenChange={setShowIQCodeModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-orange-600" />
              Il Tuo IQCode
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-calabria-sunset text-white card-premium animate-warm-glow rounded-xl p-6">
              <div className="text-center">
                <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 mb-4">
                  <span className="text-2xl font-bold tracking-wider text-gray-800">{user?.iqCode}</span>
                </div>
                <p className="text-sm text-white/90 mb-4">{t('tourist.codeActions.exclusiveDescription')}</p>
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText(user?.iqCode || '');
                      toast({
                        title: t('tourist.codeActions.copySuccess'),
                        description: t('tourist.codeActions.copyDescription'),
                      });
                    }}
                    className="flex-1 bg-white/20 hover:bg-white/30 text-white border-white/30"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    {t('tourist.codeActions.copyCode')}
                  </Button>
                  <Button
                    onClick={() => {
                      const message = t('tourist.codeActions.shareMessage', { code: user?.iqCode });
                      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
                      window.open(whatsappUrl, '_blank');
                    }}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    {t('tourist.codeActions.shareCode')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Custode del Codice dal Menu Laterale - CON SPIEGAZIONE EDUCATIVA COMPLETA */}
      <Dialog open={showCustodeModal} onOpenChange={setShowCustodeModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              {t('custode.title')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            
            {/* SPIEGAZIONE EDUCATIVA COMPLETA */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-3">🛡️ Cos'è il Custode del Codice?</h4>
              <p className="text-sm text-blue-800 mb-3">
                <strong>Il Custode del Codice è la nostra innovazione per la tua sicurezza.</strong> 
                Un sistema di recupero completamente anonimo che protegge il tuo accesso senza compromettere la privacy.
              </p>
              
              <h5 className="font-semibold text-blue-900 mb-2">🔧 Come funziona:</h5>
              <ul className="text-sm text-blue-800 space-y-1.5">
                <li>• <strong>Scegli una parola segreta</strong> che ricorderai facilmente</li>
                <li>• <strong>Inserisci una data di nascita</strong> (anche inventata, basta che la ricordi)</li>
                <li>• <strong>I dati vengono criptati</strong> e salvati in modo completamente anonimo</li>
                <li>• <strong>Potrai recuperare il tuo IQCode</strong> dalla pagina di login quando serve</li>
                <li>• <strong>Nessun dato personale richiesto:</strong> no email, no telefono, no documenti</li>
              </ul>
              
              <div className="mt-3 p-2 bg-blue-100 rounded border border-blue-300">
                <p className="text-xs text-blue-900">
                  <strong>⚠️ Importante:</strong> I dati vengono criptati con hash irreversibile. 
                  Non possiamo recuperare queste informazioni per te - custodiscile bene!
                </p>
              </div>
            </div>
            
            {custodeStatus?.hasRecoveryData ? (
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 text-green-700 mb-2">
                  <Check className="w-5 h-5" />
                  <span className="font-medium">{t('custode.alreadyActive')}</span>
                </div>
                <p className="text-sm text-green-600 mb-3">
                  Il sistema di recupero è attivo e pronto all'uso. Puoi modificare i tuoi dati di recupero quando vuoi.
                </p>
                <Button 
                  onClick={() => {
                    setShowCustodeModal(false);
                    setShowUpdateCustodeForm(true);
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Gestisci Custode del Codice
                </Button>
              </div>
            ) : (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-700 mb-3">
                  Attiva il sistema di recupero per proteggere il tuo accesso in modo completamente anonimo.
                </p>
                <Button 
                  onClick={() => {
                    setShowCustodeModal(false);
                    setShowCustodeForm(true);
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  {t('custode.activateButton')}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog I Miei Risparmi dal Menu Laterale */}
      <Dialog open={showSavingsModal} onOpenChange={setShowSavingsModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-500" />
              {t('savings.title')}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <TouristSavings />
          </div>
        </DialogContent>
      </Dialog>

      {/* Popup di Benvenuto Mobile-Friendly */}
      <Dialog open={showWelcomePopup} onOpenChange={() => setShowWelcomePopup(false)}>
        <DialogContent className="w-[95vw] max-w-md max-h-[85vh] overflow-y-auto animate-sunrise">
          <div className="relative overflow-hidden">
            {/* Background decorativo calabrese */}
            <div className="absolute inset-0 bg-calabria-sunset opacity-5"></div>
            <div className="relative">
              <DialogHeader className="text-center pb-3">
                <div className="mx-auto mb-3 w-16 h-16 bg-calabria-warm rounded-full flex items-center justify-center animate-gentle-pulse">
                  <span className="text-2xl">🌅</span>
                </div>
                <DialogTitle className="text-xl font-bold text-gray-900">
                  Benvenuto in TouristIQ!
                </DialogTitle>
                <p className="text-gray-600 mt-1 text-sm animate-fade-in-delayed">
                  {welcomeMessage || "La tua porta d'accesso alle esperienze autentiche della Calabria"}
                </p>
              </DialogHeader>
              
              <div className="space-y-4 py-3">
                {/* Benefici principali - versione compatta */}
                <div className="grid gap-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-7 h-7 bg-calabria-nature rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs">🎯</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 text-sm">Sconti Esclusivi</h4>
                      <p className="text-xs text-gray-600">Partner selezionati offrono vantaggi riservati solo a te</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-7 h-7 bg-calabria-sea rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs">🤖</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 text-sm">TIQai, la tua Guida AI</h4>
                      <p className="text-xs text-gray-600">Consigli personalizzati per scoprire luoghi autentici</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-7 h-7 bg-calabria-sunset rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs">🔐</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 text-sm">Privacy Totale</h4>
                      <p className="text-xs text-gray-600">Il tuo codice IQ protegge la tua identità</p>
                    </div>
                  </div>
                </div>

                {/* Call to action compatto */}
                <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                  <div className="flex items-center justify-center mb-1">
                    <span className="text-sm mr-1">✨</span>
                    <span className="font-semibold text-gray-900 text-sm">Inizia la tua esplorazione</span>
                  </div>
                  <p className="text-xs text-gray-600 text-center">
                    Usa il tuo codice IQ per sconti immediati o chiedi a TIQai consigli per la zona
                  </p>
                </div>
              </div>

              {/* Bottoni mobile-friendly */}
              <div className="flex flex-col gap-2 pt-3">
                <Button 
                  onClick={() => handleCloseWelcome(true)}
                  className="w-full bg-calabria-sunset text-white hover:bg-orange-600"
                >
                  Perfetto, non mostrare più
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handleCloseWelcome(false)}
                  className="w-full"
                >
                  Chiudi per ora
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
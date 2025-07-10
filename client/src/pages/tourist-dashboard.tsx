import { Layout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TIQaiChat } from "@/components/tiqai-chat";
import { OneTimeCodeGenerator } from "@/components/OneTimeCodeGenerator";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tags, Utensils, Check, MessageCircle, QrCode, MapPin, Heart, Phone, Navigation, ExternalLink, Mail, Shield, Info, Copy } from "lucide-react";
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
      {/* Selettore lingua - solo nel pannello turista */}
      <div className="absolute top-4 right-4 z-10">
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

      <div className="mb-8">
        <Card className="bg-calabria-sunset text-white card-premium animate-warm-glow hover-warm cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-center mb-3">
              <div className="animate-gentle-pulse mr-3 text-2xl">✨</div>
              <h2 className="text-xl font-semibold text-white">{t('tourist.magicPassepartout')}</h2>
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-5 text-center border-2 border-white/70 hover:bg-white/65 transition-all duration-300 shadow-lg">
              <span className="text-3xl font-bold tracking-wider text-gray-800 drop-shadow-sm">{user.iqCode}</span>
            </div>
            <div className="mt-4 flex items-center bg-white/50 rounded-lg p-3 backdrop-blur-sm">
              <span className="mr-2">🎯</span>
              <p className="text-gray-800 font-semibold">{t('tourist.codeActions.exclusiveDescription')}</p>
            </div>
            
            {/* Strumento Copia Codice Definitivo */}
            <div className="mt-4 flex items-center justify-center gap-3">
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(user.iqCode);
                  toast({
                    title: t('tourist.codeActions.copySuccess'),
                    description: t('tourist.codeActions.copyDescription'),
                  });
                }}
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold px-6 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
              >
                <Copy className="w-4 h-4" />
                {t('tourist.codeActions.copyCode')}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  const message = t('tourist.codeActions.shareMessage', { code: user.iqCode });
                  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
                  window.open(whatsappUrl, '_blank');
                }}
                className="border-2 border-green-500 text-green-600 hover:bg-green-50 px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                {t('tourist.codeActions.shareCode')}
              </Button>
            </div>
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
                  <h3 className="text-lg font-semibold text-gray-900">{t('custode.title')}</h3>
                  <p className="text-sm text-gray-600">{t('custode.securityDescription')}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative group">
                  <Info className="w-5 h-5 text-blue-600 cursor-help" />
                  <div className="absolute right-0 bottom-full mb-2 w-72 p-3 bg-gray-900 text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                    {custodeStatus?.hasRecoveryData 
                      ? t('custode.modifyTooltip')
                      : t('custode.activateTooltip')}
                  </div>
                </div>
                {custodeStatus?.hasRecoveryData ? (
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-green-600">
                      <Check className="w-5 h-5" />
                      <span className="font-medium">{t('custode.alreadyActive')}</span>
                    </div>
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={handleOpenUpdateCustodeForm}
                      className="text-blue-600 border-blue-300 hover:bg-blue-50"
                    >
                      {t('custode.manageButton')}
                    </Button>
                  </div>
                ) : (
                  <Button 
                    onClick={handleOpenCustodeForm}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {t('custode.activateButton')}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
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

        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('tourist.recentActivity')}</h3>
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <Check className="text-green-600" size={12} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{t('tourist.discountUsed')}</p>
                  <p className="text-xs text-gray-500">Pizzeria Da Mario - 15% {t('tourist.discount')}</p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <Heart className="text-blue-600" size={12} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{t('tourist.addedToFavorites')}</p>
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

        {/* Sistema Codici Monouso (Privacy-First) */}
        <OneTimeCodeGenerator />
      </div>


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
              {/* Offerta Specifica o Generale */}
              {selectedOffer ? (
                // Mostra offerta specifica cliccata
                <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-green-800">{selectedOffer.title}</h3>
                    <Badge className="bg-green-100 text-green-800 text-lg font-bold">
                      -{selectedOffer.discountPercentage}%
                    </Badge>
                  </div>
                  <p className="text-green-700">{selectedOffer.description}</p>
                  {selectedOffer.validUntil && (
                    <p className="text-xs text-green-600 mt-2">
                      Valido fino al {new Date(selectedOffer.validUntil).toLocaleDateString('it-IT')}
                    </p>
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
                      onClick={() => window.open(`https://wa.me/${selectedPartner.phone.replace(/[^0-9]/g, '')}?text=Ciao! Ho visto la vostra offerta "${selectedOffer?.title || selectedPartner.title}" su TouristIQ. Vorrei avere maggiori informazioni.`, '_blank')}
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
                      onClick={() => window.open(`mailto:${selectedPartner.email}?subject=Informazioni offerta ${selectedOffer?.title || selectedPartner.title}`, '_blank')}
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

      {/* Popup di Benvenuto Caldo e Istruttivo con Effetto Sunrise */}
      <Dialog open={showWelcomePopup} onOpenChange={() => setShowWelcomePopup(false)}>
        <DialogContent className="sm:max-w-lg animate-sunrise">
          <div className="relative overflow-hidden">
            {/* Background decorativo calabrese */}
            <div className="absolute inset-0 bg-calabria-sunset opacity-5"></div>
            <div className="relative">
              <DialogHeader className="text-center pb-4">
                <div className="mx-auto mb-4 w-20 h-20 bg-calabria-warm rounded-full flex items-center justify-center animate-gentle-pulse">
                  <span className="text-3xl">🌅</span>
                </div>
                <DialogTitle className="text-2xl font-bold text-gray-900">
                  Benvenuto in TouristIQ!
                </DialogTitle>
                <p className="text-gray-600 mt-2 animate-fade-in-delayed">
                  {welcomeMessage || "La tua porta d'accesso alle esperienze autentiche della Calabria"}
                </p>
              </DialogHeader>
              
              <div className="space-y-6 py-4">
                {/* Benefici principali */}
                <div className="grid gap-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-calabria-nature rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-sm">🎯</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Sconti Esclusivi</h4>
                      <p className="text-sm text-gray-600">Partner selezionati offrono vantaggi riservati solo a te</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-calabria-sea rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-sm">🤖</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">TIQai, la tua Guida AI</h4>
                      <p className="text-sm text-gray-600">Consigli personalizzati per scoprire luoghi autentici</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-calabria-sunset rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-sm">🔐</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Privacy Totale</h4>
                      <p className="text-sm text-gray-600">Il tuo codice IQ protegge la tua identità</p>
                    </div>
                  </div>
                </div>

                {/* Call to action */}
                <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
                  <div className="flex items-center justify-center mb-2">
                    <span className="text-lg mr-2">✨</span>
                    <span className="font-semibold text-gray-900">Inizia la tua esplorazione</span>
                  </div>
                  <p className="text-sm text-gray-600 text-center">
                    Usa il tuo codice IQ per sconti immediati o chiedi a TIQai consigli per la zona
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => handleCloseWelcome(false)}
                  className="flex-1"
                >
                  Chiudi per ora
                </Button>
                <Button 
                  onClick={() => handleCloseWelcome(true)}
                  className="flex-1 bg-calabria-sunset text-white hover:bg-orange-600"
                >
                  Perfetto, non mostrare più
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
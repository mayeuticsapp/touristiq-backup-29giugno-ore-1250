import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Layout } from "@/components/layout";
import { 
  Users, BarChart3, Plus, TrendingUp, Package, Heart, Star, 
  Download, Camera, Tags, Trophy, Calendar, Settings,
  Trash2, Calculator, Edit, Hash
} from "lucide-react";
import { useState, useRef } from "react";
import { apiRequest } from "@/lib/queryClient";
import { AdvancedAccounting } from "@/components/advanced-accounting";
import { PartnerOnboarding } from "@/components/partner-onboarding";
import PartnerBusinessInfoManager from "@/components/PartnerBusinessInfoManager";

import { CustodeCodiceDashboard } from "@/components/custode-codice";
import { OneTimeCodeValidator } from "@/components/OneTimeCodeValidator";
import { TiqOtcDiscountValidator } from "@/components/TiqOtcDiscountValidator";
import { PartnerDiscountApplicator } from "@/components/PartnerDiscountApplicator";
import PartnerReportTouristiq from "@/components/PartnerReportTouristiq";
import { PartnerRatingDisplay } from "@/components/PartnerRatingDisplay";
import { InfoPartnerModal } from "@/components/InfoPartnerModal";

interface TouristLinkRequest {
  id: string;
  touristCode: string;
  requestDate: string;
  status: "pending" | "approved" | "rejected";
  country: string;
}

interface ActiveTourist {
  id: string;
  code: string;
  linkedDate: string;
  country: string;
  totalSpent: number;
}

interface PartnerOffer {
  id: string;
  title: string;
  description: string;
  discount: string;
  validUntil: string;
  isActive: boolean;
}

interface SpecialClient {
  id: string;
  name: string;
  notes: string;
  status: "attivo" | "inattivo";
  visits: number;
  rewardsGiven: number;
  joinDate: string;
}

export default function PartnerDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Stati per i dialogs
  const [showNewOfferDialog, setShowNewOfferDialog] = useState(false);
  const [showEditOfferDialog, setShowEditOfferDialog] = useState(false);
  const [editingOffer, setEditingOffer] = useState<any>(null);
  const [showSpecialClientDialog, setShowSpecialClientDialog] = useState(false);
  const [showAccountDeleteDialog, setShowAccountDeleteDialog] = useState(false);
  const [showMiniGestionale, setShowMiniGestionale] = useState(false);
  const [showBusinessInfoManager, setShowBusinessInfoManager] = useState(false);
  const [showReportTouristiq, setShowReportTouristiq] = useState(false);


  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  
  // Ref per focus automatico check-in → check-out
  const validUntilDateRef = useRef<HTMLInputElement>(null);
  
  // Verifica stato onboarding OBBLIGATORIO
  const { data: onboardingStatus, isLoading: isLoadingOnboarding } = useQuery({
    queryKey: ['/api/partner/onboarding-status'],
    enabled: true
  });

  // Recupera informazioni entità (nome + codice)
  const { data: entityInfo } = useQuery({
    queryKey: ['/api/entity-info'],
    queryFn: () => fetch('/api/entity-info', { credentials: 'include' }).then(res => res.json())
  });

  // Stati per i form
  const [newOffer, setNewOffer] = useState({
    title: "",
    description: "",
    discount: "",
    validUntil: ""
  });
  const [newClient, setNewClient] = useState({
    name: "",
    notes: ""
  });

  // Carica offerte reali del partner
  const { data: partnerOffers = [], refetch: refetchOffers } = useQuery({
    queryKey: ['/api/partner/my-offers'],
    enabled: !!onboardingStatus?.completed
  });

  // Dati fittizi per il prototipo (da sostituire gradualmente)
  const pendingRequests: TouristLinkRequest[] = [];

  const activeTourists: ActiveTourist[] = [];

  const specialClients: SpecialClient[] = [];

  // Mutations

  const createOfferMutation = useMutation({
    mutationFn: async (offer: typeof newOffer) => {
      const response = await fetch('/api/partner/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(offer)
      });
      if (!response.ok) throw new Error('Errore creazione offerta');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Offerta creata con successo!" });
      setNewOffer({ title: "", description: "", discount: "", validUntil: "" });
      setShowNewOfferDialog(false);
      refetchOffers(); // Ricarica le offerte
    },
    onError: () => {
      toast({ 
        title: "Errore", 
        description: "Impossibile creare l'offerta",
        variant: "destructive"
      });
    }
  });

  const updateOfferMutation = useMutation({
    mutationFn: async (offer: any) => {
      const response = await fetch(`/api/partner/offers/${offer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(offer)
      });
      if (!response.ok) throw new Error('Errore modifica offerta');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Offerta modificata con successo!" });
      setEditingOffer(null);
      setShowEditOfferDialog(false);
      refetchOffers(); // Ricarica le offerte
    },
    onError: () => {
      toast({ 
        title: "Errore", 
        description: "Impossibile modificare l'offerta",
        variant: "destructive"
      });
    }
  });

  const deleteOfferMutation = useMutation({
    mutationFn: async (offerId: string) => {
      const response = await fetch(`/api/partner/offers/${offerId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Errore eliminazione offerta');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Offerta eliminata con successo!" });
      refetchOffers(); // Ricarica le offerte
    },
    onError: () => {
      toast({ 
        title: "Errore", 
        description: "Impossibile eliminare l'offerta",
        variant: "destructive"
      });
    }
  });

  const addSpecialClientMutation = useMutation({
    mutationFn: async (client: typeof newClient) => {
      const response = await fetch('/api/partner/special-clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(client)
      });
      if (!response.ok) throw new Error('Errore aggiunta cliente');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Cliente aggiunto con successo!" });
      setNewClient({ name: "", notes: "" });
      setShowSpecialClientDialog(false);
    },
    onError: () => {
      toast({ 
        title: "Errore", 
        description: "Impossibile aggiungere il cliente",
        variant: "destructive"
      });
    }
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Errore eliminazione account');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Account eliminato. Sarai disconnesso tra 5 secondi." });
      setTimeout(() => {
        window.location.href = '/login';
      }, 5000);
    },
    onError: () => {
      toast({ 
        title: "Errore", 
        description: "Impossibile eliminare l'account",
        variant: "destructive"
      });
    }
  });

  // Handlers

  const handleCreateOffer = () => {
    if (newOffer.title && newOffer.description && newOffer.discount) {
      createOfferMutation.mutate(newOffer);
    }
  };

  const handleAddSpecialClient = () => {
    if (newClient.name.trim()) {
      addSpecialClientMutation.mutate(newClient);
    }
  };

  const handleDeleteAccount = () => {
    if (deleteConfirmText === "ELIMINA DEFINITIVAMENTE") {
      deleteAccountMutation.mutate();
    } else {
      toast({
        title: "Testo di conferma errato",
        description: "Scrivi esattamente: ELIMINA DEFINITIVAMENTE",
        variant: "destructive"
      });
    }
  };

  const handleEditOffer = (offer: any) => {
    setEditingOffer(offer);
    setShowEditOfferDialog(true);
  };

  const handleUpdateOffer = () => {
    if (editingOffer && editingOffer.title && editingOffer.description && editingOffer.discount) {
      updateOfferMutation.mutate(editingOffer);
    }
  };

  const handleDeleteOffer = (offerId: string) => {
    if (confirm("Sei sicuro di voler eliminare questa offerta?")) {
      deleteOfferMutation.mutate(offerId);
    }
  };

  const downloadPDF = () => {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Partner TouristIQ - Locandina Promozionale</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 20px; }
          .header { color: #4CAF50; font-size: 24px; font-weight: bold; }
          .qr-placeholder { width: 150px; height: 150px; border: 2px solid #ccc; margin: 20px auto; }
        </style>
      </head>
      <body>
        <div class="header">🎯 TouristIQ Partner</div>
        <h2>Scopri Sconti Esclusivi!</h2>
        <p>Presenta il tuo IQCode e ottieni vantaggi speciali</p>
        <div class="qr-placeholder">IQCODE PARTNER</div>
        <p>Presenta il tuo IQCode per accedere agli sconti</p>
      </body>
      </html>
    `;
    
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'touristiq-partner-locandina.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadPartnerCode = () => {
    const svgContent = `
      <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="200" fill="white"/>
        <rect x="10" y="10" width="20" height="20" fill="black"/>
        <rect x="30" y="10" width="20" height="20" fill="black"/>
        <rect x="70" y="10" width="20" height="20" fill="black"/>
        <rect x="10" y="30" width="20" height="20" fill="black"/>
        <rect x="50" y="30" width="20" height="20" fill="black"/>
        <rect x="90" y="30" width="20" height="20" fill="black"/>
        <text x="100" y="190" text-anchor="middle" font-size="12">TouristIQ Partner</text>
      </svg>
    `;
    
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'touristiq-partner-code.svg';
    a.click();
    URL.revokeObjectURL(url);
  };

  // CONTROLLO ONBOARDING OBBLIGATORIO
  if (isLoadingOnboarding) {
    return <div className="flex items-center justify-center min-h-screen">Caricamento...</div>;
  }

  // Se onboarding non completato, mostra flusso obbligatorio
  if (!onboardingStatus?.completed) {
    return <PartnerOnboarding 
      partnerCode={onboardingStatus?.partnerCode || "partner"} 
      onComplete={() => window.location.reload()} 
    />;
  }

  if (showMiniGestionale) {
    return <AdvancedAccounting 
      structureCode="partner" 
      hasAccess={true} 
      onBackToDashboard={() => setShowMiniGestionale(false)}
    />;
  }

  if (showBusinessInfoManager) {
    return (
      <Layout
        title="Gestione Informazioni Business"
        role="partner"
        navigation={[
          {
            label: "Torna al Dashboard",
            icon: <Settings className="h-4 w-4" />,
            href: "#",
            onClick: () => setShowBusinessInfoManager(false)
          }
        ]}
        sidebarColor="bg-orange-600"
      >
        <div className="min-h-screen bg-gray-50 p-6">
          <PartnerBusinessInfoManager />
        </div>
      </Layout>
    );
  }

  if (showReportTouristiq) {
    return (
      <Layout
        title="Report TouristIQ"
        role="partner"
        navigation={[
          {
            label: "Torna al Dashboard",
            icon: <BarChart3 className="h-4 w-4" />,
            href: "#",
            onClick: () => setShowReportTouristiq(false)
          }
        ]}
        sidebarColor="bg-orange-600"
      >
        <div className="min-h-screen bg-gray-50 p-6">
          <PartnerReportTouristiq />
        </div>
      </Layout>
    );
  }



  return (
    <Layout
      title="Dashboard Partner"
      role="partner"
      navigation={[
        {
          label: "Gestisci Info Business",
          icon: <Settings className="h-4 w-4" />,
          href: "#",
          onClick: () => setShowBusinessInfoManager(true)
        },
        {
          label: "Mini-gestionale",
          icon: <Calculator className="h-4 w-4" />,
          href: "#",
          onClick: () => setShowMiniGestionale(true)
        },
        {
          label: "Report TouristIQ",
          icon: <BarChart3 className="h-4 w-4" />,
          href: "#",
          onClick: () => setShowReportTouristiq(true)
        },
        {
          label: "Elimina Account",
          icon: <Trash2 className="h-4 w-4" />,
          href: "#",
          onClick: () => setShowAccountDeleteDialog(true)
        },

      ]}
      sidebarColor="bg-orange-600"
    >
      <div className="min-h-screen bg-gray-50">
        {/* Saluto personalizzato */}
        <div className="bg-white border-b border-gray-100 px-6 py-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-800">
              👋 Benvenuto{entityInfo?.name ? `, ${entityInfo.name}` : '!'}
            </h2>
            <InfoPartnerModal />
          </div>
        </div>

        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard Partner</h1>
              <p className="text-gray-600">Gestisci i tuoi turisti e le tue offerte speciali</p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowBusinessInfoManager(true)}
                variant="outline"
                className="border-emerald-200 hover:bg-emerald-50"
              >
                <Settings className="w-4 h-4 mr-2" />
                Gestisci Info Business
              </Button>
              <Button
                onClick={() => setShowMiniGestionale(true)}
                variant="outline"
                className="border-blue-200 hover:bg-blue-50"
              >
                <Calculator className="w-4 h-4 mr-2" />
                Mini-gestionale
              </Button>
              <Button
                onClick={() => setShowAccountDeleteDialog(true)}
                variant="destructive"
                size="sm"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Elimina Account
              </Button>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-700">2</div>
                    <div className="text-sm text-green-600">Turisti Attivi</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-700">€380</div>
                    <div className="text-sm text-blue-600">Fatturato Mese</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-orange-50 border-orange-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Tags className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-700">1</div>
                    <div className="text-sm text-orange-600">Offerte Attive</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* NASCOSTO PER RIATTIVAZIONE FUTURA - Card Clienti Speciali */}
            {/* 
            <Card className="bg-purple-50 border-purple-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Star className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-700">2</div>
                    <div className="text-sm text-purple-600">Clienti Speciali</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            */}
          </div>

          {/* Sistema Rating Partner */}
          <div className="mb-6">
            <PartnerRatingDisplay partnerCode={entityInfo?.code || ''} />
          </div>

          {/* Sistema Custode del Codice per Partner */}
          <CustodeCodiceDashboard 
            roleType="partner" 
            iqCode={entityInfo?.code}
            className="mb-6" 
          />

          {/* Sistema Applicazione Sconto TIQ-OTC */}
          <div className="mb-6">
            <PartnerDiscountApplicator />
          </div>

          <div className="grid grid-cols-1 gap-6">
            {/* Tourist Link Request - NASCOSTA TEMPORANEAMENTE */}
            {/* <Card className="bg-green-50 border-green-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <Users className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Collega Nuovo Turista</h3>
                    <p className="text-gray-600 text-sm">Inserisci il codice IQ del turista per iniziare la collaborazione</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Inserisci IQCode (es: TIQ-IT-ROMA)"
                      value={touristCode}
                      onChange={(e) => setTouristCode(e.target.value)}
                      className="flex-1"
                    />
                    <Button 
                      onClick={handleLinkTourist}
                      disabled={linkTouristMutation.isPending}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {linkTouristMutation.isPending ? "Invio..." : "Collega"}
                    </Button>
                  </div>

                  {pendingRequests.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium mb-2">Richieste in Attesa</h4>
                      {pendingRequests.map((request) => (
                        <div key={request.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-200">
                          <div>
                            <div className="font-medium">{request.touristCode}</div>
                            <div className="text-sm text-gray-600">{request.requestDate} • {request.country}</div>
                          </div>
                          <Badge className="bg-yellow-100 text-yellow-700">
                            In Attesa
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card> */}

            {/* Active Tourists */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <Users className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Turisti Attivi</h3>
                    <p className="text-gray-600 text-sm">Turisti collegati al tuo circuito</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {activeTourists.map((tourist) => (
                    <div key={tourist.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div>
                        <div className="font-medium">{tourist.code}</div>
                        <div className="text-sm text-gray-600">Collegato {tourist.linkedDate} • {tourist.country}</div>
                      </div>
                      <Badge className="bg-green-100 text-green-700">
                        Attivo
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Offers and Promotions */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Tags className="w-4 h-4 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Crea Offerte e Promozioni</h3>
                      <p className="text-gray-600 text-sm">Il cuore pulsante del pannello per attirarre turisti</p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => setShowNewOfferDialog(true)}
                    className="bg-orange-500 hover:bg-orange-600"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Nuova Offerta
                  </Button>
                </div>

                <div className="space-y-3">
                  {partnerOffers.map((offer) => (
                    <div key={offer.id} className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium">{offer.title}</div>
                          <div className="text-sm text-gray-600 mt-1">{offer.description}</div>
                          <div className="flex items-center gap-4 mt-2">
                            <Badge className="bg-orange-100 text-orange-700">
                              Sconto {offer.discount}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              Valido fino al {offer.validUntil}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-2">
                          <Badge className="bg-green-100 text-green-700">
                            Attiva
                          </Badge>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEditOffer(offer)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            Modifica
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDeleteOffer(offer.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Elimina
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* NASCOSTO PER RIATTIVAZIONE FUTURA - Materiali Promozionali */}
            {/* 
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Download className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Materiali Promozionali</h3>
                    <p className="text-gray-600 text-sm">Scarica e stampa i materiali per il tuo locale</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <Button 
                    onClick={downloadPDF}
                    variant="outline" 
                    className="justify-start h-auto p-3 border-blue-200 hover:bg-blue-50"
                  >
                    <Download className="w-4 h-4 mr-3" />
                    <div className="text-left">
                      <div className="font-medium">Scarica PDF</div>
                      <div className="text-xs text-gray-600">Locandina promozionale per il tuo locale</div>
                    </div>
                  </Button>

                  <Button 
                    onClick={downloadPartnerCode}
                    variant="outline" 
                    className="justify-start h-auto p-3 border-blue-200 hover:bg-blue-50"
                  >
                    <Hash className="w-4 h-4 mr-3" />
                    <div className="text-left">
                      <div className="font-medium">Codice Partner</div>
                      <div className="text-xs text-gray-600">Il tuo IQCode partner per identificazione</div>
                    </div>
                  </Button>

                  <a 
                    href="https://www.vistaprint.it/adesivi"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <Button 
                      variant="outline" 
                      className="w-full justify-start h-auto p-3 border-blue-200 hover:bg-blue-50"
                    >
                      <Camera className="w-4 h-4 mr-3" />
                      <div className="text-left">
                        <div className="font-medium">Adesivi Personalizzati</div>
                        <div className="text-xs text-gray-600">Ordina adesivi su Vistaprint</div>
                      </div>
                    </Button>
                  </a>
                </div>
              </CardContent>
            </Card>
            */}

            {/* Report TouristIQ */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <BarChart3 className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Report TouristIQ</h3>
                      <p className="text-gray-600 text-sm">Monitora l'impatto concreto dei clienti TouristIQ</p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => setShowReportTouristiq(true)}
                    className="bg-emerald-500 hover:bg-emerald-600"
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Visualizza Report
                  </Button>
                </div>

                <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg p-4 border border-emerald-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                      <TrendingUp className="w-3 h-3 text-white" />
                    </div>
                    <span className="font-medium text-emerald-800">Valore Aggiunto TouristIQ</span>
                  </div>
                  <p className="text-sm text-emerald-700 mb-3">
                    Scopri quanti clienti in più hai servito e quanto ricavo aggiuntivo 
                    hai generato grazie alla partecipazione al network TouristIQ.
                  </p>
                  <div className="flex items-center gap-4 text-xs text-emerald-600">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      Clienti TouristIQ
                    </span>
                    <span className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      Ricavi aggiuntivi
                    </span>
                    <span className="flex items-center gap-1">
                      <Trophy className="w-3 h-3" />
                      ROI dettagliato
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* NASCOSTO PER RIATTIVAZIONE FUTURA - Clienti Speciali */}
          {/* 
          <div className="mt-8">
            <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-lg p-6 text-white mb-6">
              <div className="flex items-center gap-3 mb-4">
                <Heart className="w-8 h-8" />
                <div>
                  <h2 className="text-xl font-bold">Clienti Speciali - Sistema Fidelizzazione</h2>
                  <p className="text-purple-100">Premia i tuoi clienti più fedeli con codici IQ esclusivi</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                <a 
                  href="https://pay.sumup.com/b2c/QSJE461B"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-4 border-2 border-purple-300 rounded-lg text-center hover:border-white transition-colors cursor-pointer"
                >
                  <div className="text-2xl font-bold">25</div>
                  <div className="text-sm text-purple-100 mb-2">codici IQcode</div>
                  <div className="text-xl font-bold">€50</div>
                  <div className="text-xs text-purple-200">€2.00 per codice</div>
                  <Button className="w-full mt-3 bg-white text-purple-600 hover:bg-gray-100" size="sm">
                    <Package className="w-4 h-4 mr-2" />
                    Acquista 25 codici
                  </Button>
                </a>

                <a 
                  href="https://pay.sumup.com/b2c/QK6MLJC7"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-4 border-2 border-purple-300 rounded-lg text-center hover:border-white transition-colors cursor-pointer"
                >
                  <div className="text-2xl font-bold">50</div>
                  <div className="text-sm text-purple-100 mb-2">codici IQcode</div>
                  <div className="text-xl font-bold">€90</div>
                  <div className="text-xs text-purple-200">€1.80 per codice</div>
                  <Button className="w-full mt-3 bg-white text-purple-600 hover:bg-gray-100" size="sm">
                    <Package className="w-4 h-4 mr-2" />
                    Acquista 50 codici
                  </Button>
                </a>

                <a 
                  href="https://pay.sumup.com/b2c/Q9517L3P"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-4 border-2 border-purple-300 rounded-lg text-center hover:border-white transition-colors cursor-pointer"
                >
                  <div className="text-2xl font-bold">75</div>
                  <div className="text-sm text-purple-100 mb-2">codici IQcode</div>
                  <div className="text-xl font-bold">€130</div>
                  <div className="text-xs text-purple-200">€1.73 per codice</div>
                  <Button className="w-full mt-3 bg-white text-purple-600 hover:bg-gray-100" size="sm">
                    <Package className="w-4 h-4 mr-2" />
                    Acquista 75 codici
                  </Button>
                </a>

                <a 
                  href="https://pay.sumup.com/b2c/Q3BWI26N"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-4 border-2 border-purple-300 rounded-lg text-center hover:border-white transition-colors cursor-pointer"
                >
                  <div className="text-2xl font-bold">100</div>
                  <div className="text-sm text-purple-100 mb-2">codici IQcode</div>
                  <div className="text-xl font-bold">€160</div>
                  <div className="text-xs text-purple-200">€1.60 per codice</div>
                  <Button className="w-full mt-3 bg-white text-purple-600 hover:bg-gray-100" size="sm">
                    <Package className="w-4 h-4 mr-2" />
                    Acquista 100 codici
                  </Button>
                </a>
              </div>
            </div>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <Star className="w-4 h-4 text-yellow-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">I tuoi Clienti Fidelizzati</h3>
                      <p className="text-gray-600 text-sm">Monitora l'attività dei tuoi clienti fedeli e i premi assegnati</p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => setShowSpecialClientDialog(true)}
                    variant="outline" 
                    size="sm"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Aggiungi Cliente
                  </Button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left border-b">
                        <th className="pb-3 text-sm font-medium text-gray-600">Cliente</th>
                        <th className="pb-3 text-sm font-medium text-gray-600">Stato</th>
                        <th className="pb-3 text-sm font-medium text-gray-600">Visite</th>
                        <th className="pb-3 text-sm font-medium text-gray-600">Premi Assegnati</th>
                        <th className="pb-3 text-sm font-medium text-gray-600">Iscrizione</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {specialClients.map((client) => (
                        <tr key={client.id}>
                          <td className="py-3">
                            <div>
                              <div className="font-medium">{client.name}</div>
                              <div className="text-sm text-gray-600">{client.notes}</div>
                            </div>
                          </td>
                          <td className="py-3">
                            <Badge className={client.status === "attivo" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}>
                              {client.status}
                            </Badge>
                          </td>
                          <td className="py-3 font-medium">{client.visits}</td>
                          <td className="py-3">
                            <div className="flex items-center gap-1">
                              <Trophy className="w-4 h-4 text-yellow-500" />
                              <span className="font-medium">{client.rewardsGiven}</span>
                            </div>
                          </td>
                          <td className="py-3 text-sm text-gray-600">{client.joinDate}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
          */}
        </div>

        {/* Dialogs */}
        <Dialog open={showNewOfferDialog} onOpenChange={setShowNewOfferDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crea Nuova Offerta</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Titolo Offerta</Label>
                <Input
                  id="title"
                  value={newOffer.title}
                  onChange={(e) => setNewOffer({...newOffer, title: e.target.value})}
                  placeholder="es: Sconto Aperitivo"
                />
              </div>
              <div>
                <Label htmlFor="description">Descrizione</Label>
                <Textarea
                  id="description"
                  value={newOffer.description}
                  onChange={(e) => setNewOffer({...newOffer, description: e.target.value})}
                  placeholder="Descrivi l'offerta in dettaglio..."
                />
              </div>
              <div>
                <Label htmlFor="discount">Sconto</Label>
                <Input
                  id="discount"
                  value={newOffer.discount}
                  onChange={(e) => setNewOffer({...newOffer, discount: e.target.value})}
                  placeholder="es: 20%"
                />
              </div>
              <div>
                <Label htmlFor="validUntil">Valido Fino Al</Label>
                <Input
                  id="validUntil"
                  type="date"
                  value={newOffer.validUntil}
                  onChange={(e) => setNewOffer({...newOffer, validUntil: e.target.value})}
                />
              </div>
              <Button 
                onClick={handleCreateOffer}
                disabled={createOfferMutation.isPending}
                className="w-full"
              >
                {createOfferMutation.isPending ? "Creazione..." : "Crea Offerta"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog Modifica Offerta */}
        <Dialog open={showEditOfferDialog} onOpenChange={setShowEditOfferDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Modifica Offerta</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="editTitle">Titolo Offerta</Label>
                <Input
                  id="editTitle"
                  value={editingOffer?.title || ""}
                  onChange={(e) => setEditingOffer({...editingOffer, title: e.target.value})}
                  placeholder="es: Sconto Aperitivo"
                />
              </div>
              <div>
                <Label htmlFor="editDescription">Descrizione</Label>
                <Textarea
                  id="editDescription"
                  value={editingOffer?.description || ""}
                  onChange={(e) => setEditingOffer({...editingOffer, description: e.target.value})}
                  placeholder="Descrivi l'offerta in dettaglio..."
                />
              </div>
              <div>
                <Label htmlFor="editDiscount">Sconto</Label>
                <Input
                  id="editDiscount"
                  value={editingOffer?.discount || ""}
                  onChange={(e) => setEditingOffer({...editingOffer, discount: e.target.value})}
                  placeholder="es: 20%"
                />
              </div>
              <div>
                <Label htmlFor="editValidUntil">Valido Fino Al</Label>
                <Input
                  id="editValidUntil"
                  type="date"
                  value={editingOffer?.validUntil || ""}
                  onChange={(e) => setEditingOffer({...editingOffer, validUntil: e.target.value})}
                />
              </div>
              <Button 
                onClick={handleUpdateOffer}
                disabled={updateOfferMutation.isPending}
                className="w-full"
              >
                {updateOfferMutation.isPending ? "Salvataggio..." : "Salva Modifiche"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* NASCOSTO PER RIATTIVAZIONE FUTURA - Dialog Cliente Speciale */}
        {/* 
        <Dialog open={showSpecialClientDialog} onOpenChange={setShowSpecialClientDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Aggiungi Cliente Fidelizzato</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="clientName">Nome Cliente</Label>
                <Input
                  id="clientName"
                  value={newClient.name}
                  onChange={(e) => setNewClient({...newClient, name: e.target.value})}
                  placeholder="es: Marco R."
                />
              </div>
              <div>
                <Label htmlFor="clientNotes">Note (Facoltative)</Label>
                <Textarea
                  id="clientNotes"
                  value={newClient.notes}
                  onChange={(e) => setNewClient({...newClient, notes: e.target.value})}
                  placeholder="Preferenze, allergie, note particolari..."
                />
              </div>
              <Button 
                onClick={handleAddSpecialClient}
                disabled={addSpecialClientMutation.isPending}
                className="w-full"
              >
                {addSpecialClientMutation.isPending ? "Aggiunta..." : "Aggiungi Cliente"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        */}

        <Dialog open={showAccountDeleteDialog} onOpenChange={setShowAccountDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-red-600">Elimina Account</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <h4 className="font-semibold text-red-800 mb-2">⚠️ Attenzione: Azione Irreversibile</h4>
                <p className="text-sm text-red-700">
                  L'eliminazione dell'account comporterà:
                </p>
                <ul className="text-sm text-red-700 mt-2 space-y-1">
                  <li>• Cancellazione definitiva di tutti i tuoi dati</li>
                  <li>• Perdita di tutti i collegamenti con i turisti</li>
                  <li>• Rimozione di tutte le offerte create</li>
                  <li>• Impossibilità di recuperare l'account</li>
                </ul>
              </div>
              
              <div>
                <Label htmlFor="confirmText" className="text-red-600">
                  Per confermare, scrivi: <strong>ELIMINA DEFINITIVAMENTE</strong>
                </Label>
                <Input
                  id="confirmText"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="ELIMINA DEFINITIVAMENTE"
                  className="border-red-300 focus:border-red-500"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowAccountDeleteDialog(false)}
                  className="flex-1"
                >
                  Annulla
                </Button>
                <Button
                  onClick={handleDeleteAccount}
                  disabled={deleteAccountMutation.isPending || deleteConfirmText !== "ELIMINA DEFINITIVAMENTE"}
                  variant="destructive"
                  className="flex-1"
                >
                  {deleteAccountMutation.isPending ? "Eliminazione..." : "Elimina Account"}
                </Button>
              </div>

              <div className="text-xs text-gray-500 text-center">
                Hai problemi? Contatta il supporto: info@touristiq.it
              </div>
            </div>
          </DialogContent>
        </Dialog>


      </div>
    </Layout>
  );
}
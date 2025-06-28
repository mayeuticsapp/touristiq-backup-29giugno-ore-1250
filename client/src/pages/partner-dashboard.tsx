import { useState } from "react";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  BarChart3, 
  Tags, 
  QrCode, 
  TrendingUp, 
  Settings, 
  Ticket, 
  Euro, 
  Users, 
  Star, 
  Camera, 
  Package,
  Plus,
  Download,
  Heart,
  CheckCircle,
  Clock,
  Gift,
  Trophy
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCurrentUser } from "@/lib/auth";

export default function PartnerDashboard() {
  const [currentView, setCurrentView] = useState<'main' | 'special-clients'>('main');
  const [showNewOfferDialog, setShowNewOfferDialog] = useState(false);
  const [newOffer, setNewOffer] = useState({
    title: '',
    description: '',
    discount: '',
    validUntil: ''
  });
  const [touristCode, setTouristCode] = useState('');
  const [showSpecialClientDialog, setShowSpecialClientDialog] = useState(false);
  const [newSpecialClient, setNewSpecialClient] = useState({
    name: '',
    email: '',
    phone: '',
    notes: ''
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: getCurrentUser,
  });

  // Query per pacchetti assegnati
  const { data: packagesData, refetch: refetchPackages } = useQuery({
    queryKey: ["/api/my-packages"],
    enabled: !!user,
  });

  // Mock data per statistiche e promozioni (sostituire con dati reali)
  const stats = {
    touristToday: 3,
    thisWeek: 8,
    activePromotions: 2,
    returnRate: 65
  };

  const activePromotions = [
    {
      id: 1,
      title: "Sconto Benvenuto 15%",
      description: "Sconto del 15% per tutti i turisti TouristIQ",
      discount: 15,
      validUntil: "28/07/2025",
      usedCount: 0
    }
  ];

  const specialClients = [
    {
      id: 1,
      name: "Mario R.",
      status: "Attivo",
      visits: 3,
      lastVisit: "15/12/2024",
      reward: "Nessuno"
    },
    {
      id: 2,
      name: "Giulia M.",
      status: "Attivo", 
      visits: 5,
      lastVisit: "10/12/2024",
      reward: "Cena Omaggio"
    },
    {
      id: 3,
      name: "Francesco T.",
      status: "Attivo",
      visits: 2,
      lastVisit: "20/12/2024", 
      reward: "Sconto 10%"
    },
    {
      id: 4,
      name: "Elena S.",
      status: "Attivo",
      visits: 7,
      lastVisit: "05/12/2024",
      reward: "Aperitivo Gratis"
    }
  ];

  const handleTouristCodeSubmit = async () => {
    if (!touristCode.trim()) {
      toast({
        title: "Errore",
        description: "Inserisci un codice IQ valido",
        variant: "destructive"
      });
      return;
    }

    // Simulate API call
    toast({
      title: "Turista collegato!",
      description: `Codice ${touristCode} collegato al tuo circuito con successo`
    });
    setTouristCode('');
  };

  const createOfferMutation = useMutation({
    mutationFn: async (offerData: typeof newOffer) => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      return offerData;
    },
    onSuccess: () => {
      toast({
        title: "Offerta creata!",
        description: "La tua nuova promozione è ora attiva"
      });
      setShowNewOfferDialog(false);
      setNewOffer({ title: '', description: '', discount: '', validUntil: '' });
    }
  });

  const createSpecialClientMutation = useMutation({
    mutationFn: async (clientData: typeof newSpecialClient) => {
      // Simulate API call  
      await new Promise(resolve => setTimeout(resolve, 1000));
      return clientData;
    },
    onSuccess: () => {
      toast({
        title: "Cliente speciale aggiunto!",
        description: "Il cliente è stato aggiunto al programma fedeltà"
      });
      setShowSpecialClientDialog(false);
      setNewSpecialClient({ name: '', email: '', phone: '', notes: '' });
    }
  });

  // Main Dashboard View
  const renderMainDashboard = () => (
    <div className="space-y-6">
      {/* Hero Section */}
      <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0">
        <CardContent className="p-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-6 h-6" />
                <h1 className="text-2xl font-bold">Benvenuto nel tuo Spazio Partner</h1>
              </div>
              <p className="text-green-100 text-lg">
                Qui comincia il tuo vero viaggio dentro l'ecosistema TouristIQ
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">12</div>
              <div className="text-green-100">Turisti Collegati</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Insert Tourist Code */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <Plus className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Inserisci l'IQcode del Turista</h3>
                  <p className="text-gray-600 text-sm">Accogli nel tuo circuito e inizia il collegamento</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="tourist-code">IQcode Turista</Label>
                <Input
                  id="tourist-code"
                  placeholder="es. TIQ-2024-ABC123"
                  value={touristCode}
                  onChange={(e) => setTouristCode(e.target.value)}
                  className="text-lg"
                />
                <Button 
                  onClick={handleTouristCodeSubmit}
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={!touristCode.trim()}
                >
                  Collega Turista
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Pending Connections */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-4 h-4 text-yellow-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Collegamenti in Attesa</h3>
                  <p className="text-gray-600 text-sm">Turisti che devono ancora confermare</p>
                </div>
                <Badge variant="secondary" className="ml-auto">2</Badge>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-yellow-200 rounded-full flex items-center justify-center text-sm font-medium">
                      JS
                    </div>
                    <div>
                      <div className="font-medium">TIQ-2024-ABC123</div>
                      <div className="text-sm text-gray-600">Richiesta inviata 28/06/2025, 15:40:37</div>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                    In attesa
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-yellow-200 rounded-full flex items-center justify-center text-sm font-medium">
                      MD
                    </div>
                    <div>
                      <div className="font-medium">TIQ-2024-XYZ789</div>
                      <div className="text-sm text-gray-600">Richiesta inviata 28/06/2025, 14:40:37</div>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                    In attesa
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Tourists */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Turisti Attivi</h3>
                  <p className="text-gray-600 text-sm">Partner collegati e attivi nel circuito</p>
                </div>
                <Badge variant="secondary" className="ml-auto">2</Badge>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center text-sm font-medium">
                      HM
                    </div>
                    <div>
                      <div className="font-medium">TIQ-2024-DEF456</div>
                      <div className="text-sm text-gray-600">Collegato 27/06/2025 • Germany</div>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                    Attivo
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center text-sm font-medium">
                      ER
                    </div>
                    <div>
                      <div className="font-medium">TIQ-2024-GHI789</div>
                      <div className="text-sm text-gray-600">Collegato 26/06/2025 • Italy</div>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                    Attivo
                  </Badge>
                </div>
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
                <h4 className="font-medium text-gray-900">Promozioni Attive</h4>
                {activePromotions.map((promo) => (
                  <div key={promo.id} className="p-4 bg-orange-50 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Badge className="bg-orange-500 text-white">
                          -{promo.discount}%
                        </Badge>
                        <div>
                          <div className="font-medium">{promo.title}</div>
                          <div className="text-sm text-gray-600">{promo.description}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            Scade: {promo.validUntil} • Utilizzata: {promo.usedCount} volte
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Stats and Materials */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                <CardTitle className="text-lg">Statistiche Rapide</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Turisti Oggi</span>
                <span className="text-2xl font-bold">{stats.touristToday}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Questa Settimana</span>
                <span className="text-2xl font-bold">{stats.thisWeek}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Promozioni Attive</span>
                <span className="text-2xl font-bold text-orange-600">{stats.activePromotions}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Tasso Ritorno</span>
                <span className="text-2xl font-bold text-blue-600">{stats.returnRate}%</span>
              </div>
            </CardContent>
          </Card>

          {/* Promotional Materials */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Download className="w-5 h-5 text-purple-600" />
                <CardTitle className="text-lg">Materiali Promozionali</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start bg-blue-50 border-blue-200 hover:bg-blue-100">
                <Download className="w-4 h-4 mr-2" />
                Scarica Locandina PDF
              </Button>
              <Button variant="outline" className="w-full justify-start bg-purple-50 border-purple-200 hover:bg-purple-100">
                <QrCode className="w-4 h-4 mr-2" />
                QR Code Personalizzato
              </Button>
              <Button variant="outline" className="w-full justify-start bg-green-50 border-green-200 hover:bg-green-100">
                <Camera className="w-4 h-4 mr-2" />
                Adesivi "Benvenuti TouristIQ"
              </Button>
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-start gap-2">
                  <div className="w-4 h-4 text-blue-600 mt-0.5">💡</div>
                  <div className="text-sm text-blue-800">
                    <strong>Suggerimento:</strong> Posiziona i materiali in punti visibili per massimizzare l'engagement
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Special Clients Teaser */}
          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Heart className="w-6 h-6 text-pink-600" />
              </div>
              <h3 className="font-semibold mb-2">Novità: Clienti Speciali</h3>
              <p className="text-sm text-gray-600 mb-4">
                Ora puoi fidelizzare anche i tuoi clienti abituali! 
                Regala loro l'accesso al circuito nazionale TouristIQ.
              </p>
              <Button 
                onClick={() => setCurrentView('special-clients')}
                className="bg-pink-500 hover:bg-pink-600 w-full"
              >
                Scopri come Funziona
              </Button>
            </CardContent>
          </Card>

          {/* TouristIQ Alliance */}
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold mb-2 text-green-800">TouristIQ è un'alleanza</h3>
              <p className="text-sm text-green-700">
                Sei parte attiva di una rete che valorizza il commercio locale
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );

  // Special Clients View
  const renderSpecialClients = () => (
    <div className="space-y-6">
      {/* Hero Section */}
      <Card className="bg-gradient-to-r from-pink-500 to-purple-600 text-white border-0">
        <CardContent className="p-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Gift className="w-6 h-6" />
                <h1 className="text-2xl font-bold">Premia i tuoi Clienti</h1>
              </div>
              <p className="text-pink-100 text-lg">
                Con TouristIQ puoi fidelizzare non solo i turisti, ma anche i tuoi clienti abituali.
              </p>
              <p className="text-pink-100 text-sm mt-2">
                Acquistando uno dei pacchetti IQcode, regali loro l'accesso a un ecosistema nazionale di vantaggi e 
                promozioni. Il tuo cliente riceverà una vera e propria "carta digitale" che potrà usare in tutta Italia, in 
                ogni città dove è attivo il circuito TouristIQ.
              </p>
            </div>
            <div className="text-right">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <div className="text-lg font-bold mt-2">4</div>
              <div className="text-pink-100">Clienti Speciali</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Package Selection */}
        <div className="lg:col-span-2 space-y-6">
          {/* Package Selection */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Package className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Ordina IQcode per i tuoi Clienti</h3>
                  <p className="text-gray-600 text-sm">Scegli il pacchetto più adatto alle tue esigenze. Dopo l'acquisto, i codici saranno caricati automaticamente nel tuo spazio partner.</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 border-2 border-gray-200 rounded-lg text-center hover:border-purple-300 transition-colors cursor-pointer">
                  <div className="text-2xl font-bold">25</div>
                  <div className="text-sm text-gray-600 mb-2">codici IQcode</div>
                  <div className="text-xl font-bold text-purple-600">€50</div>
                  <div className="text-xs text-gray-500">€2.00 per codice</div>
                  <Button className="w-full mt-3 bg-purple-600 hover:bg-purple-700" size="sm">
                    <Package className="w-4 h-4 mr-2" />
                    Acquista 25 codici
                  </Button>
                </div>

                <div className="p-4 border-2 border-purple-300 rounded-lg text-center bg-purple-50 hover:border-purple-400 transition-colors cursor-pointer">
                  <div className="text-2xl font-bold">50</div>
                  <div className="text-sm text-gray-600 mb-2">codici IQcode</div>
                  <div className="text-xl font-bold text-purple-600">€90</div>
                  <div className="text-xs text-gray-500">€1.80 per codice</div>
                  <Button className="w-full mt-3 bg-purple-600 hover:bg-purple-700" size="sm">
                    <Package className="w-4 h-4 mr-2" />
                    Acquista 50 codici
                  </Button>
                </div>

                <div className="p-4 border-2 border-gray-200 rounded-lg text-center hover:border-purple-300 transition-colors cursor-pointer">
                  <div className="text-2xl font-bold">75</div>
                  <div className="text-sm text-gray-600 mb-2">codici IQcode</div>
                  <div className="text-xl font-bold text-purple-600">€130</div>
                  <div className="text-xs text-gray-500">€1.73 per codice</div>
                  <Button className="w-full mt-3 bg-purple-600 hover:bg-purple-700" size="sm">
                    <Package className="w-4 h-4 mr-2" />
                    Acquista 75 codici
                  </Button>
                </div>

                <div className="p-4 border-2 border-gray-200 rounded-lg text-center hover:border-purple-300 transition-colors cursor-pointer">
                  <div className="text-2xl font-bold">100</div>
                  <div className="text-sm text-gray-600 mb-2">codici IQcode</div>
                  <div className="text-xl font-bold text-purple-600">€160</div>
                  <div className="text-xs text-gray-500">€1.60 per codice</div>
                  <Button className="w-full mt-3 bg-purple-600 hover:bg-purple-700" size="sm">
                    <Package className="w-4 h-4 mr-2" />
                    Acquista 100 codici
                  </Button>
                </div>
              </div>

              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-start gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <strong>Tu potrai monitorare i risultati</strong><br/>
                    Premi i più attivi e diventa un punto di riferimento locale per innovazione e fidelizzazione.
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Special Clients List */}
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
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium">
                              {client.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <span className="font-medium">{client.name}</span>
                          </div>
                        </td>
                        <td className="py-3">
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                            {client.status}
                          </Badge>
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-1">
                            <span className="text-lg font-bold">{client.visits}</span>
                            <TrendingUp className="w-3 h-3 text-green-600" />
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-1">
                            {client.reward !== "Nessuno" && (
                              <Trophy className="w-4 h-4 text-yellow-600" />
                            )}
                            <span className="text-sm">{client.reward}</span>
                          </div>
                        </td>
                        <td className="py-3 text-sm text-gray-600">{client.lastVisit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-start gap-2">
                  <div className="w-4 h-4 text-yellow-600 mt-0.5">⚠️</div>
                  <div className="text-sm text-yellow-800">
                    <strong>Nota:</strong> Questi dati sono simulati per la demo. Verranno attivati quando la logica di tracciamento sarà operativa.
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Stats and System Info */}
        <div className="space-y-6">
          {/* System Benefits */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-pink-600" />
                <CardTitle className="text-lg">Vantaggi del Sistema</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-green-600">1</span>
                </div>
                <div>
                  <div className="font-medium text-sm">Fidelizzazione Automatica</div>
                  <div className="text-xs text-gray-600">I clienti ricevono vantaggi in tutta Italia</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-blue-600">2</span>
                </div>
                <div>
                  <div className="font-medium text-sm">Tracciamento Completo</div>
                  <div className="text-xs text-gray-600">Monitora visite, acquisti e comportamenti</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-purple-600">3</span>
                </div>
                <div>
                  <div className="font-medium text-sm">Innovazione Locale</div>
                  <div className="text-xs text-gray-600">Diventi un punto di riferimento tecnologico</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-yellow-600">4</span>
                </div>
                <div>
                  <div className="font-medium text-sm">Rete Nazionale</div>
                  <div className="text-xs text-gray-600">I tuoi clienti accedono a migliaia di partner</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats for Special Clients */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Statistiche Rapide</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Clienti Attivi</span>
                <span className="text-2xl font-bold">4</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Visite Totali</span>
                <span className="text-2xl font-bold">17</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Premi Assegnati</span>
                <span className="text-2xl font-bold">3</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Tasso Ritorno</span>
                <span className="text-2xl font-bold text-green-600">85%</span>
              </div>
            </CardContent>
          </Card>

          {/* System Evolution */}
          <Card className="bg-gray-50 border-gray-200">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Settings className="w-6 h-6 text-gray-600" />
              </div>
              <h3 className="font-semibold mb-2 text-gray-800">Sistema in Evoluzione</h3>
              <p className="text-sm text-gray-600">
                Questa è la versione base. Nuove funzionalità di monitoraggio e premi automatici saranno aggiunte presto.
              </p>
            </CardContent>
          </Card>

          {/* Back to Dashboard */}
          <Button 
            onClick={() => setCurrentView('main')}
            variant="outline" 
            className="w-full"
          >
            Torna a Dashboard
          </Button>
        </div>
      </div>
    </div>
  );

  const navigation = [
    { icon: <BarChart3 size={16} />, label: "Dashboard", href: "#" },
    { icon: <Tags size={16} />, label: "Gestione Sconti", href: "#" },
    { icon: <QrCode size={16} />, label: "Scansiona Codici", href: "#" },
    { icon: <TrendingUp size={16} />, label: "Statistiche", href: "#" },
    { icon: <Settings size={16} />, label: "Impostazioni", href: "#" },
  ];

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Caricamento...</h2>
          <p className="text-gray-600">Sto caricando il tuo dashboard partner</p>
        </div>
      </div>
    );
  }

  return (
    <Layout
      title="Dashboard Partner"
      role="Area Partner"
      iqCode={user.iqCode}
      navigation={navigation}
      sidebarColor="bg-orange-500"
    >
      {currentView === 'main' ? renderMainDashboard() : renderSpecialClients()}

      {/* New Offer Dialog */}
      <Dialog open={showNewOfferDialog} onOpenChange={setShowNewOfferDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Crea Nuova Offerta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="offer-title">Titolo Offerta</Label>
              <Input
                id="offer-title"
                value={newOffer.title}
                onChange={(e) => setNewOffer({ ...newOffer, title: e.target.value })}
                placeholder="es. Sconto Benvenuto"
              />
            </div>
            <div>
              <Label htmlFor="offer-description">Descrizione</Label>
              <Textarea
                id="offer-description"
                value={newOffer.description}
                onChange={(e) => setNewOffer({ ...newOffer, description: e.target.value })}
                placeholder="Descrivi la tua offerta..."
              />
            </div>
            <div>
              <Label htmlFor="offer-discount">Sconto (%)</Label>
              <Input
                id="offer-discount"
                type="number"
                value={newOffer.discount}
                onChange={(e) => setNewOffer({ ...newOffer, discount: e.target.value })}
                placeholder="15"
              />
            </div>
            <div>
              <Label htmlFor="offer-valid-until">Valido fino a</Label>
              <Input
                id="offer-valid-until"
                type="date"
                value={newOffer.validUntil}
                onChange={(e) => setNewOffer({ ...newOffer, validUntil: e.target.value })}
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button 
                onClick={() => createOfferMutation.mutate(newOffer)}
                disabled={createOfferMutation.isPending || !newOffer.title || !newOffer.discount}
                className="flex-1"
              >
                {createOfferMutation.isPending ? "Creando..." : "Crea Offerta"}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowNewOfferDialog(false)}
                className="flex-1"
              >
                Annulla
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Special Client Dialog */}
      <Dialog open={showSpecialClientDialog} onOpenChange={setShowSpecialClientDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Aggiungi Cliente Speciale</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="client-name">Nome Cliente</Label>
              <Input
                id="client-name"
                value={newSpecialClient.name}
                onChange={(e) => setNewSpecialClient({ ...newSpecialClient, name: e.target.value })}
                placeholder="Mario Rossi"
              />
            </div>
            <div>
              <Label htmlFor="client-email">Email (opzionale)</Label>
              <Input
                id="client-email"
                type="email"
                value={newSpecialClient.email}
                onChange={(e) => setNewSpecialClient({ ...newSpecialClient, email: e.target.value })}
                placeholder="mario@email.com"
              />
            </div>
            <div>
              <Label htmlFor="client-phone">Telefono (opzionale)</Label>
              <Input
                id="client-phone"
                value={newSpecialClient.phone}
                onChange={(e) => setNewSpecialClient({ ...newSpecialClient, phone: e.target.value })}
                placeholder="+39 123 456 7890"
              />
            </div>
            <div>
              <Label htmlFor="client-notes">Note</Label>
              <Textarea
                id="client-notes"
                value={newSpecialClient.notes}
                onChange={(e) => setNewSpecialClient({ ...newSpecialClient, notes: e.target.value })}
                placeholder="Cliente abituale, preferisce..."
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button 
                onClick={() => createSpecialClientMutation.mutate(newSpecialClient)}
                disabled={createSpecialClientMutation.isPending || !newSpecialClient.name}
                className="flex-1"
              >
                {createSpecialClientMutation.isPending ? "Aggiungendo..." : "Aggiungi Cliente"}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowSpecialClientDialog(false)}
                className="flex-1"
              >
                Annulla
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}

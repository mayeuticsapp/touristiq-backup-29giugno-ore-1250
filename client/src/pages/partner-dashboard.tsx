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
  Download, QrCode, Camera, Tags, Trophy, Calendar, Settings
} from "lucide-react";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";

interface User {
  iqCode: string;
  role: string;
}

export default function PartnerDashboard() {
  const [currentView, setCurrentView] = useState<'main' | 'special-clients'>('main');
  const [showNewOfferDialog, setShowNewOfferDialog] = useState(false);
  const [showSpecialClientDialog, setShowSpecialClientDialog] = useState(false);
  const [touristCode, setTouristCode] = useState('');
  const [newOffer, setNewOffer] = useState({
    title: '',
    description: '',
    discount: '',
    validUntil: ''
  });
  const [newSpecialClient, setNewSpecialClient] = useState({
    name: '',
    notes: ''
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user data
  const { data: user } = useQuery<User>({
    queryKey: ["/api/auth/me"],
  });

  // Link tourist mutation
  const linkTouristMutation = useMutation({
    mutationFn: (data: { touristCode: string }) => 
      apiRequest("/api/partner/link-tourist", "POST", data),
    onSuccess: () => {
      toast({ title: "Richiesta inviata", description: "Attendi la conferma del turista" });
      setTouristCode('');
    },
    onError: (error: any) => {
      toast({ 
        title: "Errore", 
        description: error.message || "Errore nell'invio della richiesta",
        variant: "destructive" 
      });
    }
  });

  // Create offer mutation
  const createOfferMutation = useMutation({
    mutationFn: (data: typeof newOffer) => 
      apiRequest("/api/partner/offers", "POST", data),
    onSuccess: () => {
      toast({ title: "Successo", description: "Offerta creata con successo" });
      setShowNewOfferDialog(false);
      setNewOffer({ title: '', description: '', discount: '', validUntil: '' });
    },
    onError: (error: any) => {
      toast({ 
        title: "Errore", 
        description: error.message || "Errore nella creazione dell'offerta",
        variant: "destructive" 
      });
    }
  });

  // Create special client mutation
  const createSpecialClientMutation = useMutation({
    mutationFn: (data: typeof newSpecialClient) => 
      apiRequest("/api/partner/special-clients", "POST", data),
    onSuccess: () => {
      toast({ title: "Successo", description: "Cliente speciale aggiunto" });
      setShowSpecialClientDialog(false);
      setNewSpecialClient({ name: '', notes: '' });
    },
    onError: (error: any) => {
      toast({ 
        title: "Errore", 
        description: error.message || "Errore nell'aggiunta del cliente",
        variant: "destructive" 
      });
    }
  });

  // Sample data
  const stats = {
    touristToday: 3,
    thisWeek: 8,
    activePromotions: 2,
    returnRate: 65
  };

  const activePromotions = [
    { id: 1, title: "Sconto Benvenuto", description: "15% su primo acquisto", discount: 15, validUntil: "31/12/2024", usedCount: 12 },
    { id: 2, title: "Aperitivo Happy Hour", description: "2x1 dalle 18:00", discount: 50, validUntil: "28/02/2025", usedCount: 8 }
  ];

  const pendingTourists = [
    { id: 1, code: "TIQ-2024-ABC123", country: "Germany", status: "In attesa" },
    { id: 2, code: "TIQ-2024-DEF456", country: "France", status: "In attesa" }
  ];

  const activeTourists = [
    { id: 1, code: "TIQ-2024-GHI789", country: "Italy", linkedDate: "27/06/2025" },
    { id: 2, code: "TIQ-2024-JKL012", country: "Germany", linkedDate: "26/06/2025" }
  ];

  const specialClients = [
    { id: 1, name: "Marco B.", status: "Attivo", visits: 12, reward: "Caffè Gratis", lastVisit: "25/06/25" },
    { id: 2, name: "Anna R.", status: "Attivo", visits: 8, reward: "Sconto 20%", lastVisit: "24/06/25" },
    { id: 3, name: "Luigi P.", status: "Attivo", visits: 15, reward: "Menu Degustazione", lastVisit: "23/06/25" },
    { id: 4, name: "Sofia M.", status: "Attivo", visits: 6, reward: "Nessuno", lastVisit: "22/06/25" }
  ];

  const renderMainDashboard = () => (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Benvenuto nel tuo Spazio Partner</h1>
        <p className="text-green-100">Gestisci i turisti collegati e crea promozioni esclusive per far crescere il tuo business</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Tourist Link Form */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Plus className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Inserisci l'IQcode del Turista</h3>
                  <p className="text-gray-600 text-sm">Collega un nuovo turista al tuo circuito sconti</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <Input
                  placeholder="es. TIQ-2024-ABC123"
                  value={touristCode}
                  onChange={(e) => setTouristCode(e.target.value)}
                />
                <Button 
                  onClick={() => linkTouristMutation.mutate({ touristCode })}
                  disabled={!touristCode || linkTouristMutation.isPending}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {linkTouristMutation.isPending ? "Inviando..." : "Conferma"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Pending Links */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-yellow-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Collegamenti in Attesa</h3>
                  <p className="text-gray-600 text-sm">Turisti che devono ancora confermare il collegamento</p>
                </div>
              </div>

              <div className="space-y-3">
                {pendingTourists.map((tourist) => (
                  <div key={tourist.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <div>
                      <div className="font-medium">{tourist.code}</div>
                      <div className="text-sm text-gray-600">{tourist.country}</div>
                    </div>
                    <Badge className="bg-yellow-100 text-yellow-700">
                      {tourist.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

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

        {/* Right Column */}
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
              <a 
                href="/api/partner/materials/pdf" 
                target="_blank" 
                rel="noopener noreferrer"
                className="block"
              >
                <Button variant="outline" className="w-full justify-start bg-blue-50 border-blue-200 hover:bg-blue-100">
                  <Download className="w-4 h-4 mr-2" />
                  Scarica Locandina PDF
                </Button>
              </a>
              <a 
                href="/api/partner/materials/qr" 
                target="_blank" 
                rel="noopener noreferrer"
                className="block"
              >
                <Button variant="outline" className="w-full justify-start bg-purple-50 border-purple-200 hover:bg-purple-100">
                  <QrCode className="w-4 h-4 mr-2" />
                  QR Code Personalizzato
                </Button>
              </a>
              <a 
                href="https://www.vistaprint.it/adesivi-personalizzati" 
                target="_blank" 
                rel="noopener noreferrer"
                className="block"
              >
                <Button variant="outline" className="w-full justify-start bg-green-50 border-green-200 hover:bg-green-100">
                  <Camera className="w-4 h-4 mr-2" />
                  Adesivi "Benvenuti TouristIQ"
                </Button>
              </a>
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
        </div>
      </div>
    </div>
  );

  const renderSpecialClients = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Premia i tuoi Clienti</h1>
        <p className="text-purple-100">Trasforma i tuoi clienti abituali in ambasciatori TouristIQ. Regala loro l'accesso al circuito nazionale e monitora i risultati.</p>
      </div>

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
                <a 
                  href="https://pay.sumup.com/b2c/QSJE461B" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block p-4 border-2 border-gray-200 rounded-lg text-center hover:border-purple-300 transition-colors cursor-pointer"
                >
                  <div className="text-2xl font-bold">25</div>
                  <div className="text-sm text-gray-600 mb-2">codici IQcode</div>
                  <div className="text-xl font-bold text-purple-600">€50</div>
                  <div className="text-xs text-gray-500">€2.00 per codice</div>
                  <Button className="w-full mt-3 bg-purple-600 hover:bg-purple-700" size="sm">
                    <Package className="w-4 h-4 mr-2" />
                    Acquista 25 codici
                  </Button>
                </a>

                <a 
                  href="https://pay.sumup.com/b2c/QK6MLJC7" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block p-4 border-2 border-purple-300 rounded-lg text-center bg-purple-50 hover:border-purple-400 transition-colors cursor-pointer"
                >
                  <div className="text-2xl font-bold">50</div>
                  <div className="text-sm text-gray-600 mb-2">codici IQcode</div>
                  <div className="text-xl font-bold text-purple-600">€90</div>
                  <div className="text-xs text-gray-500">€1.80 per codice</div>
                  <Button className="w-full mt-3 bg-purple-600 hover:bg-purple-700" size="sm">
                    <Package className="w-4 h-4 mr-2" />
                    Acquista 50 codici
                  </Button>
                </a>

                <a 
                  href="https://pay.sumup.com/b2c/Q9517L3P" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block p-4 border-2 border-gray-200 rounded-lg text-center hover:border-purple-300 transition-colors cursor-pointer"
                >
                  <div className="text-2xl font-bold">75</div>
                  <div className="text-sm text-gray-600 mb-2">codici IQcode</div>
                  <div className="text-xl font-bold text-purple-600">€130</div>
                  <div className="text-xs text-gray-500">€1.73 per codice</div>
                  <Button className="w-full mt-3 bg-purple-600 hover:bg-purple-700" size="sm">
                    <Package className="w-4 h-4 mr-2" />
                    Acquista 75 codici
                  </Button>
                </a>

                <a 
                  href="https://pay.sumup.com/b2c/Q3BWI26N" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block p-4 border-2 border-gray-200 rounded-lg text-center hover:border-purple-300 transition-colors cursor-pointer"
                >
                  <div className="text-2xl font-bold">100</div>
                  <div className="text-sm text-gray-600 mb-2">codici IQcode</div>
                  <div className="text-xl font-bold text-purple-600">€160</div>
                  <div className="text-xs text-gray-500">€1.60 per codice</div>
                  <Button className="w-full mt-3 bg-purple-600 hover:bg-purple-700" size="sm">
                    <Package className="w-4 h-4 mr-2" />
                    Acquista 100 codici
                  </Button>
                </a>
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
                  <Trophy className="w-4 h-4 text-yellow-600 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <strong>Suggerimento:</strong> Premia i clienti più attivi con sconti esclusivi o omaggi per incentivare la fedeltà.
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Stats and Info */}
        <div className="space-y-6">
          {/* How it Works */}
          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="p-6">
              <h3 className="font-semibold text-purple-900 mb-4">Come Funziona</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-purple-600">1</span>
                  </div>
                  <div>
                    <div className="font-medium text-sm">Acquisti IQcode</div>
                    <div className="text-xs text-gray-600">Ordini i pacchetti per i tuoi clienti</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-purple-600">2</span>
                  </div>
                  <div>
                    <div className="font-medium text-sm">Assegni ai Clienti</div>
                    <div className="text-xs text-gray-600">Regali i codici ai tuoi clienti abituali</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-purple-600">3</span>
                  </div>
                  <div>
                    <div className="font-medium text-sm">Accesso Nazionale</div>
                    <div className="text-xs text-gray-600">I clienti usano gli sconti in tutta Italia</div>
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
                placeholder="Nome generico (es. Mario, Cliente Abituale)"
              />
              <p className="text-xs text-gray-500 mt-1">
                TouristIQ non raccoglie dati sensibili. Il nome è solo per la tua memoria personale.
              </p>
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
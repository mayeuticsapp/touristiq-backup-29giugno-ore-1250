import { useState, useEffect } from "react";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  Users, 
  TrendingUp, 
  Gift, 
  MessageSquare, 
  Download, 
  Plus,
  Eye,
  MousePointer,
  ShoppingCart,
  Calendar,
  Settings,
  Bell,
  CreditCard,
  BarChart3,
  FileSpreadsheet,
  Target
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface PartnerPromotion {
  id: number;
  title: string;
  description: string;
  discountType: string;
  discountValue: string;
  isActive: boolean;
  requiresConnection: boolean;
  viewCount: number;
  usageCount: number;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface PartnerConnection {
  id: number;
  touristCode: string;
  connectionStatus: string;
  connectedAt: string;
  lastInteraction: string;
  totalVisits: number;
  promotionsUsed: number;
  totalValue: number;
  notes: string | null;
  isActive: boolean;
}

interface PartnerAnalytics {
  totalTourists: number;
  activeTourists: number;
  totalVisits: number;
  totalValue: number;
  returnRate: number;
  monthlyGrowth: Array<{ month: string; tourists: number; value: number }>;
}

interface AdminCommunication {
  id: number;
  subject: string;
  message: string;
  type: string;
  priority: string;
  isRead: boolean;
  requiresResponse: boolean;
  sentAt: string;
  readAt: string | null;
}

interface CreditRequest {
  id: number;
  requestedAmount: number;
  justification: string;
  status: string;
  requestedAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  reviewNotes: string | null;
}

export function AdvancedPartnerDashboard() {
  const [activeSection, setActiveSection] = useState("gestione");
  const [selectedPromotion, setSelectedPromotion] = useState<PartnerPromotion | null>(null);
  const [newPromotionDialog, setNewPromotionDialog] = useState(false);
  const [assignTouristsDialog, setAssignTouristsDialog] = useState(false);
  const [requestCreditsDialog, setRequestCreditsDialog] = useState(false);
  const [touristCodes, setTouristCodes] = useState("");
  const [creditAmount, setCreditAmount] = useState("");
  const [creditJustification, setCreditJustification] = useState("");

  const queryClient = useQueryClient();

  // Query per ottenere i dati del partner
  const { data: promotions } = useQuery({
    queryKey: ["/api/partner/promotions"],
    queryFn: () => apiRequest<{ promotions: PartnerPromotion[] }>({ url: "/api/partner/promotions" }),
  });

  const { data: connections } = useQuery({
    queryKey: ["/api/partner/connections"],
    queryFn: () => apiRequest<{ connections: PartnerConnection[] }>({ url: "/api/partner/connections" }),
  });

  const { data: analytics } = useQuery({
    queryKey: ["/api/partner/analytics"],
    queryFn: () => apiRequest<{ analytics: PartnerAnalytics }>({ url: "/api/partner/analytics" }),
  });

  const { data: communications } = useQuery({
    queryKey: ["/api/partner/communications"],
    queryFn: () => apiRequest<{ communications: AdminCommunication[]; unreadCount: number }>({ url: "/api/partner/communications" }),
  });

  const { data: creditRequests } = useQuery({
    queryKey: ["/api/partner/credit-requests"],
    queryFn: () => apiRequest<{ requests: CreditRequest[] }>({ url: "/api/partner/credit-requests" }),
  });

  // Mutation per creare nuova promozione
  const createPromotionMutation = useMutation({
    mutationFn: (promotionData: any) => 
      apiRequest({ url: "/api/partner/promotions", method: "POST", body: promotionData }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/partner/promotions"] });
      setNewPromotionDialog(false);
      toast({ title: "Promozione creata con successo" });
    },
  });

  // Mutation per assegnazione multipla turisti
  const assignTouristsMutation = useMutation({
    mutationFn: (data: { touristCodes: string[] }) =>
      apiRequest({ url: "/api/partner/assign-multiple-tourists", method: "POST", body: data }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/partner/connections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/partner/analytics"] });
      setAssignTouristsDialog(false);
      setTouristCodes("");
      toast({ title: `${data.assigned} turisti assegnati con successo` });
    },
  });

  // Mutation per richiesta crediti
  const requestCreditsMutation = useMutation({
    mutationFn: (data: { requestedAmount: number; justification: string }) =>
      apiRequest({ url: "/api/partner/credit-requests", method: "POST", body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/partner/credit-requests"] });
      setRequestCreditsDialog(false);
      setCreditAmount("");
      setCreditJustification("");
      toast({ title: "Richiesta crediti inviata con successo" });
    },
  });

  // Mutation per export dati
  const exportDataMutation = useMutation({
    mutationFn: () => apiRequest({ url: "/api/partner/export" }),
    onSuccess: (data) => {
      // Converti in CSV e scarica
      const csvContent = "data:text/csv;charset=utf-8," + 
        ["TuristaCode,Stato,DataCollegamento,UltimaInterazione,TotaleVisite,PromozioniUsate,ValoreTotale,Note"]
        .concat(data.csvConnections.map((row: any) => Object.values(row).join(",")))
        .join("\n");
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `partner_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({ title: "Dati esportati con successo" });
    },
  });

  const handleCreatePromotion = (formData: FormData) => {
    const promotionData = {
      title: formData.get("title"),
      description: formData.get("description"),
      discountType: formData.get("discountType"),
      discountValue: formData.get("discountValue"),
      requiresConnection: formData.get("requiresConnection") === "true",
      expiresAt: formData.get("expiresAt") || null,
    };
    createPromotionMutation.mutate(promotionData);
  };

  const handleAssignTourists = () => {
    const codes = touristCodes.split("\n").map(code => code.trim()).filter(code => code.length > 0);
    if (codes.length === 0) {
      toast({ title: "Inserisci almeno un codice turista", variant: "destructive" });
      return;
    }
    assignTouristsMutation.mutate({ touristCodes: codes });
  };

  const handleRequestCredits = () => {
    const amount = parseInt(creditAmount);
    if (!amount || amount <= 0) {
      toast({ title: "Inserisci un importo valido", variant: "destructive" });
      return;
    }
    if (!creditJustification.trim()) {
      toast({ title: "Inserisci una giustificazione", variant: "destructive" });
      return;
    }
    requestCreditsMutation.mutate({ 
      requestedAmount: amount, 
      justification: creditJustification 
    });
  };

  const navigation = [
    { icon: <Users />, label: "Gestione IQCode", href: "#gestione" },
    { icon: <Gift />, label: "Promozioni", href: "#promozioni" },
    { icon: <BarChart3 />, label: "Statistiche", href: "#statistiche" },
  ];

  const formatCurrency = (value: number) => `€${(value / 100).toFixed(2)}`;
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('it-IT');

  return (
    <Layout
      title="Partner Dashboard Avanzata"
      role="partner"
      navigation={navigation}
      sidebarColor="bg-purple-600"
    >
      <div className="space-y-6">
        {/* Header con statistiche chiave */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Turisti Totali</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.analytics.totalTourists || 0}</div>
              <p className="text-xs text-muted-foreground">
                {analytics?.analytics.activeTourists || 0} attivi
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valore Generato</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(analytics?.analytics.totalValue || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                {analytics?.analytics.totalVisits || 0} visite totali
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Promozioni Attive</CardTitle>
              <Gift className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {promotions?.promotions.filter(p => p.isActive).length || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {promotions?.promotions.length || 0} totali
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Comunicazioni</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{communications?.unreadCount || 0}</div>
              <p className="text-xs text-muted-foreground">non lette</p>
            </CardContent>
          </Card>
        </div>

        {/* Sezioni principali */}
        <Tabs value={activeSection} onValueChange={setActiveSection} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="gestione">Gestione IQCode e Clienti</TabsTrigger>
            <TabsTrigger value="promozioni">Promozioni e Marketing</TabsTrigger>
            <TabsTrigger value="statistiche">Statistiche & Comunicazioni</TabsTrigger>
          </TabsList>

          {/* Sezione 1: Gestione IQCode e Clienti */}
          <TabsContent value="gestione" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Gestione Turisti Collegati</h3>
              <div className="flex gap-2">
                <Dialog open={assignTouristsDialog} onOpenChange={setAssignTouristsDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Assegna Multipli
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Assegnazione Multipla Turisti</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Codici Turista (uno per riga)</label>
                        <Textarea
                          value={touristCodes}
                          onChange={(e) => setTouristCodes(e.target.value)}
                          placeholder="TIQ-IT-ROSA&#10;TIQ-IT-GIOIA&#10;TIQ-IT-AMORE"
                          rows={6}
                        />
                      </div>
                      <Button 
                        onClick={handleAssignTourists}
                        disabled={assignTouristsMutation.isPending}
                        className="w-full"
                      >
                        {assignTouristsMutation.isPending ? "Assegnando..." : "Assegna Turisti"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                
                <Button 
                  variant="outline"
                  onClick={() => exportDataMutation.mutate()}
                  disabled={exportDataMutation.isPending}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Storico Turisti Collegati</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {connections?.connections.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Nessun turista collegato. Usa "Assegna Multipli" per iniziare.
                    </p>
                  ) : (
                    connections?.connections.map((connection) => (
                      <div key={connection.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{connection.touristCode}</h4>
                            <Badge variant={connection.connectionStatus === 'active' ? 'default' : 'secondary'}>
                              {connection.connectionStatus}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            Collegato: {formatDate(connection.connectedAt)} • 
                            Visite: {connection.totalVisits} • 
                            Valore: {formatCurrency(connection.totalValue)}
                          </div>
                          {connection.notes && (
                            <p className="text-sm text-muted-foreground mt-1">{connection.notes}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{connection.promotionsUsed} promo usate</Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sezione 2: Promozioni e Marketing */}
          <TabsContent value="promozioni" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Gestione Promozioni</h3>
              <Dialog open={newPromotionDialog} onOpenChange={setNewPromotionDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Nuova Promozione
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Crea Nuova Promozione</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    handleCreatePromotion(formData);
                  }} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Titolo</label>
                        <Input name="title" required />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Tipo Sconto</label>
                        <Select name="discountType" required>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleziona tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="percentage">Percentuale</SelectItem>
                            <SelectItem value="fixed">Importo Fisso</SelectItem>
                            <SelectItem value="special">Offerta Speciale</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Descrizione</label>
                      <Textarea name="description" required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Valore Sconto</label>
                        <Input name="discountValue" placeholder="es. 15% o €10" required />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Scadenza (opzionale)</label>
                        <Input name="expiresAt" type="date" />
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" name="requiresConnection" value="true" id="requiresConnection" />
                      <label htmlFor="requiresConnection" className="text-sm">
                        Solo per turisti collegati
                      </label>
                    </div>
                    <Button type="submit" disabled={createPromotionMutation.isPending} className="w-full">
                      {createPromotionMutation.isPending ? "Creando..." : "Crea Promozione"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {promotions?.promotions.map((promotion) => (
                <Card key={promotion.id} className={promotion.isActive ? "border-green-200" : "border-gray-200"}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base">{promotion.title}</CardTitle>
                      <Badge variant={promotion.isActive ? "default" : "secondary"}>
                        {promotion.isActive ? "Attiva" : "Inattiva"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">{promotion.description}</p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Sconto:</span>
                        <span className="font-medium">{promotion.discountValue}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Visualizzazioni:</span>
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {promotion.viewCount}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Utilizzi:</span>
                        <span className="flex items-center gap-1">
                          <ShoppingCart className="h-3 w-3" />
                          {promotion.usageCount}
                        </span>
                      </div>
                      {promotion.expiresAt && (
                        <div className="flex justify-between text-sm">
                          <span>Scadenza:</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(promotion.expiresAt)}
                          </span>
                        </div>
                      )}
                      {promotion.requiresConnection && (
                        <Badge variant="outline" className="text-xs">Solo collegati</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Sezione 3: Statistiche & Comunicazioni */}
          <TabsContent value="statistiche" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Analytics avanzate */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Analytics ROI
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {analytics?.analytics.returnRate.toFixed(1) || 0}%
                        </div>
                        <div className="text-sm text-blue-600">Tasso Ritorno</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {formatCurrency(analytics?.analytics.totalValue || 0)}
                        </div>
                        <div className="text-sm text-green-600">Valore Totale</div>
                      </div>
                    </div>
                    <div className="pt-4">
                      <h4 className="font-medium mb-2">Crescita Mensile</h4>
                      {analytics?.analytics.monthlyGrowth.map((month) => (
                        <div key={month.month} className="flex justify-between items-center py-2">
                          <span className="text-sm">{month.month}</span>
                          <div className="text-right">
                            <div className="text-sm font-medium">{month.tourists} turisti</div>
                            <div className="text-xs text-muted-foreground">
                              {formatCurrency(month.value)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Comunicazioni Admin */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Comunicazioni Admin
                    {communications?.unreadCount && communications.unreadCount > 0 && (
                      <Badge variant="destructive">{communications.unreadCount}</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {communications?.communications.length === 0 ? (
                      <p className="text-center text-muted-foreground py-4">
                        Nessuna comunicazione
                      </p>
                    ) : (
                      communications?.communications.slice(0, 5).map((comm) => (
                        <div 
                          key={comm.id} 
                          className={`p-3 rounded-lg border ${comm.isRead ? 'bg-gray-50' : 'bg-blue-50 border-blue-200'}`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h5 className={`text-sm font-medium ${!comm.isRead ? 'text-blue-900' : ''}`}>
                                {comm.subject}
                              </h5>
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatDate(comm.sentAt)}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              <Badge variant={comm.priority === 'high' ? 'destructive' : 'secondary'} className="text-xs">
                                {comm.priority}
                              </Badge>
                              {!comm.isRead && <div className="w-2 h-2 bg-blue-500 rounded-full"></div>}
                            </div>
                          </div>
                          <p className="text-sm mt-2">{comm.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Richieste Crediti */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Richieste Crediti
                    </span>
                    <Dialog open={requestCreditsDialog} onOpenChange={setRequestCreditsDialog}>
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <Plus className="h-4 w-4 mr-1" />
                          Richiedi
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Richiesta Crediti Aggiuntivi</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium">Numero di crediti richiesti</label>
                            <Input
                              type="number"
                              value={creditAmount}
                              onChange={(e) => setCreditAmount(e.target.value)}
                              placeholder="es. 50"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Giustificazione</label>
                            <Textarea
                              value={creditJustification}
                              onChange={(e) => setCreditJustification(e.target.value)}
                              placeholder="Spiega il motivo della richiesta..."
                              rows={4}
                            />
                          </div>
                          <Button 
                            onClick={handleRequestCredits}
                            disabled={requestCreditsMutation.isPending}
                            className="w-full"
                          >
                            {requestCreditsMutation.isPending ? "Inviando..." : "Invia Richiesta"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {creditRequests?.requests.length === 0 ? (
                      <p className="text-center text-muted-foreground py-4">
                        Nessuna richiesta crediti
                      </p>
                    ) : (
                      creditRequests?.requests.slice(0, 3).map((request) => (
                        <div key={request.id} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{request.requestedAmount} crediti</span>
                                <Badge variant={
                                  request.status === 'approved' ? 'default' :
                                  request.status === 'rejected' ? 'destructive' : 'secondary'
                                }>
                                  {request.status}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {formatDate(request.requestedAt)}
                              </p>
                            </div>
                          </div>
                          <p className="text-sm mt-2">{request.justification}</p>
                          {request.reviewNotes && (
                            <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                              <strong>Note admin:</strong> {request.reviewNotes}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Materiali Promozionali */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileSpreadsheet className="h-5 w-5" />
                    Materiali Marketing
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Button variant="outline" className="w-full justify-start">
                      <Download className="h-4 w-4 mr-2" />
                      Scarica Badge "Partner TouristIQ"
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Download className="h-4 w-4 mr-2" />
                      Banner Social Media
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Download className="h-4 w-4 mr-2" />
                      Locandina QR Partner
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Download className="h-4 w-4 mr-2" />
                      Mini-video Demo
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
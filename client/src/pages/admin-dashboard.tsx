import { useState, useEffect } from "react";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Users, QrCode, Building2, Settings, BarChart3, Package, Trash2, StickyNote, TrendingUp, Send, RotateCcw, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AdminRechargeManagement } from "@/components/admin-recharge-management";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

function StatsValue({ endpoint, field }: { endpoint: string; field: string }) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    fetch(endpoint, { credentials: 'include' })
      .then(res => res.json())
      .then(data => setValue(data.stats?.[field] || 0))
      .catch(() => setValue(0));
  }, [endpoint, field]);

  return <span>{value}</span>;
}

export default function AdminDashboard({ activeSection: propActiveSection }: { activeSection?: string }) {
  const [activeView, setActiveView] = useState(propActiveSection || "stats");
  const [targetType, setTargetType] = useState<'structure' | 'partner'>('structure');
  const [targetId, setTargetId] = useState('');
  const [packageSize, setPackageSize] = useState<number>(25);
  const [isAssigning, setIsAssigning] = useState(false);
  const [adminCredits, setAdminCredits] = useState<any>(null);
  const { toast } = useToast();

  // Carico i crediti admin (Pacchetto RobS)
  useEffect(() => {
    fetchAdminCredits();
  }, []);

  const fetchAdminCredits = async () => {
    try {
      const response = await fetch('/api/admin/credits', { credentials: 'include' });
      const data = await response.json();
      setAdminCredits(data.credits);
    } catch (error) {
      console.error('Errore caricamento crediti admin:', error);
    }
  };

  const navigation = [
    { icon: <Users size={20} />, label: "Utenti", href: "/admin/users", onClick: () => setActiveView("users") },
    { icon: <Trash2 size={20} />, label: "Cestino", href: "/admin/trash", onClick: () => setActiveView("trash") },
    { icon: <QrCode size={20} />, label: "Codici Generati", href: "/admin/iqcodes", onClick: () => setActiveView("iqcodes") },
    { icon: <Package size={20} />, label: "Genera Diretto", href: "/admin/generate-direct", onClick: () => setActiveView("generate-direct") },
    { icon: <Package size={20} />, label: "Assegna Pacchetti", href: "/admin/assign-iqcodes", onClick: () => setActiveView("assign-iqcodes") },
    { icon: <CreditCard size={20} />, label: "Gestione Ricariche", href: "/admin/recharges", onClick: () => setActiveView("recharges") },
    { icon: <TrendingUp size={20} />, label: "Report", href: "/admin/reports", onClick: () => setActiveView("reports") },
    { icon: <BarChart3 size={20} />, label: "Statistiche", href: "/admin/stats", onClick: () => setActiveView("stats") },
    { icon: <Settings size={20} />, label: "Impostazioni", href: "/admin/settings", onClick: () => setActiveView("settings") }
  ];

  const handleAssignPackage = async () => {
    if (!targetId || !packageSize) {
      toast({
        title: "Errore",
        description: "Seleziona destinatario e dimensione pacchetto",
        variant: "destructive"
      });
      return;
    }

    setIsAssigning(true);
    try {
      const response = await fetch('/api/admin/assign-iqcodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          targetType,
          targetId,
          packageSize
        })
      });

      if (response.ok) {
        toast({
          title: "Successo",
          description: `Pacchetto da ${packageSize} crediti assegnato con successo`
        });
        setTargetId('');
        setPackageSize(25);
      } else {
        const error = await response.json();
        toast({
          title: "Errore",
          description: error.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Errore",
        description: "Errore nell'assegnazione del pacchetto",
        variant: "destructive"
      });
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <Layout
      title="Dashboard Admin"
      role="admin"
      iqCode="TIQ-IT-ADMIN"
      navigation={navigation}
      sidebarColor="bg-red-500"
    >
      {/* Pacchetto RobS - Crediti Admin */}
      {adminCredits && (
        <Card className="mb-6 border-2 border-blue-500 bg-blue-50">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-between text-blue-800">
              <span className="flex items-center gap-2">
                <Package className="h-6 w-6" />
                Pacchetto RobS - Uso Interno Admin
              </span>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                Personale
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{adminCredits.creditsRemaining}</p>
                <p className="text-sm text-gray-600">IQCode Disponibili</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">{adminCredits.creditsUsed}</p>
                <p className="text-sm text-gray-600">Già Utilizzati</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">1000</p>
                <p className="text-sm text-gray-600">Totale Originario</p>
              </div>
            </div>
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-green-500 h-3 rounded-full transition-all duration-300" 
                  style={{ width: `${(adminCredits.creditsRemaining / 1000) * 100}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                Ultima generazione: {adminCredits.lastGeneratedAt ? new Date(adminCredits.lastGeneratedAt).toLocaleString('it-IT') : 'Mai'}
              </p>
            </div>

            {/* Azioni rapide Pacchetto RobS */}
            <div className="mt-4 pt-4 border-t border-blue-200">
              <div className="flex gap-2 justify-center">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="text-blue-600 border-blue-600 hover:bg-blue-100"
                  onClick={() => setActiveView("generate-direct")}
                  disabled={adminCredits.creditsRemaining <= 0}
                >
                  <Package size={16} className="mr-1" />
                  Genera IQCode Diretto
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="text-blue-600 hover:bg-blue-100"
                  onClick={fetchAdminCredits}
                >
                  Aggiorna Saldo
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Utenti Totali</p>
                <p className="text-2xl font-bold text-gray-900">
                  <StatsValue endpoint="/api/admin/stats" field="totalCodes" />
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <QrCode className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Codici Attivi</p>
                <p className="text-2xl font-bold text-gray-900">
                  <StatsValue endpoint="/api/admin/stats" field="activeUsers" />
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Strutture</p>
                <p className="text-2xl font-bold text-gray-900">
                  <StatsValue endpoint="/api/admin/stats" field="structures" />
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Partner</p>
                <p className="text-2xl font-bold text-gray-900">
                  <StatsValue endpoint="/api/admin/stats" field="partners" />
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Attività Recente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b">
                <div className="flex items-center">
                  <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                    <Users className="text-gray-600" size={16} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Nuovo turista registrato</p>
                    <p className="text-sm text-gray-500">2 minuti fa</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between py-3 border-b">
                <div className="flex items-center">
                  <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                    <QrCode className="text-gray-600" size={16} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Nuovo codice IQ generato</p>
                    <p className="text-sm text-gray-500">15 minuti fa</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conditional Rendering Based on Active View */}
      {activeView === "users" && <UsersManagement />}
      {activeView === "trash" && <TrashManagement />}
      {activeView === "iqcodes" && <CodesManagement />}
      {activeView === "generate-direct" && (
        <DirectGenerationView 
          adminCredits={adminCredits}
          onRefreshCredits={fetchAdminCredits}
        />
      )}
      {activeView === "assign-iqcodes" && (
        <AssignPackagesView 
          targetType={targetType}
          setTargetType={setTargetType}
          targetId={targetId}
          setTargetId={setTargetId}
          packageSize={packageSize}
          setPackageSize={setPackageSize}
          onAssign={handleAssignPackage}
          isAssigning={isAssigning}
        />
      )}
      {activeView === "recharges" && <AdminRechargeManagement />}
      {activeView === "reports" && <ReportsView />}
      {activeView === "stats" && <StatsView />}
      {activeView === "settings" && <SettingsView />}
    </Layout>
  );
}

// Users Management Component con Note Interne e Notifiche
function UsersManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingNote, setEditingNote] = useState<number | null>(null);
  const [noteText, setNoteText] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showUserDetailDialog, setShowUserDetailDialog] = useState(false);
  const [editingUserData, setEditingUserData] = useState<any>(null);
  const queryClient = useQueryClient();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users', { credentials: 'include' });
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Errore caricamento utenti:', error);
    } finally {
      setLoading(false);
    }
  };

  // Raggruppa utenti per categoria
  const partnerUsers = users.filter(user => user.role === 'partner');
  const structureUsers = users.filter(user => user.role === 'structure');
  const touristUsers = users.filter(user => user.role === 'tourist');

  const updateUserStatus = async (userId: number, action: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action })
      });

      if (response.ok) {
        const user = users.find(u => u.id === userId);
        if (user) {
          // Mostra pulsante per inviare notifica
          if (confirm(`${action === 'approve' ? 'Approvato' : 'Bloccato'} con successo. Inviare notifica all'utente?`)) {
            sendNotification(userId, user.code, action);
          }
        }
        fetchUsers();
      } else {
        const error = await response.json();
        alert(`Errore: ${error.message}`);
      }
    } catch (error) {
      alert('Errore nell\'aggiornamento dello stato utente');
    }
  };

  const bypassOnboarding = async (userId: number) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/bypass-onboarding`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });

      if (response.ok) {
        alert('Onboarding bypassato con successo! Partner abilitato per i test.');
        fetchUsers();
      } else {
        const error = await response.json();
        alert(`Errore: ${error.message}`);
      }
    } catch (error) {
      alert('Errore nel bypass dell\'onboarding');
    }
  };

  const moveToTrash = async (userId: number) => {
    if (!confirm('Spostare questo utente nel cestino? Potrà essere ripristinato entro 24 ore.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}/trash`, {
        method: 'PATCH',
        credentials: 'include'
      });

      if (response.ok) {
        alert('Utente spostato nel cestino');
        fetchUsers();
      } else {
        const error = await response.json();
        alert(`Errore: ${error.message}`);
      }
    } catch (error) {
      alert('Errore nello spostamento nel cestino');
    }
  };

  const updateNote = async (userId: number, note: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/note`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ note })
      });

      if (response.ok) {
        alert('Nota aggiornata con successo');
        setEditingNote(null);
        setNoteText("");
        fetchUsers();
      } else {
        const error = await response.json();
        alert(`Errore: ${error.message}`);
      }
    } catch (error) {
      alert('Errore nell\'aggiornamento della nota');
    }
  };

  const sendNotification = async (userId: number, userCode: string, action: string) => {
    const message = `Ciao, il tuo account TouristIQ ${userCode} è stato ${action === 'approve' ? 'approvato' : 'bloccato'}. ${action === 'approve' ? 'Puoi ora accedere alla piattaforma.' : 'Contatta l\'assistenza per chiarimenti.'}`;

    if (confirm(`Inviare notifica: "${message}"?\n\nNOTA: Sistema notifiche in sviluppo - attualmente simulato.`)) {
      alert('Notifica simulata inviata. Integrazione WhatsApp/Email in fase di sviluppo con API Twilio/SendGrid.');
    }
  };

  const startEditingNote = (userId: number, currentNote: string) => {
    setEditingNote(userId);
    setNoteText(currentNote || "");
  };

  const saveNote = () => {
    if (editingNote) {
      updateNote(editingNote, noteText);
    }
  };

  const cancelEditingNote = () => {
    setEditingNote(null);
    setNoteText("");
  };

  const openUserDetails = (user: any) => {
    setSelectedUser(user);
    setEditingUserData({
      assignedTo: user.assignedTo || '',
      location: user.location || '',
      status: user.status,
      internalNote: user.internalNote || '',
      isActive: user.isActive
    });
    setShowUserDetailDialog(true);
  };

  const closeUserDetails = () => {
    setSelectedUser(null);
    setEditingUserData(null);
    setShowUserDetailDialog(false);
  };

  const saveUserDetails = async () => {
    if (!selectedUser || !editingUserData) return;

    try {
      // Aggiorna dati utente
      const response = await fetch(`/api/admin/users/${selectedUser.id}/details`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(editingUserData)
      });

      if (response.ok) {
        toast({
          title: "Successo",
          description: "Dati utente aggiornati con successo"
        });
        closeUserDetails();
        fetchUsers(); // Ricarica la lista
      } else {
        const error = await response.json();
        toast({
          title: "Errore",
          description: error.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Errore",
        description: "Errore durante l'aggiornamento",
        variant: "destructive"
      });
    }
  };

  const handleEditUser = (user: any) => {
    // Estrai i dati partner dalle note interne se esistono
    let partnerData = {};
    if (user.role === 'partner' && user.internalNote) {
      try {
        const noteData = JSON.parse(user.internalNote);
        partnerData = noteData.partnerData || {};
      } catch (e) {
        console.log('Errore parsing note partner:', e);
      }
    }

    setEditingUser({
      ...user,
      partnerData
    });
    setShowEditDialog(true);
  };

  const updateUserMutation = useMutation({
    mutationFn: async (userData: any) => {
      // Prepara i dati base
      const updateData: any = {
        assignedTo: userData.assignedTo,
        location: userData.location,
        status: userData.status,
        internalNote: userData.internalNote,
        isActive: userData.isActive
      };

      // Se è un partner, aggiungi i dati specifici nelle note interne
      if (userData.role === 'partner' && userData.partnerData) {
        const existingNote = userData.internalNote ? JSON.parse(userData.internalNote || '{}') : {};
        existingNote.partnerData = userData.partnerData;
        updateData.internalNote = JSON.stringify(existingNote);
      }

      const response = await fetch(`/api/admin/users/${userData.id}/details`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });
      if (!response.ok) throw new Error('Errore aggiornamento');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Utente aggiornato",
        description: "Le modifiche sono state salvate con successo"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      setShowEditDialog(false);
      setEditingUser(null);
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Errore durante l'aggiornamento",
        variant: "destructive"
      });
    }
  });

  if (loading) {
    return <div className="text-center py-4">Caricamento utenti...</div>;
  }

  // Componente per una singola colonna di categoria
  const UserCategoryColumn = ({ title, users: categoryUsers, bgColor }: {
    title: string;
    users: any[];
    bgColor: string;
  }) => (
    <Card className="h-fit">
      <CardHeader className={`${bgColor} text-white`}>
        <CardTitle className="text-center">
          {title} ({categoryUsers.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {categoryUsers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Users size={48} className="mx-auto mb-4 opacity-50" />
            <p>Nessun {title.toLowerCase()}</p>
          </div>
        ) : (
          <div className="space-y-2 p-4">
            {categoryUsers.map((user) => (
              <div key={user.id} className="border rounded-lg p-3 hover:bg-gray-50">
                <div className="flex justify-between items-start mb-2">
                  <div className="font-mono text-sm font-medium">{user.code}</div>
                  <Badge variant={
                    user.status === 'approved' ? 'default' : 
                    user.status === 'pending' ? 'secondary' : 
                    'destructive'
                  }>
                    {user.status}
                  </Badge>
                </div>

                <div className="text-sm text-gray-600 mb-2">
                  <div><strong>Nome:</strong> {user.assignedTo || 'N/A'}</div>
                  <div><strong>Provincia:</strong> {user.location || 'N/A'}</div>
                </div>

                <div className="mb-3">
                  {editingNote === user.id ? (
                    <div className="space-y-2">
                      <Textarea
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        placeholder="Aggiungi nota interna..."
                        className="min-h-16 text-xs"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={saveNote}>Salva</Button>
                        <Button size="sm" variant="outline" onClick={cancelEditingNote}>Annulla</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2">
                      <div className="text-xs text-gray-600 flex-1">
                        <strong>Note:</strong> {user.internalNote || "Nessuna nota"}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => startEditingNote(user.id, user.internalNote)}
                        className="h-6 w-6 p-0"
                      >
                        <StickyNote size={12} />
                      </Button>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-blue-600 hover:bg-blue-50 text-xs px-2 py-1"
                    onClick={() => openUserDetails(user)}
                    title="Gestisci utente"
                  >
                    📝
                  </Button>
                  {user.status === 'pending' && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-green-600 hover:bg-green-50 text-xs px-2 py-1"
                        onClick={() => updateUserStatus(user.id, 'approve')}
                      >
                        ✅
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-orange-600 hover:bg-orange-50 text-xs px-2 py-1"
                        onClick={() => updateUserStatus(user.id, 'block')}
                      >
                        🚫
                      </Button>
                    </>
                  )}
                  {user.status === 'approved' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-orange-600 hover:bg-orange-50 text-xs px-2 py-1"
                      onClick={() => updateUserStatus(user.id, 'block')}
                    >
                      🚫
                    </Button>
                  )}
                  {user.status === 'blocked' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-green-600 hover:bg-green-50 text-xs px-2 py-1"
                      onClick={() => updateUserStatus(user.id, 'approve')}
                    >
                      ✅
                    </Button>
                  )}
                  {user.role === 'partner' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-blue-600 hover:bg-blue-50 text-xs px-2 py-1"
                      onClick={() => bypassOnboarding(user.id)}
                      title="Bypass onboarding per test"
                    >
                      🚀
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 hover:bg-red-50 text-xs px-2 py-1"
                    onClick={() => moveToTrash(user.id)}
                  >
                    🗑️
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-blue-600 hover:bg-blue-50 text-xs px-2 py-1"
                    onClick={() => handleEditUser(user)}
                  >
                    ⚙️
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Users size={20} />
        <h2 className="text-xl font-semibold">Gestione Utenti ({users.length} totali)</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <UserCategoryColumn 
          title="Partner Commerciali"
          users={partnerUsers}
          bgColor="bg-orange-500"
        />
        <UserCategoryColumn 
          title="Strutture Ricettive"
          users={structureUsers}
          bgColor="bg-blue-500"
        />
        <UserCategoryColumn 
          title="Turisti"
          users={touristUsers}
          bgColor="bg-green-500"
        />
      </div>

      {/* Dialog Dettagli Utente */}
      {showUserDetailDialog && selectedUser && editingUserData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Gestione Utente - {selectedUser.code}</h2>
              <Button variant="ghost" onClick={closeUserDetails}>✕</Button>
            </div>

            <div className="space-y-6">
              {/* Informazioni Base */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label className="font-semibold">Codice IQ</Label>
                  <p className="font-mono text-sm">{selectedUser.code}</p>
                </div>
                <div>
                  <Label className="font-semibold">Ruolo</Label>
                  <Badge variant={
                    selectedUser.role === 'admin' ? 'destructive' :
                    selectedUser.role === 'partner' ? 'default' :
                    selectedUser.role === 'structure' ? 'secondary' : 'outline'
                  }>
                    {selectedUser.role}
                  </Badge>
                </div>
                <div>
                  <Label className="font-semibold">Tipo Codice</Label>
                  <p className="text-sm">{selectedUser.codeType || 'N/A'}</p>
                </div>
                <div>
                  <Label className="font-semibold">Data Creazione</Label>
                  <p className="text-sm">{new Date(selectedUser.createdAt).toLocaleDateString('it-IT')}</p>
                </div>
              </div>

              {/* Dati Modificabili */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Dati Modificabili</h3>

                <div>
                  <Label htmlFor="assignedTo">Assegnato a</Label>
                  <Input
                    id="assignedTo"
                    value={editingUserData.assignedTo}
                    onChange={(e) => setEditingUserData({...editingUserData, assignedTo: e.target.value})}
                    placeholder="Nome persona/struttura/partner"
                  />
                </div>

                <div>
                  <Label htmlFor="location">Posizione</Label>
                  <Input
                    id="location"
                    value={editingUserData.location}
                    onChange={(e) => setEditingUserData({...editingUserData, location: e.target.value})}
                    placeholder="IT, VV, RC, ecc."
                  />
                </div>

                <div>
                  <Label htmlFor="status">Stato</Label>
                  <Select 
                    value={editingUserData.status} 
                    onValueChange={(value) => setEditingUserData({...editingUserData, status: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">In Attesa</SelectItem>
                      <SelectItem value="approved">Approvato</SelectItem>
                      <SelectItem value="blocked">Bloccato</SelectItem>
                      <SelectItem value="inactive">Inattivo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={editingUserData.isActive}
                    onChange={(e) => setEditingUserData({...editingUserData, isActive: e.target.checked})}
                  />
                  <Label htmlFor="isActive">Account Attivo</Label>
                </div>

                <div>
                  <Label htmlFor="internalNote">Note Interne</Label>
                  <Textarea
                    id="internalNote"
                    value={editingUserData.internalNote}
                    onChange={(e) => setEditingUserData({...editingUserData, internalNote: e.target.value})}
                    placeholder="Note private per l'amministrazione"
                    rows={4}
                  />
                </div>
              </div>

              {/* Azioni Rapide */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Azioni Rapide</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedUser.status !== 'approved' && (
                    <Button
                      variant="outline"
                      className="text-green-600 hover:bg-green-50"
                      onClick={() => {
                        updateUserStatus(selectedUser.id, 'approve');
                        setEditingUserData({...editingUserData, status: 'approved'});
                      }}
                    >
                      ✅ Approva
                    </Button>
                  )}
                  {selectedUser.status !== 'blocked' && (
                    <Button
                      variant="outline"
                      className="text-orange-600 hover:bg-orange-50"
                      onClick={() => {
                        updateUserStatus(selectedUser.id, 'block');
                        setEditingUserData({...editingUserData, status: 'blocked'});
                      }}
                    >
                      🚫 Blocca
                    </Button>
                  )}
                  {selectedUser.role === 'partner' && (
                    <Button
                      variant="outline"
                      className="text-blue-600 hover:bg-blue-50"
                      onClick={() => bypassOnboarding(selectedUser.id)}
                    >
                      🚀 Bypass Onboarding
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    className="text-red-600 hover:bg-red-50"
                    onClick={() => {
                      moveToTrash(selectedUser.id);
                      closeUserDetails();
                    }}
                  >
                    🗑️ Sposta nel Cestino
                  </Button>
                </div>
              </div>

              {/* Statistiche Aggiuntive */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg">
                <div>
                  <Label className="font-semibold">Approvato da</Label>
                  <p className="text-sm">{selectedUser.approvedBy || 'Non ancora approvato'}</p>
                </div>
                <div>
                  <Label className="font-semibold">Data Approvazione</Label>
                  <p className="text-sm">
                    {selectedUser.approvedAt 
                      ? new Date(selectedUser.approvedAt).toLocaleDateString('it-IT')
                      : 'Non ancora approvato'
                    }
                  </p>
                </div>
              </div>

              {/* Pulsanti Azione */}
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button variant="outline" onClick={closeUserDetails}>
                  Annulla
                </Button>
                <Button onClick={saveUserDetails}>
                  Salva Modifiche
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
        {/* Dialog Modifica Utente */}
          <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  Modifica {editingUser?.role === 'partner' ? 'Partner' : 'Utente'}: {editingUser?.code}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                {/* Informazioni Base */}
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-3">Informazioni Base</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="editAssignedTo">Nome/Attività</Label>
                      <Input
                        id="editAssignedTo"
                        value={editingUser?.assignedTo || ""}
                        onChange={(e) => setEditingUser({...editingUser, assignedTo: e.target.value})}
                        placeholder="Nome o ragione sociale"
                      />
                    </div>
                    <div>
                      <Label htmlFor="editLocation">Posizione</Label>
                      <Input
                        id="editLocation"
                        value={editingUser?.location || ""}
                        onChange={(e) => setEditingUser({...editingUser, location: e.target.value})}
                        placeholder="es: VV, RC, IT"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <Label htmlFor="editStatus">Stato</Label>
                      <select
                        id="editStatus"
                        value={editingUser?.status || "pending"}
                        onChange={(e) => setEditingUser({...editingUser, status: e.target.value})}
                        className="w-full p-2 border rounded"
                      >
                        <option value="pending">In Attesa</option>
                        <option value="approved">Approvato</option>
                        <option value="blocked">Bloccato</option>
                        <option value="inactive">Inattivo</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="editActive">Attivo</Label>
                      <select
                        id="editActive"
                        value={editingUser?.isActive ? "true" : "false"}
                        onChange={(e) => setEditingUser({...editingUser, isActive: e.target.value === "true"})}
                        className="w-full p-2 border rounded"
                      >
                        <option value="true">Sì</option>
                        <option value="false">No</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Sezione Partner - Solo se è un partner */}
                {editingUser?.role === 'partner' && (
                  <div className="border rounded-lg p-4 bg-orange-50">
                    <h3 className="font-semibold mb-3 text-orange-800">Configurazione Partner</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="partnerBusinessType">Tipo Attività</Label>
                        <select
                          id="partnerBusinessType"
                          value={editingUser?.partnerData?.businessType || "ristorante"}
                          onChange={(e) => setEditingUser({
                            ...editingUser, 
                            partnerData: {...(editingUser?.partnerData || {}), businessType: e.target.value}
                          })}
                          className="w-full p-2 border rounded"
                        >
                          <option value="ristorante">Ristorante</option>
                          <option value="hotel">Hotel</option>
                          <option value="negozio">Negozio</option>
                          <option value="attrazione">Attrazione</option>
                          <option value="servizio">Servizio</option>
                          <option value="altro">Altro</option>
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="partnerPhone">Telefono</Label>
                        <Input
                          id="partnerPhone"
                          value={editingUser?.partnerData?.phone || ""}
                          onChange={(e) => setEditingUser({
                            ...editingUser, 
                            partnerData: {...(editingUser?.partnerData || {}), phone: e.target.value}
                          })}
                          placeholder="+39 123 456 7890"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div>
                        <Label htmlFor="partnerEmail">Email</Label>
                        <Input
                          id="partnerEmail"
                          type="email"
                          value={editingUser?.partnerData?.email || ""}
                          onChange={(e) => setEditingUser({
                            ...editingUser, 
                            partnerData: {...(editingUser?.partnerData || {}), email: e.target.value}
                          })}
                          placeholder="info@partner.com"
                        />
                      </div>
                      <div>
                        <Label htmlFor="partnerWebsite">Sito Web</Label>
                        <Input
                          id="partnerWebsite"
                          value={editingUser?.partnerData?.website || ""}
                          onChange={(e) => setEditingUser({
                            ...editingUser, 
                            partnerData: {...(editingUser?.partnerData || {}), website: e.target.value}
                          })}
                          placeholder="https://www.partner.com"
                        />
                      </div>
                    </div>

                    <div className="mt-4">
                      <Label htmlFor="partnerAddress">Indirizzo Completo</Label>
                      <Input
                        id="partnerAddress"
                        value={editingUser?.partnerData?.address || ""}
                        onChange={(e) => setEditingUser({
                          ...editingUser, 
                          partnerData: {...(editingUser?.partnerData || {}), address: e.target.value}
                        })}
                        placeholder="Via Roma 123, 89900 Vibo Valentia (VV)"
                      />
                    </div>

                    <div className="mt-4">
                      <Label htmlFor="partnerDescription">Descrizione Attività</Label>
                      <Textarea
                        id="partnerDescription"
                        value={editingUser?.partnerData?.description || ""}
                        onChange={(e) => setEditingUser({
                          ...editingUser, 
                          partnerData: {...(editingUser?.partnerData || {}), description: e.target.value}
                        })}
                        placeholder="Descrizione dettagliata dell'attività e dei servizi offerti"
                        rows={3}
                      />
                    </div>

                    {/* Caratteristiche Accessibilità */}
                    <div className="mt-4">
                      <Label className="text-sm font-medium">Caratteristiche</Label>
                      <div className="grid grid-cols-3 gap-4 mt-2">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="wheelchairAccessible"
                            checked={editingUser?.partnerData?.wheelchairAccessible || false}
                            onChange={(e) => setEditingUser({
                              ...editingUser, 
                              partnerData: {...(editingUser?.partnerData || {}), wheelchairAccessible: e.target.checked}
                            })}
                          />
                          <Label htmlFor="wheelchairAccessible" className="text-sm">Accessibile disabili</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="childFriendly"
                            checked={editingUser?.partnerData?.childFriendly || false}
                            onChange={(e) => setEditingUser({
                              ...editingUser, 
                              partnerData: {...(editingUser?.partnerData || {}), childFriendly: e.target.checked}
                            })}
                          />
                          <Label htmlFor="childFriendly" className="text-sm">Child Friendly</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="glutenFree"
                            checked={editingUser?.partnerData?.glutenFree || false}
                            onChange={(e) => setEditingUser({
                              ...editingUser, 
                              partnerData: {...(editingUser?.partnerData || {}), glutenFree: e.target.checked}
                            })}
                          />
                          <Label htmlFor="glutenFree" className="text-sm">Senza Glutine</Label>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Note Interne */}
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-3">Note Amministrative</h3>
                  <div>
                    <Label htmlFor="editNote">Note Interne</Label>
                    <Textarea
                      id="editNote"
                      value={editingUser?.internalNote || ""}
                      onChange={(e) => setEditingUser({...editingUser, internalNote: e.target.value})}
                      placeholder="Note private dell'amministratore"
                      rows={3}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowEditDialog(false)}
                    className="flex-1"
                  >
                    Annulla
                  </Button>
                  <Button
                    onClick={handleUpdateUser}
                    disabled={updateUserMutation.isPending}
                    className="flex-1"
                  >
                    {updateUserMutation.isPending ? "Salvataggio..." : "Salva Modifiche"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
    </div>
  );
}

// Cestino Temporaneo Management
function TrashManagement() {
  const [deletedUsers, setDeletedUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDeletedUsers();
  }, []);

  const fetchDeletedUsers = async () => {
    try {
      const response = await fetch('/api/admin/trash', { credentials: 'include' });
      const data = await response.json();
      setDeletedUsers(data.users || []);
    } catch (error) {
      console.error('Errore caricamento cestino:', error);
    } finally {
      setLoading(false);
    }
  };

  const restoreUser = async (userId: number) => {
    if (!confirm('Ripristinare questo utente?')) return;

    try {
      const response = await fetch(`/api/admin/users/${userId}/restore`, {
        method: 'PATCH',
        credentials: 'include'
      });

      if (response.ok) {
        alert('Utente ripristinato con successo');
        fetchDeletedUsers();
      } else {
        const error = await response.json();
        alert(`Errore: ${error.message}`);
      }
    } catch (error) {
      alert('Errore nel ripristino');
    }
  };

  const permanentDelete = async (userId: number) => {
    if (!confirm('ATTENZIONE: Questa azione eliminerà DEFINITIVAMENTE l\'utente. Continuare?')) return;

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        alert('Utente eliminato definitivamente');
        fetchDeletedUsers();
      } else {
        const error = await response.json();
        alert(`Errore: ${error.message}`);
      }
    } catch (error) {
      alert('Errore nell\'eliminazione definitiva');
    }
  };

  if (loading) {
    return <div className="text-center py-4">Caricamento cestino...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trash2 size={20} />
          Cestino Temporaneo ({deletedUsers.length})
          <Badge variant="secondary" className="ml-2">Auto-cleanup 24h</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {deletedUsers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Trash2 size={48} className="mx-auto mb-4 opacity-50" />
            <p>Cestino vuoto</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Codice</th>
                  <th className="text-left p-2">Ruolo</th>
                  <th className="text-left p-2">Assegnato a</th>
                  <th className="text-left p-2">Eliminato il</th>
                  <th className="text-left p-2">Note</th>
                  <th className="text-left p-2">Azioni</th>
                </tr>
              </thead>
              <tbody>
                {deletedUsers.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-gray-50">
                    <td className="p-2 font-mono text-sm">{user.code}</td>
                    <td className="p-2">
                      <Badge variant="outline">{user.role}</Badge>
                    </td>
                    <td className="p-2">{user.assignedTo || 'N/A'}</td>
                    <td className="p-2 text-sm text-gray-600">
                      {user.deletedAt ? new Date(user.deletedAt).toLocaleString('it-IT') : 'N/A'}
                    </td>
                    <td className="p-2 text-sm text-gray-600 max-w-xs truncate">
                      {user.internalNote || 'Nessuna nota'}
                    </td>
                    <td className="p-2">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 hover:bg-green-50"
                          onClick={() => restoreUser(user.id)}
                        >
                          <RotateCcw size={16} className="mr-1" />
                          Ripristina
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:bg-red-50"
                          onClick={() => permanentDelete(user.id)}
                        >
                          Elimina Subito
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Reportistica Strategica IQCode
function ReportsView() {
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await fetch('/api/admin/reports', { credentials: 'include' });
      const data = await response.json();
      setReportData(data);
    } catch (error) {
      console.error('Errore caricamento report:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-4">Generazione report...</div>;
  }

  if (!reportData) {
    return <div className="text-center py-4 text-red-600">Errore nel caricamento dei report</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp size={20} />
            TouristIQ Insight - Reportistica Strategica
          </CardTitle>
          <p className="text-sm text-gray-600">
            Ultimo aggiornamento: {new Date(reportData.lastUpdated).toLocaleString('it-IT')}
          </p>
        </CardHeader>
        <CardContent>
          {/* Overview Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <p className="text-2xl font-bold text-blue-600">{reportData.overview.totalActiveCodes}</p>
              <p className="text-sm text-blue-800">Codici Attivi</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <p className="text-2xl font-bold text-green-600">{reportData.overview.professionalCodes}</p>
              <p className="text-sm text-green-800">Professionali</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg text-center">
              <p className="text-2xl font-bold text-purple-600">{reportData.overview.emotionalCodes}</p>
              <p className="text-sm text-purple-800">Emozionali</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg text-center">
              <p className="text-2xl font-bold text-yellow-600">{reportData.overview.pendingApproval}</p>
              <p className="text-sm text-yellow-800">In Attesa</p>
            </div>
            <div className="bg-emerald-50 p-4 rounded-lg text-center">
              <p className="text-2xl font-bold text-emerald-600">{reportData.overview.approvedCodes}</p>
              <p className="text-sm text-emerald-800">Approvati</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg text-center">
              <p className="text-2xl font-bold text-red-600">{reportData.overview.blockedCodes}</p>
              <p className="text-sm text-red-800">Bloccati</p>
            </div>
          </div>

          {/* Distribuzione per Ruolo */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-3">Distribuzione per Ruolo</h3>
              <div className="space-y-2">
                {Object.entries(reportData.roleDistribution).map(([role, count]) => (
                  <div key={role} className="flex justify-between items-center">
                    <span className="capitalize">{role}</span>
                    <Badge variant="secondary">{count as number}</Badge>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Distribuzione per Location</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {Object.entries(reportData.locationDistribution)
                  .sort(([,a], [,b]) => (b as number) - (a as number))
                  .slice(0, 10)
                  .map(([location, count]) => (
                    <div key={location} className="flex justify-between items-center">
                      <span>{location}</span>
                      <Badge variant="outline">{count as number}</Badge>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Top Strutture e Partner */}
          <div className="grid md:grid-cols-2 gap-6 mt-6">
            <div>
              <h3 className="font-semibold mb-3">Top Strutture (per attivazioni)</h3>
              <div className="space-y-2">
                {reportData.topStructures.slice(0, 5).map((item: any, index: number) => (
                  <div key={item.name} className="flex justify-between items-center">
                    <span className="text-sm">#{index + 1} {item.name}</span>
                    <Badge variant="secondary">{item.count}</Badge>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Top Partner (per attivazioni)</h3>
              <div className="space-y-2">
                {reportData.topPartners.slice(0, 5).map((item: any, index: number) => (
                  <div key={item.name} className="flex justify-between items-center">
                    <span className="text-sm">#{index + 1} {item.name}</span>
                    <Badge variant="secondary">{item.count}</Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Crescita nel tempo */}
          <div className="mt-6">
            <h3 className="font-semibold mb-3">Crescita per Mese</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {reportData.growthByMonth.slice(-6).map((item: any) => (
                <div key={item.month} className="bg-gray-50 p-3 rounded text-center">
                  <p className="text-lg font-bold text-gray-800">{item.count}</p>
                  <p className="text-xs text-gray-600">{item.month}</p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Altri componenti esistenti rimangono invariati
function CodesManagement() {
  const [codes, setCodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCodes();
  }, []);

  const fetchCodes = async () => {
    try {
      const response = await fetch('/api/admin/iqcodes', { credentials: 'include' });
      const data = await response.json();
      setCodes(data.codes || []);
    } catch (error) {
      console.error('Errore caricamento codici:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-4">Caricamento codici...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Codici IQ Generati ({codes.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Codice</th>
                <th className="text-left p-2">Ruolo</th>
                <th className="text-left p-2">Tipo</th>
                <th className="text-left p-2">Assegnato a</th>
                <th className="text-left p-2">Data Creazione</th>
                <th className="text-left p-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {codes.map((code) => (
                <tr key={code.id} className="border-b hover:bg-gray-50">
                  <td className="p-2 font-mono text-sm">{code.code}</td>
                  <td className="p-2">
                    <Badge variant={code.role === 'admin' ? 'destructive' : 'secondary'}>
                      {code.role}
                    </Badge>
                  </td>
                  <td className="p-2">
                    <Badge variant={code.codeType === 'emotional' ? 'default' : 'outline'}>
                      {code.codeType || 'N/A'}
                    </Badge>
                  </td>
                  <td className="p-2">{code.assignedTo || 'N/A'}</td>
                  <td className="p-2 text-sm">
                    {new Date(code.createdAt).toLocaleDateString('it-IT')}
                  </td>
                  <td className="p-2">
                    <Badge variant={code.isActive ? 'default' : 'secondary'}>
                      {code.isActive ? 'Attivo' : 'Inattivo'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function StatsView() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Statistiche Dettagliate</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center p-6 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-800">Utenti Totali</h3>
            <p className="text-3xl font-bold text-blue-600">
              <StatsValue endpoint="/api/admin/stats" field="totalCodes" />
            </p>
          </div>
          <div className="text-center p-6 bg-green-50 rounded-lg">
            <h3 className="text-lg font-semibold text-green-800">Utenti Attivi</h3>
            <p className="text-3xl font-bold text-green-600">
              <StatsValue endpoint="/api/admin/stats" field="activeUsers" />
            </p>
          </div>
          <div className="text-center p-6 bg-purple-50 rounded-lg">
            <h3 className="text-lg font-semibold text-purple-800">Strutture</h3>
            <p className="text-3xl font-bold text-purple-600">
              <StatsValue endpoint="/api/admin/stats" field="structures" />
            </p>
          </div>
          <div className="text-center p-6 bg-orange-50 rounded-lg">
            <h3 className="text-lg font-semibold text-orange-800">Partner</h3>
            <p className="text-3xl font-bold text-orange-600">
              <StatsValue endpoint="/api/admin/stats" field="partners" />
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AssignPackagesView({ 
  targetType, setTargetType, targetId, setTargetId, 
  packageSize, setPackageSize, onAssign, isAssigning 
}: any) {
  const [structures, setStructures] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);

  useEffect(() => {
    fetchTargets();
  }, []);

  const fetchTargets = async () => {
    try {
      const response = await fetch('/api/structures', { credentials: 'include' });
      const data = await response.json();
      setStructures(data.structures || []);

      // Recupera anche i partner approvati
      const partnerResponse = await fetch('/api/admin/partners', { credentials: 'include' });
      const partnerData = await partnerResponse.json();
      setPartners(partnerData.partners || []);
    } catch (error) {
      console.error('Errore caricamento destinatari:', error);
    }
  };

  function getStructureName(code: string): string {
    const parts = code.split('-');
    if (parts.length >= 4) {
      const id = parts[3];
      const names: { [key: string]: string } = {
        '9576': 'Resort Capo Vaticano',
        '4334': 'Grand Hotel Reggio',
        '7541': 'Hotel Calabria Mare',
        '2567': 'Sole e Mare Hotel'
      };
      return names[id] || `Struttura ${id}`;
    }
    return 'Struttura Sconosciuta';
  }

  function getPartnerName(code: string): string {
    const parts = code.split('-');
    if (parts.length >= 4) {
      const id = parts[3];
      const names: { [key: string]: string } = {
        '8654': 'Ristorante Roma Centro',
        '3421': 'Bar Tropical Vibo',
        '9876': 'Pizzeria Calabrese'
      };
      return names[id] || `Partner ${id}`;
    }
    return 'Partner Sconosciuto';
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assegna Pacchetti IQCode</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="targetType">Tipo Destinatario</Label>
            <Select value={targetType} onValueChange={setTargetType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="structure">Struttura</SelectItem>
                <SelectItem value="partner">Partner</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="targetId">Destinatario</Label>
            <Select value={targetId} onValueChange={setTargetId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleziona destinatario" />
              </SelectTrigger>
              <SelectContent>
                {targetType === 'structure' 
                  ? structures.map((struct) => (
                      <SelectItem key={struct.code} value={struct.code}>
                        {getStructureName(struct.code)} ({struct.code})
                      </SelectItem>
                    ))
                  : partners.map((partner) => (
                      <SelectItem key={partner.code} value={partner.code}>
                        {getPartnerName(partner.code)} ({partner.code})
                      </SelectItem>
                    ))
                }
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="packageSize">Dimensione Pacchetto</Label>
            <Select value={packageSize.toString()} onValueChange={(val) => setPackageSize(parseInt(val))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="25">25 crediti</SelectItem>
                <SelectItem value="50">50 crediti</SelectItem>
                <SelectItem value="75">75 crediti</SelectItem>
                <SelectItem value="100">100 crediti</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button 
          onClick={onAssign} 
          disabled={isAssigning || !targetId}
          className="w-full"
        >
          {isAssigning ? 'Assegnazione in corso...' : 'Assegna Pacchetto'}
        </Button>
      </CardContent>
    </Card>
  );
}

// Componente per generazione diretta IQCode dal Pacchetto RobS
function DirectGenerationView({ adminCredits, onRefreshCredits }: { adminCredits: any; onRefreshCredits: () => void }) {
  const [codeType, setCodeType] = useState<'emotional' | 'professional'>('emotional');
  const [role, setRole] = useState<'tourist' | 'structure' | 'partner'>('tourist');
  const [country, setCountry] = useState('IT');
  const [province, setProvince] = useState('VV');
  const [assignedTo, setAssignedTo] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastGenerated, setLastGenerated] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!assignedTo.trim()) {
      alert('Inserisci il nome del destinatario');
      return;
    }

    if (codeType === 'emotional' && adminCredits?.creditsRemaining <= 0) {
      alert('Pacchetto RobS esaurito. Non puoi generare codici emozionali.');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/genera-iqcode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          codeType,
          role,
          country: codeType === 'emotional' ? country : undefined,
          province: codeType === 'professional' ? province : undefined,
          assignedTo: assignedTo.trim()
        })
      });

      if (response.ok) {
        const result = await response.json();
        setLastGenerated(result.code);
        alert(`IQCode generato con successo: ${result.code}`);
        onRefreshCredits(); // Aggiorna il saldo
        setAssignedTo('');
      } else {
        const error = await response.json();
        alert(`Errore: ${error.message}`);
      }
    } catch (error) {
      alert('Errore nella generazione del codice');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package size={20} />
          Generazione Diretta IQCode - Pacchetto RobS
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            Uso Interno Admin
          </Badge>
        </CardTitle>
        <p className="text-sm text-gray-600">
          Genera IQCode direttamente dal tuo pacchetto personale da 1000 crediti
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Saldo visibile */}
        {adminCredits && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-medium">Crediti rimanenti:</span>
              <span className="text-xl font-bold text-green-600">
                {adminCredits.creditsRemaining} / 1000
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-green-500 h-2 rounded-full" 
                style={{ width: `${(adminCredits.creditsRemaining / 1000) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Form di generazione */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="codeType">Tipo Codice</Label>
            <Select value={codeType} onValueChange={(val: 'emotional' | 'professional') => setCodeType(val)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="emotional">Emozionale (scala crediti)</SelectItem>
                <SelectItem value="professional">Professionale (illimitato)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="role">Ruolo Utente</Label>
            <Select value={role} onValueChange={(val: 'tourist' | 'structure' | 'partner') => setRole(val)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tourist">Turista</SelectItem>
                <SelectItem value="structure">Struttura</SelectItem>
                <SelectItem value="partner">Partner</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {codeType === 'emotional' ? (
            <div>
              <Label htmlFor="country">Paese</Label>
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IT">🇮🇹 Italia</SelectItem>
                  <SelectItem value="FR">🇫🇷 Francia</SelectItem>
                  <SelectItem value="ES">🇪🇸 Spagna</SelectItem>
                  <SelectItem value="DE">🇩🇪 Germania</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div>
              <Label htmlFor="province">Provincia</Label>
              <Select value={province} onValueChange={setProvince}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VV">Vibo Valentia</SelectItem>
                  <SelectItem value="RC">Reggio Calabria</SelectItem>
                  <SelectItem value="CS">Cosenza</SelectItem>
                  <SelectItem value="CZ">Catanzaro</SelectItem>
                  <SelectItem value="KR">Crotone</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="md:col-span-2">
            <Label htmlFor="assignedTo">Assegnato a</Label>
            <Input
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              placeholder="Nome destinatario del codice IQ"
            />
          </div>
        </div>

        {/* Avvisi */}
        {codeType === 'emotional' && (
          <div className="bg-orange-50 border border-orange-200 p-3 rounded-lg">
            <p className="text-sm text-orange-700">
              ⚠️ I codici emozionali scalano dal tuo Pacchetto RobS ({adminCredits?.creditsRemaining || 0} rimanenti)
            </p>
          </div>
        )}

        {codeType === 'professional' && (
          <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
            <p className="text-sm text-green-700">
              ✅ I codici professionali sono illimitati e non scalano crediti
            </p>
          </div>
        )}

        {/* Ultimo codice generato */}
        {lastGenerated && (
          <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
            <p className="text-sm text-blue-700">
              🎯 Ultimo codice generato: <span className="font-mono font-bold">{lastGenerated}</span>
            </p>
          </div>
        )}

        {/* Pulsante generazione */}
        <Button 
          onClick={handleGenerate}
          disabled={isGenerating || (codeType === 'emotional' && adminCredits?.creditsRemaining <= 0)}
          className="w-full"
          size="lg"
        >
          {isGenerating ? 'Generazione in corso...' : 'Genera IQCode'}
        </Button>
      </CardContent>
    </Card>
  );
}

function SettingsView() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Impostazioni Sistema</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <Label>Nome Piattaforma</Label>
            <Input defaultValue="TouristIQ" />
          </div>
          <div>
            <Label>Email Supporto</Label>
            <Input defaultValue="support@touristiq.com" />
          </div>
          <div>
            <Label>Messaggio di Benvenuto</Label>
            <Textarea defaultValue="Benvenuto nella piattaforma TouristIQ" />
          </div>
          <div>
            <Label>Max Codici per Giorno</Label>
            <Input type="number" defaultValue="100" />
          </div>
          <Button>Salva Impostazioni</Button>
        </div>
      </CardContent>
    </Card>
  );
}
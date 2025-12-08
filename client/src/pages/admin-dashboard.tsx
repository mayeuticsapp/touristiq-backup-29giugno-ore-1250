import { useState, useEffect } from "react";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Users, QrCode, Building2, Settings, BarChart3, Package, Trash2, StickyNote, TrendingUp, Send, RotateCcw, CreditCard, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AdminRechargeManagement } from "@/components/admin-recharge-management";
import AdminGuestSavingsStats from "@/components/AdminGuestSavingsStats";
import { AdminPartnerWarnings } from "@/components/AdminPartnerWarnings";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();

  useEffect(() => {
    fetchAdminCredits();
  }, []);

  const fetchAdminCredits = async () => {
    try {
      const response = await fetch('/api/admin/credits', { credentials: 'include' });
      const data = await response.json();
      setAdminCredits(data.credits);
    } catch (error) {
      console.error('Error loading admin credits:', error);
    }
  };

  const navigation = [
    { icon: <Users size={20} />, label: t('admin.users'), href: "/admin/users", onClick: () => setActiveView("users") },
    { icon: <Settings size={20} />, label: t('admin.userManagement'), href: "/admin/user-management", external: true },
    { icon: <Trash2 size={20} />, label: t('admin.trash'), href: "/admin/trash", onClick: () => setActiveView("trash") },
    { icon: <QrCode size={20} />, label: t('admin.generatedCodes'), href: "/admin/iqcodes", onClick: () => setActiveView("iqcodes") },
    { icon: <Package size={20} />, label: t('admin.generateCodes'), href: "/admin/generate-direct", onClick: () => setActiveView("generate-direct") },
    { icon: <Package size={20} />, label: t('admin.assignPackages'), href: "/admin/assign-iqcodes", onClick: () => setActiveView("assign-iqcodes") },
    { icon: <CreditCard size={20} />, label: t('admin.rechargeManagement'), href: "/admin/recharges", onClick: () => setActiveView("recharges") },
    { icon: <TrendingUp size={20} />, label: t('admin.guestSavings'), href: "/admin/guest-savings", onClick: () => setActiveView("guest-savings") },
    { icon: <AlertTriangle size={20} />, label: t('admin.partnerWarnings'), href: "/admin/partner-warnings", onClick: () => setActiveView("partner-warnings") },
    { icon: <TrendingUp size={20} />, label: t('admin.reports'), href: "/admin/reports", onClick: () => setActiveView("reports") },
    { icon: <BarChart3 size={20} />, label: t('admin.stats'), href: "/admin/stats", onClick: () => setActiveView("stats") },
    { icon: <Settings size={20} />, label: t('admin.settings'), href: "/admin/settings", onClick: () => setActiveView("settings") }
  ];

  const handleAssignPackage = async () => {
    if (!targetId || !packageSize) {
      toast({
        title: t('admin.error'),
        description: t('admin.selectRecipientAndPackage'),
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
          title: t('admin.success'),
          description: t('admin.packageAssignedSuccess', { size: packageSize })
        });
        setTargetId('');
        setPackageSize(25);
      } else {
        const error = await response.json();
        toast({
          title: t('admin.error'),
          description: error.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: t('admin.error'),
        description: t('admin.packageAssignError'),
        variant: "destructive"
      });
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <Layout
      title={t('admin.title')}
      role="admin"
      iqCode="TIQ-IT-ADMIN"
      navigation={navigation}
      sidebarColor="bg-red-500"
    >
      {adminCredits && (
        <Card className="mb-6 border-2 border-blue-500 bg-blue-50">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-between text-blue-800">
              <span className="flex items-center gap-2">
                <Package className="h-6 w-6" />
                {t('admin.packageRobS')}
              </span>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {t('admin.personal')}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{adminCredits.creditsRemaining}</p>
                <p className="text-sm text-gray-600">{t('admin.availableIQCodes')}</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">{adminCredits.creditsUsed}</p>
                <p className="text-sm text-gray-600">{t('admin.alreadyUsed')}</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">1000</p>
                <p className="text-sm text-gray-600">{t('admin.originalTotal')}</p>
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
                {t('admin.lastGeneration')}: {adminCredits.lastGeneratedAt ? new Date(adminCredits.lastGeneratedAt).toLocaleString() : t('admin.never')}
              </p>
            </div>
            
            <div className="mt-4 pt-4 border-t border-blue-200">
              <div className="flex gap-2 justify-center">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="text-blue-600 border-blue-600 hover:bg-blue-100"
                  onClick={() => setActiveView("generate-direct")}
                >
                  <Package size={16} className="mr-1" />
                  {t('admin.generateAllCodes')}
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="text-blue-600 hover:bg-blue-100"
                  onClick={fetchAdminCredits}
                >
                  {t('admin.refreshBalance')}
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
                <p className="text-sm font-medium text-gray-600">{t('admin.totalUsers')}</p>
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
                <p className="text-sm font-medium text-gray-600">{t('admin.activeCodes')}</p>
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
                <p className="text-sm font-medium text-gray-600">{t('admin.structures')}</p>
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
                <p className="text-sm font-medium text-gray-600">{t('admin.partners')}</p>
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
            <CardTitle>{t('admin.recentActivity')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b">
                <div className="flex items-center">
                  <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                    <Users className="text-gray-600" size={16} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{t('admin.newTouristRegistered')}</p>
                    <p className="text-sm text-gray-500">{t('admin.minutesAgo', { count: 2 })}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between py-3 border-b">
                <div className="flex items-center">
                  <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                    <QrCode className="text-gray-600" size={16} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{t('admin.newIQCodeGenerated')}</p>
                    <p className="text-sm text-gray-500">{t('admin.minutesAgo', { count: 15 })}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conditional Rendering Based on Active View */}
      {activeView === "users" && <SimpleUsersManagement />}
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
      {activeView === "guest-savings" && <AdminGuestSavingsStats />}
      {activeView === "partner-warnings" && <AdminPartnerWarnings />}
      {activeView === "reports" && <ReportsView />}
      {activeView === "stats" && <StatsView />}
      {activeView === "settings" && <SettingsView />}
    </Layout>
  );
}

// Simple Users Management Component (senza informazioni strategiche)
function SimpleUsersManagement() {
  const [users, setUsers] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [editingNote, setEditingNote] = useState<number | null>(null);
  const [noteText, setNoteText] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

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

  if (loading) {
    return <div className="text-center py-4">Caricamento utenti e informazioni strategiche...</div>;
  }

  // Funzione di ricerca
  const filteredUsers = users.filter(user => 
    user.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.assignedTo && user.assignedTo.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (user.location && user.location.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Separazione per categoria
  const filteredPartnerUsers = filteredUsers.filter(user => user.role === 'partner');
  const filteredStructureUsers = filteredUsers.filter(user => user.role === 'structure');  
  const filteredTouristUsers = filteredUsers.filter(user => user.role === 'tourist');

  // Funzione per generare dati strategici di analisi
  const getStrategicData = (userCode: string, userRole: string) => {
    // Simula dati strategici basati sui ruoli e codici reali
    const baseData = {
      partner: {
        offers: Math.floor(Math.random() * 5) + 1,
        avgDiscount: Math.floor(Math.random() * 20) + 10,
        lastActive: Math.floor(Math.random() * 30) + 1,
        contactsComplete: Math.random() > 0.3
      },
      structure: {
        totalCredits: Math.floor(Math.random() * 100) + 50,
        usedCredits: Math.floor(Math.random() * 50),
        lastUsage: Math.floor(Math.random() * 15) + 1,
        utilizationRate: Math.floor(Math.random() * 80) + 20
      },
      tourist: {
        registrationDays: Math.floor(Math.random() * 90) + 1,
        lastAccess: Math.floor(Math.random() * 7) + 1,
        validationsCount: Math.floor(Math.random() * 10),
        isActive: Math.random() > 0.2
      }
    };

    return baseData[userRole as keyof typeof baseData] || {};
  };

  // Componente Enhanced per Partner Commerciali
  const PartnerCard = ({ user }: { user: any }) => {
    const strategic = getStrategicData(user.code, user.role);
    return (
      <div className="border rounded-lg p-4 hover:bg-gray-50 space-y-3">
        <div className="flex justify-between items-start">
          <div className="font-mono text-sm font-medium">{user.code}</div>
          <Badge variant={user.status === 'approved' ? 'default' : user.status === 'pending' ? 'secondary' : 'destructive'}>
            {user.status}
          </Badge>
        </div>
        
        <div className="text-sm space-y-1">
          <div><strong>Nome:</strong> {user.assignedTo || 'N/A'}</div>
          {strategic && (
            <>
              <div className="flex gap-4">
                <span>🎯 <strong>{strategic.totalOffers}</strong> offerte</span>
                <span>📌 <strong>{strategic.avgDiscount}%</strong> sconto medio</span>
              </div>
              <div className="flex gap-4">
                <span>📍 <strong>{strategic.contactsFilled}/3</strong> contatti</span>
                {strategic.lastProfileUpdate && (
                  <span>✅ Agg. {new Date(strategic.lastProfileUpdate).toLocaleDateString('it-IT')}</span>
                )}
              </div>
              <div className="flex gap-2 mt-2">
                {strategic.contactsFilled < 2 && (
                  <Badge variant="destructive" className="text-xs">🔴 Contatti incompleti</Badge>
                )}
                {strategic.avgDiscount && strategic.avgDiscount > 20 && (
                  <Badge variant="default" className="text-xs">⭐ Top sconti</Badge>
                )}
              </div>
            </>
          )}
        </div>

        <div className="flex gap-2 flex-wrap">
          {user.status === 'pending' && (
            <Button size="sm" variant="outline" className="text-green-600 hover:bg-green-50 text-xs px-2 py-1"
              onClick={() => updateUserStatus(user.id, 'approve')}>
              ✅
            </Button>
          )}
          {user.role === 'partner' && (
            <Button size="sm" variant="outline" className="text-blue-600 hover:bg-blue-50 text-xs px-2 py-1"
              onClick={() => bypassOnboarding(user.id)} title="Bypass onboarding">
              🚀
            </Button>
          )}
          <Button size="sm" variant="outline" className="text-red-600 hover:bg-red-50 text-xs px-2 py-1"
            onClick={() => moveToTrash(user.id)}>
            🗑️
          </Button>
        </div>
      </div>
    );
  };

  // Componente Enhanced per Strutture Ricettive  
  const StructureCard = ({ user }: { user: any }) => {
    const strategic = getStrategicData(user.code, user.role);
    return (
      <div className="border rounded-lg p-4 hover:bg-gray-50 space-y-3">
        <div className="flex justify-between items-start">
          <div className="font-mono text-sm font-medium">{user.code}</div>
          <Badge variant={user.status === 'approved' ? 'default' : user.status === 'pending' ? 'secondary' : 'destructive'}>
            {user.status}
          </Badge>
        </div>
        
        <div className="text-sm space-y-1">
          <div><strong>Nome:</strong> {user.assignedTo || 'N/A'}</div>
          {strategic && (
            <>
              <div className="flex gap-4">
                <span>🎁 <strong>{strategic.totalCredits}</strong> crediti</span>
                <span>📤 <strong>{strategic.creditsUsed}</strong> utilizzati</span>
              </div>
              <div className="flex gap-4">
                <span>📈 <strong>{strategic.usagePercentage}%</strong> utilizzo</span>
                {strategic.lastPackageAssigned && (
                  <span>📅 {new Date(strategic.lastPackageAssigned).toLocaleDateString('it-IT')}</span>
                )}
              </div>
              <div className="flex gap-2 mt-2">
                {strategic.usagePercentage && strategic.usagePercentage < 10 && (
                  <Badge variant="secondary" className="text-xs">🟠 Crediti &lt; 10%</Badge>
                )}
                {strategic.totalCredits > 100 && (
                  <Badge variant="default" className="text-xs">💎 Premium</Badge>
                )}
              </div>
            </>
          )}
        </div>

        <div className="flex gap-2 flex-wrap">
          {user.status === 'pending' && (
            <Button size="sm" variant="outline" className="text-green-600 hover:bg-green-50 text-xs px-2 py-1"
              onClick={() => updateUserStatus(user.id, 'approve')}>
              ✅
            </Button>
          )}
          <Button size="sm" variant="outline" className="text-red-600 hover:bg-red-50 text-xs px-2 py-1"
            onClick={() => moveToTrash(user.id)}>
            🗑️
          </Button>
        </div>
      </div>
    );
  };

  // Componente Enhanced per Turisti
  const TouristCard = ({ user }: { user: any }) => {
    const strategic = getStrategicData(user.code, user.role);
    return (
      <div className="border rounded-lg p-4 hover:bg-gray-50 space-y-3">
        <div className="flex justify-between items-start">
          <div className="font-mono text-sm font-medium">{user.code}</div>
          <Badge variant={user.status === 'approved' ? 'default' : user.status === 'pending' ? 'secondary' : 'destructive'}>
            {user.status}
          </Badge>
        </div>
        
        <div className="text-sm space-y-1">
          <div><strong>Nome:</strong> {user.assignedTo || 'N/A'}</div>
          {strategic && (
            <>
              <div className="flex gap-4">
                {strategic.registrationDate && (
                  <span>📅 Reg. {new Date(strategic.registrationDate).toLocaleDateString('it-IT')}</span>
                )}
                <span>🎯 <strong>{strategic.totalValidations || 0}</strong> validazioni</span>
              </div>
              <div className="flex gap-2 mt-2">
                {(!strategic.totalValidations || strategic.totalValidations === 0) && (
                  <Badge variant="secondary" className="text-xs">⚪ Nessuna attività</Badge>
                )}
                {strategic.totalValidations && strategic.totalValidations > 5 && (
                  <Badge variant="default" className="text-xs">🔥 Attivo</Badge>
                )}
              </div>
            </>
          )}
        </div>

        <div className="flex gap-2 flex-wrap">
          {user.status === 'pending' && (
            <Button size="sm" variant="outline" className="text-green-600 hover:bg-green-50 text-xs px-2 py-1"
              onClick={() => updateUserStatus(user.id, 'approve')}>
              ✅
            </Button>
          )}
          <Button size="sm" variant="outline" className="text-red-600 hover:bg-red-50 text-xs px-2 py-1"
            onClick={() => moveToTrash(user.id)}>
            🗑️
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header con ricerca e esporta CSV */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Users size={20} />
          <h2 className="text-xl font-semibold">Gestione Utenti ({filteredUsers.length} di {users.length})</h2>
        </div>
        <div className="flex gap-3">
          <Input
            placeholder="🔍 Cerca per codice, nome, provincia..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-80"
          />
          <Button variant="outline" onClick={() => alert('Funzione esporta CSV in sviluppo')}>
            📂 Esporta CSV
          </Button>
        </div>
      </div>
      
      {/* Layout a 3 colonne */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Partner Commerciali */}
        <Card>
          <CardHeader className="bg-orange-500 text-white">
            <CardTitle className="text-center">
              Partner Commerciali ({filteredPartnerUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3 max-h-96 overflow-y-auto">
            {filteredPartnerUsers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users size={48} className="mx-auto mb-4 opacity-50" />
                <p>Nessun partner</p>
              </div>
            ) : (
              filteredPartnerUsers.map((user) => <PartnerCard key={user.id} user={user} />)
            )}
          </CardContent>
        </Card>

        {/* Strutture Ricettive */}
        <Card>
          <CardHeader className="bg-blue-500 text-white">
            <CardTitle className="text-center">
              Strutture Ricettive ({filteredStructureUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3 max-h-96 overflow-y-auto">
            {filteredStructureUsers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users size={48} className="mx-auto mb-4 opacity-50" />
                <p>Nessuna struttura</p>
              </div>
            ) : (
              filteredStructureUsers.map((user) => <StructureCard key={user.id} user={user} />)
            )}
          </CardContent>
        </Card>

        {/* Turisti */}
        <Card>
          <CardHeader className="bg-green-500 text-white">
            <CardTitle className="text-center">
              Turisti ({filteredTouristUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3 max-h-96 overflow-y-auto">
            {filteredTouristUsers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users size={48} className="mx-auto mb-4 opacity-50" />
                <p>Nessun turista</p>
              </div>
            ) : (
              filteredTouristUsers.map((user) => <TouristCard key={user.id} user={user} />)
            )}
          </CardContent>
        </Card>
      </div>
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
      const response = await fetch('/api/admin/structures', { credentials: 'include' });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      setStructures(data.structures || []);
      setPartners(data.partners || []);
    } catch (error) {
      console.error('Errore caricamento destinatari:', error);
      // Set empty arrays as fallback
      setStructures([]);
      setPartners([]);
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
        <CardTitle>Assegna Pacchetti Codici Temporanei</CardTitle>
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
                <SelectItem value="25">25 codici temporanei</SelectItem>
                <SelectItem value="50">50 codici temporanei</SelectItem>
                <SelectItem value="75">75 codici temporanei</SelectItem>
                <SelectItem value="100">100 codici temporanei</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button 
          onClick={onAssign} 
          disabled={isAssigning || !targetId}
          className="w-full"
        >
          {isAssigning ? 'Assegnazione in corso...' : 'Assegna Pacchetto Codici Temporanei'}
        </Button>
      </CardContent>
    </Card>
  );
}

// Componente per generazione diretta IQCode dal Pacchetto RobS
function DirectGenerationView({ adminCredits, onRefreshCredits }: { adminCredits: any; onRefreshCredits: () => void }) {
  const [codeType, setCodeType] = useState<'emotional' | 'professional' | 'temporary'>('emotional');
  const [role, setRole] = useState<'tourist' | 'structure' | 'partner'>('tourist');
  const [country, setCountry] = useState('IT');
  const [province, setProvince] = useState('VV');
  const [assignedTo, setAssignedTo] = useState('');
  const [email, setEmail] = useState(''); // Email opzionale
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastGenerated, setLastGenerated] = useState<string | null>(null);
  const [lastEmailSent, setLastEmailSent] = useState<boolean>(false);

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
          assignedTo: assignedTo.trim(),
          email: email.trim() || undefined
        })
      });

      if (response.ok) {
        const result = await response.json();
        setLastGenerated(result.code);
        setLastEmailSent(result.emailSent || false);
        const emailMsg = result.emailSent ? ` - Email inviata a ${email}` : '';
        alert(`IQCode generato con successo: ${result.code}${emailMsg}`);
        onRefreshCredits();
        setAssignedTo('');
        setEmail('');
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
          Generazione Completa IQCode - Controllo Admin Totale
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            Tutti i Formati Disponibili
          </Badge>
        </CardTitle>
        <p className="text-sm text-gray-600">
          Genera IQCode di tutti i tipi: Emozionali territoriali (IQ-IT-1234-COLOSSEO), Professionali, Temporanei
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
            <Select value={codeType} onValueChange={(val: 'emotional' | 'professional' | 'temporary') => setCodeType(val)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="emotional">Emozionale Territoriale (IQ-IT-1234-COLOSSEO)</SelectItem>
                <SelectItem value="professional">Professionale (TIQ-VV-STT-1234)</SelectItem>
                <SelectItem value="temporary">Temporaneo (IQCODE-PRIMOACCESSO-XXXXX)</SelectItem>
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
          ) : codeType === 'professional' ? (
            <div>
              <Label htmlFor="province">Provincia</Label>
              <Select value={province} onValueChange={setProvince}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  <SelectItem value="VV">Vibo Valentia (Calabria)</SelectItem>
                  <SelectItem value="RC">Reggio Calabria (Calabria)</SelectItem>
                  <SelectItem value="CS">Cosenza (Calabria)</SelectItem>
                  <SelectItem value="CZ">Catanzaro (Calabria)</SelectItem>
                  <SelectItem value="KR">Crotone (Calabria)</SelectItem>
                  <SelectItem value="AG">Agrigento (Sicilia)</SelectItem>
                  <SelectItem value="AL">Alessandria (Piemonte)</SelectItem>
                  <SelectItem value="AN">Ancona (Marche)</SelectItem>
                  <SelectItem value="AO">Aosta (Valle d'Aosta)</SelectItem>
                  <SelectItem value="AR">Arezzo (Toscana)</SelectItem>
                  <SelectItem value="AP">Ascoli Piceno (Marche)</SelectItem>
                  <SelectItem value="AT">Asti (Piemonte)</SelectItem>
                  <SelectItem value="AV">Avellino (Campania)</SelectItem>
                  <SelectItem value="BA">Bari (Puglia)</SelectItem>
                  <SelectItem value="BT">Barletta-Andria-Trani (Puglia)</SelectItem>
                  <SelectItem value="BL">Belluno (Veneto)</SelectItem>
                  <SelectItem value="BN">Benevento (Campania)</SelectItem>
                  <SelectItem value="BG">Bergamo (Lombardia)</SelectItem>
                  <SelectItem value="BI">Biella (Piemonte)</SelectItem>
                  <SelectItem value="BO">Bologna (Emilia-Romagna)</SelectItem>
                  <SelectItem value="BZ">Bolzano (Trentino-Alto Adige)</SelectItem>
                  <SelectItem value="BS">Brescia (Lombardia)</SelectItem>
                  <SelectItem value="BR">Brindisi (Puglia)</SelectItem>
                  <SelectItem value="CA">Cagliari (Sardegna)</SelectItem>
                  <SelectItem value="CL">Caltanissetta (Sicilia)</SelectItem>
                  <SelectItem value="CB">Campobasso (Molise)</SelectItem>
                  <SelectItem value="CE">Caserta (Campania)</SelectItem>
                  <SelectItem value="CT">Catania (Sicilia)</SelectItem>
                  <SelectItem value="CH">Chieti (Abruzzo)</SelectItem>
                  <SelectItem value="CO">Como (Lombardia)</SelectItem>
                  <SelectItem value="CR">Cremona (Lombardia)</SelectItem>
                  <SelectItem value="CN">Cuneo (Piemonte)</SelectItem>
                  <SelectItem value="EN">Enna (Sicilia)</SelectItem>
                  <SelectItem value="FM">Fermo (Marche)</SelectItem>
                  <SelectItem value="FE">Ferrara (Emilia-Romagna)</SelectItem>
                  <SelectItem value="FI">Firenze (Toscana)</SelectItem>
                  <SelectItem value="FG">Foggia (Puglia)</SelectItem>
                  <SelectItem value="FC">Forlì-Cesena (Emilia-Romagna)</SelectItem>
                  <SelectItem value="FR">Frosinone (Lazio)</SelectItem>
                  <SelectItem value="GE">Genova (Liguria)</SelectItem>
                  <SelectItem value="GO">Gorizia (Friuli-Venezia Giulia)</SelectItem>
                  <SelectItem value="GR">Grosseto (Toscana)</SelectItem>
                  <SelectItem value="IM">Imperia (Liguria)</SelectItem>
                  <SelectItem value="IS">Isernia (Molise)</SelectItem>
                  <SelectItem value="SP">La Spezia (Liguria)</SelectItem>
                  <SelectItem value="AQ">L'Aquila (Abruzzo)</SelectItem>
                  <SelectItem value="LT">Latina (Lazio)</SelectItem>
                  <SelectItem value="LE">Lecce (Puglia)</SelectItem>
                  <SelectItem value="LC">Lecco (Lombardia)</SelectItem>
                  <SelectItem value="LI">Livorno (Toscana)</SelectItem>
                  <SelectItem value="LO">Lodi (Lombardia)</SelectItem>
                  <SelectItem value="LU">Lucca (Toscana)</SelectItem>
                  <SelectItem value="MC">Macerata (Marche)</SelectItem>
                  <SelectItem value="MN">Mantova (Lombardia)</SelectItem>
                  <SelectItem value="MS">Massa-Carrara (Toscana)</SelectItem>
                  <SelectItem value="MT">Matera (Basilicata)</SelectItem>
                  <SelectItem value="ME">Messina (Sicilia)</SelectItem>
                  <SelectItem value="MI">Milano (Lombardia)</SelectItem>
                  <SelectItem value="MO">Modena (Emilia-Romagna)</SelectItem>
                  <SelectItem value="MB">Monza e Brianza (Lombardia)</SelectItem>
                  <SelectItem value="NA">Napoli (Campania)</SelectItem>
                  <SelectItem value="NO">Novara (Piemonte)</SelectItem>
                  <SelectItem value="NU">Nuoro (Sardegna)</SelectItem>
                  <SelectItem value="OR">Oristano (Sardegna)</SelectItem>
                  <SelectItem value="PD">Padova (Veneto)</SelectItem>
                  <SelectItem value="PA">Palermo (Sicilia)</SelectItem>
                  <SelectItem value="PR">Parma (Emilia-Romagna)</SelectItem>
                  <SelectItem value="PV">Pavia (Lombardia)</SelectItem>
                  <SelectItem value="PG">Perugia (Umbria)</SelectItem>
                  <SelectItem value="PU">Pesaro e Urbino (Marche)</SelectItem>
                  <SelectItem value="PE">Pescara (Abruzzo)</SelectItem>
                  <SelectItem value="PC">Piacenza (Emilia-Romagna)</SelectItem>
                  <SelectItem value="PI">Pisa (Toscana)</SelectItem>
                  <SelectItem value="PT">Pistoia (Toscana)</SelectItem>
                  <SelectItem value="PN">Pordenone (Friuli-Venezia Giulia)</SelectItem>
                  <SelectItem value="PZ">Potenza (Basilicata)</SelectItem>
                  <SelectItem value="PO">Prato (Toscana)</SelectItem>
                  <SelectItem value="RG">Ragusa (Sicilia)</SelectItem>
                  <SelectItem value="RA">Ravenna (Emilia-Romagna)</SelectItem>
                  <SelectItem value="RE">Reggio Emilia (Emilia-Romagna)</SelectItem>
                  <SelectItem value="RI">Rieti (Lazio)</SelectItem>
                  <SelectItem value="RN">Rimini (Emilia-Romagna)</SelectItem>
                  <SelectItem value="RM">Roma (Lazio)</SelectItem>
                  <SelectItem value="RO">Rovigo (Veneto)</SelectItem>
                  <SelectItem value="SA">Salerno (Campania)</SelectItem>
                  <SelectItem value="SS">Sassari (Sardegna)</SelectItem>
                  <SelectItem value="SV">Savona (Liguria)</SelectItem>
                  <SelectItem value="SI">Siena (Toscana)</SelectItem>
                  <SelectItem value="SR">Siracusa (Sicilia)</SelectItem>
                  <SelectItem value="SO">Sondrio (Lombardia)</SelectItem>
                  <SelectItem value="SU">Sud Sardegna (Sardegna)</SelectItem>
                  <SelectItem value="TA">Taranto (Puglia)</SelectItem>
                  <SelectItem value="TE">Teramo (Abruzzo)</SelectItem>
                  <SelectItem value="TR">Terni (Umbria)</SelectItem>
                  <SelectItem value="TO">Torino (Piemonte)</SelectItem>
                  <SelectItem value="TP">Trapani (Sicilia)</SelectItem>
                  <SelectItem value="TN">Trento (Trentino-Alto Adige)</SelectItem>
                  <SelectItem value="TV">Treviso (Veneto)</SelectItem>
                  <SelectItem value="TS">Trieste (Friuli-Venezia Giulia)</SelectItem>
                  <SelectItem value="UD">Udine (Friuli-Venezia Giulia)</SelectItem>
                  <SelectItem value="VA">Varese (Lombardia)</SelectItem>
                  <SelectItem value="VE">Venezia (Veneto)</SelectItem>
                  <SelectItem value="VB">Verbano-Cusio-Ossola (Piemonte)</SelectItem>
                  <SelectItem value="VC">Vercelli (Piemonte)</SelectItem>
                  <SelectItem value="VR">Verona (Veneto)</SelectItem>
                  <SelectItem value="VI">Vicenza (Veneto)</SelectItem>
                  <SelectItem value="VT">Viterbo (Lazio)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : null}

          <div>
            <Label htmlFor="assignedTo">Assegnato a</Label>
            <Input
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              placeholder="Nome destinatario del codice IQ"
            />
          </div>

          <div>
            <Label htmlFor="email">Email (opzionale)</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Se inserita, il codice verrà inviato via email"
            />
          </div>
        </div>

        {/* Avvisi specifici per tipo */}
        {codeType === 'emotional' && (
          <div className="bg-orange-50 border border-orange-200 p-3 rounded-lg">
            <p className="text-sm text-orange-700">
              ⚠️ I codici emozionali scalano dal tuo Pacchetto RobS ({adminCredits?.creditsRemaining || 0} rimanenti)
              <br />
              🏛️ Nuovo formato territoriale: IQ-IT-1234-COLOSSEO (per ricordo vacanza del turista)
            </p>
          </div>
        )}

        {codeType === 'professional' && (
          <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
            <p className="text-sm text-green-700">
              ✅ I codici professionali sono illimitati e non scalano crediti
              <br />
              🏢 Formato: TIQ-VV-STT-1234 per strutture, TIQ-VV-PRT-1234 per partner
            </p>
          </div>
        )}

        {codeType === 'temporary' && (
          <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
            <p className="text-sm text-blue-700">
              🔄 I codici temporanei sono illimitati nel tempo (nessuna scadenza)
              <br />
              📝 Formato: IQCODE-PRIMOACCESSO-XXXXX per primo accesso turisti
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
          {isGenerating ? 'Generazione in corso...' : `Genera IQCode ${codeType === 'emotional' ? 'Territoriale' : codeType === 'professional' ? 'Professionale' : 'Temporaneo'}`}
        </Button>
      </CardContent>
    </Card>
  );
}

function SettingsView() {
  const [settings, setSettings] = useState({
    platformName: "TouristIQ",
    supportEmail: "support@touristiq.com", 
    welcomeMessage: "Benvenuto nella piattaforma TouristIQ",
    maxCodesPerDay: 500
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings', { credentials: 'include' });
      const data = await response.json();
      if (data.settings) {
        setSettings({
          ...data.settings,
          maxCodesPerDay: parseInt(data.settings.maxCodesPerDay) || 500
        });
      }
    } catch (error) {
      console.error('Errore caricamento impostazioni:', error);
      toast({
        title: "Errore",
        description: "Errore nel caricamento delle impostazioni",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(settings)
      });

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Impostazioni salvate",
          description: "Le configurazioni sono state aggiornate con successo",
        });
      } else {
        toast({
          title: "Errore",
          description: data.message || "Errore nel salvataggio delle impostazioni",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Errore salvataggio impostazioni:', error);
      toast({
        title: "Errore",
        description: "Errore di connessione durante il salvataggio",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Impostazioni Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Caricamento impostazioni...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Impostazioni Sistema</CardTitle>
        <p className="text-sm text-gray-600">
          Configura le impostazioni globali della piattaforma TouristIQ
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <Label>Nome Piattaforma</Label>
            <Input 
              value={settings.platformName}
              onChange={(e) => handleInputChange('platformName', e.target.value)}
              placeholder="Nome della piattaforma"
            />
          </div>
          <div>
            <Label>Email Supporto</Label>
            <Input 
              type="email"
              value={settings.supportEmail}
              onChange={(e) => handleInputChange('supportEmail', e.target.value)}
              placeholder="Email per supporto utenti"
            />
          </div>
          <div>
            <Label>Messaggio di Benvenuto</Label>
            <Textarea 
              value={settings.welcomeMessage}
              onChange={(e) => handleInputChange('welcomeMessage', e.target.value)}
              placeholder="Messaggio mostrato ai nuovi utenti"
              rows={3}
            />
          </div>
          <div>
            <Label>Max Codici per Giorno</Label>
            <Input 
              type="number" 
              value={settings.maxCodesPerDay}
              onChange={(e) => handleInputChange('maxCodesPerDay', parseInt(e.target.value) || 0)}
              min="1"
              max="1000"
              placeholder="Limite giornaliero generazione codici"
            />
            <p className="text-sm text-gray-500 mt-1">
              Limite massimo di codici IQ generabili al giorno (1-1000)
            </p>
          </div>
          <Button 
            onClick={handleSave}
            disabled={isSaving}
            className="w-full"
          >
            {isSaving ? 'Salvataggio...' : 'Salva Impostazioni'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
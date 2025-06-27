import { useState, useEffect } from "react";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, QrCode, Building2, Settings, BarChart3, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();

  const navigation = [
    { icon: <Users size={20} />, label: "Utenti", href: "/admin/users", onClick: () => setActiveView("users") },
    { icon: <QrCode size={20} />, label: "Codici Generati", href: "/admin/iqcodes", onClick: () => setActiveView("iqcodes") },
    { icon: <Package size={20} />, label: "Assegna Pacchetti", href: "/admin/assign-iqcodes", onClick: () => setActiveView("assign-iqcodes") },
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
      const response = await fetch('/api/assign-package', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          recipientIqCode: targetId,
          packageSize: packageSize
        })
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Pacchetto Assegnato",
          description: `${packageSize} crediti assegnati con successo a ${targetId}`
        });
        setTargetId('');
        setPackageSize(25);
      } else {
        const error = await response.json();
        toast({
          title: "Errore",
          description: error.message || "Errore durante l'assegnazione",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Errore",
        description: "Errore di connessione",
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
      {activeView === "users" && (
        <UsersManagement />
      )}
      
      {activeView === "iqcodes" && (
        <CodesManagement />
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
      
      {activeView === "stats" && (
        <StatsView />
      )}
      
      {activeView === "settings" && (
        <SettingsView />
      )}
    </Layout>
  );
}

// Users Management Component - CON PACCHETTO ROBS
function UsersManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminCredits, setAdminCredits] = useState<any>(null);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUserRole, setNewUserRole] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [newUserProvince, setNewUserProvince] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const updateUserStatus = async (userId: number, action: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action })
      });

      if (response.ok) {
        alert(`Utente ${action === 'approve' ? 'approvato' : action === 'block' ? 'bloccato' : 'aggiornato'} con successo`);
        window.location.reload();
      } else {
        const error = await response.json();
        alert(`Errore: ${error.message}`);
      }
    } catch (error) {
      alert('Errore nell\'aggiornamento dello stato utente');
    }
  };

  const deleteUser = async (userId: number) => {
    if (!confirm('Sei sicuro di voler cancellare questo utente? Questa azione è irreversibile.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        alert('Utente cancellato con successo');
        window.location.reload();
      } else {
        const error = await response.json();
        alert(`Errore: ${error.message}`);
      }
    } catch (error) {
      alert('Errore nella cancellazione dell\'utente');
    }
  };

  useEffect(() => {
    // Carica utenti
    fetch('/api/admin/users', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        setUsers(data.users || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
    
    // Carica crediti admin
    fetch('/api/admin/credits', { credentials: 'include' })
      .then(res => res.json())
      .then(data => setAdminCredits(data.credits))
      .catch(() => console.log('Error loading admin credits'));
  }, []);

  const handleAddUser = async () => {
    if (!newUserRole || !newUserName || (newUserRole !== 'tourist' && !newUserProvince)) {
      alert("Compila tutti i campi richiesti");
      return;
    }

    if (adminCredits && adminCredits.creditsRemaining <= 0) {
      alert("Hai finito i tuoi 1000 codici, oh Grande RobS 😅");
      return;
    }

    setIsCreating(true);
    try {
      const payload = newUserRole === 'tourist' 
        ? {
            codeType: "emotional",
            role: newUserRole,
            country: "IT",
            assignedTo: newUserName
          }
        : {
            codeType: "professional", 
            role: newUserRole,
            province: newUserProvince,
            assignedTo: newUserName
          };

      const response = await fetch("/api/genera-iqcode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Utente creato con successo!\nCodice IQ: ${result.code}`);
        setShowAddUser(false);
        setNewUserRole("");
        setNewUserName("");
        setNewUserProvince("");
        
        // Ricarica dati
        window.location.reload();
      } else {
        const error = await response.json();
        alert(`Errore: ${error.message}`);
      }
    } catch (error) {
      console.error("Errore creazione utente:", error);
      alert("Errore durante la creazione dell'utente");
    } finally {
      setIsCreating(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Caricamento utenti...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Pacchetto RobS */}
      <Card>
        <CardHeader>
          <CardTitle className="text-green-600">📦 Pacchetto RobS</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-semibold">
                Crediti rimanenti: <span className="text-green-600">{adminCredits?.creditsRemaining || 1000}</span>
              </p>
              <p className="text-sm text-gray-600">
                Codici utilizzati: {adminCredits?.creditsUsed || 0}/1000
              </p>
            </div>
            <div className="text-right">
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full" 
                  style={{ width: `${((adminCredits?.creditsRemaining || 1000) / 1000) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add User Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Genera Nuovo Codice IQ
            <Button 
              onClick={() => setShowAddUser(!showAddUser)}
              variant={showAddUser ? "outline" : "default"}
              disabled={adminCredits && adminCredits.creditsRemaining <= 0}
            >
              {showAddUser ? "Annulla" : "Nuovo Codice"}
            </Button>
          </CardTitle>
        </CardHeader>
        {showAddUser && (
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="userRole">Tipo Utente</Label>
                <Select value={newUserRole} onValueChange={setNewUserRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona ruolo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tourist">Turista</SelectItem>
                    <SelectItem value="structure">Struttura</SelectItem>
                    <SelectItem value="partner">Partner</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="userName">Nome/Descrizione</Label>
                <Input
                  id="userName"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="es. Mario Rossi"
                />
              </div>

              {newUserRole !== 'tourist' && (
                <div>
                  <Label htmlFor="userProvince">Provincia</Label>
                  <Select value={newUserProvince} onValueChange={setNewUserProvince}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona provincia" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="VV">Vibo Valentia</SelectItem>
                      <SelectItem value="RC">Reggio Calabria</SelectItem>
                      <SelectItem value="CS">Cosenza</SelectItem>
                      <SelectItem value="KR">Crotone</SelectItem>
                      <SelectItem value="CZ">Catanzaro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="mt-4">
              <Button 
                onClick={handleAddUser} 
                disabled={isCreating || !newUserRole || !newUserName}
                className="w-full"
              >
                {isCreating ? "Generando..." : "Genera Codice IQ"}
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Users List con Gestione */}
      <Card>
        <CardHeader>
          <CardTitle>Gestione Utenti ({users.length})</CardTitle>
          <p className="text-sm text-gray-600">Approva, blocca o cancella utenti per controllo editoriale</p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Codice IQ</th>
                  <th className="text-left py-2">Ruolo</th>
                  <th className="text-left py-2">Assegnato</th>
                  <th className="text-left py-2">Status</th>
                  <th className="text-left py-2">Tipo</th>
                  <th className="text-left py-2">Azioni</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b">
                    <td className="py-2 font-mono">{user.code}</td>
                    <td className="py-2">
                      <Badge variant={
                        user.role === 'admin' ? 'destructive' :
                        user.role === 'structure' ? 'default' :
                        user.role === 'partner' ? 'secondary' : 'outline'
                      }>
                        {user.role}
                      </Badge>
                    </td>
                    <td className="py-2 text-xs">{user.assignedTo || 'Non assegnato'}</td>
                    <td className="py-2">
                      <Badge variant={
                        user.status === 'approved' ? 'default' :
                        user.status === 'blocked' ? 'destructive' :
                        user.status === 'inactive' ? 'secondary' : 'outline'
                      }>
                        {user.status === 'approved' ? 'Approvato' :
                         user.status === 'blocked' ? 'Bloccato' :
                         user.status === 'inactive' ? 'Inattivo' : 'In Attesa'}
                      </Badge>
                    </td>
                    <td className="py-2">
                      <Badge variant="outline" className={
                        user.codeType === 'emotional' ? 'text-purple-600' : 'text-blue-600'
                      }>
                        {user.codeType === 'emotional' ? 'Emozionale' : 'Professionale'}
                      </Badge>
                    </td>
                    <td className="py-2">
                      {user.code !== 'TIQ-IT-ADMIN' ? (
                        <div className="flex space-x-1">
                          {user.status !== 'approved' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 hover:bg-green-50 text-xs px-2 py-1"
                              onClick={() => updateUserStatus(user.id, 'approve')}
                            >
                              ✓
                            </Button>
                          )}
                          {user.status !== 'blocked' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-orange-600 hover:bg-orange-50 text-xs px-2 py-1"
                              onClick={() => updateUserStatus(user.id, 'block')}
                            >
                              🚫
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:bg-red-50 text-xs px-2 py-1"
                            onClick={() => deleteUser(user.id)}
                          >
                            🗑️
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500">Admin</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CodesManagement() {
  const [codes, setCodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/iqcodes', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        setCodes(data.codes || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-center py-8">Caricamento codici...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Codici IQ Generati ({codes.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Codice</th>
                <th className="text-left py-2">Ruolo</th>
                <th className="text-left py-2">Data Creazione</th>
              </tr>
            </thead>
            <tbody>
              {codes.map((code, index) => (
                <tr key={index} className="border-b">
                  <td className="py-2 font-mono">{code.code}</td>
                  <td className="py-2">
                    <Badge variant={
                      code.role === 'admin' ? 'destructive' :
                      code.role === 'structure' ? 'default' :
                      code.role === 'partner' ? 'secondary' : 'outline'
                    }>
                      {code.role}
                    </Badge>
                  </td>
                  <td className="py-2">{new Date(code.createdAt).toLocaleDateString('it-IT')}</td>
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
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        setStats(data.stats || {});
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-center py-8">Caricamento statistiche...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Utenti per Ruolo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Admin:</span>
              <Badge variant="destructive">{stats.admins || 0}</Badge>
            </div>
            <div className="flex justify-between">
              <span>Strutture:</span>
              <Badge variant="default">{stats.structures || 0}</Badge>
            </div>
            <div className="flex justify-between">
              <span>Partner:</span>
              <Badge variant="secondary">{stats.partners || 0}</Badge>
            </div>
            <div className="flex justify-between">
              <span>Turisti:</span>
              <Badge variant="outline">{stats.tourists || 0}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Attività Recente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Login oggi:</span>
              <span className="font-semibold">{stats.dailyLogins || 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Codici generati:</span>
              <span className="font-semibold">{stats.codesGenerated || 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Sessioni attive:</span>
              <span className="font-semibold">{stats.activeSessions || 0}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AssignPackagesView({ 
  targetType, setTargetType, targetId, setTargetId, 
  packageSize, setPackageSize, onAssign, isAssigning 
}: any) {
  const [availableTargets, setAvailableTargets] = useState<any[]>([]);

  function getStructureName(code: string): string {
    const structureNames: { [key: string]: string } = {
      'TIQ-VV-STT-0700': 'Hotel Calabria',
      'TIQ-VV-STT-9576': 'Resort Capo Vaticano',
      'TIQ-CS-STT-7541': 'Grand Hotel Cosenza',
      'TIQ-RC-STT-4334': 'Grand Hotel Reggio'
    };
    return structureNames[code] || code;
  }

  function getPartnerName(code: string): string {
    const partnerNames: { [key: string]: string } = {
      'TIQ-VV-PRT-4897': 'Hotel Centrale Pizzo',
      'TIQ-RC-PRT-8654': 'Ristorante Marina'
    };
    return partnerNames[code] || code;
  }

  useEffect(() => {
    const endpoint = targetType === 'structure' ? '/api/admin/structures' : '/api/admin/partners';
    fetch(endpoint, { credentials: 'include' })
      .then(res => res.json())
      .then(data => setAvailableTargets(data.users || []))
      .catch(() => setAvailableTargets([]));
  }, [targetType]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assegna Pacchetto Crediti</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Tipo Destinatario</Label>
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
            <Label>Destinatario</Label>
            <Select value={targetId} onValueChange={setTargetId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleziona destinatario" />
              </SelectTrigger>
              <SelectContent>
                {availableTargets.map((target) => (
                  <SelectItem key={target.code} value={target.code}>
                    {targetType === 'structure' 
                      ? getStructureName(target.code)
                      : getPartnerName(target.code)
                    } ({target.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Dimensione Pacchetto</Label>
            <Select value={packageSize.toString()} onValueChange={(value) => setPackageSize(Number(value))}>
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

        <div className="mt-6">
          <Button 
            onClick={onAssign} 
            disabled={isAssigning || !targetId}
            className="w-full"
          >
            {isAssigning ? "Assegnando..." : "Assegna Pacchetto"}
          </Button>
        </div>
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
        <div className="space-y-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="font-semibold text-green-800">Sistema Crediti Attivo</h3>
            <p className="text-green-700 text-sm mt-1">
              Il sistema di assegnazione pacchetti è operativo. 
              Le strutture e i partner possono generare codici IQ emozionali dai crediti assegnati.
            </p>
          </div>
          
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-800">Database PostgreSQL</h3>
            <p className="text-blue-700 text-sm mt-1">
              Connessione al database persistente attiva. 
              Tutti i dati vengono salvati permanentemente.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BarChart3, Users, QrCode, Settings, TrendingUp, Handshake, Percent, Copy, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getCurrentUser } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";

export default function AdminDashboard({ activeSection: propActiveSection }: { activeSection?: string }) {
  const [codeType, setCodeType] = useState(""); // "emotional" or "professional"
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeView, setActiveView] = useState(propActiveSection || "overview"); // overview, users, codes, stats, settings

  // Update activeView when propActiveSection changes
  useEffect(() => {
    if (propActiveSection) {
      setActiveView(propActiveSection);
    }
  }, [propActiveSection]);

  const { data: user } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: getCurrentUser,
  });

  const countries = [
    { code: "IT", name: "Italia", flag: "🇮🇹" },
    { code: "ES", name: "España", flag: "🇪🇸" },
    { code: "FR", name: "France", flag: "🇫🇷" },
    { code: "JP", name: "日本", flag: "🇯🇵" }
  ];

  const provinces = [
    { code: "RM", name: "Roma", region: "Lazio" },
    { code: "MI", name: "Milano", region: "Lombardia" },
    { code: "NA", name: "Napoli", region: "Campania" },
    { code: "TO", name: "Torino", region: "Piemonte" },
    { code: "PA", name: "Palermo", region: "Sicilia" },
    { code: "GE", name: "Genova", region: "Liguria" },
    { code: "BO", name: "Bologna", region: "Emilia-Romagna" },
    { code: "FI", name: "Firenze", region: "Toscana" },
    { code: "BA", name: "Bari", region: "Puglia" },
    { code: "CA", name: "Cagliari", region: "Sardegna" },
    { code: "VE", name: "Venezia", region: "Veneto" },
    { code: "CT", name: "Catania", region: "Sicilia" }
  ];

  const roles = [
    { value: "tourist", label: "Turista" },
    { value: "structure", label: "Struttura" },
    { value: "partner", label: "Partner" },
    { value: "admin", label: "Amministratore" }
  ];

  const codeTypes = [
    { value: "emotional", label: "Emozionale (per turisti)", description: "TIQ-IT-LEONARDO" },
    { value: "professional", label: "Professionale (per aziende)", description: "TIQ-RM-PRT-0001" }
  ];

  const handleGenerateCode = async () => {
    if (!codeType || !selectedRole) return;
    if (codeType === "emotional" && !selectedCountry) return;
    if (codeType === "professional" && !selectedProvince) return;

    setIsGenerating(true);
    try {
      const requestBody = {
        codeType,
        role: selectedRole,
        assignedTo,
        ...(codeType === "emotional" ? { country: selectedCountry } : { province: selectedProvince })
      };

      const response = await fetch("/api/genera-iqcode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Include cookies for session
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Errore durante la generazione");
      }
      
      setGeneratedCode(data.code);
      
      // Reset form after successful generation
      setCodeType("");
      setSelectedCountry("");
      setSelectedProvince("");
      setSelectedRole("");
      setAssignedTo("");
      setCopied(false);
      
    } catch (error) {
      console.error("Errore generazione codice:", error);
      // Show error to user
      alert(`Errore: ${(error as Error).message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const navigation = [
    { icon: <BarChart3 size={16} />, label: "Dashboard", href: "/admin", onClick: () => setActiveView("overview") },
    { icon: <Users size={16} />, label: "Gestione Utenti", href: "/admin/users", onClick: () => setActiveView("users") },
    { icon: <QrCode size={16} />, label: "Codici IQ", href: "/admin/iqcodes", onClick: () => setActiveView("iqcodes") },
    { icon: <TrendingUp size={16} />, label: "Statistiche", href: "/admin/stats", onClick: () => setActiveView("stats") },
    { icon: <Settings size={16} />, label: "Impostazioni", href: "/admin/settings", onClick: () => setActiveView("settings") },
  ];

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Caricamento...</h2>
          <p className="text-gray-600">Sto caricando il pannello amministratore</p>
        </div>
      </div>
    );
  }

  return (
    <Layout
      title="Dashboard Amministratore"
      role="Admin Panel"
      iqCode={user.iqCode}
      navigation={navigation}
      sidebarColor="bg-tourist-blue"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-full">
                <Users className="text-blue-600" size={20} />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Utenti Totali</p>
                <p className="text-2xl font-semibold text-gray-900">1,234</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-full">
                <QrCode className="text-green-600" size={20} />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Codici Attivi</p>
                <p className="text-2xl font-semibold text-gray-900">567</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-full">
                <Handshake className="text-yellow-600" size={20} />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Partner</p>
                <p className="text-2xl font-semibold text-gray-900">89</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-full">
                <Percent className="text-purple-600" size={20} />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Sconti Utilizzati</p>
                <p className="text-2xl font-semibold text-gray-900">2,345</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Generatore Codici IQ */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode size={20} />
              Generatore Codici IQ Emozionali
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="codeType">Tipo di Codice</Label>
              <Select value={codeType} onValueChange={setCodeType}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona tipo di codice" />
                </SelectTrigger>
                <SelectContent>
                  {codeTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div>
                        <div className="font-medium">{type.label}</div>
                        <div className="text-xs text-gray-500">{type.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {codeType === "emotional" && (
              <div>
                <Label htmlFor="country">Paese</Label>
                <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona paese" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country.code} value={country.code}>
                        {country.flag} {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {codeType === "professional" && (
              <div>
                <Label htmlFor="province">Provincia (es: VV, RC, CS)</Label>
                <Input
                  value={selectedProvince}
                  onChange={(e) => setSelectedProvince(e.target.value.toUpperCase())}
                  placeholder="Inserisci sigla provincia (es: VV, RC, CS)"
                  maxLength={3}
                  className="uppercase"
                />
              </div>
            )}

            <div>
              <Label htmlFor="role">Ruolo</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona ruolo" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="assignedTo">Assegnato a (opzionale)</Label>
              <Input
                id="assignedTo"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                placeholder="Nome persona"
              />
            </div>

            <Button 
              onClick={handleGenerateCode}
              disabled={
                !codeType || 
                !selectedRole || 
                (codeType === "emotional" && !selectedCountry) ||
                (codeType === "professional" && !selectedProvince) ||
                isGenerating
              }
              className="w-full bg-tourist-blue hover:bg-tourist-dark"
            >
              {isGenerating ? "Generando..." : "Genera Codice IQ"}
            </Button>

            {generatedCode && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600 font-medium">Codice generato:</p>
                    <p className="text-lg font-mono font-bold text-green-800">{generatedCode}</p>
                    {assignedTo && (
                      <p className="text-sm text-green-600">Assegnato a: {assignedTo}</p>
                    )}
                  </div>
                  <Button
                    onClick={handleCopyCode}
                    variant="outline"
                    size="sm"
                    className="ml-2"
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Attività Recente */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Attività Recente</h3>
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
      
      {activeView === "stats" && (
        <StatsView />
      )}
      
      {activeView === "settings" && (
        <SettingsView />
      )}
    </Layout>
  );
}

// Users Management Component
function UsersManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/users', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        setUsers(data.users || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-center py-8">Caricamento utenti...</div>;
  }

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Gestione Utenti</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Codice IQ</th>
                <th className="text-left p-2">Ruolo</th>
                <th className="text-left p-2">Assegnato a</th>
                <th className="text-left p-2">Posizione</th>
                <th className="text-left p-2">Tipo</th>
                <th className="text-left p-2">Stato</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b">
                  <td className="p-2 font-mono">{user.code}</td>
                  <td className="p-2">{user.role}</td>
                  <td className="p-2">{user.assignedTo || '-'}</td>
                  <td className="p-2">{user.location || '-'}</td>
                  <td className="p-2">{user.codeType || '-'}</td>
                  <td className="p-2">
                    <span className={`px-2 py-1 rounded text-xs ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {user.isActive ? 'Attivo' : 'Inattivo'}
                    </span>
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

// Codes Management Component
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

  const getRoleLabel = (role: string) => {
    const labels: { [key: string]: string } = {
      'admin': 'Amministratore',
      'tourist': 'Turista',
      'structure': 'Struttura',
      'partner': 'Partner'
    };
    return labels[role] || role;
  };

  const getProvinceFromCode = (code: string) => {
    const parts = code.split('-');
    if (parts.length >= 2) {
      return parts[1]; // Extract province (VV, RC, CS, etc.)
    }
    return '';
  };

  const getDashboardLink = (code: any) => {
    switch (code.role) {
      case 'structure':
        const structureId = code.code.split('-').pop();
        return `/structure/${structureId}`;
      case 'tourist':
        return '/tourist';
      case 'partner':
        return '/partner';
      case 'admin':
        return '/admin';
      default:
        return '#';
    }
  };

  if (loading) {
    return <div className="text-center py-8">Caricamento codici...</div>;
  }

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode size={20} />
          Codici Generati - Lista Completa
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Codice IQ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipologia
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nome Assegnato
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Provincia
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data Creazione
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dashboard
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {codes.map((code) => (
                <tr key={code.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap font-mono text-sm font-medium text-gray-900">
                    {code.code}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      code.role === 'admin' ? 'bg-red-100 text-red-800' :
                      code.role === 'tourist' ? 'bg-blue-100 text-blue-800' :
                      code.role === 'structure' ? 'bg-purple-100 text-purple-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {getRoleLabel(code.role)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {code.assignedTo || 'Non assegnato'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getProvinceFromCode(code.code) || code.location || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(code.createdAt).toLocaleDateString('it-IT')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <a 
                      href={getDashboardLink(code)}
                      className="text-tourist-blue hover:text-tourist-blue-dark font-medium"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Vai alla Dashboard →
                    </a>
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

// Stats View Component
function StatsView() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        setStats(data.stats);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-center py-8">Caricamento statistiche...</div>;
  }

  if (!stats) {
    return <div className="text-center py-8">Errore nel caricamento statistiche</div>;
  }

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Statistiche Piattaforma</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{stats.totalCodes}</div>
            <div className="text-sm text-gray-600">Codici Totali</div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{stats.activeUsers}</div>
            <div className="text-sm text-gray-600">Utenti Attivi</div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-600">{stats.byType.emotional || 0}</div>
            <div className="text-sm text-gray-600">Codici Emozionali</div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">{stats.byType.professional || 0}</div>
            <div className="text-sm text-gray-600">Codici Professionali</div>
          </div>
        </div>
        
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Distribuzione per Ruolo</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded">
              <div className="text-2xl font-bold text-blue-600">{stats.byRole.tourist}</div>
              <div className="text-sm">Turisti</div>
            </div>
            <div className="bg-green-50 p-4 rounded">
              <div className="text-2xl font-bold text-green-600">{stats.byRole.structure}</div>
              <div className="text-sm">Strutture</div>
            </div>
            <div className="bg-orange-50 p-4 rounded">
              <div className="text-2xl font-bold text-orange-600">{stats.byRole.partner}</div>
              <div className="text-sm">Partner</div>
            </div>
            <div className="bg-gray-50 p-4 rounded">
              <div className="text-2xl font-bold text-gray-600">{stats.byRole.admin}</div>
              <div className="text-sm">Admin</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Settings View Component
function SettingsView() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/settings', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        setSettings(data.settings);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-center py-8">Caricamento impostazioni...</div>;
  }

  if (!settings) {
    return <div className="text-center py-8">Errore nel caricamento impostazioni</div>;
  }

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Impostazioni Sistema</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <Label>Nome Piattaforma</Label>
            <Input value={settings?.platformName || 'TouristIQ'} disabled className="mt-1" />
          </div>
          
          <div>
            <Label>Email Supporto</Label>
            <Input value={settings?.supportEmail || 'support@touristiq.com'} disabled className="mt-1" />
          </div>
          
          <div>
            <Label>Messaggio di Benvenuto</Label>
            <Input value={settings?.welcomeMessage || 'Benvenuto in TouristIQ'} disabled className="mt-1" />
          </div>
          
          <div>
            <Label>Codici Massimi per Giorno</Label>
            <Input value={settings?.maxCodesPerDay || 100} disabled className="mt-1" />
          </div>
          
          <Button disabled>
            Salva Modifiche (Demo)
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

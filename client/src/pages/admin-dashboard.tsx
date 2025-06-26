import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BarChart3, Users, QrCode, Settings, TrendingUp, Handshake, Percent, Copy, Check } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getCurrentUser } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";

export default function AdminDashboard() {
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

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

  const roles = [
    { value: "tourist", label: "Turista" },
    { value: "structure", label: "Struttura" },
    { value: "partner", label: "Partner" },
    { value: "admin", label: "Amministratore" }
  ];

  const handleGenerateCode = async () => {
    if (!selectedCountry || !selectedRole) return;

    setIsGenerating(true);
    try {
      const response = await fetch("/api/genera-iqcode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          country: selectedCountry,
          role: selectedRole,
          assignedTo
        })
      });

      const data = await response.json();
      setGeneratedCode(data.code);
    } catch (error) {
      console.error("Errore generazione codice:", error);
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
    { icon: <BarChart3 size={16} />, label: "Dashboard", href: "#" },
    { icon: <Users size={16} />, label: "Gestione Utenti", href: "#" },
    { icon: <QrCode size={16} />, label: "Codici IQ", href: "#" },
    { icon: <TrendingUp size={16} />, label: "Statistiche", href: "#" },
    { icon: <Settings size={16} />, label: "Impostazioni", href: "#" },
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
              disabled={!selectedCountry || !selectedRole || isGenerating}
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
    </Layout>
  );
}

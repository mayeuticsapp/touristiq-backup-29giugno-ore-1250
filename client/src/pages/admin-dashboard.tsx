import { Layout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart3, Users, QrCode, Settings, TrendingUp, Handshake, Percent } from "lucide-react";

export default function AdminDashboard() {
  const navigation = [
    { icon: <BarChart3 size={16} />, label: "Dashboard", href: "#" },
    { icon: <Users size={16} />, label: "Gestione Utenti", href: "#" },
    { icon: <QrCode size={16} />, label: "Codici IQ", href: "#" },
    { icon: <TrendingUp size={16} />, label: "Statistiche", href: "#" },
    { icon: <Settings size={16} />, label: "Impostazioni", href: "#" },
  ];

  return (
    <Layout
      title="Dashboard Amministratore"
      role="Admin Panel"
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
    </Layout>
  );
}

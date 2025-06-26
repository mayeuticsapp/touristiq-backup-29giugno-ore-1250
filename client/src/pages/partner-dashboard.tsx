import { Layout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, Tags, QrCode, TrendingUp, Settings, Ticket, Euro, Users, Star, Camera } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getCurrentUser } from "@/lib/auth";

export default function PartnerDashboard() {
  const { data: user } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: getCurrentUser,
  });

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-full">
                <Ticket className="text-green-600" size={20} />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Sconti Utilizzati</p>
                <p className="text-2xl font-semibold text-gray-900">145</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-full">
                <Euro className="text-blue-600" size={20} />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Risparmio Clienti</p>
                <p className="text-2xl font-semibold text-gray-900">€2,340</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-full">
                <Users className="text-purple-600" size={20} />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Nuovi Clienti</p>
                <p className="text-2xl font-semibold text-gray-900">23</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-full">
                <Star className="text-yellow-600" size={20} />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Rating</p>
                <p className="text-2xl font-semibold text-gray-900">4.8</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Sconti Attivi</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Menu Pranzo</p>
                  <p className="text-sm text-gray-500">Sconto del 20%</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-green-600">45 utilizzi</p>
                  <p className="text-xs text-gray-400">Questo mese</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Aperitivo</p>
                  <p className="text-sm text-gray-500">Sconto del 15%</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-green-600">28 utilizzi</p>
                  <p className="text-xs text-gray-400">Questo mese</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Scanner Codici IQ</h3>
            <div className="text-center">
              <div className="w-32 h-32 mx-auto mb-4 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                <QrCode className="text-4xl text-gray-400" size={48} />
              </div>
              <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                <Camera className="mr-2" size={16} />
                Scansiona Codice
              </Button>
              <p className="text-sm text-gray-500 mt-2">Scansiona il codice IQ del turista per applicare lo sconto</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

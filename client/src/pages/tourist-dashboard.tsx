import { Layout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TIQaiChat } from "@/components/tiqai-chat";
import { Compass, Tags, History, Heart, User, Utensils, Check, MessageCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getCurrentUser } from "@/lib/auth";

export default function TouristDashboard() {
  const { data: user } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: getCurrentUser,
  });
  const navigation = [
    { icon: <Compass size={16} />, label: "Esplora", href: "#" },
    { icon: <Tags size={16} />, label: "I Miei Sconti", href: "#" },
    { icon: <MessageCircle size={16} />, label: "TIQai Chat", href: "#" },
    { icon: <History size={16} />, label: "Cronologia", href: "#" },
    { icon: <Heart size={16} />, label: "Preferiti", href: "#" },
    { icon: <User size={16} />, label: "Profilo", href: "#" },
  ];

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Caricamento...</h2>
          <p className="text-gray-600">Sto caricando il tuo dashboard turista</p>
        </div>
      </div>
    );
  }

  return (
    <Layout
      title="Benvenuto, Turista!"
      role="Area Turista"
      iqCode={user.iqCode}
      navigation={navigation}
      sidebarColor="bg-tourist-green"
    >
      <div className="mb-8">
        <Card className="bg-gradient-to-r from-tourist-green to-green-400 text-white">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-2 text-white">Il tuo Codice IQ</h2>
            <div className="bg-white/30 rounded-lg p-4 text-center border-2 border-white/20">
              <span className="text-2xl font-bold tracking-wider text-gray-900">{user.iqCode}</span>
            </div>
            <p className="mt-3 text-white font-medium">Mostra questo codice ai partner per ottenere sconti esclusivi!</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Sconti Disponibili</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center">
                  <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                    <Utensils className="text-red-600" size={20} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Ristorante Il Borgo</p>
                    <p className="text-sm text-gray-500">20% di sconto sul menù</p>
                  </div>
                </div>
                <Badge className="bg-green-100 text-green-800">-20%</Badge>
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center">
                  <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                    <Utensils className="text-blue-600" size={20} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Pizzeria Da Mario</p>
                    <p className="text-sm text-gray-500">15% di sconto su pizza</p>
                  </div>
                </div>
                <Badge className="bg-green-100 text-green-800">-15%</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Attività Recenti</h3>
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <Check className="text-green-600" size={12} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Sconto utilizzato</p>
                  <p className="text-xs text-gray-500">Pizzeria Da Mario - 15% di sconto</p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <Heart className="text-blue-600" size={12} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Aggiunto ai preferiti</p>
                  <p className="text-xs text-gray-500">Ristorante Il Borgo</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <TIQaiChat />
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

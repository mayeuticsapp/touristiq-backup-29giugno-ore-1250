import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Tags, QrCode, TrendingUp, Settings, Ticket, Euro, Users, Star, Camera, Package } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getCurrentUser } from "@/lib/auth";

export default function PartnerDashboard() {
  const { data: user } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: getCurrentUser,
  });

  // Query per pacchetti assegnati
  const { data: packagesData } = useQuery({
    queryKey: ["/api/my-packages"],
    enabled: !!user,
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

      {/* Sezione Pacchetti Assegnati */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package size={20} />
            Pacchetti IQCode Assegnati
          </CardTitle>
        </CardHeader>
        <CardContent>
          {packagesData?.packages?.length > 0 ? (
            <div className="space-y-4">
              {packagesData.packages.map((pkg: any) => (
                <div key={pkg.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">Pacchetto #{pkg.id}</h3>
                      <p className="text-sm text-gray-600">
                        Assegnato da: {pkg.assignedBy} il {new Date(pkg.assignedAt).toLocaleDateString('it-IT')}
                      </p>
                    </div>
                    <Badge variant={pkg.status === 'available' ? 'default' : 'secondary'}>
                      {pkg.status === 'available' ? 'Disponibile' : pkg.status}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Codici Totali</p>
                      <p className="text-xl font-bold text-blue-600">{pkg.packageSize}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Codici Disponibili</p>
                      <p className="text-xl font-bold text-green-600">{pkg.availableCodes}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Codici Utilizzati</p>
                      <p className="text-xl font-bold text-orange-600">{pkg.packageSize - pkg.availableCodes}</p>
                    </div>
                  </div>

                  <div className="border-t pt-3">
                    <p className="text-sm text-gray-600 mb-2">Codici generati ({pkg.codesGenerated?.length || 0}):</p>
                    <div className="max-h-32 overflow-y-auto bg-gray-50 p-2 rounded text-xs font-mono">
                      {pkg.codesGenerated?.slice(0, 5).map((code: string, index: number) => (
                        <div key={index} className="mb-1">{code}</div>
                      ))}
                      {pkg.codesGenerated?.length > 5 && (
                        <div className="text-gray-500">... e altri {pkg.codesGenerated.length - 5} codici</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Package size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 mb-2">Nessun pacchetto assegnato</p>
              <p className="text-sm text-gray-500 mb-6">
                I pacchetti IQCode assegnati dall'amministratore appariranno qui
              </p>
              
              {/* Link acquisto pacchetti SumUp */}
              <div className="bg-blue-50 p-6 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-4">Acquista Pacchetti IQCode</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <a href="https://pay.sumup.com/b2c/QSJE461B" target="_blank" rel="noopener noreferrer"
                     className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg text-center transition-colors">
                    <div className="text-lg font-bold">25</div>
                    <div className="text-xs">codici</div>
                  </a>
                  <a href="https://pay.sumup.com/b2c/QK6MLJC7" target="_blank" rel="noopener noreferrer"
                     className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg text-center transition-colors">
                    <div className="text-lg font-bold">50</div>
                    <div className="text-xs">codici</div>
                  </a>
                  <a href="https://pay.sumup.com/b2c/Q9517L3P" target="_blank" rel="noopener noreferrer"
                     className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg text-center transition-colors">
                    <div className="text-lg font-bold">75</div>
                    <div className="text-xs">codici</div>
                  </a>
                  <a href="https://pay.sumup.com/b2c/Q3BWI26N" target="_blank" rel="noopener noreferrer"
                     className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg text-center transition-colors">
                    <div className="text-lg font-bold">100</div>
                    <div className="text-xs">codici</div>
                  </a>
                </div>
                <p className="text-xs text-blue-700 mt-3">
                  Dopo l'acquisto, i codici verranno assegnati automaticamente al tuo account
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </Layout>
  );
}

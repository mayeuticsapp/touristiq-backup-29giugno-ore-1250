import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Users, 
  Building2, 
  MapPin, 
  ArrowLeft,
  Search 
} from 'lucide-react';
import { Link } from 'wouter';

interface User {
  id: number;
  code: string;
  role: string;
  assignedTo?: string;
  location?: string;
}

interface StrategicInfo {
  code: string;
  partnerName?: string;
  totalOffers?: number;
  averageDiscount?: number;
  contactsComplete?: boolean;
  structureName?: string;
  creditsTotal?: number;
  creditsUsed?: number;
  usagePercentage?: number;
  lastPackageAssigned?: Date;
  touristName?: string;
  registrationDate?: Date;
  totalValidations?: number;
}

interface UsersStrategicData {
  partners: StrategicInfo[];
  structures: StrategicInfo[];
  tourists: StrategicInfo[];
}

function getStrategicBadges(info: StrategicInfo, role: string) {
  const badges = [];

  if (role === 'partner') {
    if (!info.contactsComplete) {
      badges.push(<Badge key="contacts" variant="destructive" className="text-xs">🔴 Contatti incompleti</Badge>);
    }
    if (info.averageDiscount && info.averageDiscount >= 20) {
      badges.push(<Badge key="top" variant="default" className="text-xs">⭐ Top sconti</Badge>);
    }
  }

  if (role === 'structure') {
    if (info.usagePercentage && info.usagePercentage < 10) {
      badges.push(<Badge key="low" variant="secondary" className="text-xs">🟠 Crediti &lt; 10%</Badge>);
    }
    if (info.creditsTotal && info.creditsTotal >= 100) {
      badges.push(<Badge key="premium" variant="default" className="text-xs">💎 Premium</Badge>);
    }
  }

  if (role === 'tourist') {
    if (!info.totalValidations || info.totalValidations === 0) {
      badges.push(<Badge key="inactive" variant="secondary" className="text-xs">⚪ Nessuna attività</Badge>);
    }
    if (info.totalValidations && info.totalValidations > 5) {
      badges.push(<Badge key="active" variant="default" className="text-xs">🔥 Attivo</Badge>);
    }
  }

  return badges;
}

export default function UserManagement() {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['/api/admin/users'],
  });

  const { data: strategicData } = useQuery<UsersStrategicData>({
    queryKey: ['/api/admin/users-strategic-info'],
  });

  // Usa i dati strategici per i conteggi invece di fare affidamento sui dati utenti base
  const partnerData = strategicData?.partners || [];
  const structureData = strategicData?.structures || [];
  const touristData = strategicData?.tourists || [];

  // Applica filtro di ricerca sui dati strategici
  const filteredPartners = partnerData.filter(p =>
    p.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.partnerName?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const filteredStructures = structureData.filter(s =>
    s.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.structureName?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const filteredTourists = touristData.filter(t =>
    t.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.touristName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Torna al Dashboard
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Gestione Utenti</h1>
          <p className="text-muted-foreground">Informazioni strategiche e badge di stato per tutti gli utenti</p>
        </div>
      </div>

      {/* Search */}
      <div className="max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cerca per codice, nome o ruolo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Partner Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-orange-500" />
            Partner Commerciali ({filteredPartners.length})
          </CardTitle>
          <CardDescription>Informazioni strategiche sui partner business locali</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredPartners.map(partner => (
              <Card key={partner.code} className="border-orange-200">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-sm font-medium">{partner.code}</CardTitle>
                      <Badge variant="outline" className="text-xs mt-1">Partner</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-sm space-y-1">
                    <div><strong>Nome:</strong> {partner.partnerName || 'N/A'}</div>
                    <div className="flex gap-4">
                      <span>🎯 <strong>{partner.totalOffers || 0}</strong> offerte</span>
                      {partner.averageDiscount && (
                        <span>💰 <strong>{partner.averageDiscount.toFixed(1)}%</strong> sconto medio</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {getStrategicBadges(partner, 'partner')}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Structure Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-500" />
            Strutture Ricettive ({filteredStructures.length})
          </CardTitle>
          <CardDescription>Informazioni strategiche sulle strutture turistiche</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredStructures.map(structure => (
              <Card key={structure.code} className="border-blue-200">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-sm font-medium">{structure.code}</CardTitle>
                      <Badge variant="outline" className="text-xs mt-1">Struttura</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-sm space-y-1">
                    <div><strong>Nome:</strong> {structure.structureName || 'N/A'}</div>
                    <div className="flex gap-4">
                      <span>💳 <strong>{structure.creditsUsed || 0}</strong>/{structure.creditsTotal || 0} crediti</span>
                      {structure.usagePercentage !== undefined && (
                        <span>📊 <strong>{structure.usagePercentage.toFixed(1)}%</strong> utilizzo</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {getStrategicBadges(structure, 'structure')}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tourist Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-green-500" />
            Turisti ({filteredTourists.length})
          </CardTitle>
          <CardDescription>Informazioni strategiche sui turisti registrati</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredTourists.map(tourist => (
              <Card key={tourist.code} className="border-green-200">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-sm font-medium">{tourist.code}</CardTitle>
                      <Badge variant="outline" className="text-xs mt-1">Turista</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-sm space-y-1">
                    <div><strong>Nome:</strong> {tourist.touristName || 'N/A'}</div>
                    <div className="flex gap-4">
                      <span>✅ <strong>{tourist.totalValidations || 0}</strong> validazioni</span>
                      {tourist.registrationDate && (
                        <span>📅 <strong>{new Date(tourist.registrationDate).toLocaleDateString()}</strong></span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {getStrategicBadges(tourist, 'tourist')}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
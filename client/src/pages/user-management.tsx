import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { ArrowLeft, Users, Building2, MapPin } from 'lucide-react';
import { Link } from 'wouter';

interface User {
  id: number;
  code: string;
  role: string;
  assignedTo: string | null;
  location: string | null;
  isActive: boolean;
  status: string;
  createdAt: Date;
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

  const getStrategicInfo = (userCode: string, role: string): StrategicInfo | undefined => {
    if (!strategicData) return undefined;
    
    if (role === 'partner') {
      return strategicData.partners.find(p => p.code === userCode);
    } else if (role === 'structure') {
      return strategicData.structures.find(s => s.code === userCode);
    } else if (role === 'tourist') {
      return strategicData.tourists.find(t => t.code === userCode);
    }
    return undefined;
  };

  const filteredUsers = users.filter(user => 
    user.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.assignedTo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const partnerUsers = filteredUsers.filter(u => u.role === 'partner');
  const structureUsers = filteredUsers.filter(u => u.role === 'structure');
  const touristUsers = filteredUsers.filter(u => u.role === 'tourist');

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
        <Input
          placeholder="Cerca per codice, nome o ruolo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Partner Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-orange-500" />
            Partner Commerciali ({partnerUsers.length})
          </CardTitle>
          <CardDescription>Informazioni strategiche sui partner business locali</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {partnerUsers.map(user => {
              const strategic = getStrategicInfo(user.code, 'partner');
              return (
                <Card key={user.id} className="border-orange-200">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-sm font-medium">{user.code}</CardTitle>
                        <Badge variant="outline" className="text-xs mt-1">Partner</Badge>
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        {user.location || 'N/A'}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-sm space-y-1">
                      <div><strong>Nome:</strong> {user.assignedTo || 'N/A'}</div>
                      {strategic && (
                        <>
                          <div className="flex gap-4">
                            <span>🎯 <strong>{strategic.totalOffers || 0}</strong> offerte</span>
                            {strategic.averageDiscount && (
                              <span>💰 <strong>{strategic.averageDiscount.toFixed(1)}%</strong> sconto medio</span>
                            )}
                          </div>
                          <div className="flex gap-2 mt-2 flex-wrap">
                            {getStrategicBadges(strategic, 'partner')}
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Structure Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-500" />
            Strutture Ricettive ({structureUsers.length})
          </CardTitle>
          <CardDescription>Informazioni strategiche sulle strutture turistiche</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {structureUsers.map(user => {
              const strategic = getStrategicInfo(user.code, 'structure');
              return (
                <Card key={user.id} className="border-blue-200">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-sm font-medium">{user.code}</CardTitle>
                        <Badge variant="outline" className="text-xs mt-1">Struttura</Badge>
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        {user.location || 'N/A'}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-sm space-y-1">
                      <div><strong>Nome:</strong> {user.assignedTo || 'N/A'}</div>
                      {strategic && (
                        <>
                          <div className="flex gap-4">
                            <span>💳 <strong>{strategic.creditsUsed || 0}</strong>/{strategic.creditsTotal || 0} crediti</span>
                            {strategic.usagePercentage !== undefined && (
                              <span>📊 <strong>{strategic.usagePercentage.toFixed(1)}%</strong> utilizzo</span>
                            )}
                          </div>
                          <div className="flex gap-2 mt-2 flex-wrap">
                            {getStrategicBadges(strategic, 'structure')}
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Tourist Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-green-500" />
            Turisti ({touristUsers.length})
          </CardTitle>
          <CardDescription>Informazioni strategiche sui turisti registrati</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {touristUsers.map(user => {
              const strategic = getStrategicInfo(user.code, 'tourist');
              return (
                <Card key={user.id} className="border-green-200">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-sm font-medium">{user.code}</CardTitle>
                        <Badge variant="outline" className="text-xs mt-1">Turista</Badge>
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        {user.location || 'N/A'}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
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
                          <div className="flex gap-2 mt-2 flex-wrap">
                            {getStrategicBadges(strategic, 'tourist')}
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
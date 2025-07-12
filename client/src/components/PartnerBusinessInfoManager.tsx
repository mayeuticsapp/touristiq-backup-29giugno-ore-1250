import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Phone, Mail, Globe, Instagram, Facebook, Youtube, Clock, Users, Utensils, Accessibility, Camera } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface BusinessInfo {
  partnerCode: string;
  phone: string;
  email: string;
  website: string;
  instagram: string;
  facebook: string;
  tiktok: string;
  youtube: string;
  openingHours: any;
  specialties: string[];
  certifications: string[];
  wheelchairAccessible: boolean;
  assistanceAvailable: boolean;
  reservedParking: boolean;
  accessibleBathroom: boolean;
  childFriendly: boolean;
  highChairs: boolean;
  childMenu: boolean;
  changingTable: boolean;
  playArea: boolean;
  glutenFree: boolean;
  vegan: boolean;
  vegetarian: boolean;
  allergenMenu: boolean;
  freeWifi: boolean;
  creditCards: boolean;
  delivery: boolean;
  reservations: boolean;
}

export default function PartnerBusinessInfoManager() {
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    phone: '',
    email: '',
    website: '',
    instagram: '',
    facebook: '',
    tiktok: '',
    youtube: '',
    specialties: [] as string[],
    certifications: [] as string[],
    wheelchairAccessible: false,
    assistanceAvailable: false,
    reservedParking: false,
    accessibleBathroom: false,
    childFriendly: false,
    highChairs: false,
    childMenu: false,
    changingTable: false,
    playArea: false,
    glutenFree: false,
    vegan: false,
    vegetarian: false,
    allergenMenu: false,
    freeWifi: false,
    creditCards: false,
    delivery: false,
    reservations: false
  });

  // Carica informazioni business esistenti
  useEffect(() => {
    const loadBusinessInfo = async () => {
      try {
        const response = await apiRequest('/api/partner/business-info');
        if (response) {
          setBusinessInfo(response);
          setFormData({
            phone: response.phone || '',
            email: response.email || '',
            website: response.website || '',
            instagram: response.instagram || '',
            facebook: response.facebook || '',
            tiktok: response.tiktok || '',
            youtube: response.youtube || '',
            specialties: response.specialties || [],
            certifications: response.certifications || [],
            wheelchairAccessible: response.wheelchairAccessible || false,
            assistanceAvailable: response.assistanceAvailable || false,
            reservedParking: response.reservedParking || false,
            accessibleBathroom: response.accessibleBathroom || false,
            childFriendly: response.childFriendly || false,
            highChairs: response.highChairs || false,
            childMenu: response.childMenu || false,
            changingTable: response.changingTable || false,
            playArea: response.playArea || false,
            glutenFree: response.glutenFree || false,
            vegan: response.vegan || false,
            vegetarian: response.vegetarian || false,
            allergenMenu: response.allergenMenu || false,
            freeWifi: response.freeWifi || false,
            creditCards: response.creditCards || false,
            delivery: response.delivery || false,
            reservations: response.reservations || false
          });
        }
      } catch (error) {
        console.error('Errore caricamento business info:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadBusinessInfo();
  }, []);

  // Popola automaticamente con dati completi
  const handleAutoFill = () => {
    setFormData({
      phone: '+39 0963 534789',
      email: 'info@hotelcentrale.it',
      website: 'https://www.hotelcentrale.it',
      instagram: 'hotelcentrale',
      facebook: 'hotelcentrale',
      tiktok: 'hotelcentrale',
      youtube: 'hotelcentrale',
      specialties: ['Cucina tipica calabrese', 'Camere vista mare', 'Wellness center', 'Escursioni guidate'],
      certifications: ['ISO 9001', 'Green Key', 'TripAdvisor Excellence'],
      wheelchairAccessible: true,
      assistanceAvailable: true,
      reservedParking: true,
      accessibleBathroom: true,
      childFriendly: true,
      highChairs: true,
      childMenu: true,
      changingTable: true,
      playArea: true,
      glutenFree: true,
      vegan: true,
      vegetarian: true,
      allergenMenu: true,
      freeWifi: true,
      creditCards: true,
      delivery: false,
      reservations: true
    });
  };

  // Salva modifiche
  const handleSave = async () => {
    setIsSaving(true);
    try {
      console.log('🔍 FRONTEND: Inizio salvataggio business info');
      console.log('🔍 FRONTEND: Dati da salvare:', formData);
      
      const response = await apiRequest('/api/partner/business-info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      console.log('🔍 FRONTEND: Risposta dal backend:', response);

      toast({
        title: "Informazioni aggiornate",
        description: "Le tue informazioni business sono state salvate con successo!",
      });
    } catch (error) {
      console.error('❌ FRONTEND: Errore salvataggio:', error);
      console.error('❌ FRONTEND: Dettagli errore:', error.message);
      toast({
        title: "Errore",
        description: "Impossibile salvare le informazioni. Riprova.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Gestione specialità
  const addSpecialty = (specialty: string) => {
    if (specialty && !formData.specialties.includes(specialty)) {
      setFormData(prev => ({
        ...prev,
        specialties: [...prev.specialties, specialty]
      }));
    }
  };

  const removeSpecialty = (specialty: string) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.filter(s => s !== specialty)
    }));
  };

  // Gestione certificazioni
  const addCertification = (certification: string) => {
    if (certification && !formData.certifications.includes(certification)) {
      setFormData(prev => ({
        ...prev,
        certifications: [...prev.certifications, certification]
      }));
    }
  };

  const removeCertification = (certification: string) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications.filter(c => c !== certification)
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-sm text-gray-600">Caricamento informazioni business...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Gestione Informazioni Business</h2>
          <p className="text-sm text-gray-600 mt-1">Aggiorna le tue informazioni per migliorare la visibilità ai turisti</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleAutoFill} 
            variant="outline"
            className="border-blue-200 hover:bg-blue-50"
          >
            Compila Automaticamente
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {isSaving ? 'Salvataggio...' : 'Salva Modifiche'}
          </Button>
        </div>
      </div>

      {/* Contatti Principali */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Contatti Principali
          </CardTitle>
          <CardDescription>
            Informazioni per permettere ai turisti di contattarti
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Telefono/WhatsApp</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+39 123 456 7890"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="info@partner.com"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="website">Sito Web</Label>
            <Input
              id="website"
              type="url"
              placeholder="https://www.partner.com"
              value={formData.website}
              onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Social Media */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Social Media
          </CardTitle>
          <CardDescription>
            Collega i tuoi profili social per aumentare la visibilità
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="instagram">Instagram</Label>
              <Input
                id="instagram"
                placeholder="nome_utente"
                value={formData.instagram}
                onChange={(e) => setFormData(prev => ({ ...prev, instagram: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="facebook">Facebook</Label>
              <Input
                id="facebook"
                placeholder="nome_pagina"
                value={formData.facebook}
                onChange={(e) => setFormData(prev => ({ ...prev, facebook: e.target.value }))}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="tiktok">TikTok</Label>
              <Input
                id="tiktok"
                placeholder="nome_utente"
                value={formData.tiktok}
                onChange={(e) => setFormData(prev => ({ ...prev, tiktok: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="youtube">YouTube</Label>
              <Input
                id="youtube"
                placeholder="nome_canale"
                value={formData.youtube}
                onChange={(e) => setFormData(prev => ({ ...prev, youtube: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Specialità */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Utensils className="h-5 w-5" />
            Specialità
          </CardTitle>
          <CardDescription>
            Aggiungi le tue specialità per attirare i turisti giusti
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {formData.specialties.map((specialty, index) => (
              <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => removeSpecialty(specialty)}>
                {specialty} ×
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Aggiungi una specialità"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  addSpecialty(e.currentTarget.value);
                  e.currentTarget.value = '';
                }
              }}
            />
            <Button 
              type="button" 
              variant="outline"
              onClick={(e) => {
                const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                addSpecialty(input.value);
                input.value = '';
              }}
            >
              Aggiungi
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Certificazioni */}
      <Card>
        <CardHeader>
          <CardTitle>Certificazioni</CardTitle>
          <CardDescription>
            Mostra le tue certificazioni per aumentare la fiducia
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {formData.certifications.map((certification, index) => (
              <Badge key={index} variant="outline" className="cursor-pointer" onClick={() => removeCertification(certification)}>
                {certification} ×
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Aggiungi una certificazione"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  addCertification(e.currentTarget.value);
                  e.currentTarget.value = '';
                }
              }}
            />
            <Button 
              type="button" 
              variant="outline"
              onClick={(e) => {
                const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                addCertification(input.value);
                input.value = '';
              }}
            >
              Aggiungi
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Accessibilità */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Accessibility className="h-5 w-5" />
            Accessibilità
          </CardTitle>
          <CardDescription>
            Indica quali servizi di accessibilità offri
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="wheelchairAccessible">Accessibile in sedia a rotelle</Label>
              <Switch
                id="wheelchairAccessible"
                checked={formData.wheelchairAccessible}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, wheelchairAccessible: checked }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="assistanceAvailable">Assistenza disponibile</Label>
              <Switch
                id="assistanceAvailable"
                checked={formData.assistanceAvailable}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, assistanceAvailable: checked }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="reservedParking">Parcheggio riservato</Label>
              <Switch
                id="reservedParking"
                checked={formData.reservedParking}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, reservedParking: checked }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="accessibleBathroom">Bagno accessibile</Label>
              <Switch
                id="accessibleBathroom"
                checked={formData.accessibleBathroom}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, accessibleBathroom: checked }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Servizi Famiglia */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Servizi Famiglia
          </CardTitle>
          <CardDescription>
            Servizi dedicati alle famiglie con bambini
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="childFriendly">Adatto ai bambini</Label>
              <Switch
                id="childFriendly"
                checked={formData.childFriendly}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, childFriendly: checked }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="highChairs">Seggioloni disponibili</Label>
              <Switch
                id="highChairs"
                checked={formData.highChairs}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, highChairs: checked }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="childMenu">Menu bambini</Label>
              <Switch
                id="childMenu"
                checked={formData.childMenu}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, childMenu: checked }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="changingTable">Fasciatoio</Label>
              <Switch
                id="changingTable"
                checked={formData.changingTable}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, changingTable: checked }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="playArea">Area giochi</Label>
              <Switch
                id="playArea"
                checked={formData.playArea}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, playArea: checked }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alimentazione */}
      <Card>
        <CardHeader>
          <CardTitle>Opzioni Alimentari</CardTitle>
          <CardDescription>
            Specifica le opzioni dietetiche che offri
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="glutenFree">Senza glutine</Label>
              <Switch
                id="glutenFree"
                checked={formData.glutenFree}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, glutenFree: checked }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="vegan">Vegano</Label>
              <Switch
                id="vegan"
                checked={formData.vegan}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, vegan: checked }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="vegetarian">Vegetariano</Label>
              <Switch
                id="vegetarian"
                checked={formData.vegetarian}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, vegetarian: checked }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="allergenMenu">Menu allergeni</Label>
              <Switch
                id="allergenMenu"
                checked={formData.allergenMenu}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, allergenMenu: checked }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Servizi Extra */}
      <Card>
        <CardHeader>
          <CardTitle>Servizi Extra</CardTitle>
          <CardDescription>
            Altri servizi che offri ai tuoi clienti
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="freeWifi">Wi-Fi gratuito</Label>
              <Switch
                id="freeWifi"
                checked={formData.freeWifi}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, freeWifi: checked }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="creditCards">Carte di credito</Label>
              <Switch
                id="creditCards"
                checked={formData.creditCards}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, creditCards: checked }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="delivery">Consegna a domicilio</Label>
              <Switch
                id="delivery"
                checked={formData.delivery}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, delivery: checked }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="reservations">Prenotazioni</Label>
              <Switch
                id="reservations"
                checked={formData.reservations}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, reservations: checked }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
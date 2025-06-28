import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  Building2, 
  MapPin, 
  Accessibility, 
  UtensilsCrossed, 
  Baby, 
  Star, 
  Wifi, 
  CheckCircle,
  AlertTriangle,
  Clock,
  Phone,
  Mail,
  Globe
} from 'lucide-react';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  completed: boolean;
  required: boolean;
}

interface PartnerOnboardingProps {
  partnerCode: string;
  onComplete: () => void;
}

export function PartnerOnboarding({ partnerCode, onComplete }: PartnerOnboardingProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    // Business Info
    businessName: '',
    businessType: '',
    description: '',
    address: '',
    city: '',
    province: '',
    phone: '',
    email: '',
    website: '',
    openingHours: JSON.stringify({
      monday: { open: '09:00', close: '18:00', closed: false },
      tuesday: { open: '09:00', close: '18:00', closed: false },
      wednesday: { open: '09:00', close: '18:00', closed: false },
      thursday: { open: '09:00', close: '18:00', closed: false },
      friday: { open: '09:00', close: '18:00', closed: false },
      saturday: { open: '09:00', close: '18:00', closed: false },
      sunday: { open: '09:00', close: '18:00', closed: true }
    }),
    
    // Accessibility
    wheelchairAccessible: false,
    rampWidth: '',
    rampSlope: '',
    elevatorAccess: false,
    accessibleBathroom: false,
    parkingSpaces: 0,
    accessibleParking: 0,
    assistanceAvailable: false,
    accessibilityNotes: '',
    
    // Allergies
    glutenFree: false,
    glutenFreeKitchen: false,
    dairyFree: false,
    nutFree: false,
    vegetarianOptions: false,
    veganOptions: false,
    halalCertified: false,
    kosherCertified: false,
    allergyTraining: false,
    allergyMenu: false,
    allergyNotes: '',
    
    // Family
    childFriendly: false,
    highChairs: false,
    kidsMenu: false,
    changingTable: false,
    playArea: false,
    babyFriendly: false,
    toddlerFriendly: false,
    childFriendly6plus: false,
    teenFriendly: false,
    familyPackages: false,
    babysittingService: false,
    familyNotes: '',
    
    // Specialties
    uniqueSpecialties: '[]',
    localTraditions: '',
    experienceTypes: '[]',
    skillLevels: '[]',
    equipmentProvided: '[]',
    languagesSpoken: '["Italiano"]',
    certifications: '[]',
    awards: '[]',
    
    // Services
    wifiAvailable: false,
    petsAllowed: false,
    smokingAllowed: false,
    creditCardsAccepted: false,
    deliveryService: false,
    takeawayService: false,
    reservationsRequired: false,
    groupBookings: false,
    privateEvents: false
  });

  // Check onboarding status
  const { data: onboardingStatus } = useQuery({
    queryKey: ['/api/partner/onboarding-status', partnerCode],
    queryFn: () => fetch(`/api/partner/onboarding-status/${partnerCode}`).then(res => res.json())
  });

  const steps: OnboardingStep[] = [
    {
      id: 'business',
      title: 'Informazioni Business',
      description: 'Dati base della tua attività',
      icon: Building2,
      completed: onboardingStatus?.businessInfo || false,
      required: true
    },
    {
      id: 'accessibility',
      title: 'Accessibilità',
      description: 'Servizi per persone con disabilità',
      icon: Accessibility,
      completed: onboardingStatus?.accessibilityInfo || false,
      required: true
    },
    {
      id: 'allergies',
      title: 'Allergie e Intolleranze',
      description: 'Opzioni alimentari specifiche',
      icon: UtensilsCrossed,
      completed: onboardingStatus?.allergyInfo || false,
      required: true
    },
    {
      id: 'family',
      title: 'Servizi Famiglia',
      description: 'Accoglienza bambini e famiglie',
      icon: Baby,
      completed: onboardingStatus?.familyInfo || false,
      required: true
    },
    {
      id: 'specialties',
      title: 'Specialità Uniche',
      description: 'Quello che ti rende speciale',
      icon: Star,
      completed: onboardingStatus?.specialtyInfo || false,
      required: true
    },
    {
      id: 'services',
      title: 'Servizi Aggiuntivi',
      description: 'Servizi extra e comodità',
      icon: Wifi,
      completed: onboardingStatus?.servicesInfo || false,
      required: true
    }
  ];

  const progress = (steps.filter(s => s.completed).length / steps.length) * 100;

  // Save step data
  const saveStepMutation = useMutation({
    mutationFn: async (stepData: any) => {
      const response = await fetch('/api/partner/onboarding-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partnerCode,
          step: steps[currentStep].id,
          data: stepData
        })
      });
      if (!response.ok) throw new Error('Errore salvataggio');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/partner/onboarding-status'] });
      toast({
        title: "Sezione completata!",
        description: `${steps[currentStep].title} salvata con successo.`
      });
      
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        // Complete onboarding
        completeOnboardingMutation.mutate();
      }
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Errore durante il salvataggio. Riprova.",
        variant: "destructive"
      });
    }
  });

  // Complete onboarding
  const completeOnboardingMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/partner/complete-onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partnerCode })
      });
      if (!response.ok) throw new Error('Errore completamento');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "🎉 Onboarding Completato!",
        description: "Ora puoi accedere alla dashboard partner."
      });
      onComplete();
    }
  });

  const handleStepSubmit = () => {
    const currentStepId = steps[currentStep].id;
    let stepData = {};

    switch (currentStepId) {
      case 'business':
        stepData = {
          businessName: formData.businessName,
          businessType: formData.businessType,
          description: formData.description,
          address: formData.address,
          city: formData.city,
          province: formData.province,
          phone: formData.phone,
          email: formData.email,
          website: formData.website,
          openingHours: formData.openingHours
        };
        break;
      case 'accessibility':
        stepData = {
          wheelchairAccessible: formData.wheelchairAccessible,
          rampWidth: formData.rampWidth,
          rampSlope: formData.rampSlope,
          elevatorAccess: formData.elevatorAccess,
          accessibleBathroom: formData.accessibleBathroom,
          parkingSpaces: formData.parkingSpaces,
          accessibleParking: formData.accessibleParking,
          assistanceAvailable: formData.assistanceAvailable,
          accessibilityNotes: formData.accessibilityNotes
        };
        break;
      case 'allergies':
        stepData = {
          glutenFree: formData.glutenFree,
          glutenFreeKitchen: formData.glutenFreeKitchen,
          dairyFree: formData.dairyFree,
          nutFree: formData.nutFree,
          vegetarianOptions: formData.vegetarianOptions,
          veganOptions: formData.veganOptions,
          halalCertified: formData.halalCertified,
          kosherCertified: formData.kosherCertified,
          allergyTraining: formData.allergyTraining,
          allergyMenu: formData.allergyMenu,
          allergyNotes: formData.allergyNotes
        };
        break;
      case 'family':
        stepData = {
          childFriendly: formData.childFriendly,
          highChairs: formData.highChairs,
          kidsMenu: formData.kidsMenu,
          changingTable: formData.changingTable,
          playArea: formData.playArea,
          babyFriendly: formData.babyFriendly,
          toddlerFriendly: formData.toddlerFriendly,
          childFriendly6plus: formData.childFriendly6plus,
          teenFriendly: formData.teenFriendly,
          familyPackages: formData.familyPackages,
          babysittingService: formData.babysittingService,
          familyNotes: formData.familyNotes
        };
        break;
      case 'specialties':
        stepData = {
          uniqueSpecialties: formData.uniqueSpecialties,
          localTraditions: formData.localTraditions,
          experienceTypes: formData.experienceTypes,
          skillLevels: formData.skillLevels,
          equipmentProvided: formData.equipmentProvided,
          languagesSpoken: formData.languagesSpoken,
          certifications: formData.certifications,
          awards: formData.awards
        };
        break;
      case 'services':
        stepData = {
          wifiAvailable: formData.wifiAvailable,
          petsAllowed: formData.petsAllowed,
          smokingAllowed: formData.smokingAllowed,
          creditCardsAccepted: formData.creditCardsAccepted,
          deliveryService: formData.deliveryService,
          takeawayService: formData.takeawayService,
          reservationsRequired: formData.reservationsRequired,
          groupBookings: formData.groupBookings,
          privateEvents: formData.privateEvents
        };
        break;
    }

    saveStepMutation.mutate(stepData);
  };

  const renderStepContent = () => {
    const step = steps[currentStep];
    
    switch (step.id) {
      case 'business':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="businessName">Nome Attività *</Label>
                <Input
                  id="businessName"
                  value={formData.businessName}
                  onChange={(e) => setFormData({...formData, businessName: e.target.value})}
                  placeholder="Es: Ristorante Da Mario"
                  required
                />
              </div>
              <div>
                <Label htmlFor="businessType">Tipo Attività *</Label>
                <Select value={formData.businessType} onValueChange={(value) => setFormData({...formData, businessType: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ristorante">Ristorante</SelectItem>
                    <SelectItem value="pizzeria">Pizzeria</SelectItem>
                    <SelectItem value="bar">Bar/Caffè</SelectItem>
                    <SelectItem value="gelateria">Gelateria</SelectItem>
                    <SelectItem value="negozio">Negozio</SelectItem>
                    <SelectItem value="attrazione">Attrazione Turistica</SelectItem>
                    <SelectItem value="museo">Museo</SelectItem>
                    <SelectItem value="escursioni">Tour/Escursioni</SelectItem>
                    <SelectItem value="trasporti">Trasporti</SelectItem>
                    <SelectItem value="wellness">Wellness/SPA</SelectItem>
                    <SelectItem value="altro">Altro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Descrizione Attività *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Descrivi la tua attività, cosa offri di speciale..."
                rows={3}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="address">Indirizzo *</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  placeholder="Via Roma 123"
                  required
                />
              </div>
              <div>
                <Label htmlFor="city">Città *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                  placeholder="Milano"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="province">Provincia *</Label>
                <Input
                  id="province"
                  value={formData.province}
                  onChange={(e) => setFormData({...formData, province: e.target.value})}
                  placeholder="MI"
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">Telefono *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="+39 123 456 7890"
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="info@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="website">Sito Web</Label>
              <Input
                id="website"
                value={formData.website}
                onChange={(e) => setFormData({...formData, website: e.target.value})}
                placeholder="https://www.example.com"
              />
            </div>
          </div>
        );

      case 'accessibility':
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">Perché è importante?</h4>
              <p className="text-blue-700 text-sm">
                TIQai utilizzerà queste informazioni per dare risposte precise a turisti con esigenze specifiche di accessibilità.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="wheelchairAccessible"
                  checked={formData.wheelchairAccessible}
                  onCheckedChange={(checked) => setFormData({...formData, wheelchairAccessible: !!checked})}
                />
                <Label htmlFor="wheelchairAccessible">Accessibile a sedie a rotelle</Label>
              </div>

              {formData.wheelchairAccessible && (
                <div className="ml-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="rampWidth">Larghezza rampa (cm)</Label>
                    <Input
                      id="rampWidth"
                      value={formData.rampWidth}
                      onChange={(e) => setFormData({...formData, rampWidth: e.target.value})}
                      placeholder="90"
                    />
                  </div>
                  <div>
                    <Label htmlFor="rampSlope">Pendenza rampa (%)</Label>
                    <Input
                      id="rampSlope"
                      value={formData.rampSlope}
                      onChange={(e) => setFormData({...formData, rampSlope: e.target.value})}
                      placeholder="8"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="elevatorAccess"
                  checked={formData.elevatorAccess}
                  onCheckedChange={(checked) => setFormData({...formData, elevatorAccess: !!checked})}
                />
                <Label htmlFor="elevatorAccess">Accesso con ascensore</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="accessibleBathroom"
                  checked={formData.accessibleBathroom}
                  onCheckedChange={(checked) => setFormData({...formData, accessibleBathroom: !!checked})}
                />
                <Label htmlFor="accessibleBathroom">Bagno accessibile</Label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="parkingSpaces">Posti auto totali</Label>
                  <Input
                    id="parkingSpaces"
                    type="number"
                    value={formData.parkingSpaces}
                    onChange={(e) => setFormData({...formData, parkingSpaces: parseInt(e.target.value) || 0})}
                    placeholder="10"
                  />
                </div>
                <div>
                  <Label htmlFor="accessibleParking">Posti auto accessibili</Label>
                  <Input
                    id="accessibleParking"
                    type="number"
                    value={formData.accessibleParking}
                    onChange={(e) => setFormData({...formData, accessibleParking: parseInt(e.target.value) || 0})}
                    placeholder="2"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="assistanceAvailable"
                  checked={formData.assistanceAvailable}
                  onCheckedChange={(checked) => setFormData({...formData, assistanceAvailable: !!checked})}
                />
                <Label htmlFor="assistanceAvailable">Assistenza disponibile per persone con disabilità</Label>
              </div>

              <div>
                <Label htmlFor="accessibilityNotes">Note aggiuntive sull'accessibilità</Label>
                <Textarea
                  id="accessibilityNotes"
                  value={formData.accessibilityNotes}
                  onChange={(e) => setFormData({...formData, accessibilityNotes: e.target.value})}
                  placeholder="Dettagli specifici, limitazioni, servizi particolari..."
                  rows={3}
                />
              </div>
            </div>
          </div>
        );

      case 'allergies':
        return (
          <div className="space-y-6">
            <div className="bg-orange-50 p-4 rounded-lg">
              <h4 className="font-semibold text-orange-800 mb-2">Informazioni Critiche</h4>
              <p className="text-orange-700 text-sm">
                Queste informazioni sono fondamentali per la sicurezza dei clienti con allergie. Sii preciso e onesto.
              </p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="glutenFree"
                    checked={formData.glutenFree}
                    onCheckedChange={(checked) => setFormData({...formData, glutenFree: !!checked})}
                  />
                  <Label htmlFor="glutenFree">Opzioni senza glutine</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="glutenFreeKitchen"
                    checked={formData.glutenFreeKitchen}
                    onCheckedChange={(checked) => setFormData({...formData, glutenFreeKitchen: !!checked})}
                  />
                  <Label htmlFor="glutenFreeKitchen">Cucina separata senza glutine</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="dairyFree"
                    checked={formData.dairyFree}
                    onCheckedChange={(checked) => setFormData({...formData, dairyFree: !!checked})}
                  />
                  <Label htmlFor="dairyFree">Opzioni senza lattosio</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="nutFree"
                    checked={formData.nutFree}
                    onCheckedChange={(checked) => setFormData({...formData, nutFree: !!checked})}
                  />
                  <Label htmlFor="nutFree">Opzioni senza frutta secca</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="vegetarianOptions"
                    checked={formData.vegetarianOptions}
                    onCheckedChange={(checked) => setFormData({...formData, vegetarianOptions: !!checked})}
                  />
                  <Label htmlFor="vegetarianOptions">Opzioni vegetariane</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="veganOptions"
                    checked={formData.veganOptions}
                    onCheckedChange={(checked) => setFormData({...formData, veganOptions: !!checked})}
                  />
                  <Label htmlFor="veganOptions">Opzioni vegane</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="halalCertified"
                    checked={formData.halalCertified}
                    onCheckedChange={(checked) => setFormData({...formData, halalCertified: !!checked})}
                  />
                  <Label htmlFor="halalCertified">Certificazione Halal</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="kosherCertified"
                    checked={formData.kosherCertified}
                    onCheckedChange={(checked) => setFormData({...formData, kosherCertified: !!checked})}
                  />
                  <Label htmlFor="kosherCertified">Certificazione Kosher</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="allergyTraining"
                    checked={formData.allergyTraining}
                    onCheckedChange={(checked) => setFormData({...formData, allergyTraining: !!checked})}
                  />
                  <Label htmlFor="allergyTraining">Staff formato su allergie</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="allergyMenu"
                    checked={formData.allergyMenu}
                    onCheckedChange={(checked) => setFormData({...formData, allergyMenu: !!checked})}
                  />
                  <Label htmlFor="allergyMenu">Menu allergie disponibile</Label>
                </div>
              </div>

              <div>
                <Label htmlFor="allergyNotes">Note specifiche su allergie e intolleranze</Label>
                <Textarea
                  id="allergyNotes"
                  value={formData.allergyNotes}
                  onChange={(e) => setFormData({...formData, allergyNotes: e.target.value})}
                  placeholder="Procedure specifiche, limitazioni, precauzioni particolari..."
                  rows={3}
                />
              </div>
            </div>
          </div>
        );

      case 'family':
        return (
          <div className="space-y-6">
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-2">Accoglienza Famiglie</h4>
              <p className="text-green-700 text-sm">
                Aiuta TIQai a consigliare la tua attività alle famiglie con bambini di età specifiche.
              </p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="childFriendly"
                    checked={formData.childFriendly}
                    onCheckedChange={(checked) => setFormData({...formData, childFriendly: !!checked})}
                  />
                  <Label htmlFor="childFriendly">Accogliente per bambini</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="highChairs"
                    checked={formData.highChairs}
                    onCheckedChange={(checked) => setFormData({...formData, highChairs: !!checked})}
                  />
                  <Label htmlFor="highChairs">Seggioloni disponibili</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="kidsMenu"
                    checked={formData.kidsMenu}
                    onCheckedChange={(checked) => setFormData({...formData, kidsMenu: !!checked})}
                  />
                  <Label htmlFor="kidsMenu">Menu bambini</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="changingTable"
                    checked={formData.changingTable}
                    onCheckedChange={(checked) => setFormData({...formData, changingTable: !!checked})}
                  />
                  <Label htmlFor="changingTable">Fasciatoio</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="playArea"
                    checked={formData.playArea}
                    onCheckedChange={(checked) => setFormData({...formData, playArea: !!checked})}
                  />
                  <Label htmlFor="playArea">Area giochi</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="babysittingService"
                    checked={formData.babysittingService}
                    onCheckedChange={(checked) => setFormData({...formData, babysittingService: !!checked})}
                  />
                  <Label htmlFor="babysittingService">Servizio baby-sitting</Label>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Fasce di età specifiche:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="babyFriendly"
                      checked={formData.babyFriendly}
                      onCheckedChange={(checked) => setFormData({...formData, babyFriendly: !!checked})}
                    />
                    <Label htmlFor="babyFriendly">Neonati (0-2 anni)</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="toddlerFriendly"
                      checked={formData.toddlerFriendly}
                      onCheckedChange={(checked) => setFormData({...formData, toddlerFriendly: !!checked})}
                    />
                    <Label htmlFor="toddlerFriendly">Bambini piccoli (2-5 anni)</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="childFriendly6plus"
                      checked={formData.childFriendly6plus}
                      onCheckedChange={(checked) => setFormData({...formData, childFriendly6plus: !!checked})}
                    />
                    <Label htmlFor="childFriendly6plus">Bambini (6-12 anni)</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="teenFriendly"
                      checked={formData.teenFriendly}
                      onCheckedChange={(checked) => setFormData({...formData, teenFriendly: !!checked})}
                    />
                    <Label htmlFor="teenFriendly">Adolescenti (13+ anni)</Label>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="familyPackages"
                  checked={formData.familyPackages}
                  onCheckedChange={(checked) => setFormData({...formData, familyPackages: !!checked})}
                />
                <Label htmlFor="familyPackages">Pacchetti famiglia</Label>
              </div>

              <div>
                <Label htmlFor="familyNotes">Note specifiche per famiglie</Label>
                <Textarea
                  id="familyNotes"
                  value={formData.familyNotes}
                  onChange={(e) => setFormData({...formData, familyNotes: e.target.value})}
                  placeholder="Servizi speciali, attività per bambini, sconti famiglia..."
                  rows={3}
                />
              </div>
            </div>
          </div>
        );

      case 'specialties':
        return (
          <div className="space-y-6">
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-semibold text-purple-800 mb-2">Quello che ti rende unico</h4>
              <p className="text-purple-700 text-sm">
                Queste informazioni aiuteranno TIQai a consigliare la tua attività per esperienze specifiche.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="localTraditions">Tradizioni locali offerte</Label>
                <Textarea
                  id="localTraditions"
                  value={formData.localTraditions}
                  onChange={(e) => setFormData({...formData, localTraditions: e.target.value})}
                  placeholder="Es: Laboratori di ceramica tradizionale calabrese, degustazioni di vini locali..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Lingue parlate</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {['Italiano', 'Inglese', 'Francese', 'Tedesco', 'Spagnolo', 'Russo'].map(lang => (
                      <div key={lang} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`lang-${lang}`}
                          checked={formData.languagesSpoken.includes(lang)}
                          onCheckedChange={(checked) => {
                            const languages = JSON.parse(formData.languagesSpoken);
                            if (checked) {
                              languages.push(lang);
                            } else {
                              const index = languages.indexOf(lang);
                              if (index > -1) languages.splice(index, 1);
                            }
                            setFormData({...formData, languagesSpoken: JSON.stringify(languages)});
                          }}
                        />
                        <Label htmlFor={`lang-${lang}`} className="text-sm">{lang}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="certifications">Certificazioni</Label>
                  <Textarea
                    id="certifications"
                    value={formData.certifications}
                    onChange={(e) => setFormData({...formData, certifications: e.target.value})}
                    placeholder="Es: Certificazione biologica, ISO 9001..."
                    rows={2}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="awards">Premi e riconoscimenti</Label>
                <Textarea
                  id="awards"
                  value={formData.awards}
                  onChange={(e) => setFormData({...formData, awards: e.target.value})}
                  placeholder="Es: Michelin, TripAdvisor Certificate of Excellence..."
                  rows={2}
                />
              </div>
            </div>
          </div>
        );

      case 'services':
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">Servizi e Comodità</h4>
              <p className="text-blue-700 text-sm">
                Ultimi dettagli sui servizi che offri.
              </p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="wifiAvailable"
                    checked={formData.wifiAvailable}
                    onCheckedChange={(checked) => setFormData({...formData, wifiAvailable: !!checked})}
                  />
                  <Label htmlFor="wifiAvailable">Wi-Fi gratuito</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="petsAllowed"
                    checked={formData.petsAllowed}
                    onCheckedChange={(checked) => setFormData({...formData, petsAllowed: !!checked})}
                  />
                  <Label htmlFor="petsAllowed">Animali ammessi</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="smokingAllowed"
                    checked={formData.smokingAllowed}
                    onCheckedChange={(checked) => setFormData({...formData, smokingAllowed: !!checked})}
                  />
                  <Label htmlFor="smokingAllowed">Permesso fumare</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="creditCardsAccepted"
                    checked={formData.creditCardsAccepted}
                    onCheckedChange={(checked) => setFormData({...formData, creditCardsAccepted: !!checked})}
                  />
                  <Label htmlFor="creditCardsAccepted">Carte di credito accettate</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="deliveryService"
                    checked={formData.deliveryService}
                    onCheckedChange={(checked) => setFormData({...formData, deliveryService: !!checked})}
                  />
                  <Label htmlFor="deliveryService">Servizio consegna</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="takeawayService"
                    checked={formData.takeawayService}
                    onCheckedChange={(checked) => setFormData({...formData, takeawayService: !!checked})}
                  />
                  <Label htmlFor="takeawayService">Servizio asporto</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="reservationsRequired"
                    checked={formData.reservationsRequired}
                    onCheckedChange={(checked) => setFormData({...formData, reservationsRequired: !!checked})}
                  />
                  <Label htmlFor="reservationsRequired">Prenotazione richiesta</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="groupBookings"
                    checked={formData.groupBookings}
                    onCheckedChange={(checked) => setFormData({...formData, groupBookings: !!checked})}
                  />
                  <Label htmlFor="groupBookings">Prenotazioni di gruppo</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="privateEvents"
                    checked={formData.privateEvents}
                    onCheckedChange={(checked) => setFormData({...formData, privateEvents: !!checked})}
                  />
                  <Label htmlFor="privateEvents">Eventi privati</Label>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return <div>Sezione non trovata</div>;
    }
  };

  const canProceed = () => {
    const step = steps[currentStep];
    
    switch (step.id) {
      case 'business':
        return formData.businessName && formData.businessType && formData.description && 
               formData.address && formData.city && formData.province && 
               formData.phone && formData.email;
      default:
        return true; // Altri step non hanno campi obbligatori
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Benvenuto in TouristIQ
          </h1>
          <p className="text-gray-600 mb-4">
            Completa il tuo profilo per iniziare a ricevere clienti attraverso TIQai
          </p>
          
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Progresso completamento</span>
              <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-gray-500 mt-2">
              {steps.filter(s => s.completed).length} di {steps.length} sezioni completate
            </p>
          </div>
        </div>

        {/* Step indicator */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = step.completed;
              
              return (
                <div 
                  key={step.id}
                  className={`flex flex-col items-center ${isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'}`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 mb-2 ${
                    isActive ? 'border-blue-600 bg-blue-50' : 
                    isCompleted ? 'border-green-600 bg-green-50' : 
                    'border-gray-300 bg-white'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle size={24} />
                    ) : (
                      <Icon size={24} />
                    )}
                  </div>
                  <span className="text-xs font-medium text-center max-w-20">
                    {step.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Current step content */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              {(() => {
                const IconComponent = steps[currentStep].icon;
                return <IconComponent size={24} />;
              })()}
              <div>
                <CardTitle>{steps[currentStep].title}</CardTitle>
                <p className="text-gray-600">{steps[currentStep].description}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {renderStepContent()}
            
            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
              >
                Indietro
              </Button>
              
              <Button
                onClick={handleStepSubmit}
                disabled={!canProceed() || saveStepMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {saveStepMutation.isPending ? 'Salvando...' : 
                 currentStep === steps.length - 1 ? 'Completa Registrazione' : 'Continua'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Warning message */}
        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="text-amber-600 mt-0.5" size={20} />
            <div>
              <h4 className="font-semibold text-amber-800">Importante</h4>
              <p className="text-amber-700 text-sm">
                Tutte le informazioni che inserisci verranno utilizzate da TIQai per fornire consigli precisi ai turisti. 
                Inserimenti errati o incomplete potrebbero portare a feedback negativi da parte dei clienti.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Shield, Clock, CheckCircle } from "lucide-react";

export default function ActivateTempCode() {
  const [tempCode, setTempCode] = useState("");
  const [touristProfile, setTouristProfile] = useState({
    name: "",
    phone: "",
    email: ""
  });
  const [isChecking, setIsChecking] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [tempCodeValid, setTempCodeValid] = useState<boolean | null>(null);
  const [structureCode, setStructureCode] = useState("");
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Auto-popolamento codice dal localStorage se disponibile
  useEffect(() => {
    const savedTempCode = localStorage.getItem('temp_code_for_activation');
    if (savedTempCode) {
      setTempCode(savedTempCode);
      localStorage.removeItem('temp_code_for_activation'); // Rimuovi dopo l'uso
      
      // Auto-verifica il codice
      setTimeout(() => {
        checkTempCodeWithValue(savedTempCode);
      }, 500);
    }
  }, []);

  // Verifica validità codice temporaneo con valore specifico
  const checkTempCodeWithValue = async (codeToCheck: string) => {
    setIsChecking(true);
    setTempCodeValid(null);

    try {
      const response = await fetch("/api/check-temp-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tempCode: codeToCheck.trim() })
      });

      const result = await response.json();
      
      if (response.ok && result.valid) {
        setTempCodeValid(true);
        toast({
          title: "Codice valido!",
          description: "Il codice temporaneo è valido. Procedi con la creazione del tuo profilo.",
        });
      } else {
        setTempCodeValid(false);
        toast({
          title: "Codice non valido",
          description: result.message || "Il codice è scaduto o già utilizzato",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Errore verifica codice:", error);
      setTempCodeValid(false);
      toast({
        title: "Errore",
        description: "Impossibile verificare il codice",
        variant: "destructive",
      });
    } finally {
      setIsChecking(false);
    }
  };

  // Verifica validità codice temporaneo
  const checkTempCode = async () => {
    if (!tempCode.trim()) {
      toast({
        title: "Errore",
        description: "Inserisci il codice temporaneo",
        variant: "destructive",
      });
      return;
    }

    setIsChecking(true);
    setTempCodeValid(null);

    try {
      const response = await fetch("/api/check-temp-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tempCode: tempCode.trim() })
      });

      const result = await response.json();
      
      if (response.ok && result.valid) {
        setTempCodeValid(true);
        toast({
          title: "Codice valido!",
          description: "Il codice temporaneo è valido. Procedi con la creazione del tuo profilo.",
        });
      } else {
        setTempCodeValid(false);
        toast({
          title: "Codice non valido",
          description: result.message || "Il codice è scaduto o già utilizzato",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Errore verifica codice:", error);
      setTempCodeValid(false);
      toast({
        title: "Errore",
        description: "Impossibile verificare il codice",
        variant: "destructive",
      });
    } finally {
      setIsChecking(false);
    }
  };

  // Attiva codice temporaneo e crea IQCode definitivo
  const activateAndCreateProfile = async () => {
    if (!tempCode.trim() || !touristProfile.name.trim()) {
      toast({
        title: "Errore",
        description: "Codice temporaneo e nome sono obbligatori",
        variant: "destructive",
      });
      return;
    }

    setIsActivating(true);

    try {
      // Prima attiva il codice temporaneo
      const activateResponse = await fetch("/api/activate-temp-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tempCode: tempCode.trim() })
      });

      if (!activateResponse.ok) {
        const error = await activateResponse.json();
        throw new Error(error.error || "Errore attivazione codice");
      }

      const activateResult = await activateResponse.json();
      setStructureCode(activateResult.structureCode);

      // Poi crea il profilo turistico definitivo
      const createResponse = await fetch("/api/create-permanent-from-temp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tempCode: tempCode.trim(),
          touristProfile: {
            name: touristProfile.name.trim(),
            phone: touristProfile.phone.trim() || null,
            email: touristProfile.email.trim() || null
          }
        })
      });

      if (!createResponse.ok) {
        const error = await createResponse.json();
        throw new Error(error.error || "Errore creazione profilo");
      }

      const createResult = await createResponse.json();
      
      toast({
        title: "Profilo creato con successo!",
        description: `Il tuo IQCode è ${createResult.iqCode}. Benvenuto in TouristIQ!`,
      });

      // Reindirizza alla dashboard turista
      navigate("/tourist");

    } catch (error) {
      console.error("Errore attivazione:", error);
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Errore durante l'attivazione",
        variant: "destructive",
      });
    } finally {
      setIsActivating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto pt-8">
        <Card className="border-2 border-blue-200 shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-2xl text-blue-900">
              <Shield className="w-8 h-8" />
              Attivazione Codice Temporaneo
            </CardTitle>
            <p className="text-gray-600 mt-2">
              Inserisci il codice temporaneo ricevuto dalla struttura per creare il tuo IQCode personale
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Sezione 1: Inserimento codice temporaneo */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="tempCode" className="text-lg font-semibold">
                  Codice Temporaneo
                </Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="tempCode"
                    value={tempCode}
                    onChange={(e) => setTempCode(e.target.value)}
                    placeholder="Es: IQCODE-PRIMOACCESSO-67421"
                    className="flex-1 text-lg font-mono"
                    maxLength={30}
                  />
                  <Button
                    onClick={checkTempCode}
                    disabled={isChecking || !tempCode.trim()}
                    variant="outline"
                    className="px-6"
                  >
                    {isChecking ? (
                      <>
                        <Clock className="w-4 h-4 mr-2 animate-spin" />
                        Verificando...
                      </>
                    ) : (
                      "Verifica"
                    )}
                  </Button>
                </div>
                
                {tempCodeValid === true && (
                  <Alert className="mt-3 border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      ✅ Codice temporaneo valido! Procedi con la creazione del profilo.
                    </AlertDescription>
                  </Alert>
                )}
                
                {tempCodeValid === false && (
                  <Alert className="mt-3 border-red-200 bg-red-50">
                    <AlertDescription className="text-red-800">
                      ❌ Codice temporaneo non valido o scaduto. Richiedi un nuovo codice alla struttura.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>

            {/* Sezione 2: Profilo turista (solo se codice valido) */}
            {tempCodeValid === true && (
              <div className="space-y-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-900">
                  Crea il tuo profilo TouristIQ
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nome Completo *</Label>
                    <Input
                      id="name"
                      value={touristProfile.name}
                      onChange={(e) => setTouristProfile({...touristProfile, name: e.target.value})}
                      placeholder="Es: Mario Rossi"
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="phone">Telefono (Opzionale)</Label>
                    <Input
                      id="phone"
                      value={touristProfile.phone}
                      onChange={(e) => setTouristProfile({...touristProfile, phone: e.target.value})}
                      placeholder="Es: +39 123 456 7890"
                      className="mt-1"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="email">Email (Opzionale)</Label>
                  <Input
                    id="email"
                    type="email"
                    value={touristProfile.email}
                    onChange={(e) => setTouristProfile({...touristProfile, email: e.target.value})}
                    placeholder="Es: mario@example.com"
                    className="mt-1"
                  />
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600 mt-4">
                  <Shield className="w-4 h-4" />
                  <span>I tuoi dati sono protetti e non verranno mai condivisi senza il tuo consenso.</span>
                </div>
              </div>
            )}

            {/* Sezione 3: Attivazione finale */}
            {tempCodeValid === true && (
              <div className="text-center">
                <Button
                  onClick={activateAndCreateProfile}
                  disabled={isActivating || !touristProfile.name.trim()}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-lg"
                >
                  {isActivating ? (
                    <>
                      <Clock className="w-5 h-5 mr-2 animate-spin" />
                      Creando il tuo profilo...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-5 h-5 mr-2" />
                      Crea il mio IQCode definitivo
                    </>
                  )}
                </Button>
                
                <p className="text-xs text-gray-500 mt-2">
                  Una volta creato, riceverai un IQCode personale unico per accedere a sconti esclusivi
                </p>
              </div>
            )}

            {/* Informazioni aggiuntive */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-2">Come funziona?</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Il codice temporaneo è valido per 15 minuti</li>
                <li>• Dopo l'attivazione, riceverai un IQCode personale definitivo</li>
                <li>• Potrai usare il tuo IQCode per sconti esclusivi presso partner TouristIQ</li>
                <li>• I tuoi dati sono protetti e rispettiamo la tua privacy</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
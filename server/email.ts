import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@touristiq.it';

export async function sendPartnerAcceptedEmail(partnerEmail: string, partnerName: string, partnerCode: string): Promise<boolean> {
  try {
    const { data, error } = await resend.emails.send({
      from: `TouristIQ <${fromEmail}>`,
      to: partnerEmail,
      subject: 'Benvenuto in TouristIQ - La tua richiesta è stata accettata!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb;">TouristIQ</h1>
          </div>
          
          <h2 style="color: #1f2937;">Congratulazioni, ${partnerName}!</h2>
          
          <p style="color: #4b5563; line-height: 1.6;">
            Siamo lieti di comunicarti che la tua richiesta di adesione al network TouristIQ è stata <strong>accettata</strong>.
          </p>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #1f2937;"><strong>Il tuo codice Partner:</strong></p>
            <p style="font-size: 24px; font-weight: bold; color: #2563eb; margin: 10px 0;">${partnerCode}</p>
            <p style="margin: 0; color: #6b7280; font-size: 14px;">Usa questo codice per accedere alla tua dashboard partner</p>
          </div>
          
          <p style="color: #4b5563; line-height: 1.6;">
            Da oggi potrai:<br>
            • Validare i codici TIQ-OTC dei turisti<br>
            • Offrire sconti esclusivi ai visitatori<br>
            • Apparire sulla mappa TouristIQ
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://touristiq.it" style="background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">Accedi alla Dashboard</a>
          </div>
          
          <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 40px;">
            TouristIQ - Connettere turisti e territorio<br>
            Questa email è stata inviata a ${partnerEmail}
          </p>
        </div>
      `
    });

    if (error) {
      console.error('Errore invio email partner:', error);
      return false;
    }
    
    console.log('✅ Email accettazione partner inviata:', data?.id);
    return true;
  } catch (err) {
    console.error('Errore invio email partner:', err);
    return false;
  }
}

export async function sendStructurePaymentConfirmationEmail(
  structureEmail: string, 
  structureName: string, 
  structureCode: string,
  packageName: string,
  creditsAmount: number,
  paymentAmount: string
): Promise<boolean> {
  try {
    const { data, error } = await resend.emails.send({
      from: `TouristIQ <${fromEmail}>`,
      to: structureEmail,
      subject: 'TouristIQ - Conferma acquisto pacchetto IQcode',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb;">TouristIQ</h1>
          </div>
          
          <h2 style="color: #1f2937;">Grazie per il tuo acquisto, ${structureName}!</h2>
          
          <p style="color: #4b5563; line-height: 1.6;">
            Il pagamento è stato ricevuto con successo. Ecco il riepilogo del tuo ordine:
          </p>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Pacchetto:</td>
                <td style="padding: 8px 0; color: #1f2937; font-weight: bold; text-align: right;">${packageName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Crediti IQcode:</td>
                <td style="padding: 8px 0; color: #1f2937; font-weight: bold; text-align: right;">${creditsAmount}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Importo pagato:</td>
                <td style="padding: 8px 0; color: #2563eb; font-weight: bold; text-align: right;">${paymentAmount}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Codice Struttura:</td>
                <td style="padding: 8px 0; color: #1f2937; font-weight: bold; text-align: right;">${structureCode}</td>
              </tr>
            </table>
          </div>
          
          <p style="color: #4b5563; line-height: 1.6;">
            I crediti sono già disponibili nella tua dashboard. Puoi iniziare subito a generare codici IQ per i tuoi ospiti!
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://touristiq.it" style="background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">Vai alla Dashboard</a>
          </div>
          
          <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 40px;">
            TouristIQ - Connettere turisti e territorio<br>
            Questa email è stata inviata a ${structureEmail}
          </p>
        </div>
      `
    });

    if (error) {
      console.error('Errore invio email struttura:', error);
      return false;
    }
    
    console.log('✅ Email conferma pagamento struttura inviata:', data?.id);
    return true;
  } catch (err) {
    console.error('Errore invio email struttura:', err);
    return false;
  }
}

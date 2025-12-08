import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@touristiq.it';

type SupportedLanguage = 'it' | 'en' | 'es' | 'de' | 'fr' | 'pl';

const emailTranslations: Record<SupportedLanguage, {
  partnerAccepted: {
    subject: string;
    congratulations: string;
    accepted: string;
    yourPartnerCode: string;
    useThisCode: string;
    fromToday: string;
    validateCodes: string;
    offerDiscounts: string;
    appearOnMap: string;
    accessDashboard: string;
    footer: string;
  };
  structurePayment: {
    subject: string;
    thankYou: string;
    paymentReceived: string;
    package: string;
    iqCodeCredits: string;
    amountPaid: string;
    structureCode: string;
    creditsAvailable: string;
    goToDashboard: string;
    footer: string;
  };
  newIQCode: {
    subject: string;
    welcome: string;
    yourCodeReady: string;
    yourIQCode: string;
    whatYouCanDo: string;
    discoverOffers: string;
    exclusiveDiscounts: string;
    authenticExperiences: string;
    accessDashboard: string;
    footer: string;
  };
}> = {
  it: {
    partnerAccepted: {
      subject: 'Benvenuto in TouristIQ - La tua richiesta è stata accettata!',
      congratulations: 'Congratulazioni',
      accepted: 'Siamo lieti di comunicarti che la tua richiesta di adesione al network TouristIQ è stata <strong>accettata</strong>.',
      yourPartnerCode: 'Il tuo codice Partner:',
      useThisCode: 'Usa questo codice per accedere alla tua dashboard partner',
      fromToday: 'Da oggi potrai:',
      validateCodes: 'Validare i codici TIQ-OTC dei turisti',
      offerDiscounts: 'Offrire sconti esclusivi ai visitatori',
      appearOnMap: 'Apparire sulla mappa TouristIQ',
      accessDashboard: 'Accedi alla Dashboard',
      footer: 'TouristIQ - Connettere turisti e territorio'
    },
    structurePayment: {
      subject: 'TouristIQ - Conferma acquisto pacchetto IQcode',
      thankYou: 'Grazie per il tuo acquisto',
      paymentReceived: 'Il pagamento è stato ricevuto con successo. Ecco il riepilogo del tuo ordine:',
      package: 'Pacchetto',
      iqCodeCredits: 'Crediti IQcode',
      amountPaid: 'Importo pagato',
      structureCode: 'Codice Struttura',
      creditsAvailable: 'I crediti sono già disponibili nella tua dashboard. Puoi iniziare subito a generare codici IQ per i tuoi ospiti!',
      goToDashboard: 'Vai alla Dashboard',
      footer: 'TouristIQ - Connettere turisti e territorio'
    },
    newIQCode: {
      subject: 'TouristIQ - Il tuo nuovo IQCode è pronto!',
      welcome: 'Benvenuto in TouristIQ!',
      yourCodeReady: 'Il tuo codice IQ personale è stato generato ed è pronto per l\'uso.',
      yourIQCode: 'Il tuo IQCode:',
      whatYouCanDo: 'Con il tuo IQCode potrai:',
      discoverOffers: 'Scoprire offerte esclusive',
      exclusiveDiscounts: 'Ottenere sconti dai partner locali',
      authenticExperiences: 'Vivere esperienze autentiche del territorio',
      accessDashboard: 'Accedi alla Dashboard',
      footer: 'TouristIQ - Connettere turisti e territorio'
    }
  },
  en: {
    partnerAccepted: {
      subject: 'Welcome to TouristIQ - Your request has been accepted!',
      congratulations: 'Congratulations',
      accepted: 'We are pleased to inform you that your request to join the TouristIQ network has been <strong>accepted</strong>.',
      yourPartnerCode: 'Your Partner code:',
      useThisCode: 'Use this code to access your partner dashboard',
      fromToday: 'From today you can:',
      validateCodes: 'Validate tourist TIQ-OTC codes',
      offerDiscounts: 'Offer exclusive discounts to visitors',
      appearOnMap: 'Appear on the TouristIQ map',
      accessDashboard: 'Access Dashboard',
      footer: 'TouristIQ - Connecting tourists and territory'
    },
    structurePayment: {
      subject: 'TouristIQ - IQcode package purchase confirmation',
      thankYou: 'Thank you for your purchase',
      paymentReceived: 'Payment has been successfully received. Here is your order summary:',
      package: 'Package',
      iqCodeCredits: 'IQcode Credits',
      amountPaid: 'Amount paid',
      structureCode: 'Structure Code',
      creditsAvailable: 'Credits are now available in your dashboard. You can start generating IQ codes for your guests right away!',
      goToDashboard: 'Go to Dashboard',
      footer: 'TouristIQ - Connecting tourists and territory'
    },
    newIQCode: {
      subject: 'TouristIQ - Your new IQCode is ready!',
      welcome: 'Welcome to TouristIQ!',
      yourCodeReady: 'Your personal IQ code has been generated and is ready to use.',
      yourIQCode: 'Your IQCode:',
      whatYouCanDo: 'With your IQCode you can:',
      discoverOffers: 'Discover exclusive offers',
      exclusiveDiscounts: 'Get discounts from local partners',
      authenticExperiences: 'Experience authentic local experiences',
      accessDashboard: 'Access Dashboard',
      footer: 'TouristIQ - Connecting tourists and territory'
    }
  },
  es: {
    partnerAccepted: {
      subject: '¡Bienvenido a TouristIQ - Tu solicitud ha sido aceptada!',
      congratulations: '¡Felicitaciones',
      accepted: 'Nos complace informarte que tu solicitud para unirte a la red TouristIQ ha sido <strong>aceptada</strong>.',
      yourPartnerCode: 'Tu código de Partner:',
      useThisCode: 'Usa este código para acceder a tu panel de partner',
      fromToday: 'A partir de hoy podrás:',
      validateCodes: 'Validar códigos TIQ-OTC de turistas',
      offerDiscounts: 'Ofrecer descuentos exclusivos a visitantes',
      appearOnMap: 'Aparecer en el mapa de TouristIQ',
      accessDashboard: 'Acceder al Panel',
      footer: 'TouristIQ - Conectando turistas y territorio'
    },
    structurePayment: {
      subject: 'TouristIQ - Confirmación de compra del paquete IQcode',
      thankYou: 'Gracias por tu compra',
      paymentReceived: 'El pago se ha recibido correctamente. Aquí está el resumen de tu pedido:',
      package: 'Paquete',
      iqCodeCredits: 'Créditos IQcode',
      amountPaid: 'Importe pagado',
      structureCode: 'Código de Estructura',
      creditsAvailable: 'Los créditos ya están disponibles en tu panel. ¡Puedes empezar a generar códigos IQ para tus huéspedes de inmediato!',
      goToDashboard: 'Ir al Panel',
      footer: 'TouristIQ - Conectando turistas y territorio'
    },
    newIQCode: {
      subject: '¡TouristIQ - Tu nuevo IQCode está listo!',
      welcome: '¡Bienvenido a TouristIQ!',
      yourCodeReady: 'Tu código IQ personal ha sido generado y está listo para usar.',
      yourIQCode: 'Tu IQCode:',
      whatYouCanDo: 'Con tu IQCode podrás:',
      discoverOffers: 'Descubrir ofertas exclusivas',
      exclusiveDiscounts: 'Obtener descuentos de socios locales',
      authenticExperiences: 'Vivir experiencias auténticas del territorio',
      accessDashboard: 'Acceder al Panel',
      footer: 'TouristIQ - Conectando turistas y territorio'
    }
  },
  de: {
    partnerAccepted: {
      subject: 'Willkommen bei TouristIQ - Ihre Anfrage wurde akzeptiert!',
      congratulations: 'Herzlichen Glückwunsch',
      accepted: 'Wir freuen uns, Ihnen mitteilen zu können, dass Ihre Anfrage zur Aufnahme in das TouristIQ-Netzwerk <strong>akzeptiert</strong> wurde.',
      yourPartnerCode: 'Ihr Partner-Code:',
      useThisCode: 'Verwenden Sie diesen Code, um auf Ihr Partner-Dashboard zuzugreifen',
      fromToday: 'Ab heute können Sie:',
      validateCodes: 'TIQ-OTC-Codes von Touristen validieren',
      offerDiscounts: 'Exklusive Rabatte für Besucher anbieten',
      appearOnMap: 'Auf der TouristIQ-Karte erscheinen',
      accessDashboard: 'Zum Dashboard',
      footer: 'TouristIQ - Touristen und Territorium verbinden'
    },
    structurePayment: {
      subject: 'TouristIQ - Kaufbestätigung IQcode-Paket',
      thankYou: 'Vielen Dank für Ihren Kauf',
      paymentReceived: 'Die Zahlung wurde erfolgreich erhalten. Hier ist Ihre Bestellübersicht:',
      package: 'Paket',
      iqCodeCredits: 'IQcode-Guthaben',
      amountPaid: 'Gezahlter Betrag',
      structureCode: 'Struktur-Code',
      creditsAvailable: 'Die Guthaben sind bereits in Ihrem Dashboard verfügbar. Sie können sofort mit der Generierung von IQ-Codes für Ihre Gäste beginnen!',
      goToDashboard: 'Zum Dashboard',
      footer: 'TouristIQ - Touristen und Territorium verbinden'
    },
    newIQCode: {
      subject: 'TouristIQ - Ihr neuer IQCode ist bereit!',
      welcome: 'Willkommen bei TouristIQ!',
      yourCodeReady: 'Ihr persönlicher IQ-Code wurde generiert und ist einsatzbereit.',
      yourIQCode: 'Ihr IQCode:',
      whatYouCanDo: 'Mit Ihrem IQCode können Sie:',
      discoverOffers: 'Exklusive Angebote entdecken',
      exclusiveDiscounts: 'Rabatte von lokalen Partnern erhalten',
      authenticExperiences: 'Authentische lokale Erlebnisse genießen',
      accessDashboard: 'Zum Dashboard',
      footer: 'TouristIQ - Touristen und Territorium verbinden'
    }
  },
  fr: {
    partnerAccepted: {
      subject: 'Bienvenue chez TouristIQ - Votre demande a été acceptée !',
      congratulations: 'Félicitations',
      accepted: 'Nous avons le plaisir de vous informer que votre demande d\'adhésion au réseau TouristIQ a été <strong>acceptée</strong>.',
      yourPartnerCode: 'Votre code Partenaire :',
      useThisCode: 'Utilisez ce code pour accéder à votre tableau de bord partenaire',
      fromToday: 'À partir d\'aujourd\'hui, vous pouvez :',
      validateCodes: 'Valider les codes TIQ-OTC des touristes',
      offerDiscounts: 'Offrir des réductions exclusives aux visiteurs',
      appearOnMap: 'Apparaître sur la carte TouristIQ',
      accessDashboard: 'Accéder au Tableau de Bord',
      footer: 'TouristIQ - Connecter touristes et territoire'
    },
    structurePayment: {
      subject: 'TouristIQ - Confirmation d\'achat du forfait IQcode',
      thankYou: 'Merci pour votre achat',
      paymentReceived: 'Le paiement a été reçu avec succès. Voici le récapitulatif de votre commande :',
      package: 'Forfait',
      iqCodeCredits: 'Crédits IQcode',
      amountPaid: 'Montant payé',
      structureCode: 'Code Structure',
      creditsAvailable: 'Les crédits sont déjà disponibles dans votre tableau de bord. Vous pouvez commencer à générer des codes IQ pour vos invités dès maintenant !',
      goToDashboard: 'Aller au Tableau de Bord',
      footer: 'TouristIQ - Connecter touristes et territoire'
    },
    newIQCode: {
      subject: 'TouristIQ - Votre nouveau IQCode est prêt !',
      welcome: 'Bienvenue chez TouristIQ !',
      yourCodeReady: 'Votre code IQ personnel a été généré et est prêt à être utilisé.',
      yourIQCode: 'Votre IQCode :',
      whatYouCanDo: 'Avec votre IQCode, vous pouvez :',
      discoverOffers: 'Découvrir des offres exclusives',
      exclusiveDiscounts: 'Obtenir des réductions auprès des partenaires locaux',
      authenticExperiences: 'Vivre des expériences locales authentiques',
      accessDashboard: 'Accéder au Tableau de Bord',
      footer: 'TouristIQ - Connecter touristes et territoire'
    }
  },
  pl: {
    partnerAccepted: {
      subject: 'Witamy w TouristIQ - Twoja prośba została zaakceptowana!',
      congratulations: 'Gratulacje',
      accepted: 'Z przyjemnością informujemy, że Twoja prośba o dołączenie do sieci TouristIQ została <strong>zaakceptowana</strong>.',
      yourPartnerCode: 'Twój kod Partnera:',
      useThisCode: 'Użyj tego kodu, aby uzyskać dostęp do panelu partnera',
      fromToday: 'Od dziś możesz:',
      validateCodes: 'Walidować kody TIQ-OTC turystów',
      offerDiscounts: 'Oferować ekskluzywne zniżki odwiedzającym',
      appearOnMap: 'Pojawić się na mapie TouristIQ',
      accessDashboard: 'Przejdź do Panelu',
      footer: 'TouristIQ - Łączymy turystów z terytorium'
    },
    structurePayment: {
      subject: 'TouristIQ - Potwierdzenie zakupu pakietu IQcode',
      thankYou: 'Dziękujemy za zakup',
      paymentReceived: 'Płatność została pomyślnie otrzymana. Oto podsumowanie zamówienia:',
      package: 'Pakiet',
      iqCodeCredits: 'Kredyty IQcode',
      amountPaid: 'Zapłacona kwota',
      structureCode: 'Kod Struktury',
      creditsAvailable: 'Kredyty są już dostępne w Twoim panelu. Możesz od razu zacząć generować kody IQ dla swoich gości!',
      goToDashboard: 'Przejdź do Panelu',
      footer: 'TouristIQ - Łączymy turystów z terytorium'
    },
    newIQCode: {
      subject: 'TouristIQ - Twój nowy IQCode jest gotowy!',
      welcome: 'Witamy w TouristIQ!',
      yourCodeReady: 'Twój osobisty kod IQ został wygenerowany i jest gotowy do użycia.',
      yourIQCode: 'Twój IQCode:',
      whatYouCanDo: 'Z Twoim IQCode możesz:',
      discoverOffers: 'Odkrywać ekskluzywne oferty',
      exclusiveDiscounts: 'Uzyskiwać zniżki od lokalnych partnerów',
      authenticExperiences: 'Doświadczać autentycznych lokalnych przeżyć',
      accessDashboard: 'Przejdź do Panelu',
      footer: 'TouristIQ - Łączymy turystów z terytorium'
    }
  }
};

function getTranslation(lang: string): typeof emailTranslations['it'] {
  const supportedLang = (lang as SupportedLanguage) in emailTranslations ? lang as SupportedLanguage : 'it';
  return emailTranslations[supportedLang];
}

export async function sendPartnerAcceptedEmail(partnerEmail: string, partnerName: string, partnerCode: string, lang: string = 'it'): Promise<boolean> {
  const t = getTranslation(lang).partnerAccepted;
  
  try {
    const { data, error } = await resend.emails.send({
      from: `TouristIQ <${fromEmail}>`,
      to: partnerEmail,
      subject: t.subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb;">TouristIQ</h1>
          </div>
          
          <h2 style="color: #1f2937;">${t.congratulations}, ${partnerName}!</h2>
          
          <p style="color: #4b5563; line-height: 1.6;">
            ${t.accepted}
          </p>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #1f2937;"><strong>${t.yourPartnerCode}</strong></p>
            <p style="font-size: 24px; font-weight: bold; color: #2563eb; margin: 10px 0;">${partnerCode}</p>
            <p style="margin: 0; color: #6b7280; font-size: 14px;">${t.useThisCode}</p>
          </div>
          
          <p style="color: #4b5563; line-height: 1.6;">
            ${t.fromToday}<br>
            • ${t.validateCodes}<br>
            • ${t.offerDiscounts}<br>
            • ${t.appearOnMap}
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://touristiq.app" style="background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">${t.accessDashboard}</a>
          </div>
          
          <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 40px;">
            ${t.footer}<br>
            ${partnerEmail}
          </p>
        </div>
      `
    });

    if (error) {
      console.error('Error sending partner email:', error);
      return false;
    }
    
    console.log('✅ Partner acceptance email sent:', data?.id);
    return true;
  } catch (err) {
    console.error('Error sending partner email:', err);
    return false;
  }
}

export async function sendStructurePaymentConfirmationEmail(
  structureEmail: string, 
  structureName: string, 
  structureCode: string,
  packageName: string,
  creditsAmount: number,
  paymentAmount: string,
  lang: string = 'it'
): Promise<boolean> {
  const t = getTranslation(lang).structurePayment;
  
  try {
    const { data, error } = await resend.emails.send({
      from: `TouristIQ <${fromEmail}>`,
      to: structureEmail,
      subject: t.subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb;">TouristIQ</h1>
          </div>
          
          <h2 style="color: #1f2937;">${t.thankYou}, ${structureName}!</h2>
          
          <p style="color: #4b5563; line-height: 1.6;">
            ${t.paymentReceived}
          </p>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">${t.package}:</td>
                <td style="padding: 8px 0; color: #1f2937; font-weight: bold; text-align: right;">${packageName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">${t.iqCodeCredits}:</td>
                <td style="padding: 8px 0; color: #1f2937; font-weight: bold; text-align: right;">${creditsAmount}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">${t.amountPaid}:</td>
                <td style="padding: 8px 0; color: #2563eb; font-weight: bold; text-align: right;">${paymentAmount}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">${t.structureCode}:</td>
                <td style="padding: 8px 0; color: #1f2937; font-weight: bold; text-align: right;">${structureCode}</td>
              </tr>
            </table>
          </div>
          
          <p style="color: #4b5563; line-height: 1.6;">
            ${t.creditsAvailable}
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://touristiq.app" style="background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">${t.goToDashboard}</a>
          </div>
          
          <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 40px;">
            ${t.footer}<br>
            ${structureEmail}
          </p>
        </div>
      `
    });

    if (error) {
      console.error('Error sending structure email:', error);
      return false;
    }
    
    console.log('✅ Structure payment confirmation email sent:', data?.id);
    return true;
  } catch (err) {
    console.error('Error sending structure email:', err);
    return false;
  }
}

export async function sendNewIQCodeEmail(
  touristEmail: string,
  touristName: string,
  iqCode: string,
  lang: string = 'it'
): Promise<boolean> {
  const t = getTranslation(lang).newIQCode;
  
  try {
    const { data, error } = await resend.emails.send({
      from: `TouristIQ <${fromEmail}>`,
      to: touristEmail,
      subject: t.subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb;">TouristIQ</h1>
          </div>
          
          <h2 style="color: #1f2937;">${t.welcome}</h2>
          
          <p style="color: #4b5563; line-height: 1.6;">
            ${touristName ? `${touristName}, ` : ''}${t.yourCodeReady}
          </p>
          
          <div style="background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%); padding: 30px; border-radius: 12px; margin: 20px 0; text-align: center;">
            <p style="margin: 0; color: rgba(255,255,255,0.9); font-size: 14px;">${t.yourIQCode}</p>
            <p style="font-size: 28px; font-weight: bold; color: white; margin: 15px 0; letter-spacing: 2px;">${iqCode}</p>
          </div>
          
          <p style="color: #4b5563; line-height: 1.6;">
            ${t.whatYouCanDo}<br>
            • ${t.discoverOffers}<br>
            • ${t.exclusiveDiscounts}<br>
            • ${t.authenticExperiences}
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://touristiq.app" style="background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">${t.accessDashboard}</a>
          </div>
          
          <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 40px;">
            ${t.footer}<br>
            ${touristEmail}
          </p>
        </div>
      `
    });

    if (error) {
      console.error('Error sending new IQCode email:', error);
      return false;
    }
    
    console.log('✅ New IQCode email sent:', data?.id);
    return true;
  } catch (err) {
    console.error('Error sending new IQCode email:', err);
    return false;
  }
}

import nodemailer from 'nodemailer';
import { logger, emailLogger, generateRequestId, createPerformanceTimer } from './logger';

// Configuration des emails
const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@emstone.ca';
const EMAIL_SERVICE = process.env.EMAIL_SERVICE;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;
const EMAIL_RETRY_ATTEMPTS = Number(process.env.EMAIL_RETRY_ATTEMPTS || '3');
const EMAIL_RETRY_DELAY = Number(process.env.EMAIL_RETRY_DELAY || '1000'); // ms

// Interface pour les statistiques d'email
interface EmailStats {
  totalAttempts: number;
  successCount: number;
  failureCount: number;
  lastSendTime: Date | null;
  averageSendTime: number;
}

// Statistiques globales pour le monitoring des emails
const emailStats: EmailStats = {
  totalAttempts: 0,
  successCount: 0,
  failureCount: 0,
  lastSendTime: null,
  averageSendTime: 0,
};

// Drapeau pour suivre si l'envoi d'emails est activé
const EMAIL_ENABLED = Boolean(EMAIL_SERVICE && EMAIL_USER && EMAIL_PASSWORD);

if (!EMAIL_ENABLED) {
  logger.warn(
    "L'envoi d'emails est désactivé. Définissez EMAIL_SERVICE, EMAIL_USER et EMAIL_PASSWORD pour activer l'envoi d'emails.",
  );
  emailLogger.warn(
    "L'envoi d'emails est désactivé. Définissez EMAIL_SERVICE, EMAIL_USER et EMAIL_PASSWORD pour activer l'envoi d'emails.",
    { emailConfig: { service: EMAIL_SERVICE ? '✓' : '✗', user: EMAIL_USER ? '✓' : '✗', password: EMAIL_PASSWORD ? '✓' : '✗' } }
  );
}

// Créer le transporteur en fonction de la configuration
let transporter: nodemailer.Transporter;

if (EMAIL_ENABLED) {
  emailLogger.debug('Initialisation du transporteur email avec service: ' + EMAIL_SERVICE);
  transporter = nodemailer.createTransport({
    service: EMAIL_SERVICE,
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASSWORD,
    },
  });
} else {
  // Utiliser un transporteur de test qui enregistre les emails au lieu de les envoyer
  emailLogger.debug('Initialisation du transporteur email de test');
  transporter = nodemailer.createTransport({
    host: 'localhost',
    port: 25,
    secure: false,
    tls: {
      rejectUnauthorized: false,
    },
  });
}

// Vérifier la configuration du transporteur
transporter.verify((error) => {
  if (error) {
    logger.error("Échec de la vérification du transporteur d'email:", error);
    emailLogger.error("Échec de la vérification du transporteur d'email:", { 
      error: { 
        message: error.message, 
        stack: error.stack,
        code: (error as any).code,
        command: (error as any).command
      },
      emailConfig: { 
        service: EMAIL_SERVICE, 
        user: EMAIL_USER ? '✓' : '✗'
      }
    });
  } else {
    logger.info("Le transporteur d'email est prêt à envoyer des messages");
    emailLogger.info("Le transporteur d'email est prêt à envoyer des messages", {
      emailConfig: { 
        service: EMAIL_SERVICE, 
        enabled: EMAIL_ENABLED 
      }
    });
  }
});

/**
 * Fonction d'aide pour tenter d'envoyer un email avec des tentatives de réessai
 */
async function trySendMail(
  mailOptions: nodemailer.SendMailOptions, 
  requestId: string,
  maxAttempts = EMAIL_RETRY_ATTEMPTS
): Promise<nodemailer.SentMessageInfo> {
  let lastError: any;
  let attempt = 0;

  while (attempt < maxAttempts) {
    attempt++;
    try {
      emailLogger.debug(`Tentative d'envoi d'email [${attempt}/${maxAttempts}]`, { 
        requestId,
        recipient: mailOptions.to, 
        subject: mailOptions.subject,
        attempt
      });
      
      const result = await transporter.sendMail(mailOptions);
      
      emailLogger.debug(`Email envoyé avec succès à la tentative ${attempt}`, { 
        requestId,
        messageId: result.messageId,
        response: result.response 
      });
      
      return result;
    } catch (error) {
      lastError = error;
      const delay = attempt * EMAIL_RETRY_DELAY;
      
      emailLogger.warn(`Échec de la tentative ${attempt}/${maxAttempts} d'envoi d'email`, { 
        requestId,
        error: { 
          message: error instanceof Error ? error.message : String(error),
          name: error instanceof Error ? error.name : 'UnknownError',
          code: (error as any)?.code
        },
        recipient: mailOptions.to,
        nextRetryIn: delay
      });
      
      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // Si nous arrivons ici, toutes les tentatives ont échoué
  throw lastError;
}

/**
 * Mise à jour des statistiques d'envoi d'email
 */
function updateEmailStats(success: boolean, duration: number): void {
  emailStats.totalAttempts++;
  if (success) {
    emailStats.successCount++;
    emailStats.lastSendTime = new Date();
    
    // Mettre à jour le temps moyen d'envoi
    emailStats.averageSendTime = (
      (emailStats.averageSendTime * (emailStats.successCount - 1) + duration) / 
      emailStats.successCount
    );
  } else {
    emailStats.failureCount++;
  }
  
  // Log des statistiques d'emails périodiquement (à chaque 10 tentatives)
  if (emailStats.totalAttempts % 10 === 0) {
    emailLogger.info('Statistiques d\'envoi d\'emails', {
      stats: { ...emailStats, successRate: `${(emailStats.successCount / emailStats.totalAttempts * 100).toFixed(2)}%` }
    });
  }
}

/**
 * Obtenir les statistiques actuelles d'envoi d'email
 */
export function getEmailStats(): EmailStats {
  return { ...emailStats };
}

// Envoyer l'email avec le lien magique
export const sendMagicLink = async (
  email: string,
  name: string,
  magicLink: string,
): Promise<void> => {
  const requestId = generateRequestId();
  const timer = createPerformanceTimer();
  let success = false;

  emailLogger.info(`Préparation de l'envoi d'un email avec lien magique`, {
    requestId,
    recipient: email,
    name,
    linkExpiryMinutes: 30
  });
  
  try {
    // Valider l'adresse email
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      const errorMsg = `Adresse email invalide: ${email}`;
      emailLogger.error(errorMsg, { requestId });
      throw new Error(errorMsg);
    }

    // Contenu de l'email
    const mailOptions = {
      from: `Pool des Séries Éliminatoires NHL <${EMAIL_FROM}>`,
      to: email,
      subject: 'Votre Lien Magique pour le Pool des Séries Éliminatoires NHL',
      text: `
Bonjour ${name},

Voici votre lien magique pour vous connecter au Pool des Séries Éliminatoires NHL:
${magicLink}

Ce lien expirera dans 30 minutes.

Si vous n'avez pas demandé ce lien, vous pouvez ignorer cet email en toute sécurité.

Cordialement,
L'équipe du Pool des Séries Éliminatoires NHL
      `,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Votre Lien Magique pour le Pool des Séries Éliminatoires NHL</title>
  <style>
    :root {
      color-scheme: light dark;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.5;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background-color: #041E42;
      color: white;
      padding: 24px;
      text-align: center;
      border-radius: 8px 8px 0 0;
      margin-bottom: 0;
    }
    .content {
      background-color: white;
      padding: 32px;
      border-radius: 0 0 8px 8px;
      border: 1px solid #e5e7eb;
      border-top: none;
      text-align: center;
    }
    .button {
      display: inline-block;
      background-color: #041E42;
      color: white !important;
      text-decoration: none;
      padding: 14px 28px;
      border-radius: 6px;
      margin: 24px 0;
      font-weight: 600;
      transition: background-color 0.2s ease;
    }
    .button:hover {
      background-color: #082a5c;
    }
    .footer {
      margin-top: 24px;
      text-align: center;
      font-size: 0.9rem;
      color: #6b7280;
      border-top: 1px solid #e5e7eb;
      padding-top: 24px;
    }
    .text {
      color: #333333;
      margin: 16px 0;
      text-align: center;
    }
    .title {
      color: #333333;
      margin: 24px 0;
      text-align: center;
      font-size: 24px;
    }
    @media (prefers-color-scheme: dark) {
      body {
        background-color: #1a1a1a;
        color: #ffffff;
      }
      .content {
        background-color: #2d2d2d;
        border-color: #ffffff33;
      }
      .text {
        color: #ffffff;
      }
      .title {
        color: #ffffff;
      }
      .footer {
        color: #ffffff;
        border-color: #ffffff33;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 28px;">Pool des Séries Éliminatoires NHL</h1>
    </div>
    <div class="content">
      <h2 class="title">Connexion Sécurisée</h2>
      <p class="text">Bonjour ${name},</p>
      <p class="text">Voici votre lien magique pour accéder au Pool des Séries Éliminatoires NHL. Ce lien est valide pour les 30 prochaines minutes.</p>
      <p style="text-align: center;"><a href="${magicLink}" class="button">Se Connecter</a></p>
      
      <p class="text" style="font-size: 0.9em; color: #666666;">Si vous n'avez pas demandé ce lien, vous pouvez ignorer cet email en toute sécurité.</p>
      <div class="footer">
        <p>Cordialement,<br>Seb</p>
      </div>
    </div>
  </div>
</body>
</html>
      `,
    };

    // Envoyer l'email avec mécanisme de réessai
    const info = await trySendMail(mailOptions, requestId);
    
    success = true;
    const duration = timer.end();
    
    // Mise à jour des statistiques
    updateEmailStats(true, duration);
    
    logger.info(`Email avec lien magique envoyé à ${email}`, {
      messageId: info.messageId,
    });
    
    emailLogger.info(`Email avec lien magique envoyé avec succès`, {
      requestId,
      recipient: email,
      messageId: info.messageId,
      duration: `${duration.toFixed(2)}ms`,
    });
  } catch (error) {
    const duration = timer.end();
    updateEmailStats(false, duration);
    
    const errorDetails = {
      requestId,
      recipient: email,
      duration: `${duration.toFixed(2)}ms`,
      error: {
        message: error instanceof Error ? error.message : String(error),
        name: error instanceof Error ? error.name : 'UnknownError',
        stack: error instanceof Error ? error.stack : undefined,
        code: (error as any)?.code,
        responseCode: (error as any)?.responseCode,
      }
    };
    
    logger.error(`Échec de l'envoi de l'email avec lien magique à ${email}:`, error);
    emailLogger.error(`Échec définitif de l'envoi de l'email avec lien magique`, errorDetails);
    
    throw error; // Relancer pour gérer dans le contrôleur
  }
};

// Envoyer un email de notification
export const sendNotification = async (
  email: string,
  subject: string,
  textContent: string,
  htmlContent: string,
): Promise<void> => {
  const requestId = generateRequestId();
  const timer = createPerformanceTimer();
  let success = false;
  
  emailLogger.info(`Préparation de l'envoi d'un email de notification`, {
    requestId,
    recipient: email,
    subject
  });
  
  try {
    // Valider l'adresse email
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      const errorMsg = `Adresse email invalide: ${email}`;
      emailLogger.error(errorMsg, { requestId });
      throw new Error(errorMsg);
    }

    // Contenu de l'email
    const mailOptions = {
      from: `Pool des Séries Éliminatoires NHL <${EMAIL_FROM}>`,
      to: email,
      subject,
      text: textContent,
      html: htmlContent,
    };

    // Envoyer l'email avec mécanisme de réessai
    const info = await trySendMail(mailOptions, requestId);
    
    success = true;
    const duration = timer.end();
    
    // Mise à jour des statistiques
    updateEmailStats(true, duration);
    
    logger.info(`Email de notification envoyé à ${email}`, {
      messageId: info.messageId,
    });
    
    emailLogger.info(`Email de notification envoyé avec succès`, {
      requestId,
      recipient: email,
      subject,
      messageId: info.messageId,
      duration: `${duration.toFixed(2)}ms`,
    });
  } catch (error) {
    const duration = timer.end();
    updateEmailStats(false, duration);
    
    const errorDetails = {
      requestId,
      recipient: email,
      subject,
      duration: `${duration.toFixed(2)}ms`,
      error: {
        message: error instanceof Error ? error.message : String(error),
        name: error instanceof Error ? error.name : 'UnknownError',
        stack: error instanceof Error ? error.stack : undefined,
        code: (error as any)?.code,
        responseCode: (error as any)?.responseCode,
      }
    };
    
    logger.error(`Échec de l'envoi de l'email de notification à ${email}:`, error);
    emailLogger.error(`Échec définitif de l'envoi de l'email de notification`, errorDetails);
    
    throw error; // Relancer pour gérer dans le contrôleur
  }
};

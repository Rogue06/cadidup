# Cahier des Charges Complet - Application d'Optimisation CV/Emploi

## 🎯 Vision du Projet

Créer une application SaaS simple et efficace qui aide les demandeurs d'emploi à optimiser leur CV et générer des lettres de motivation personnalisées en analysant la correspondance avec des offres d'emploi via GPT-4o-mini. L'accent est mis sur la simplicité et la qualité plutôt que sur la quantité de fonctionnalités.

## 📋 Spécifications Fonctionnelles

### Fonctionnalités Core

1. **Analyse & Scoring CV vs Offre d'emploi** (1ère analyse gratuite, puis payant)
2. **Optimisation de CV** avec suggestions précises (payant après le 1er essai)
3. **Génération de lettre de motivation** personnalisée (payant après le 1er essai)
4. **Système d'abonnement** avec protection anti-abus
5. **Suivi des candidatures** (optionnel, dossiers légers)
6. **Dashboard utilisateur** minimaliste et efficace

### User Stories Révisées

- **Utilisateur libre** : "Je peux faire 1 analyse complète gratuite (scoring + optimisation + lettre), puis seulement du scoring pour mes 4 analyses restantes"
- **Utilisateur payant** : "Je peux analyser, optimiser et générer des lettres autant que je veux"
- **Demandeur d'emploi** : "Je colle une offre + mon CV, j'obtiens un score avec étoiles et des suggestions détaillées"
- **Candidat** : "Je peux rééditer mon CV et relancer l'analyse pour voir ma note évoluer"
- **Utilisateur expérimenté** : "Je récupère un CV optimisé et une lettre de motivation prêts à envoyer"

### Logique Anti-Abus

```
Utilisateur nouveau :
├── Analyse 1 : GRATUIT (scoring + optimisation + lettre)
├── Analyses 2-5 : GRATUIT (scoring uniquement)
├── Optimisation CV : PAYANT (dès la 2ème fois)
├── Lettre motivation : PAYANT (dès la 2ème fois)
└── Analyse 6+ : PAYANT (tout)

Contrôles :
- 1 compte par email/IP
- Vérification email obligatoire
- Limitation par device fingerprint
```

## 🏗️ Architecture Technique

### Stack Technologique

```
Frontend: React + TypeScript + Tailwind CSS
Backend: Node.js + Express + TypeScript
Base de données: PostgreSQL (ou SQLite pour dev)
Authentification: JWT + bcrypt + email verification
IA: OpenAI API (GPT-4o-mini)
Anti-fraude: Device fingerprinting + rate limiting
Paiements: Stripe
Hébergement: Railway/Render/DigitalOcean
```

### Structure du Projet

```
job-optimizer/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/     # Composants réutilisables
│   │   │   ├── ScoreDisplay.tsx    # Affichage score étoiles
│   │   │   ├── CVOptimizer.tsx     # Interface optimisation
│   │   │   └── PaywallModal.tsx    # Modal limitation
│   │   ├── pages/         # Pages principales
│   │   │   ├── Analyzer.tsx        # Page analyse principale
│   │   │   ├── Dashboard.tsx       # Suivi candidatures
│   │   │   └── Pricing.tsx         # Plans abonnement
│   │   ├── hooks/         # Custom hooks
│   │   │   ├── useAuth.ts
│   │   │   └── useAnalysisLimits.ts
│   │   ├── utils/         # Fonctions utilitaires
│   │   └── types/         # Types TypeScript
├── server/                # Backend Node.js
│   ├── src/
│   │   ├── routes/        # Routes API
│   │   ├── middleware/    # Middlewares + anti-fraude
│   │   ├── models/        # Modèles de données
│   │   ├── services/      # Logique métier + OpenAI
│   │   └── utils/         # Utilitaires serveur
└── README.md
```

## 📊 Modèle de Données Révisé

### Base de Données (PostgreSQL)

```sql
-- Table utilisateurs avec contrôles anti-abus
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email_verified BOOLEAN DEFAULT FALSE,
    plan VARCHAR(20) DEFAULT 'free', -- 'free', 'premium'

    -- Compteurs d'usage pour freemium
    total_analyses INTEGER DEFAULT 0,
    free_analyses_used INTEGER DEFAULT 0,  -- Max 5
    cv_optimizations_used INTEGER DEFAULT 0, -- 1 gratuit
    cover_letters_used INTEGER DEFAULT 0,    -- 1 gratuit

    -- Anti-abus
    device_fingerprint VARCHAR(255),
    registration_ip VARCHAR(45),
    last_analysis_ip VARCHAR(45),

    -- Abonnement
    stripe_customer_id VARCHAR(255),
    subscription_status VARCHAR(20), -- 'active', 'canceled', 'past_due'
    subscription_expires_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table analyses avec distinction des services
CREATE TABLE analyses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),

    -- Données d'entrée
    job_title VARCHAR(255),
    company_name VARCHAR(255),
    job_offer_text TEXT NOT NULL,
    cv_text TEXT NOT NULL,

    -- Résultats
    score_percentage INTEGER, -- 0-100
    score_stars DECIMAL(2,1), -- 0.0-5.0 pour affichage étoiles
    analysis_result JSONB,

    -- Services utilisés (pour facturation)
    included_cv_optimization BOOLEAN DEFAULT FALSE,
    included_cover_letter BOOLEAN DEFAULT FALSE,
    optimized_cv TEXT,
    cover_letter TEXT,

    -- Métadonnées
    was_free BOOLEAN DEFAULT FALSE,
    analysis_type VARCHAR(20) DEFAULT 'scoring', -- 'scoring', 'full', 'reanalysis'

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table suivi candidatures (optionnel)
CREATE TABLE job_applications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    analysis_id INTEGER REFERENCES analyses(id),

    company_name VARCHAR(255) NOT NULL,
    job_title VARCHAR(255) NOT NULL,
    application_date DATE,
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'sent', 'interview', 'rejected', 'accepted'

    notes TEXT,
    interview_date TIMESTAMP,
    follow_up_date DATE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour performances et anti-abus
CREATE INDEX idx_users_email_verified ON users(email, email_verified);
CREATE INDEX idx_users_device_fingerprint ON users(device_fingerprint);
CREATE INDEX idx_analyses_user_created ON analyses(user_id, created_at);
```

### Types TypeScript Révisés

```typescript
export interface User {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  emailVerified: boolean;
  plan: "free" | "premium";

  // Compteurs d'usage
  totalAnalyses: number;
  freeAnalysesUsed: number; // Max 5
  cvOptimizationsUsed: number; // 1 gratuit
  coverLettersUsed: number; // 1 gratuit

  subscriptionStatus?: "active" | "canceled" | "past_due";
  subscriptionExpiresAt?: Date;
}

export interface Analysis {
  id: number;
  userId: number;
  jobTitle: string;
  companyName?: string;
  jobOfferText: string;
  cvText: string;

  // Résultats scoring
  scorePercentage: number; // 0-100
  scoreStars: number; // 0.0-5.0
  analysisResult: AnalysisResult;

  // Services inclus
  includedCvOptimization: boolean;
  includedCoverLetter: boolean;
  optimizedCv?: string;
  coverLetter?: string;

  wasFree: boolean;
  analysisType: "scoring" | "full" | "reanalysis";
  createdAt: Date;
}

export interface AnalysisResult {
  scorePercentage: number;
  scoreStars: number;

  // Feedback détaillé
  pointsForts: string[];
  pointsAmelioration: string[];
  motsClesManquants: string[];
  competencesCorrespondantes: string[];

  // Suggestions d'optimisation
  suggestionsReformulation: {
    section: string;
    ancien: string;
    nouveau: string;
    justification: string;
  }[];

  // Questions pour améliorer l'analyse
  questionsManquantes?: string[];

  conseilsStrategiques: string[];
}

export interface UsageLimits {
  canAnalyze: boolean;
  canOptimizeCV: boolean;
  canGenerateCoverLetter: boolean;
  freeAnalysesRemaining: number;
  requiresUpgrade: boolean;
  upgradeReason?: string;
}

export interface JobApplication {
  id: number;
  analysisId: number;
  companyName: string;
  jobTitle: string;
  applicationDate?: Date;
  status: "draft" | "sent" | "interview" | "rejected" | "accepted";
  notes?: string;
  interviewDate?: Date;
  followUpDate?: Date;
}
```

## 🔧 Spécifications API Révisées

### Endpoints Backend

```typescript
// Authentification avec vérification email
POST /api/auth/register        # + envoi email vérification
POST /api/auth/verify-email    # Vérification token email
POST /api/auth/login
GET  /api/auth/me

// Analyses avec contrôle d'usage
POST /api/analyses/score       # Scoring seul (5 gratuits)
POST /api/analyses/full        # Scoring + optimisation + lettre (1 gratuit)
POST /api/analyses/reanalyze   # Re-analyser après édition CV
GET  /api/analyses             # Historique utilisateur
GET  /api/analyses/:id         # Détails analyse
DELETE /api/analyses/:id       # Supprimer analyse

// Vérification limites avant action
GET  /api/usage/limits         # Vérifier quotas utilisateur
GET  /api/usage/can-optimize   # Peut optimiser CV ?
GET  /api/usage/can-generate-letter # Peut générer lettre ?

// Services premium (payants après quotas)
POST /api/premium/optimize-cv  # Optimisation CV seule
POST /api/premium/generate-letter # Lettre motivation seule

// Suivi candidatures (optionnel)
POST /api/applications         # Créer candidature
GET  /api/applications         # Liste candidatures
PUT  /api/applications/:id     # Mettre à jour statut
DELETE /api/applications/:id   # Supprimer candidature

// Abonnements
POST /api/subscriptions/create
POST /api/subscriptions/cancel
GET  /api/subscriptions/status
POST /api/webhooks/stripe
```

### Service OpenAI Amélioré

```typescript
class OpenAIService {
  async analyzeJobMatch(
    jobOffer: string,
    cv: string,
    includeOptimization: boolean = false,
    includeCoverLetter: boolean = false
  ): Promise<AnalysisResult> {
    const systemPrompt = `Tu es un expert en recrutement spécialisé dans l'analyse CV/offre d'emploi.
    
RÈGLES IMPORTANTES:
- Sois précis et constructif dans tes suggestions
- Si des informations manquent dans le CV, pose des questions plutôt que d'inventer
- Note de 0 à 100 basée sur la correspondance réelle
- Conversion en étoiles: 0-20=1★, 21-40=2★, 41-60=3★, 61-80=4★, 81-100=5★`;

    const userPrompt = this.buildAnalysisPrompt(
      jobOffer,
      cv,
      includeOptimization,
      includeCoverLetter
    );

    const response = await this.callOpenAI(systemPrompt, userPrompt);
    return this.parseAnalysisResponse(response);
  }

  private buildAnalysisPrompt(
    jobOffer: string,
    cv: string,
    includeOptimization: boolean,
    includeCoverLetter: boolean
  ): string {
    let prompt = `
OFFRE D'EMPLOI:
${jobOffer}

CV CANDIDAT:
${cv}

ANALYSE DEMANDÉE:
1. Score de correspondance (0-100) avec justification
2. Points forts du candidat pour ce poste
3. Points d'amélioration avec suggestions précises
4. Mots-clés manquants dans le CV
5. Compétences qui correspondent à l'offre
`;

    if (includeOptimization) {
      prompt += `
6. OPTIMISATION CV:
   - Suggestions de reformulation précises (section par section)
   - Questions à poser au candidat si informations manquantes
   - Ne jamais inventer d'expériences ou compétences
`;
    }

    if (includeCoverLetter) {
      prompt += `
7. LETTRE DE MOTIVATION:
   - Générée à partir du CV et de l'offre
   - Structure: accroche, motivation, valeur ajoutée, conclusion
   - Personnalisée selon l'entreprise et le poste
`;
    }

    prompt += `
RÉPONDS EN JSON VALIDE UNIQUEMENT:
{
  "scorePercentage": 75,
  "scoreStars": 3.5,
  "pointsForts": ["Point fort avec justification..."],
  "pointsAmelioration": ["Amélioration avec suggestion concrète..."],
  "motsClesManquants": ["mot-clé1", "mot-clé2"],
  "competencesCorrespondantes": ["compétence1", "compétence2"],
  "conseilsStrategiques": ["Conseil 1", "Conseil 2", "Conseil 3"]${
    includeOptimization
      ? `,
  "suggestionsReformulation": [
    {
      "section": "Expérience professionnelle",
      "ancien": "Texte actuel",
      "nouveau": "Texte optimisé",
      "justification": "Pourquoi cette modification"
    }
  ],
  "questionsManquantes": ["Question si info manquante"]`
      : ""
  }${
      includeCoverLetter
        ? `,
  "lettreMotivation": "Lettre complète personnalisée..."`
        : ""
    }
}`;

    return prompt;
  }
}
```

## 💰 Modèle Économique Révisé

### Pricing Strategy Anti-Abus

```typescript
export const USAGE_LIMITS = {
  free: {
    totalAnalyses: 5, // 5 analyses au total
    freeFullAnalyses: 1, // 1 analyse complète gratuite
    cvOptimizations: 1, // 1 optimisation CV gratuite
    coverLetters: 1, // 1 lettre gratuite
    // Après épuisement: scoring seul jusqu'à 5 analyses max
  },
};

export const PLANS = {
  free: {
    name: "Découverte",
    price: 0,
    description: "1 analyse complète + 4 scorings",
    features: [
      "1 analyse complète gratuite (score + optimisation + lettre)",
      "4 analyses scoring supplémentaires",
      "Export texte basique",
      "Conseils d'amélioration",
    ],
  },
  premium: {
    name: "Premium",
    price: 14.99,
    description: "Analyses illimitées + suivi candidatures",
    features: [
      "Analyses illimitées avec optimisation",
      "Lettres de motivation personnalisées",
      "Suivi de candidatures",
      "Export PDF professionnel",
      "Réanalyse après modifications",
      "Support prioritaire",
    ],
  },
};
```

### Calculs de Rentabilité

- **Coût par analyse complète** : ~0.015€ (GPT-4o-mini + optimisation + lettre)
- **Coût par scoring seul** : ~0.005€
- **Utilisateur premium** : 50 analyses/mois × 0.015€ = 0.75€/mois
- **Marge nette** : 14.99€ - 0.75€ = 14.24€ (95%)
- **Objectif** : 200 utilisateurs premium = 2848€/mois

## 🎨 Interface Utilisateur Révisée

### Composant Principal avec Gestion des Limites

```jsx
// Analyzer.tsx - Interface principale
function Analyzer() {
  const { user } = useAuth();
  const { limits, checkLimits } = useAnalysisLimits();
  const [analysisType, setAnalysisType] =
    (useState < "scoring") | ("full" > "scoring");

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header avec statut utilisateur */}
      <div className="mb-6 bg-blue-50 p-4 rounded-lg">
        <h1 className="text-2xl font-bold mb-2">
          Analyseur CV / Offre d'emploi
        </h1>
        <UsageStatus limits={limits} />
      </div>

      {/* Sélecteur type d'analyse */}
      <div className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnalysisOption
            type="scoring"
            title="Analyse & Score"
            description="Score de correspondance + conseils"
            price={limits.canAnalyze ? "Gratuit" : "Premium"}
            selected={analysisType === "scoring"}
            available={limits.canAnalyze}
            onSelect={() => setAnalysisType("scoring")}
          />

          <AnalysisOption
            type="full"
            title="Analyse Complète"
            description="Score + CV optimisé + lettre de motivation"
            price={limits.canOptimizeCV ? "Gratuit" : "14.99€/mois"}
            selected={analysisType === "full"}
            available={limits.canOptimizeCV}
            onSelect={() => setAnalysisType("full")}
          />
        </div>
      </div>

      {/* Formulaire d'analyse */}
      <AnalysisForm
        analysisType={analysisType}
        onSubmit={handleAnalysis}
        disabled={!limits.canAnalyze}
      />

      {/* Modal paywall si nécessaire */}
      {limits.requiresUpgrade && (
        <PaywallModal
          reason={limits.upgradeReason}
          onUpgrade={() => navigate("/pricing")}
          onClose={() => setShowPaywall(false)}
        />
      )}
    </div>
  );
}

// Composant affichage du statut d'usage
function UsageStatus({ limits }: { limits: UsageLimits }) {
  if (limits.freeAnalysesRemaining > 0) {
    return (
      <div className="flex items-center gap-2 text-green-700">
        <CheckCircle className="w-5 h-5" />
        <span>{limits.freeAnalysesRemaining} analyses gratuites restantes</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-orange-600">
      <AlertCircle className="w-5 h-5" />
      <span>Analyses gratuites épuisées - Passez Premium pour continuer</span>
    </div>
  );
}
```

### Affichage des Résultats avec Score Étoiles

```jsx
// ScoreDisplay.tsx
function ScoreDisplay({ analysis }: { analysis: Analysis }) {
  const renderStars = (score: number) => {
    const stars = [];
    const fullStars = Math.floor(score);
    const hasHalfStar = score % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <Star key={i} className="w-8 h-8 text-yellow-400 fill-current" />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <StarHalf key={i} className="w-8 h-8 text-yellow-400 fill-current" />
        );
      } else {
        stars.push(<Star key={i} className="w-8 h-8 text-gray-300" />);
      }
    }
    return stars;
  };

  return (
    <div className="text-center mb-8">
      <div className="mb-4">
        <div className="text-4xl font-bold text-blue-600 mb-2">
          {analysis.scorePercentage}%
        </div>
        <div className="flex justify-center gap-1 mb-2">
          {renderStars(analysis.scoreStars)}
        </div>
        <p className="text-gray-600">Score de correspondance</p>
      </div>

      {/* Feedback rapide basé sur le score */}
      <ScoreFeedback score={analysis.scorePercentage} />
    </div>
  );
}

function ScoreFeedback({ score }: { score: number }) {
  if (score >= 80) {
    return (
      <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg">
        ✅ Excellent profil ! Vous correspondez parfaitement à cette offre.
      </div>
    );
  } else if (score >= 60) {
    return (
      <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg">
        👍 Bon profil avec quelques optimisations possibles.
      </div>
    );
  } else if (score >= 40) {
    return (
      <div className="bg-orange-100 text-orange-800 px-4 py-2 rounded-lg">
        ⚠️ Profil moyen, des améliorations sont nécessaires.
      </div>
    );
  } else {
    return (
      <div className="bg-red-100 text-red-800 px-4 py-2 rounded-lg">
        ❌ Correspondance faible, repensez votre approche.
      </div>
    );
  }
}
```

## ⚙️ Système Anti-Abus

### Middleware de Protection

```typescript
// middleware/antiAbuse.ts
export const antiAbuseMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userId = req.user?.id;
  const userIP = req.ip;
  const deviceFingerprint = req.headers["x-device-fingerprint"] as string;

  // Vérification rate limiting par IP
  const ipKey = `rate_limit:${userIP}`;
  const ipCount = await redis.get(ipKey);
  if (ipCount && parseInt(ipCount) > 10) {
    // 10 analyses/heure par IP
    return res
      .status(429)
      .json({ error: "Trop de requêtes. Réessayez plus tard." });
  }

  // Si utilisateur connecté, vérifier ses quotas
  if (userId) {
    const user = await User.findById(userId);
    if (!user.emailVerified) {
      return res.status(403).json({ error: "Email non vérifié" });
    }

    // Vérifier device fingerprint pour éviter multi-comptes
    if (
      user.deviceFingerprint &&
      user.deviceFingerprint !== deviceFingerprint
    ) {
      await logSuspiciousActivity(userId, "device_mismatch", {
        userIP,
        deviceFingerprint,
      });
    }
  }

  // Incrémenter compteur IP
  await redis.incr(ipKey);
  await redis.expire(ipKey, 3600); // 1 heure

  next();
};

// Service de vérification des quotas
export class UsageLimitService {
  static async checkUserLimits(userId: number): Promise<UsageLimits> {
    const user = await User.findById(userId);

    if (user.plan === "premium" && user.subscriptionStatus === "active") {
      return {
        canAnalyze: true,
        canOptimizeCV: true,
        canGenerateCoverLetter: true,
        freeAnalysesRemaining: -1, // illimité
        requiresUpgrade: false,
      };
    }

    // Utilisateur gratuit
    const canAnalyze = user.freeAnalysesUsed < 5;
    const canOptimizeCV = user.cvOptimizationsUsed < 1;
    const canGenerateCoverLetter = user.coverLettersUsed < 1;

    return {
      canAnalyze,
      canOptimizeCV,
      canGenerateCoverLetter,
      freeAnalysesRemaining: Math.max(0, 5 - user.freeAnalysesUsed),
      requiresUpgrade: !canAnalyze,
      upgradeReason: !canAnalyze
        ? "Vous avez épuisé vos 5 analyses gratuites"
        : !canOptimizeCV || !canGenerateCoverLetter
        ? "L'optimisation et les lettres nécessitent un abonnement Premium"
        : undefined,
    };
  }

  static async incrementUsage(
    userId: number,
    type: "analysis" | "cv_optimization" | "cover_letter"
  ): Promise<void> {
    const updates: any = { totalAnalyses: literal("total_analyses + 1") };

    switch (type) {
      case "analysis":
        updates.freeAnalysesUsed = literal("free_analyses_used + 1");
        break;
      case "cv_optimization":
        updates.cvOptimizationsUsed = literal("cv_optimizations_used + 1");
        break;
      case "cover_letter":
        updates.coverLettersUsed = literal("cover_letters_used + 1");
        break;
    }

    await User.update(updates, { where: { id: userId } });
  }
}
```

## 🚀 Plan de Développement Révisé

### Phase 1 (Semaine 1-2): MVP Anti-Abus

- [ ] Setup projet avec système de limites
- [ ] Authentification + vérification email
- [ ] Base de données avec compteurs d'usage
- [ ] Service OpenAI avec scoring étoiles
- [ ] Interface analyse avec gestion quotas
- [ ] Middleware anti-abus basique

### Phase 2 (Semaine 3): Monétisation

- [ ] Intégration Stripe pour Premium
- [ ] Dashboard avec historique analyses
- [ ] Export PDF des résultats
- [ ] Système de réanalyse pour utilisateurs premium
- [ ] Suivi candidatures (optionnel)

### Phase 3 (Semaine 4): Polish & Sécurité

- [ ] Device fingerprinting avancé
- [ ] Rate limiting Redis
- [ ] Interface utilisateur finale
- [ ] Tests complets
- [ ] Déploiement production

### Phase 4 (Semaine 5+): Optimisations

- [ ] Analytics conversion
- [ ] A/B testing prix
- [ ] Détection fraude avancée
- [ ] Support client
- [ ] Fonctionnalités bonus

## 📈 Métriques de Succès Révisées

- **Taux de conversion gratuit → premium** : >8% (plus restrictif = plus qualifié)
- **Taux d'abus détecté** : <2%
- **Coût d'acquisition** : <10€ par utilisateur premium
- **Churn rate mensuel** : <5%
- **Score satisfaction** : >4.2/5
- **Temps d'analyse** : <45 secondes

## 🔒 Sécurité & Conformité

- **RGPD** : Consentement explicite, droit à l'oubli
- **Sécurité** : Chiffrement des CV stockés, purge automatique après 30 jours
- **Anti-fraude** : Monitoring des patterns suspects, blocage automatique
- **Qualité** : Modération manuelle des cas limites

Cette version révisée met l'accent sur la simplicité, la qualité et la protection contre les abus tout en maintenant une expérience utilisateur fluide pour les utilisateurs légitimes.

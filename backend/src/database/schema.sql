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

-- Table suivi candidatures
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
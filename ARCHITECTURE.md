# 🏗️ Architecture DevSecOps Platform

## Vue d'ensemble de l'architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          Internet                                │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Load Balancer                                │
│                    (Port 80/443)                               │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Reverse Proxy (Nginx)                         │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   Frontend  │  │ API Gateway │  │   Payment   │             │
│  │ (localhost) │  │(api.local)  │  │(pay.local)  │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Docker Network                               │
│                   (172.20.0.0/16)                              │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  Frontend   │  │     API     │  │   Payment   │             │
│  │   Service   │  │   Gateway   │  │   Service   │             │
│  │   (Port 80) │  │ (Port 3000) │  │ (Port 4000) │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │    Admin    │  │   MongoDB   │  │ Monitoring  │             │
│  │  Dashboard  │  │  Database   │  │(Prometheus) │             │
│  │ (Port 8080) │  │ (Port 27017)│  │ (Port 9090) │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    External Services                            │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   Stripe    │  │ Docker Hub  │  │   GitHub    │             │
│  │     API     │  │  Registry   │  │  Repository │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
└─────────────────────────────────────────────────────────────────┘
```

## Composants de l'architecture

### 1. Frontend Application (Port 80)
- **Technologie**: HTML5, CSS3, JavaScript Vanilla
- **Fonction**: Interface utilisateur pour l'e-commerce
- **Sécurité**: 
  - Content Security Policy (CSP)
  - Headers de sécurité HTTP
  - Validation côté client
- **Intégrations**: 
  - Stripe.js pour les paiements
  - API Gateway pour les données

### 2. API Gateway (Port 3000)
- **Technologie**: Node.js, Express.js
- **Fonction**: Point d'entrée centralisé pour toutes les API
- **Sécurité**:
  - Rate limiting
  - Authentification JWT
  - Validation des entrées
  - Helmet.js pour la sécurité HTTP
- **Responsabilités**:
  - Routage des requêtes
  - Authentification et autorisation
  - Agrégation des données
  - Logging centralisé

### 3. Payment Service (Port 4000)
- **Technologie**: Node.js, Express.js, Stripe SDK
- **Fonction**: Gestion des paiements et transactions
- **Sécurité**:
  - Chiffrement des données sensibles
  - Validation stricte des montants
  - Gestion des webhooks Stripe
  - Logging des transactions
- **Intégrations**:
  - Stripe Payment Intent API
  - Webhooks pour les confirmations
  - Base de données pour l'historique

### 4. Admin Dashboard (Port 8080) - VULNÉRABLE
- **Technologie**: Node.js, Express.js, EJS
- **Fonction**: Interface d'administration
- **⚠️ Vulnérabilités intentionnelles**:
  - Injection de commandes
  - Exposition d'informations sensibles
  - Upload de fichiers non sécurisé
  - Authentification faible
  - Configuration de sécurité relâchée

### 5. Reverse Proxy (Nginx)
- **Fonction**: Routage et sécurité
- **Configuration**:
  - SSL/TLS termination
  - Load balancing
  - Compression GZIP
  - Headers de sécurité
- **Routage**:
  - `/` → Frontend
  - `/api/*` → API Gateway
  - `/payment/*` → Payment Service

### 6. Base de données (MongoDB)
- **Fonction**: Stockage persistant
- **Collections**:
  - `users` - Utilisateurs et authentification
  - `payments` - Transactions et historique
  - `products` - Catalogue produits
  - `logs` - Journaux d'audit

## Flux de données

### 1. Flux de paiement
```
User → Frontend → API Gateway → Payment Service → Stripe → Webhook → Database
```

### 2. Flux d'authentification
```
User → Frontend → API Gateway → Database → JWT Token → User
```

### 3. Flux de monitoring
```
All Services → Prometheus → Grafana → Alerts
```

## Sécurité par couches

### Couche Réseau
- Docker network isolé
- Firewall règles
- Ports exposition limitée

### Couche Application
- Validation des entrées
- Authentification forte
- Autorisation basée sur les rôles
- Rate limiting

### Couche Données
- Chiffrement au repos
- Chiffrement en transit
- Backup automatique
- Audit trail

## Scalabilité

### Horizontale
- Réplication des services
- Load balancing
- Database sharding

### Verticale
- Optimisation des ressources
- Caching Redis
- CDN pour les assets

## Monitoring et observabilité

### Métriques
- Prometheus pour la collecte
- Grafana pour la visualisation
- Alerting automatique

### Logs
- Centralisés avec Winston
- Structured logging
- Log rotation

### Tracing
- Jaeger pour le tracing distribué
- Corrélation des requêtes

## Déploiement

### Infrastructure as Code
- Docker Compose pour l'orchestration
- Configuration centralisée
- Secrets management

### CI/CD Pipeline
```
Code → Build → Test → Security Scan → Deploy → Monitor
```

## Considérations DevSecOps

### Shift Left Security
- Analyse statique du code
- Scan des dépendances
- Tests de sécurité automatisés

### Continuous Monitoring
- Vulnerability scanning
- Performance monitoring
- Security event monitoring

### Compliance
- GDPR compliance
- PCI DSS pour les paiements
- Audit logging

## Tests de pénétration

### Cibles identifiées
1. **Admin Dashboard** (Port 8080)
   - Command injection
   - File upload vulnerability
   - Information disclosure
   - Weak authentication

2. **API Gateway**
   - Rate limiting bypass
   - JWT manipulation
   - SQL injection attempts

3. **Payment Service**
   - Transaction manipulation
   - Webhook spoofing
   - Amount tampering

### Outils recommandés
- OWASP ZAP
- Burp Suite
- Nmap
- Nikto
- SQLMap

## Évolutions futures

### Phase 2
- Kubernetes deployment
- Service mesh (Istio)
- Advanced monitoring

### Phase 3
- Multi-cloud deployment
- Advanced security (mTLS)
- Machine learning for fraud detection 
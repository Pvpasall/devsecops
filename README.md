# 🛡️ DevSecOps E-Commerce Platform

## Souleymane SALL

## 📋 Description du Projet

Ce projet démontre l'implémentation d'une architecture DevSecOps complète avec Docker, comprenant 4 applications microservices avec intégration Stripe pour les paiements. Développé dans le cadre du projet E5 ESTIAM Paris.

## 🏗️ Architecture

### Applications Déployées

1. **Frontend (Application Statique)** - Port 80 (via reverse proxy)
   - Interface utilisateur moderne en HTML/CSS/JavaScript
   - Intégration Stripe pour les paiements
   - Responsive design

2. **API Gateway** - Port 80 (via reverse proxy, subdomain api.localhost)
   - Point d'entrée centralisé pour les API
   - Gestion de l'authentification et autorisation
   - Rate limiting et sécurité

3. **Payment Service** - Port 80 (via reverse proxy, subdomain payment.localhost)
   - Service dédié aux paiements Stripe
   - Gestion des webhooks
   - Logging avancé

4. **Admin Dashboard** - Port 8080 (Accès direct pour pentests)
   - Interface d'administration
   - **⚠️ Contient des vulnérabilités intentionnelles pour tests de pénétration**
   - Gestion des utilisateurs et système

### Infrastructure

- **Reverse Proxy**: Nginx
- **Base de données**: MongoDB
- **Conteneurisation**: Docker & Docker Compose
- **Orchestration**: Infrastructure as Code (single file)

## 🚀 Déploiement

### Prérequis

- Docker et Docker Compose installés
- Compte Stripe (pour les clés API)
- Ports 80, 8080 disponibles

### Installation

1. **Cloner le repository**
```bash
git clone <repository-url>
cd projet
```

2. **Configuration des variables d'environnement**
```bash
# Copier le fichier d'exemple
cp env.example .env

# Éditer les variables avec vos clés Stripe
nano .env
```

3. **Déployer l'infrastructure complète**
```bash
# Démarrer tous les services
docker-compose up -d

# Vérifier le statut
docker-compose ps

# Voir les logs
docker-compose logs -f
```

### Configuration Stripe

1. Créer un compte Stripe (mode test)
2. Récupérer les clés API dans le dashboard Stripe
3. Modifier le fichier `.env` avec vos clés :
   - `STRIPE_SECRET_KEY=sk_test_...`
   - `STRIPE_PUBLISHABLE_KEY=pk_test_...`

## 🌐 Accès aux Applications

### Via Reverse Proxy (Port 80)
- **Frontend**: http://localhost
- **API Gateway**: http://api.localhost
- **Payment Service**: http://payment.localhost

### Accès Direct (Pour Pentests)
- **Admin Dashboard**: http://localhost:8080
  - Identifiants: `admin` / `admin123`
  - Identifiants: `user` / `user123`

### 📚 Documentation API (Swagger)
- **API Gateway Documentation**: http://api.localhost/docs
- **Payment Service Documentation**: http://payment.localhost/docs
- **Alternative URLs**:
  - http://localhost/api-docs (redirect vers API Gateway)
  - http://api.localhost/api-docs
  - http://payment.localhost/api-docs

## 🔒 Sécurité

### Mesures de Sécurité Implémentées

1. **Conteneurisation**
   - Utilisateurs non-root dans les conteneurs
   - Images Alpine légères
   - Health checks automatiques

2. **Reverse Proxy**
   - Headers de sécurité
   - Rate limiting
   - Compression GZIP

3. **Applications**
   - Helmet.js pour la sécurité HTTP
   - CORS configuré
   - Validation des entrées
   - Logging complet

### ⚠️ Vulnérabilités Intentionnelles (Admin Dashboard)

**ATTENTION**: L'Admin Dashboard contient des vulnérabilités intentionnelles pour les tests de pénétration :

1. **Injection de commandes**
   - Endpoint `/api/execute` permet l'exécution de commandes système
   - Aucune validation des entrées

2. **Exposition d'informations sensibles**
   - Endpoint `/api/system-info` expose les variables d'environnement
   - Endpoint `/debug` expose l'état interne de l'application

3. **Upload de fichiers non sécurisé**
   - Endpoint `/api/upload` sans validation de chemin
   - Possibilité de path traversal

4. **Authentification faible**
   - Mots de passe hardcodés
   - Session management basique
   - Pas de hachage des mots de passe

5. **Configuration de sécurité relâchée**
   - CSP désactivé
   - CORS permissif
   - Rate limiting très élevé

## 🧪 Tests de Pénétration

### Outils Recommandés

- **OWASP ZAP** - Scanner de vulnérabilités web
- **Burp Suite** - Proxy d'interception
- **Nmap** - Scanner de ports
- **Nikto** - Scanner de vulnérabilités web

### Scénarios de Test

1. **Injection de commandes**
```bash
# Tester l'endpoint /api/execute
curl -X POST http://localhost:8080/api/execute \
  -H "Content-Type: application/json" \
  -d '{"command": "ls -la"}'
```

2. **Information disclosure**
```bash
# Récupérer les informations système
curl http://localhost:8080/api/system-info
curl http://localhost:8080/debug
```

3. **File upload vulnerability**
```bash
# Tenter un path traversal
curl -X POST http://localhost:8080/api/upload \
  -H "Content-Type: application/json" \
  -d '{"filename": "../../../etc/passwd", "content": "test"}'
```

## 📊 Monitoring et Logs

### Health Checks

Tous les services exposent des endpoints de health check :
- Frontend: http://localhost/health
- API Gateway: http://api.localhost/api/health
- Payment Service: http://payment.localhost/api/health
- Admin Dashboard: http://localhost:8080/health

### API Documentation

Chaque service API expose une documentation Swagger complète :
- **API Gateway**: http://api.localhost/docs
  - Endpoints de produits, authentification, commandes
  - Exemples de requêtes et réponses
  - Schémas de données détaillés
- **Payment Service**: http://payment.localhost/docs
  - Intégration Stripe complète
  - Gestion des webhooks
  - Validation des paiements

### Logs

```bash
# Voir tous les logs
docker-compose logs -f

# Logs d'un service spécifique
docker-compose logs -f api-gateway
docker-compose logs -f payment-service
```

## 🔄 CI/CD et DevSecOps

### Pipeline Recommandé

1. **Build Stage**
   - Construction des images Docker
   - Scan de sécurité des images (Trivy, Clair)
   - Tests unitaires

2. **Security Stage**
   - Analyse statique du code (SonarQube)
   - Scan des dépendances (npm audit)
   - Tests de sécurité automatisés

3. **Deploy Stage**
   - Déploiement en environnement de test
   - Tests d'intégration
   - Tests de pénétration automatisés

### Commandes Utiles

```bash
# Audit de sécurité npm
docker-compose exec api-gateway npm audit
docker-compose exec payment-service npm audit

# Reconstruction des images
docker-compose build --no-cache

# Nettoyage
docker-compose down -v
docker system prune -a
```

## 🐳 Docker Hub

### Publication des Images

```bash
# Build et tag des images
docker build -t votre-username/devsecops-frontend ./frontend
docker build -t votre-username/devsecops-api-gateway ./api-gateway
docker build -t votre-username/devsecops-payment-service ./payment-service
docker build -t votre-username/devsecops-admin-dashboard ./admin-dashboard

# Push vers Docker Hub
docker push votre-username/devsecops-frontend
docker push votre-username/devsecops-api-gateway
docker push votre-username/devsecops-payment-service
docker push votre-username/devsecops-admin-dashboard
```

## 🎯 Objectifs Pédagogiques

Ce projet démontre :

1. **Architecture Microservices**
   - Séparation des responsabilités
   - Communication inter-services
   - Scalabilité horizontale

2. **Sécurité DevSecOps**
   - Security by design
   - Monitoring et logging
   - Tests de pénétration

3. **Conteneurisation**
   - Optimisation des images Docker
   - Orchestration avec Docker Compose
   - Infrastructure as Code

4. **Intégration de Paiement**
   - API Stripe
   - Webhooks
   - Gestion des erreurs

## 👥 Équipe

- **Développement Frontend**: [Nom]
- **Développement Backend**: [Nom]
- **DevSecOps**: [Nom]
- **Tests de Sécurité**: [Nom]
- **Documentation**: [Nom]

## 📝 Licence

Ce projet est développé à des fins éducatives dans le cadre du cursus ESTIAM E5 DevSecOps.

## ⚠️ Avertissement

**IMPORTANT**: Ce projet contient des vulnérabilités intentionnelles à des fins pédagogiques. Ne jamais déployer en production sans corrections de sécurité appropriées.

## 🔗 Liens Utiles

- [Documentation Stripe](https://stripe.com/docs)
- [Docker Documentation](https://docs.docker.com/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [DevSecOps Best Practices](https://devsecops.org/) 
# declic

Application de correction orthographique, elle corrige un phrase simple et affiche :

- le texte corrigé.
- les mots ou passages modifiés.
- une explication des corrections.

                  UTILISATEUR
                       |
                       | ouvre l'application
                       v
               +----------------+
               |   Navigateur   |
               +----------------+
                       |
                       | HTTP / HTTPS
                       v
+---------------------------------------------------+
|                TON SERVEUR DOCKER                 |
|                                                   |
|  +---------------------+                          |
|  | Conteneur FRONTEND  |                          |
|  |                     |                          |
|  | Nginx sert les      |                          |
|  | fichiers Angular   |                          |
|  +---------------------+                          |
|             |                                     |
|             | Le navigateur exécute Angular       |
|             | et appelle POST /api/v1/corrections  |
|             v                                     |
|  +---------------------------------------------+  |
|  | Conteneur BACKEND : Java / Spring Boot       |  |
|  |                                             |  |
|  | Controller -> Service -> OpenAI Provider    |  |
|  |                                             |  |
|  | Clé API injectée au lancement               |  |
|  +---------------------------------------------+  |
|                         |                         |
+-------------------------|-------------------------+
                          |
                          | HTTPS + clé API
                          v
                 +------------------+
                 |    API OpenAI    |
                 |                  |
                 | Corrige le texte |
                 +------------------+

## Technologies

- Backend : Java 21, Spring Boot et Maven
- Frontend : Angular et TypeScript
- IA : API OpenAI, puis modèle local.
- L'application tourne sous docker.

## Prérequis

- Java 21
- Node.js : ??
- Une clé API OpenAI pour les premiers tests

# Installation

```bash
git clone <URL_DU_DEPOT>
cd <NOM_DU_DOSSIER>
```

## Configuration

Configurer les variables d’environnement du backend :

- `OPENAI_API_KEY` : clé API OpenAI
- `OPENAI_MODEL` : modèle utilisé

## Lancement

Backend, depuis le dossier `backend` :

```bash
./mvnw spring-boot:run
```

Sur Windows : `mvnw.cmd spring-boot:run`.

Frontend, depuis le dossier `frontend` :

```bash
npm ci
npm start
```

## Avancement

- [ ] V0 : correction via OpenAI en local
- [ ] V1 : tests, sécurité et déploiement
- [ ] V2 : connexion à une IA locale

## Note JDK

$env:JAVA_HOME = "C:\Program Files\Java\jdk-21.0.12"; $env:Path = "$env:JAVA_HOME\bin;$env:Path"; $env:SPRING_PROFILES_ACTIVE = "dev"
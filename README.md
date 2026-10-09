# declic

Application de correction orthographique, elle corrige un phrase simple et affiche :

- le texte corrigé.
- les mots ou passages modifiés.
- une explication des corrections.

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
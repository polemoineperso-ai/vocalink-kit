# Options avancées (facultatives)

Vocalink fonctionne entièrement sans ces options. Elles sont plus techniques : ne les configurez que si vous en avez besoin. Chaque option absente ou mal configurée est simplement ignorée — vos idées s'enregistrent toujours normalement.

## Ajouter une variable dans Vercel (procédure commune)

Toutes les options se configurent de la même façon :

1. [vercel.com](https://vercel.com) → votre projet → **Settings** → **Environment Variables**.
2. **Key** = le nom de la variable (ex. `NOTION_API_KEY`), **Value** = sa valeur → **Save**.
3. Une fois toutes les variables ajoutées : onglet **Deployments** → **⋯** sur la première ligne → **Redeploy**.

---

## Synchronisation Notion (idées « Projet »)

Chaque idée de catégorie **Projet** crée ou met à jour une page dans une base Notion.

1. Allez sur [notion.so/my-integrations](https://www.notion.so/my-integrations) → **New integration** → type **Internal** → copiez le secret → variable `NOTION_API_KEY`.
2. Créez une base Notion (une base pleine page convient) avec ces propriétés, noms exacts :
   - **Name** (titre, existe par défaut)
   - **Résumé** — texte
   - **Tags** — multi-select
   - **Statut** — select, avec les options `PENDING` et `ACTIONED`
3. **À ne pas oublier** : ouvrez la base → menu **•••** → **Connexions** (*Connections*) → ajoutez l'intégration créée à l'étape 1. Sans cela, Notion répond « introuvable » même avec un secret valide.
4. Copiez l'identifiant de la base depuis son adresse (`https://www.notion.so/<espace>/<32 caractères>?v=...` : ce sont les 32 caractères) → variable `NOTION_DATABASE_ID`.

---

## Synchronisation Google Tasks (toutes les idées)

Chaque idée crée ou met à jour une tâche Google Tasks ; « Marquer traité » coche la tâche. **C'est l'option la plus technique** : elle demande d'installer [Node.js](https://nodejs.org) sur votre ordinateur et de lancer une commande une fois.

1. [console.cloud.google.com](https://console.cloud.google.com) → créez un projet → activez l'**API Google Tasks**.
2. **Écran de consentement OAuth** → type **Externe**, statut **Test** → ajoutez votre propre adresse Google comme **utilisateur de test** → scope `https://www.googleapis.com/auth/tasks`.
3. **Identifiants** → **Créer des identifiants** → **ID client OAuth** → type **Application de bureau**.
4. Notez l'ID client et le code secret → variables `GOOGLE_CLIENT_ID` et `GOOGLE_CLIENT_SECRET`.
5. Obtenez le jeton d'autorisation, **une seule fois**, sur votre ordinateur :
   - téléchargez votre copie du programme depuis GitHub (bouton **Code** → **Download ZIP**) et décompressez-la ;
   - dans ce dossier, créez un fichier `.env` contenant `GOOGLE_CLIENT_ID="..."` et `GOOGLE_CLIENT_SECRET="..."` ;
   - ouvrez un terminal dans ce dossier et lancez `npm install` puis `node scripts/get-google-refresh-token.mjs` ;
   - ouvrez l'adresse affichée, connectez-vous avec votre compte Google et acceptez ;
   - le jeton s'affiche dans le terminal → variable `GOOGLE_REFRESH_TOKEN`.
6. Limites connues : Google Tasks ne garde que la date d'échéance, pas l'heure. En statut « Test », le jeton peut expirer après une longue inactivité : relancez alors l'étape 5.

---

## Email récapitulatif quotidien (idées oubliées)

Chaque jour, un email liste les idées toujours « en attente » depuis plus de 3 jours.

1. Créez un compte sur [resend.com](https://resend.com) → **API Keys** → **Create API Key** → variable `RESEND_API_KEY`.
2. `DIGEST_TO_EMAIL` = l'adresse qui reçoit l'email. **Sans domaine vérifié chez Resend, ce doit être l'adresse de votre compte Resend.**
3. `CRON_SECRET` = une suite de caractères au hasard (protège l'envoi contre les appels extérieurs).
4. `APP_URL` = l'adresse de votre Vocalink (ex. `https://mon-vocalink-xxxx.vercel.app`), pour les liens dans l'email.
5. Facultatif : si vous avez vérifié votre propre domaine chez Resend, `DIGEST_FROM_EMAIL` = `Vocalink <digest@votre-domaine.fr>` permet d'envoyer vers n'importe quelle adresse.

L'envoi est automatique tous les jours vers 8 h UTC (10 h en été et 9 h en hiver, heure de Paris).

---

## Utiliser Claude (Anthropic) plutôt qu'OpenAI pour classer les idées

Par défaut, OpenAI transcrit **et** classe les idées. Si vous ajoutez une clé Anthropic (`ANTHROPIC_API_KEY`, sur [console.anthropic.com](https://console.anthropic.com)), c'est Claude qui classe ; OpenAI reste utilisé pour la transcription.

Le modèle OpenAI de classification peut être changé avec `OPENAI_CLASSIFICATION_MODEL` (par défaut `gpt-4.1-mini`).

# Vocalink

> ## 👉 [Guide d'installation simple, étape par étape](https://polemoineperso-ai.github.io/vocalink-kit/)
>
> Vous voulez simplement installer Vocalink ? Ouvrez **[ce guide](https://polemoineperso-ai.github.io/vocalink-kit/)** : il est plus facile à suivre que cette page.

**Dites une idée à voix haute, elle se transforme en action** : un projet, un email à écrire, un appel à passer, ou simplement une note. Vocalink transcrit votre voix, range l'idée dans la bonne catégorie, repère les contacts (nom, téléphone, email…) et les dates, puis vous laisse tout relire avant d'enregistrer.

Ce guide vous permet d'installer **votre propre Vocalink**, seul, sans connaissances techniques. Vos idées restent chez vous : personne d'autre n'y a accès.

---

## Avant de commencer

| | |
|---|---|
| ⏱️ **Durée** | 30 à 45 minutes, une seule fois |
| 💻 **Matériel** | un ordinateur (plus confortable qu'un téléphone pour l'installation) |
| 📧 **À avoir sous la main** | une adresse email, votre téléphone (codes de vérification), une carte bancaire |
| 💶 **Coût** | l'hébergement est **gratuit** ; seule l'intelligence artificielle (OpenAI) est payante, à l'usage : quelques centimes par idée, soit **quelques euros par mois** pour un usage personnel. Vous payez directement OpenAI, par crédit prépayé : **pas d'abonnement, pas de mauvaise surprise**. |

Vous allez créer **3 comptes**, tous à votre nom :

1. **GitHub** — garde une copie du programme. Gratuit. Vous n'aurez plus besoin d'y retourner ensuite.
2. **OpenAI** — l'intelligence artificielle qui comprend votre voix. Payant à l'usage.
3. **Vercel** — fait tourner l'application sur Internet. Gratuit. Se crée en un clic à partir de GitHub.

> 💡 **Astuce** : ouvrez un fichier texte ou une note sur votre ordinateur pour y coller au fur et à mesure votre **clé OpenAI** (étape 2) et votre **mot de passe** (étape 3). Vous en aurez besoin à l'étape 4.

> ℹ️ Les sites cités ci-dessous changent parfois l'intitulé exact de leurs boutons. Si un bouton n'a pas tout à fait le même nom, cherchez celui qui s'en approche le plus.

---

## Étape 1 — Créer votre compte GitHub (5 min)

1. Allez sur **[github.com/signup](https://github.com/signup)**.
2. Saisissez votre **adresse email**, puis cliquez sur **Continue**.
3. Choisissez un **mot de passe**, puis un **nom d'utilisateur** (par exemple `marie-dupont`), puis **Continue**.
4. Résolvez la petite vérification (« je ne suis pas un robot »).
5. Ouvrez votre boîte mail : GitHub vous a envoyé un **code à 8 chiffres**. Saisissez-le.
6. Si GitHub vous pose des questions (« combien êtes-vous dans votre équipe ? »…), choisissez les réponses les plus simples ou cliquez sur **Skip** (passer). Si une offre payante est proposée, choisissez **Free** (gratuit).

✅ **C'est fait quand** vous voyez la page d'accueil de GitHub.

---

## Étape 2 — Obtenir votre clé OpenAI (10 min)

La « clé » est un code secret qui autorise votre Vocalink à utiliser OpenAI **à vos frais**. Ne la partagez avec personne.

### 2.a — Créer le compte

1. Allez sur **[platform.openai.com/signup](https://platform.openai.com/signup)**.
2. Créez un compte (email + mot de passe, ou **Continue with Google**).
3. Confirmez votre adresse email et, si demandé, votre numéro de téléphone.

> ⚠️ Il s'agit de la **plateforme développeur** d'OpenAI (platform.openai.com). Un abonnement ChatGPT Plus **ne suffit pas** et n'est **pas nécessaire** : ce sont deux choses séparées.

### 2.b — Ajouter du crédit

1. Allez sur **[platform.openai.com/settings/organization/billing](https://platform.openai.com/settings/organization/billing)**.
2. Cliquez sur **Add payment details** (ajouter un moyen de paiement), puis **Individual** (particulier), et saisissez votre carte.
3. Achetez du crédit : **5 $** suffisent largement pour commencer (le minimum accepté).
4. **Recommandé** : laissez la recharge automatique (**auto recharge**) **désactivée**. Ainsi, vous ne pouvez jamais dépenser plus que le crédit acheté.

### 2.c — Créer la clé

1. Allez sur **[platform.openai.com/api-keys](https://platform.openai.com/api-keys)**.
2. Cliquez sur **Create new secret key**.
3. Nom : `Vocalink`. Si un champ d'**expiration** apparaît, choisissez **Jamais** (*Never*) : une clé qui expire coupe Vocalink le jour dit, sans prévenir. Cliquez sur **Create secret key**.
4. Une longue suite de caractères commençant par **`sk-`** s'affiche. Cliquez sur **Copy** et **collez-la tout de suite dans votre note**.

> ⚠️ **OpenAI n'affichera plus jamais cette clé.** Si vous la perdez, ce n'est pas grave : supprimez-la et recréez-en une (même procédure).

✅ **C'est fait quand** votre note contient une clé commençant par `sk-`.

---

## Étape 3 — Choisir le mot de passe de votre Vocalink (1 min)

Votre Vocalink sera accessible sur Internet : ce mot de passe empêche quiconque d'autre d'y entrer.

- Choisissez un mot de passe **nouveau**, d'au moins **12 caractères** (par exemple trois mots au hasard : `girafe-orage-violon42`).
- Notez-le dans votre note. Votre téléphone vous proposera de l'enregistrer à la première connexion.

---

## Étape 4 — Installer Vocalink en un clic (10 min)

1. Cliquez sur ce bouton :

   [![Installer sur Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fpolemoineperso-ai%2Fvocalink-kit&project-name=mon-vocalink&repository-name=mon-vocalink&env=OPENAI_API_KEY,APP_PASSWORD&envDescription=OPENAI_API_KEY%20%3A%20la%20cl%C3%A9%20OpenAI%20cr%C3%A9%C3%A9e%20%C3%A0%20l%27%C3%A9tape%202.%20APP_PASSWORD%20%3A%20le%20mot%20de%20passe%20choisi%20%C3%A0%20l%27%C3%A9tape%203.&envLink=https%3A%2F%2Fgithub.com%2Fpolemoineperso-ai%2Fvocalink-kit%23readme&stores=%5B%7B%22type%22%3A%22integration%22%2C%22integrationSlug%22%3A%22neon%22%2C%22productSlug%22%3A%22neon%22%2C%22protocol%22%3A%22storage%22%7D%5D)

2. **Créer le compte Vercel** : cliquez sur **Continue with GitHub**, puis sur **Authorize Vercel** (autoriser). Si Vercel demande votre type d'usage, choisissez **Hobby** (usage personnel, gratuit) et indiquez votre nom.
3. **Copie du programme** : Vercel propose de créer une copie dans votre GitHub, nommée `mon-vocalink`. Laissez **Private repository** (dépôt privé) coché et cliquez sur **Create**. Si GitHub demande d'autoriser Vercel à accéder à vos dépôts, acceptez (**Install** / **Authorize**).
4. **Base de données** : Vercel propose d'ajouter **Neon** (là où vos idées seront rangées). Cliquez sur **Add** ou **Create**, puis :
   - choisissez le plan **Free** (gratuit) ;
   - comme région, choisissez **Europe** (par exemple *Frankfurt*) si on vous la demande ;
   - acceptez les conditions et validez (**Accept and Create** / **Continue**).
5. **Vos deux secrets** : Vercel affiche deux cases à remplir.
   - `OPENAI_API_KEY` → collez votre **clé OpenAI** (celle qui commence par `sk-`) ;
   - `APP_PASSWORD` → collez votre **mot de passe** de l'étape 3.

   Attention à ne pas ajouter d'espace avant ou après.
6. Cliquez sur **Deploy** (déployer). L'installation prend **2 à 4 minutes** : laissez la page ouverte.
7. Des confettis 🎉 apparaissent : c'est installé ! Cliquez sur **Continue to Dashboard** (ou **Go to Dashboard**).

✅ **C'est fait quand** vous voyez une miniature de l'application et une adresse du type **`mon-vocalink-xxxx.vercel.app`**. Cette adresse est **votre Vocalink** : notez-la.

> En cas d'erreur rouge pendant l'installation, voir [Problèmes fréquents](#problèmes-fréquents).

---

## Étape 5 — Premier essai (2 min)

1. Ouvrez votre adresse **`https://mon-vocalink-xxxx.vercel.app`**.
2. Saisissez votre **mot de passe** (étape 3).
3. Touchez le **gros bouton micro orange** en bas de l'écran, autorisez le **micro**, et dites par exemple :
   > « Rappeler Jean Dupont, directeur chez ACME, au 06 12 34 56 78, jeudi à 10 h. »
4. Touchez le bouton rouge pour arrêter : Vocalink écrit et range l'idée tout seul. Après quelques secondes, Vocalink affiche la transcription, la catégorie **Appel / Rappel**, le contact et la date. Corrigez si besoin, puis **Enregistrer**.

✅ **Bravo, tout fonctionne.**

---

## Étape 6 — Mettre Vocalink sur l'écran d'accueil du téléphone (3 min)

Vocalink s'utilise comme une application, sans passer par un store.

**iPhone (Safari)**
1. Ouvrez votre adresse Vocalink **dans Safari** et connectez-vous.
2. Touchez le bouton **Partager** (carré avec une flèche vers le haut).
3. Choisissez **Sur l'écran d'accueil**, puis **Ajouter**.

**Android (Chrome)**
1. Ouvrez votre adresse Vocalink dans **Chrome** et connectez-vous.
2. Touchez le menu **⋮** en haut à droite.
3. Choisissez **Installer l'application** (ou **Ajouter à l'écran d'accueil**).

L'icône 🎙️ Vocalink apparaît avec vos autres applications. Ouvrez-la : Vocalink vous demande votre **prénom**, puis propose le **brief du matin** (une notification chaque matin avec ce qui vous attend) : touchez **Activer les notifications** puis **Autoriser**. À la première dictée, **autorisez l'accès au micro**.

> Sur iPhone, les notifications ne fonctionnent qu'en ouvrant Vocalink **depuis l'icône** de l'écran d'accueil (iOS 16.4 ou plus récent).

> Si le micro ne réagit pas depuis l'icône, ouvrez simplement votre adresse Vocalink dans le navigateur : tout fonctionne de la même façon.

---

## Au quotidien

- **Dicter** : touchez le micro (en bas, au centre) → parlez → touchez pour arrêter → relisez → *Enregistrer*.
- **Mes idées** (l'accueil) : vos idées en cartes, rangées par étape : *Nouvelle*, *En réflexion*, *En cours*, puis *Réalisée*. Touchez une idée pour la faire avancer d'une étape, lui **ajouter une note à la voix** (une précision, une piste qui vous vient plus tard), ou l'*archiver* : elle est mise de côté, pas perdue.
- **À faire** (onglet) : uniquement les appels et emails, rangés par moment (en retard, aujourd'hui, demain…).
- **Retrouver** : la recherche de *Mes idées* (et de *À faire*) permet de chercher (y compris par nom de contact ou société) et de filtrer par catégorie, statut ou priorité.
- **Agir** : sur chaque idée, *Écrire l'email* ou *Agenda* prépare le message ou l'événement ; le numéro de téléphone d'un contact se touche pour appeler.
- **Contacter** : sur une idée avec un contact, *Appeler*, *SMS*, *WhatsApp* ou *Email* en un toucher.
- **Reporter** : une idée du jour ou en retard se reporte à *Demain*, *Lundi* ou *Dans 1 semaine*.
- **Dicter en un geste** : l'adresse `https://votre-adresse.vercel.app/?dicter=1` ouvre Vocalink micro déjà lancé. Sur iPhone, mettez-la dans un raccourci (app *Raccourcis* → *Ouvrir les URL*), à lancer avec Siri ou le bouton Action. Sur Android, appui long sur l'icône → *Dicter*.
- **Ranger une action** : touchez le rond à gauche quand c'est fait (*Annuler* apparaît quelques secondes). Glissez une action vers la gauche pour la reporter. Pour supprimer : ouvrez l'idée, puis *Supprimer l'idée* tout en bas.

---

## Problèmes fréquents

**« Transcription indisponible » ou « La transcription a échoué »**
La clé OpenAI a expiré (colonne « Expire » sur la page des clés OpenAI), est mal copiée, ou votre crédit OpenAI est épuisé.
→ Vérifiez votre crédit sur [platform.openai.com/settings/organization/billing](https://platform.openai.com/settings/organization/billing). Si besoin, créez une nouvelle clé et remplacez-la (voir ci-dessous).

**Changer la clé OpenAI ou le mot de passe**
1. Allez sur [vercel.com](https://vercel.com) → votre projet **mon-vocalink** → **Settings** → **Environment Variables**.
2. Sur la ligne `OPENAI_API_KEY` ou `APP_PASSWORD`, cliquez sur **⋯** → **Edit**, collez la nouvelle valeur, **Save**.
3. Allez dans l'onglet **Deployments**, sur la première ligne cliquez sur **⋯** → **Redeploy** → **Redeploy**. Attendez 2 minutes.

**Mot de passe oublié** : même procédure — vous le remplacez simplement par un nouveau.

**L'installation (étape 4) s'est arrêtée sur une erreur rouge**
→ Dans Vercel, onglet **Deployments**, cliquez sur **⋯** → **Redeploy**. La plupart des erreurs viennent d'une base de données pas encore prête : un deuxième essai suffit souvent.
→ Si la base Neon n'a pas été créée à l'étape 4 : projet → onglet **Storage** → **Create Database** → **Neon** → **Free** → **Connect**, puis **Redeploy**.

**Le micro ne fonctionne pas**
→ Vérifiez que le navigateur a le droit d'utiliser le micro (Réglages du téléphone → Safari/Chrome → Micro). L'adresse doit bien commencer par **https://**.

---

## Bon à savoir

- **Vos données** : vos idées sont stockées dans **votre** base de données (Neon), accessible uniquement avec **votre** mot de passe. L'audio est envoyé à OpenAI pour être transcrit, puis **n'est conservé nulle part** par Vocalink.
- **Contacts** : si vous notez des coordonnées de tiers, gardez-les pour votre usage personnel.
- **Usage** : l'offre gratuite de Vercel (Hobby) est prévue pour un usage **personnel, non commercial**.
- **Mises à jour** : votre Vocalink est une copie indépendante. Il ne change pas tout seul et continue de fonctionner tel quel.
- **Options avancées** (facultatives, plus techniques) : synchronisation Notion, Google Tasks, email récapitulatif quotidien — voir [docs/OPTIONS-AVANCEES.md](docs/OPTIONS-AVANCEES.md).

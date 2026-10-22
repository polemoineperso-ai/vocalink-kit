# Vocalink

**Dites une idée à voix haute : Vocalink la garde, la fait mûrir et vous la rappelle au bon moment.** Il transcrit votre voix, range l'idée, repère les contacts et les dates, puis vous laisse tout relire avant d'enregistrer.

## Installer votre Vocalink

**Suivez le [guide d'installation pas à pas](https://polemoineperso-ai.github.io/vocalink-kit/)** : 4 missions, environ 30 minutes, sans connaissances techniques. Vous créez 3 comptes à votre nom : GitHub (gratuit), OpenAI (payant à l'usage, quelques euros par mois) et Vercel (gratuit).

Le guide fait tout le chemin avec vous. Pour mémoire, le bouton d'installation est celui-ci :

[![Installer sur Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fpolemoineperso-ai%2Fvocalink-kit&project-name=mon-vocalink&repository-name=mon-vocalink&env=OPENAI_API_KEY,APP_PASSWORD&envDescription=OPENAI_API_KEY%20%3A%20la%20cl%C3%A9%20OpenAI%20cr%C3%A9%C3%A9e%20%C3%A0%20l%27%C3%A9tape%202.%20APP_PASSWORD%20%3A%20le%20mot%20de%20passe%20choisi%20%C3%A0%20l%27%C3%A9tape%203.&envLink=https%3A%2F%2Fgithub.com%2Fpolemoineperso-ai%2Fvocalink-kit%23readme&stores=%5B%7B%22type%22%3A%22integration%22%2C%22integrationSlug%22%3A%22neon%22%2C%22productSlug%22%3A%22neon%22%2C%22protocol%22%3A%22storage%22%7D%5D)

Vercel y demande deux réglages :

- `OPENAI_API_KEY` : votre clé OpenAI (elle commence par `sk-`) ;
- `APP_PASSWORD` : le mot de passe que vous avez choisi pour protéger votre Vocalink.

Collez-les sans espace avant ni après.

## Un souci ?

- Dans Vocalink : **Réglages → Tout fonctionne ?** vérifie la base de données, la clé et le crédit OpenAI, et dit quoi faire.
- Les problèmes fréquents (crédit épuisé, clé ou mot de passe à changer, micro) sont expliqués dans l'aide, en bas du [guide](https://polemoineperso-ai.github.io/vocalink-kit/).

## Au quotidien

- **Dicter** : touchez le micro (en bas, au centre) → parlez → touchez pour arrêter → relisez → *Enregistrer*.
- **Mes idées** (l'accueil) : vos idées en cartes, rangées par étape : *Nouvelle*, *En réflexion*, *En cours*, puis *Réalisée*. Touchez une idée pour la faire avancer d'une étape, lui **ajouter une note à la voix** (une précision, une piste qui vous vient plus tard), ou l'*archiver* : elle est mise de côté, pas perdue.
- **Prochaine étape** : sur une idée, *Suggérer une prochaine étape* propose un petit pas concret. *Créer l'action* l'ajoute à *À faire* (avec le contact connu) ; une piste de réflexion s'ajoute en note.
- **Thèmes** : sous la recherche de *Mes idées*, vos sujets les plus fréquents en un toucher.
- **À redécouvrir** : une idée oubliée depuis plus d'une semaine remonte en haut de *Mes idées* (et dans le brief du matin). *La développer*, *Plus tard* ou *Archiver* : elle ne revient pas avant deux semaines.
- **À faire** (onglet) : uniquement les appels et emails, rangés par moment (en retard, aujourd'hui, demain…).
- **Retrouver** : la recherche de *Mes idées* (et de *À faire*) permet de chercher (y compris par nom de contact ou société) et de filtrer par catégorie, statut ou priorité.
- **Agir** : sur chaque idée, *Écrire l'email* ou *Agenda* prépare le message ou l'événement ; le numéro de téléphone d'un contact se touche pour appeler.
- **Contacter** : sur une idée avec un contact, *Appeler*, *SMS*, *WhatsApp* ou *Email* en un toucher.
- **Reporter** : une idée du jour ou en retard se reporte à *Demain*, *Lundi* ou *Dans 1 semaine*.
- **Dicter en un geste** : l'adresse `https://votre-adresse.vercel.app/?dicter=1` ouvre Vocalink micro déjà lancé. Sur iPhone, mettez-la dans un raccourci (app *Raccourcis* → *Ouvrir les URL*), à lancer avec Siri ou le bouton Action. Sur Android, appui long sur l'icône → *Dicter*.
- **Exporter** : *Réglages → Mes données* télécharge toutes vos idées, avec notes et contacts : un tableau pour Excel, ou une sauvegarde complète.
- **Ranger une action** : touchez le rond à gauche quand c'est fait (*Annuler* apparaît quelques secondes). Glissez une action vers la gauche pour la reporter. Pour supprimer : ouvrez l'idée, puis *Supprimer l'idée* tout en bas.

---

## Mettre à jour votre Vocalink

Quand une nouvelle version existe, une pastille apparaît sur votre initiale dans Vocalink, et **Réglages → À propos** l'annonce. La mise à jour prend 2 minutes et ne touche pas à vos idées.

1. Sur [github.com](https://github.com), ouvrez votre dépôt **mon-vocalink**.
2. Onglet **Actions** → à gauche **Mettre à jour Vocalink** → à droite **Run workflow** → bouton vert **Run workflow**.
3. Attendez la coche verte (environ 1 minute), puis 2 à 3 minutes que Vercel remette votre assistant en ligne. Fermez et rouvrez l'app.

Une croix rouge ? Votre Vocalink continue de marcher comme avant : signalez-le (ci-dessous).

## Signaler un problème

Dans Vocalink : **Réglages → Signaler un problème**, ou directement [sur GitHub](https://github.com/polemoineperso-ai/vocalink-kit/issues/new?template=probleme.yml) avec votre compte. **Le message est public** : n'y mettez jamais votre mot de passe, votre clé OpenAI, l'adresse de votre Vocalink ni le contenu de vos idées.

## Précautions d'usage

Votre Vocalink n'est pas l'appli d'une entreprise : c'est **le vôtre**, installé sur vos propres comptes. C'est ce qui le rend privé, et c'est pour ça que ces quelques réflexes comptent.

- **Vous êtes la seule personne à y avoir accès.** Vos idées sont rangées dans **votre** base de données (Neon), sur **vos** comptes. Personne d'autre ne peut les lire, pas même la personne qui vous a envoyé ce kit. Le revers : personne ne pourra non plus les récupérer à votre place. Gardez précieusement votre note (clé et mot de passe) et vos accès GitHub, Vercel et OpenAI.
- **Votre mot de passe ouvre tout.** Quiconque le connaît voit toutes vos idées : ne le donnez à personne et ne le réutilisez pas ailleurs. Téléphone perdu, ou mot de passe qui a circulé ? Changez-le (marche à suivre dans l'aide du [guide](https://polemoineperso-ai.github.io/vocalink-kit/), « Changer la clé ou le mot de passe ») : tous les appareils connectés sont aussitôt déconnectés. Sur un appareil partagé, déconnectez-vous depuis **Réglages**.
- **Votre clé OpenAI, c'est comme une carte bancaire.** Elle permet de dépenser votre crédit. Ne l'envoyez jamais par email, message ou capture d'écran, à personne, même pour vous faire aider. Si elle a pu fuiter : supprimez-la sur la page des clés OpenAI et créez-en une nouvelle. Laissez la recharge automatique désactivée : au pire, vous perdez le crédit restant, jamais plus.
- **Ce qui sort de chez vous.** Pour vous comprendre, l'enregistrement de votre voix et le texte de vos idées passent par OpenAI. Vocalink ne garde pas l'enregistrement. Selon ses conditions, OpenAI n'entraîne pas ses modèles avec ce qui passe par une clé comme la vôtre. Si vous activez les options avancées (Notion, Google Tasks, email), vos idées y sont aussi copiées. Enfin, une fois par jour, l'app regarde sur le site du guide s'il existe une nouvelle version, sans rien envoyer de vos données.
- **Pas de secrets dans vos idées.** Vocalink est fait pour des idées, pas pour servir de coffre-fort : ne dictez ni codes, ni mots de passe, ni numéros de carte, ni informations de santé très personnelles. Les coordonnées de vos contacts sont pour votre usage personnel : ne les diffusez pas, par respect pour eux.
- **Les notifications se lisent sur l'écran verrouillé.** Le brief du matin affiche le titre de vos idées. Si d'autres voient votre téléphone, masquez les aperçus : sur iPhone, Réglages → Notifications → Afficher les aperçus → *Si déverrouillé* ; sur Android, masquez le contenu sensible sur l'écran de verrouillage.
- **Supprimer, c'est définitif.** Une idée supprimée ne revient pas : en cas de doute, préférez *Archiver*. De temps en temps, gardez une copie de vos idées : **Réglages → Exporter mes idées** (un tableau qui s'ouvre dans Excel). Et ne supprimez jamais le projet **mon-vocalink** sur Vercel ni sa base de données : toutes vos idées partiraient avec.
- **Et le RGPD ?** *Usage personnel* (vos idées, vos proches) : le RGPD ne s'applique pas, c'est l'exception de l'usage « personnel ou domestique ». *Usage professionnel* (clients, prospects, collègues) : il s'applique, et c'est vous qui êtes responsable des données. Notez seulement le nécessaire, supprimez ce qui ne sert plus, effacez un contact s'il vous le demande, évitez les données sensibles (santé, opinions…) et vérifiez que votre employeur autorise ce type d'outil. *Où sont vos données* : la base (Neon) et les serveurs (Vercel, région `fra1`) de votre Vocalink sont en Europe, à Francfort ; seule la compréhension de la voix et du texte passe par OpenAI, aux États-Unis (ainsi que Notion, Google ou l'email si vous activez les options avancées). La personne qui vous a envoyé ce kit n'a accès à rien. Ces repères ne remplacent pas un avis juridique.

## Bon à savoir

- **Usage** : l'offre gratuite de Vercel (Hobby) est prévue pour un usage **personnel, non commercial**.
- **Licence** : Vocalink est un logiciel libre ([licence MIT](LICENSE)) créé par [Pierre-Olivier Lemoine](https://polemoineperso-ai.github.io/portfolio/carte-visite.html), fourni tel quel, **sans garantie** : vous l'installez et l'utilisez sous votre responsabilité.
- **Mises à jour** : votre Vocalink est une copie indépendante. Il ne change jamais tout seul : c'est vous qui décidez de le mettre à jour (voir plus haut). Pour vérifier s'il existe une nouvelle version, l'app consulte une fois par jour le site du guide, sans rien envoyer de vos données.
- **Options avancées** (facultatives, plus techniques) : synchronisation Notion, Google Tasks, email récapitulatif quotidien — voir [docs/OPTIONS-AVANCEES.md](docs/OPTIONS-AVANCEES.md).

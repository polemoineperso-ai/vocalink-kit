// Script d'autorisation Google OAuth à lancer UNE SEULE FOIS, à la main :
//   node scripts/get-google-refresh-token.mjs
//
// Ne fait jamais partie de l'app déployée (pas dans build/start/dev). Ce
// script n'ouvre pas de navigateur lui-même : il affiche l'URL et c'est à
// vous de l'ouvrir et de vous connecter vous-même avec votre propre compte
// Google — aucun agent ne doit se connecter à votre place.
import "dotenv/config";
import http from "node:http";

const PORT = 53682;
const REDIRECT_URI = `http://127.0.0.1:${PORT}/oauth2callback`;
const SCOPE = "https://www.googleapis.com/auth/tasks";

const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  console.error("GOOGLE_CLIENT_ID et GOOGLE_CLIENT_SECRET doivent être renseignés dans .env avant de lancer ce script.");
  process.exit(1);
}

const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
authUrl.searchParams.set("client_id", clientId);
authUrl.searchParams.set("redirect_uri", REDIRECT_URI);
authUrl.searchParams.set("response_type", "code");
authUrl.searchParams.set("scope", SCOPE);
authUrl.searchParams.set("access_type", "offline");
authUrl.searchParams.set("prompt", "consent");

console.log("\nOuvrez cette URL vous-même dans votre navigateur et connectez-vous avec votre compte Google :\n");
console.log(authUrl.toString());
console.log(`\nEn attente du retour sur ${REDIRECT_URI} ...\n`);

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
  if (url.pathname !== "/oauth2callback") {
    res.writeHead(404).end();
    return;
  }

  const code = url.searchParams.get("code");
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.end("<p>Vous pouvez fermer cette fenêtre et revenir au terminal.</p>");
  server.close();

  if (!code) {
    console.error("Aucun code reçu — autorisation refusée ou annulée.");
    process.exit(1);
  }

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    });
    const data = await tokenRes.json();

    if (!tokenRes.ok) {
      console.error("Échec de l'échange du code contre un token :", data);
      process.exit(1);
    }

    if (!data.refresh_token) {
      console.warn(
        "\nAucun refresh_token renvoyé — Google n'en émet qu'à la première autorisation (ou avec prompt=consent).\n" +
          "Allez sur https://myaccount.google.com/permissions, révoquez l'accès de cette application, puis relancez ce script.\n",
      );
      process.exit(1);
    }

    console.log("\n✔ Autorisation réussie. Copiez cette valeur dans GOOGLE_REFRESH_TOKEN (.env local et `vercel env add`) :\n");
    console.log(data.refresh_token);
    console.log("");
    process.exit(0);
  } catch (e) {
    console.error("Erreur lors de l'échange du code :", e);
    process.exit(1);
  }
});

server.listen(PORT);

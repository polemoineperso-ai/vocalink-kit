import type { NextConfig } from "next";

// En-têtes de sécurité sur toutes les pages : Vocalink ne peut pas être
// affiché à l'intérieur d'un autre site (qui piégerait les clics), le
// navigateur ne devine pas le type des fichiers, l'adresse complète ne fuit
// pas vers les liens externes, et seul le micro est autorisé (par Vocalink
// lui-même).
const SECURITY_HEADERS = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "microphone=(self), camera=(), geolocation=(), payment=()" },
];

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // L'enregistrement d'une dictée est envoyé par une Server Action, limitée
      // à 1 Mo par défaut : trop peu au-delà d'une minute sur iPhone. 4 Mo reste
      // sous la limite de Vercel (4,5 Mo par requête) et couvre les 5 minutes
      // maximum d'une dictée à 32 kbit/s (voir use-voice-recorder.ts).
      bodySizeLimit: "4mb",
    },
  },
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
};

export default nextConfig;

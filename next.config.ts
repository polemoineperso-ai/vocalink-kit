import type { NextConfig } from "next";

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
};

export default nextConfig;

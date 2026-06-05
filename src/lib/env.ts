import "server-only";

/**
 * Liest eine Environment-Variable zur LAUFZEIT.
 *
 * Hintergrund: Next.js (production build, standalone) ersetzt direkte
 * `process.env.X`-Zugriffe — und sogar `process.env["X"]` — am Build-Zeitpunkt
 * durch die dort gefundenen Werte. Wenn die Variable beim Build nicht existiert
 * (typisch in Docker, wo .env nur zur Laufzeit per env_file injiziert wird),
 * eliminiert die statische Analyse den Code als unerreichbar.
 *
 * Mit dieser Indirektion (Schlüssel kommt als String-Parameter rein) kann
 * der Compiler nicht statisch vorhersagen, welche Variable gelesen wird,
 * und lässt den Zugriff bis zur Laufzeit stehen.
 */
export function readEnv(key: string): string | undefined {
  return process.env[key];
}

/**
 * Cron-Worker deaktiviert.
 * Ergebnisse werden manuell über das Admin-Panel gepflegt.
 */
console.log("--------------------------------------------------");
console.log("MANUELLER MODUS: Automatische API-Sync ist deaktiviert.");
console.log("Ergebnisse bitte im Admin-Bereich eintragen.");
console.log("--------------------------------------------------");

// Der Prozess bleibt am Leben, tut aber nichts (keine API-Abfragen).
setInterval(() => {}, 1000 * 60 * 60); 

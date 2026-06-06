-- Strafkachel-Mechanik: Bei jedem falschen Partner-Tipp wird ein Counter
-- erhoeht, der von der Anzeige der offenen Kacheln abgezogen wird.
-- Cap auf der Anwendungsseite: wrong_partner_guesses wird nur inkrementiert,
-- wenn es kleiner als die aktuelle Anzahl tilesUnlocked ist.
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS wrong_partner_guesses INT NOT NULL DEFAULT 0;

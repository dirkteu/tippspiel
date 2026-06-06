import { openTilePositions } from "@/lib/tiles";

interface Props {
  /** Pfad/URL des verdeckten Partner-Fotos (via /api/avatar/partner) */
  photoSrc: string;
  /** zufällige, pro Team feste Permutation aus DB (teams.tile_order) */
  tileOrder: number[];
  /** wie viele der 9 Kacheln aktuell offen sind */
  tilesOpen: number;
  /** vollständiger Reveal: zeige Pseudonym darunter */
  revealedName?: string | null;
}

/**
 * Blur-Stufen in Pixeln, je nach Anzahl offener Kacheln.
 * 0 Kacheln: extra-stark ("undurchsichtig"), 1 Kachel: 100% (maximal),
 * abnehmend bis ab 6 Kacheln voellig scharf.
 */
function blurForTiles(open: number): number {
  if (open >= 6) return 0;
  if (open === 5) return 3;   // 10%
  if (open === 4) return 12;  // 50%
  if (open === 3) return 18;  // 75%
  if (open === 2) return 22;  // 95%
  if (open === 1) return 24;  // 100%
  return 36;                  // 0 Kacheln: undurchsichtig
}

export function PartnerTile({ photoSrc, tileOrder, tilesOpen, revealedName }: Props) {
  const open = openTilePositions(tileOrder, tilesOpen);
  const blurPx = blurForTiles(tilesOpen);
  return (
    <div className="card partner-card">
      <div className="grid3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photoSrc}
          alt=""
          className="photo"
          style={{
            objectFit: "cover",
            // Slight overscale damit der Blur-Rand nicht durch die Kante guckt.
            transform: blurPx > 0 ? "scale(1.08)" : "scale(1)",
            filter: blurPx > 0 ? `blur(${blurPx}px)` : "none",
            transition: "filter 700ms ease-out, transform 700ms ease-out",
          }}
        />
        <div className="tiles">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className={`tile${open.has(i) ? " open" : ""}`} />
          ))}
        </div>
      </div>
      <div className="progress">
        <i style={{ width: `${(tilesOpen / 9) * 100}%` }} />
      </div>
      <div style={{ textAlign: "center" }}>
        {tilesOpen === 9 && revealedName ? (
          <div className="partner-name">{revealedName} 🎉</div>
        ) : (
          <div className="t-small">{tilesOpen} / 9 Kacheln aufgedeckt</div>
        )}
      </div>
    </div>
  );
}

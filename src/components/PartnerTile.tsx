import { Lock } from "lucide-react";
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

export function PartnerTile({ photoSrc, tileOrder, tilesOpen, revealedName }: Props) {
  const open = openTilePositions(tileOrder, tilesOpen);
  return (
    <div className="card partner-card">
      <div className="grid3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photoSrc} alt="" className="photo" style={{ objectFit: "cover" }} />
        <div className="tiles">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className={`tile${open.has(i) ? " open" : ""}`}>
              <Lock size={18} />
            </div>
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

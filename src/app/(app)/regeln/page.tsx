import Link from "next/link";
import { ArrowLeft, Award, Lock, Target, Trophy } from "lucide-react";
import { AppBar } from "@/components/primitives/AppBar";

/**
 * Tipp-Regeln-Seite — kein interaktiver State, reine Info.
 * Aufrufbar via /regeln, verlinkt aus dem Tipps-Header.
 */
export default function RegelnPage() {
  return (
    <div className="scroll">
      <AppBar
        action={
          <Link href="/tipps" className="icon-btn" aria-label="Zurück zu Tipps">
            <ArrowLeft size={19} />
          </Link>
        }
      />
      <span className="kicker">Tipp-Regeln</span>
      <h1 className="h1" style={{ marginTop: 4 }}>So gibt&apos;s Punkte</h1>
      <p className="t-small" style={{ marginTop: 10, marginBottom: 24 }}>
        Pro Spiel kannst du 0, 2, 3 oder 4 Punkte holen — je nachdem, wie nah dein
        Tipp am echten Ergebnis liegt. Der Weltmeister-Tipp bringt zusätzliche 10
        Punkte am Turnierende.
      </p>

      <RuleRow
        points={4}
        title="Volltreffer"
        body="Du tippst das Ergebnis exakt richtig — z. B. 2:1 getippt und 2:1 gespielt."
        icon={<Target size={18} />}
        accent="var(--green-500)"
      />
      <RuleRow
        points={3}
        title="Tordifferenz"
        body="Differenz stimmt. Du tippst 2:1 und es endet 3:2 — du hast die richtige Differenz, aber nicht das exakte Ergebnis."
        icon={<Target size={18} />}
        accent="var(--green-400)"
      />
      <RuleRow
        points={2}
        title="Sieger richtig"
        body="Du hast den Sieger (oder das Unentschieden) korrekt vorhergesagt, aber Differenz und Endstand passen nicht."
        icon={<Target size={18} />}
        accent="var(--gold)"
      />
      <RuleRow
        points={0}
        title="Daneben"
        body="Sieger falsch getippt — keine Punkte."
        icon={<Target size={18} />}
        accent="var(--loss)"
      />

      <div className="section-head" style={{ marginTop: 28 }}>
        <span className="kicker">Bonus</span>
      </div>
      <RuleRow
        points={10}
        title="Weltmeister"
        body="Richtig getippt, wer am Ende den Pokal hochhält? +10 Punkte am Turnierende. Du kannst deinen Weltmeister-Tipp NUR EINMAL setzen — und nur bis 5 Minuten vor dem ersten K.o.-Spiel."
        icon={<Trophy size={18} />}
        accent="var(--gold)"
      />

      <div className="section-head" style={{ marginTop: 28 }}>
        <span className="kicker">K.o.-Runde</span>
      </div>
      <div className="card pad" style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <div
          style={{
            width: 36,
            height: 36,
            flexShrink: 0,
            borderRadius: 10,
            background: "var(--surface-2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--accent)",
          }}
        >
          <Target size={18} />
        </div>
        <div>
          <div style={{ fontWeight: 600, color: "var(--fg1)", marginBottom: 4 }}>
            Es zählt das Ergebnis nach 90 Minuten
          </div>
          <p className="t-small" style={{ margin: 0 }}>
            Auch in den K.o.-Spielen tippst du das Ergebnis nach regulärer
            Spielzeit — Verlängerung und Elfmeterschießen zählen NICHT für die
            Wertung. Ein Unentschieden ist also auch im K.o.-Spiel ein gültiger
            Tipp. Volltreffer (≥3 Pkt) in K.o.-Spielen decken zusätzlich eine
            Bonus-Kachel auf.
          </p>
        </div>
      </div>

      <div className="section-head" style={{ marginTop: 28 }}>
        <span className="kicker">Sperrfrist</span>
      </div>
      <div className="card pad" style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <div
          style={{
            width: 36,
            height: 36,
            flexShrink: 0,
            borderRadius: 10,
            background: "var(--surface-2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--loss)",
          }}
        >
          <Lock size={18} />
        </div>
        <div>
          <div style={{ fontWeight: 600, color: "var(--fg1)", marginBottom: 4 }}>
            5 Minuten vor Anpfiff
          </div>
          <p className="t-small" style={{ margin: 0 }}>
            Tipps werden 5 Minuten vor Anpfiff gesperrt — danach kannst du den Tipp
            nicht mehr ändern. Der Weltmeister-Tipp ist bis 5 Minuten vor dem
            ersten K.o.-Spiel (28.06.) möglich — und einmal gesetzt sofort final.
          </p>
        </div>
      </div>

      <div className="section-head" style={{ marginTop: 28 }}>
        <span className="kicker">Wertung</span>
      </div>
      <div className="card pad" style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <div
          style={{
            width: 36,
            height: 36,
            flexShrink: 0,
            borderRadius: 10,
            background: "var(--surface-2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--accent)",
          }}
        >
          <Award size={18} />
        </div>
        <div>
          <div style={{ fontWeight: 600, color: "var(--fg1)", marginBottom: 4 }}>
            Team-Tabelle
          </div>
          <p className="t-small" style={{ margin: 0 }}>
            Die Punkte deines Spieler-Paars werden zusammen gewertet — euer Squad-Team
            erscheint anonym in der Tabelle. Volltreffer (≥3 Pkt) zählen extra als
            Statistik.
          </p>
        </div>
      </div>
    </div>
  );
}

function RuleRow({
  points,
  title,
  body,
  icon,
  accent,
}: {
  points: number;
  title: string;
  body: string;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <div
      className="card pad"
      style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 10 }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          flexShrink: 0,
          borderRadius: 12,
          background: "var(--surface-2)",
          color: accent,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          fontSize: 18,
          position: "relative",
        }}
      >
        {points}
        <div
          style={{
            position: "absolute",
            bottom: -6,
            right: -6,
            width: 22,
            height: 22,
            borderRadius: 999,
            background: "var(--bg)",
            border: "1px solid var(--border-soft)",
            color: accent,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {icon}
        </div>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, color: "var(--fg1)", marginBottom: 4 }}>
          {title}
        </div>
        <p className="t-small" style={{ margin: 0 }}>{body}</p>
      </div>
    </div>
  );
}

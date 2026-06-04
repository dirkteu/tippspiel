import type { GroupStanding } from "@/lib/standings";

/**
 * Anzeige einer Gruppentabelle inkl. Tendenz-Chips (W/D/L)
 * für die letzten bis zu 3 Spiele.
 */
export function GroupStandingsTable({ group }: { group: GroupStanding }) {
  return (
    <div className="card pad" style={{ padding: "12px 14px" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "20px 1fr 28px 28px 56px 36px",
          alignItems: "center",
          gap: 6,
          fontSize: 11,
          color: "var(--fg4)",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: ".05em",
          paddingBottom: 8,
          borderBottom: "1px solid var(--border-soft)",
        }}
      >
        <span>#</span>
        <span>Team</span>
        <span style={{ textAlign: "center" }}>Sp</span>
        <span style={{ textAlign: "center" }}>TD</span>
        <span style={{ textAlign: "center" }}>Form</span>
        <span style={{ textAlign: "right" }}>Pkt</span>
      </div>
      {group.rows.map((r, i) => (
        <div
          key={r.team}
          style={{
            display: "grid",
            gridTemplateColumns: "20px 1fr 28px 28px 56px 36px",
            alignItems: "center",
            gap: 6,
            padding: "8px 0",
            fontSize: 13,
            color: "var(--fg1)",
            borderBottom:
              i < group.rows.length - 1 ? "1px solid var(--border-soft)" : "none",
          }}
        >
          <span style={{ color: "var(--fg4)", fontWeight: 600 }}>{i + 1}</span>
          <span
            style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}
          >
            <span className="flag" style={{ fontSize: 16 }}>{r.flag ?? "🏳️"}</span>
            <span
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {r.team}
            </span>
          </span>
          <span
            style={{
              textAlign: "center",
              fontVariantNumeric: "tabular-nums",
              color: "var(--fg3)",
            }}
          >
            {r.played}
          </span>
          <span
            style={{
              textAlign: "center",
              fontVariantNumeric: "tabular-nums",
              color: r.gd > 0 ? "var(--green-400)" : r.gd < 0 ? "var(--loss)" : "var(--fg3)",
            }}
          >
            {r.gd > 0 ? `+${r.gd}` : r.gd}
          </span>
          <span style={{ display: "flex", gap: 3, justifyContent: "center" }}>
            {r.form.length === 0 ? (
              <span style={{ color: "var(--fg4)", fontSize: 11 }}>—</span>
            ) : (
              r.form.map((f, idx) => <FormChip key={idx} kind={f} />)
            )}
          </span>
          <span
            style={{
              textAlign: "right",
              fontVariantNumeric: "tabular-nums",
              fontWeight: 700,
            }}
          >
            {r.pts}
          </span>
        </div>
      ))}
    </div>
  );
}

function FormChip({ kind }: { kind: "W" | "D" | "L" }) {
  const bg =
    kind === "W"
      ? "var(--green-500)"
      : kind === "D"
        ? "var(--draw, #f59e0b)"
        : "var(--loss)";
  return (
    <span
      style={{
        width: 16,
        height: 16,
        borderRadius: 4,
        background: bg,
        color: "#fff",
        fontSize: 10,
        fontWeight: 700,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {kind === "D" ? "U" : kind}
    </span>
  );
}

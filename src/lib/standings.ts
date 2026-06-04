import type { MatchRow } from "./matches";

export interface StandingRow {
  team: string;
  flag: string | null;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  pts: number;
  /** Form der letzten bis zu 3 fertig gespielten Begegnungen, neuestes zuerst */
  form: ("W" | "D" | "L")[];
}

export interface GroupStanding {
  group_name: string;
  rows: StandingRow[];
}

/**
 * Berechnet Gruppen-Tabellen aus den Match-Rohdaten.
 * Nur Spiele mit round='group' werden gewertet.
 * Ergebnisse werden nur gezählt, wenn beide Tor-Werte gesetzt sind.
 */
export function computeGroupStandings(matches: MatchRow[]): GroupStanding[] {
  const byGroup = new Map<string, MatchRow[]>();
  for (const m of matches) {
    if (m.round !== "group") continue;
    if (!byGroup.has(m.group_name)) byGroup.set(m.group_name, []);
    byGroup.get(m.group_name)!.push(m);
  }

  const result: GroupStanding[] = [];
  for (const [group_name, ms] of byGroup) {
    // Statistik pro Team aggregieren
    const stats = new Map<string, StandingRow>();
    const ensure = (name: string, flag: string | null) => {
      const cur = stats.get(name);
      if (cur) return cur;
      const row: StandingRow = {
        team: name,
        flag,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        gf: 0,
        ga: 0,
        gd: 0,
        pts: 0,
        form: [],
      };
      stats.set(name, row);
      return row;
    };

    // Auch unfertige Spiele zählen die Teams als "im Wettbewerb"
    for (const m of ms) {
      ensure(m.team_1, m.flag_1);
      ensure(m.team_2, m.flag_2);
    }

    // Nur fertig gespielte Begegnungen werten, chronologisch
    const played = ms
      .filter((m) => m.result_1 != null && m.result_2 != null)
      .sort(
        (a, b) =>
          new Date(a.match_date).getTime() - new Date(b.match_date).getTime(),
      );

    for (const m of played) {
      const a = ensure(m.team_1, m.flag_1);
      const b = ensure(m.team_2, m.flag_2);
      const r1 = m.result_1 as number;
      const r2 = m.result_2 as number;
      a.played++;
      b.played++;
      a.gf += r1;
      a.ga += r2;
      b.gf += r2;
      b.ga += r1;
      if (r1 > r2) {
        a.won++;
        b.lost++;
        a.pts += 3;
        a.form.unshift("W");
        b.form.unshift("L");
      } else if (r1 < r2) {
        b.won++;
        a.lost++;
        b.pts += 3;
        a.form.unshift("L");
        b.form.unshift("W");
      } else {
        a.drawn++;
        b.drawn++;
        a.pts += 1;
        b.pts += 1;
        a.form.unshift("D");
        b.form.unshift("D");
      }
    }

    // GD + Form auf 3 kürzen
    for (const row of stats.values()) {
      row.gd = row.gf - row.ga;
      row.form = row.form.slice(0, 3);
    }

    const rows = Array.from(stats.values()).sort(
      (a, b) =>
        b.pts - a.pts ||
        b.gd - a.gd ||
        b.gf - a.gf ||
        a.team.localeCompare(b.team),
    );

    result.push({ group_name, rows });
  }

  // Gruppen alphabetisch
  result.sort((a, b) => a.group_name.localeCompare(b.group_name));
  return result;
}

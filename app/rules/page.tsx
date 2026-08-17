export default function RulesPage() {
  return (
    <div className="max-w-4xl">
      <h1 className="font-display text-4xl tracking-wide text-bone">League Rules</h1>
      <p className="mt-2 text-sm text-mute">Greaze Fantasy Football League — official rulebook</p>
      <div className="divider-tentacle my-6" />

      <RuleSection title="Scoring">
        <div className="grid gap-6 sm:grid-cols-3">
          <ScoreTable
            rows={[
              ["Pass Yds (25)", "1"],
              ["Pass TD", "4"],
              ["Pass Int", "-1"],
              ["Rush Yds (10)", "1"],
              ["Rush TD", "6"],
              ["Rec Yds (10)", "1"],
              ["Rec TD", "6"],
              ["Receptions", "0.5"],
              ["Fumble Lost", "-2"],
              ["2 Pt Conv", "2"],
            ]}
          />
          <ScoreTable
            rows={[
              ["FG 0-40", "3"],
              ["FG 41-50", "4"],
              ["FG 50+", "5"],
              ["PAT Made", "1"],
              ["0 Pts Allow", "12"],
              ["1-6 Pts Allow", "7"],
              ["7-13 Pts Allow", "4"],
              ["14-20 Pts Allow", "1"],
              ["21-27 Pts Allow", "0"],
              ["28-34 Pts Allow", "-1"],
              ["35+ Pts Allow", "-4"],
            ]}
          />
          <ScoreTable
            rows={[
              ["Sack", "1"],
              ["Interception", "2"],
              ["Fumble Recovery", "2"],
              ["TD", "6"],
              ["Safety", "2"],
              ["Block Kick", "2"],
              ["KO and PR TD", "6"],
              ["FG Missed 0-29", "-3"],
              ["FG Missed 30-39", "-2"],
              ["PAT Missed", "-1"],
            ]}
          />
        </div>
      </RuleSection>

      <RuleSection title="Keepers">
        <RuleList
          items={[
            "Maximum 2 keepers per year.",
            <>Value is based on original draft round; that round advances (gets worse) by 3 rounds for each subsequent year the player is kept.</>,
            "No players drafted in rounds 1 or 2 are keeper eligible — this supersedes drafted players who get dropped and re-added; they remain ineligible. Players CAN become recurring keepers who advance into rounds 1 or 2 (they simply become ineligible at that point).",
            "Free agent keepers are valued at a 6th round pick. Free agents kept are only eligible to be kept ONE year, then are forced back into the player pool. If a free-agent keeper was originally drafted, that player is valued at the earlier of the original draft round or the free-agent value (6th).",
            <>Multiple years, same keeper: value advances 3 rounds earlier each year kept. Example — drafted in round 11, kept in year 2 he counts as round 11, year 3 round 8, year 4 round 5, etc. This holds even if traded to a new owner. A player kept in round 3 can only be kept one more year, since advancing 3 rounds from round 3 isn&apos;t possible.</>,
            "If two players are kept in the same round (via trade, FA equivalent, etc.), the team forfeits that round plus the preceding round. If both kept players are 6th-round value via draft position or keeper advancement, the manager chooses which gets the lower round. If both are 6th-round value via FA acquisition, same choice applies. If only one of the two is an FA, the FA keeper is automatically assigned the lower (5th) round value.",
            "Eligibility requires being a member of the season-ending roster, plus 6 consecutive weeks of roster-week value (active week = 2, bench week = 1). Weeks your team isn't in the playoffs don't count toward eligibility. Weeks a player is suspended or inactive for reasons other than injury don't count either.",
            "If a player is drafted, then dropped mid-season, their keeper value is the earlier of FA value or original draft position.",
            "Keeper trades: a player not being kept by Owner A cannot be traded to Owner B for draft-pick consideration. Players already deemed keepers are eligible for trade in exchange for draft picks — if picks are included, the trade must be even (players for picks) so every team ends the draft with 16 players.",
            "Keeper submissions are due BEFORE draft order selection, and must be submitted simultaneously by all teams.",
            "If a player is injured for the season before the draft, that player is ineligible as a keeper. If a player goes on IR mid-season, he can only be kept if he was never dropped.",
          ]}
        />
      </RuleSection>

      <RuleSection title="Free Agents">
        <RuleList
          items={[
            "FAAB (free agent auction bidding) governs free-agent pickups.",
            "Each team has $100 FAAB, valued at $50 real money.",
            "Whatever FAAB money is spent is what's owed in transaction fees at the end of the year.",
            "Once all FAAB is spent, managers can still place waiver claims for $0, awarded based on waiver order.",
          ]}
        />
      </RuleSection>

      <RuleSection title="Trades">
        <RuleList
          items={[
            "All trades are reviewed by the commissioner.",
            "No trading future draft picks.",
            "Keepers can be traded at the draft for other draft picks.",
            "Players not being kept are ineligible for trade at the draft.",
          ]}
        />
      </RuleSection>

      <RuleSection title="Payment">
        <RuleList
          items={[
            "League payment must be made the night of the draft or before.",
            "Failure to pay for the league causes forfeiture of that team's 1st round pick — the forfeited pick is compensated for at the end of the 2nd round.",
            "Payment for free agent acquisitions must be made after the first pickup in the next payment bracket. Failure to pay permits the commissioner to lock the offending team.",
            "League fees increase $10 every other year (even years).",
            "The league winner pays $10 less than the league fee the following year. The league loser pays $10 more the following year, and is responsible for getting the trophy engraved at their own expense.",
            "The lowest scorer each week is charged an extra $5.",
          ]}
        />
      </RuleSection>

      <RuleSection title="Payout">
        <RuleList
          items={[
            "League fees plus any remaining transaction fees fund the payouts below.",
            "Highest score each week gets paid $25, funded by the $5 weekly loser fee plus transaction fees.",
          ]}
        />
        <div className="mt-4 max-w-sm">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="border-b border-line py-2 text-left text-mute">Place</th>
                <th className="border-b border-line py-2 text-right text-mute">Payout</th>
              </tr>
            </thead>
            <tbody>
              <tr><td className="py-2 text-bone">Champion</td><td className="py-2 text-right text-teal font-semibold">70%</td></tr>
              <tr><td className="py-2 text-bone">Runner Up</td><td className="py-2 text-right text-teal font-semibold">10%</td></tr>
              <tr><td className="py-2 text-bone">Regular Season</td><td className="py-2 text-right text-teal font-semibold">20%</td></tr>
            </tbody>
          </table>
        </div>
      </RuleSection>

      <RuleSection title="Draft Structure">
        <RuleList
          items={[
            "League members are split into 2 groups based on last year's finish. Group A is the top 8 teams from the regular season, EXCEPT the league champion and runner-up. Group B is the bottom 4 teams PLUS the champion and runner-up.",
            "Numbers are drawn from a hat to determine draft SELECTION POSITION, not draft order directly. Group A selects numbers 1-6, Group B selects numbers 7-12.",
            "In order of drawn number (1-12), each manager selects which draft position they want. Example: the manager who drew #1 may choose draft position #4; the manager who drew #2 then selects their position, and so on.",
          ]}
        />
      </RuleSection>

      <RuleSection title="Other Rules">
        <RuleList
          items={[
            "If a manager fails to set a roster in weeks 10-13, the commissioner has the right to select a roster for that manager based on most projected points, as an arbitrary way to select the roster and avoid a situation where a manager could throw a game to help another manager.",
            "Every team MUST draft a Kicker and a Defense.",
            "ALL rule changes must be submitted to the commissioner via email two weeks prior to the draft to be eligible for that season.",
          ]}
        />
      </RuleSection>
    </div>
  );
}

function RuleSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-10">
      <h2 className="mb-4 font-display text-2xl text-teal">{title}</h2>
      {children}
    </div>
  );
}

function RuleList({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item, i) => (
        <li key={i} className="stat-card rounded-lg px-4 py-3 text-sm leading-relaxed text-bone">
          {item}
        </li>
      ))}
    </ul>
  );
}

function ScoreTable({ rows }: { rows: [string, string][] }) {
  return (
    <table className="w-full border-collapse text-sm">
      <tbody>
        {rows.map(([label, val], i) => (
          <tr key={i} className="border-b border-line/50">
            <td className="py-1.5 text-mute">{label}</td>
            <td className="py-1.5 text-right font-semibold text-bone">{val}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

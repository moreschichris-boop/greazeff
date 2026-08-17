type TeamGrade = {
  rank: number;
  team: string;
  owner: string;
  grade: string;
  score: number;

const grades: TeamGrade[] = [
  {
    rank: 1,
    team: "Cock Bowers",
    owner: "Chris Moreschi",
    grade: "A",
  score: 96.5,
    blurb:
      "Saquon Barkley and A.J. Brown to open, then two elite keepers in Jaxon Smith-Njigba and Brock Bowers land at prices most of the league would kill for. This is the deepest 1-4 punch in the draft.",
    prediction: "Championship-caliber top end — the question is bench depth if injuries hit.",
  },
  {
    rank: 2,
    team: "Virgin Hackuiri",
    owner: "Cuyler Peragallo",
    grade: "A-",
      score: 93.0,
    blurb:
      "Ja'Marr Chase and George Pickens give a true alpha WR duo, and keepers Breece Hall (R3) and Javonte Williams (R6) add legitimate RB1/2 value on top. Very few holes.",
    prediction: "Playoff lock if the receivers stay healthy.",
  },
  {
    rank: 3,
    team: "You Hack of Wine!",
    owner: "Soren Pedersen",
    grade: "A-",
    score: 92.0,
    blurb:
      "McCaffrey and McBride anchor the top, but the real win is stacking Emeka Egbuka and Nico Collins as keepers — two ascending WR1-caliber weapons at a fraction of their value.",
    prediction: "WR room might be the best in the league; RB depth after McCaffrey is the watch item.",
  },
  {
    rank: 4,
    team: "Mendoza's Meat Market",
    owner: "Jeff Peragallo",
    grade: "A-",
    score: 91.0,
    blurb:
      "St. Brown and Josh Allen give a strong 1-2, and Quinshon Judkins plus Tyler Warren as keepers add a young RB1 and a breakout TE at bargain rounds.",
    prediction: "Deep, well-rounded roster with real weekly ceiling at every skill spot.",
  },
  {
    rank: 5,
    team: "Two Bags",
    owner: "Frank Panico",
    grade: "B+",
    score: 87.5,
    blurb:
      "Bijan and Etienne give a strong RB base, DeVonta Smith adds a steady WR1, and Jayden Daniels as a late QB gives real weekly upside without an early investment.",
    prediction: "Balanced enough to compete every week, without a true league-winning ceiling piece.",
  },
  {
    rank: 6,
    team: "#SorenSucks",
    owner: "Adam Rudin",
    grade: "B+",
    score: 86.5,
    blurb:
      "Puka and Nabers headline, and De'Von Achane plus Chase Brown as keepers were both elite value — but the roster gets thin fast after round 9, with two Miami Washingtons filling out the bench.",
    prediction: "High weekly ceiling if the top 6 stay on the field; injury depth is the real risk.",
  },
  {
    rank: 7,
    team: "Koo Fast Koo Furious",
    owner: "Ian O'Loughlin",
    grade: "B+",
    score: 85.5,
    blurb:
      "CeeDee Lamb and Josh Jacobs headline a strong start, and Ladd McConkey plus Kyren Williams land as keepers at real discounts, giving a deep, well-rounded WR/RB mix.",
    prediction: "Consistent weekly floor — a safe bet to make the playoffs.",
  },
  {
    rank: 8,
    team: "Chicken Parm Guy",
    owner: "Chris Blanco",
    grade: "B+",
    score: 84.5,
    blurb:
      "James Cook and Derrick Henry give a heavy-volume RB core, and Rashee Rice plus Parker Washington as keepers add two ascending WRs at bargain cost.",
    prediction: "RB-driven build with plenty of receiving depth to round it out.",
  },
  {
    rank: 9,
    team: "I'll Be Hack",
    owner: "Kevin Blanco",
    grade: "B",
    score: 79.0,
    blurb:
      "Jahmyr Gibbs is as good an RB1 as anyone got, but the picks after lean WR-heavy (McMillan, Pierce, Wan'Dale, Addison) without a true second bell-cow back to pair with Gibbs.",
    prediction: "Gibbs has to carry this roster — a big injury there hurts more than most.",
  },
  {
    rank: 10,
    team: "Two Bags 2",
    owner: "Michael Pateiro",
    grade: "B",
    score: 77.5,
    blurb:
      "Jonathan Taylor and Drake London anchor a solid top two, and Kenneth Walker plus Jaylen Waddle as keepers add depth — a roster that's steady without a standout league-winner.",
    prediction: "Middle-of-the-pack floor; needs a breakout from the RB depth to separate.",
  },
  {
    rank: 11,
    team: "Olave Garden",
    owner: "Adam Gladstone",
    grade: "B",
    score: 76.0,
    blurb:
      "Justin Jefferson and Omarion Hampton give a strong foundation, but with only one keeper (Chris Olave), the rest of the roster is built entirely fresh — solid value, but no discount advantage over the field.",
    prediction: "Talented top, but this team did it the hard way with no keeper edge.",
  },
  {
    rank: 12,
    team: "Rebuilding Year",
    owner: "Rob Moreschi",
    grade: "C+",
    score: 68.0,
    blurb:
      "Ashton Jeanty is a fine RB1, but the receiving corps is thin outside Terry McLaurin, and both keepers (Tucker Kraft, Jacory Croskey-Merritt) are useful rather than difference-making.",
    prediction: "The name says it all — this roster is a year (or a big waiver hit) away.",
  },
];

const gradeColor: Record<string, string> = {
  A: "text-gold", "A-": "text-gold",
  "B+": "text-teal", B: "text-teal", "B-": "text-teal",
  "C+": "text-mute", C: "text-mute",
};

export default function DraftGradesPage() {
  return (
    <div className="max-w-4xl">
      <h1 className="font-display text-4xl tracking-wide text-bone">Draft Grades</h1>
      <p className="mt-2 text-sm text-mute">2026-27 season — grades, breakdowns, and predictions for every team</p>
      <div className="divider-tentacle my-6" />

      <div className="space-y-4">
        {grades.map((g) => (
          <div key={g.team} className="stat-card rounded-xl p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className={`font-display text-4xl ${gradeColor[g.grade] ?? "text-bone"}`}>{g.grade}</span>
                    <div className="text-xs font-semibold text-mute">{g.score.toFixed(1)}%</div>
                  </div>
                  <span className="text-teal">{isOpen ? "▲" : "▼"}</span>
                </div>
                  <div className="font-display text-xl text-bone">{g.team}</div>
                  <div className="text-xs uppercase tracking-widest text-mute">{g.owner}</div>
                </div>
              </div>
              <span className={`font-display text-4xl ${gradeColor[g.grade] ?? "text-bone"}`}>{g.grade}</span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-bone">{g.blurb}</p>
            <p className="mt-2 text-sm italic leading-relaxed text-teal">{g.prediction}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";

type Pick = {
  round: number;
  player: string;
  pos: string;
  team: string;
  keeper?: boolean;
  pickGrade: string;
  note: string;
};

type TeamGrade = {
  rank: number;
  team: string;
  owner: string;
  grade: string;
  score: number;
  blurb: string;
  prediction: string;
  picks: Pick[];
  breakdown: string;
};

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
    picks: [
      { round: 1, player: "Saquon Barkley", pos: "RB", team: "PHI", pickGrade: "A", note: "Locked in a true RB1 workhorse at 1.1 value." },
      { round: 2, player: "A.J. Brown", pos: "WR", team: "NE", pickGrade: "B+", note: "Elite talent, slight injury-history discount priced in at pick 2." },
      { round: 3, player: "Jaxon Smith-Njigba", pos: "WR", team: "SEA", keeper: true, pickGrade: "Keeper", note: "Kept at R3 — top-8 WR value at a third-round tag." },
      { round: 4, player: "Brock Bowers", pos: "TE", team: "LV", keeper: true, pickGrade: "Keeper", note: "Kept at R4 — arguably the best keeper value in the whole league." },
      { round: 5, player: "Blake Corum", pos: "RB", team: "LAR", pickGrade: "C+", note: "Committee back with touchdown-only upside; a bit of a reach for RB2." },
      { round: 6, player: "Makai Lemon", pos: "WR", team: "PHI", pickGrade: "B", note: "Solid rookie flier with real target-share potential." },
      { round: 7, player: "Kyle Monangai", pos: "RB", team: "CHI", pickGrade: "B-", note: "Handcuff-y volume play, fine value this late." },
      { round: 8, player: "Jaxson Dart", pos: "QB", team: "NYG", pickGrade: "B", note: "Rushing floor gives this streamer-tier QB real weekly ceiling." },
      { round: 9, player: "Jayden Reed", pos: "WR", team: "GB", pickGrade: "B", note: "Reasonable WR depth add in a crowded Packers passing game." },
      { round: 10, player: "Tyler Allgeier", pos: "RB", team: "ARI", pickGrade: "C+", note: "Buried in a crowded backfield; low weekly floor." },
      { round: 11, player: "Stefon Diggs", pos: "WR", team: "WAS", pickGrade: "B-", note: "Aging but still a real target earner if healthy." },
      { round: 12, player: "Tre' Harris", pos: "WR", team: "LAC", pickGrade: "B", note: "Nice late dart throw on an ascending rookie." },
      { round: 13, player: "Alvin Kamara", pos: "RB", team: "NO", pickGrade: "B+", note: "Great value this late for a player still seeing real volume." },
      { round: 14, player: "Patrick Mahomes", pos: "QB", team: "KC", pickGrade: "B+", note: "Elite QB2 insurance fell all the way to round 14." },
      { round: 15, player: "Bears", pos: "DEF", team: "CHI", pickGrade: "C+", note: "Streaming-caliber defense, nothing special." },
      { round: 16, player: "Andy Borregales", pos: "K", team: "NE", pickGrade: "C", note: "Late-round kicker lottery ticket." },
    ],
    breakdown:
      "The two keepers are what separate this roster from the field. Getting Brock Bowers — a top-3 TE in real value — for a fourth-round tag is close to a cheat code, and Jaxon Smith-Njigba at a third-round tag isn't far behind. Layer that on top of a legitimate Barkley/A.J. Brown 1-2, and this team has four true difference-makers before pick 5 even happens for most of the league. The RB room past Barkley is thin (Corum, Monangai, Kamara are all committee/handcuff-type pieces), so the offense leans hard on the receiving corps and Bowers to make up the gap. Backup QB with Mahomes as a bye-week/injury insurance play behind Dart is a savvy touch. The floor here is high because of the keepers alone; the ceiling depends on whether Corum or Monangai can round into a real RB2.",
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
    picks: [
      { round: 1, player: "Ja'Marr Chase", pos: "WR", team: "CIN", pickGrade: "A", note: "True 1.1-caliber alpha receiver." },
      { round: 2, player: "George Pickens", pos: "WR", team: "DAL", pickGrade: "B+", note: "Big-play upside in a new offense, strong WR2." },
      { round: 3, player: "Breece Hall", pos: "RB", team: "NYJ", keeper: true, pickGrade: "Keeper", note: "Kept at R3 — this is his final keeper-eligible year." },
      { round: 4, player: "DJ Moore", pos: "WR", team: "BUF", pickGrade: "B", note: "Solid third receiver with real target volume." },
      { round: 5, player: "David Montgomery", pos: "RB", team: "HOU", pickGrade: "B-", note: "Touchdown-dependent but reliable enough for an RB3." },
      { round: 6, player: "Javonte Williams", pos: "RB", team: "DAL", keeper: true, pickGrade: "Keeper", note: "Kept at R6 — strong RB2 value." },
      { round: 7, player: "Marvin Harrison Jr.", pos: "WR", team: "ARI", pickGrade: "B", note: "Talented but still finding consistency; fair price here." },
      { round: 8, player: "Kenyon Sadiq", pos: "TE", team: "NYJ", pickGrade: "C+", note: "Speculative rookie TE, unproven role." },
      { round: 9, player: "Caleb Williams", pos: "QB", team: "CHI", pickGrade: "B", note: "High-variance but capable of big weeks." },
      { round: 10, player: "Denzel Boston", pos: "WR", team: "CLE", pickGrade: "C+", note: "Deep-league flier with limited proven role." },
      { round: 11, player: "Jake Ferguson", pos: "TE", team: "DAL", pickGrade: "B-", note: "Steady, low-ceiling TE streamer." },
      { round: 12, player: "Tank Dell", pos: "WR", team: "HOU", pickGrade: "B", note: "Boom-bust but real talent if healthy." },
      { round: 13, player: "Seahawks", pos: "DEF", team: "SEA", pickGrade: "B-", note: "Solid defensive unit, fair pick for a streaming DEF." },
      { round: 14, player: "MarShawn Lloyd", pos: "RB", team: "GB", pickGrade: "C+", note: "Buried in a crowded backfield." },
      { round: 15, player: "Malachi Fields", pos: "WR", team: "NYG", pickGrade: "C", note: "Deep bench dart throw." },
      { round: 16, player: "Harrison Butker", pos: "K", team: "KC", pickGrade: "B-", note: "Reliable veteran kicker, fine this late." },
    ],
    breakdown:
      "Three true WR1/2-caliber receivers (Chase, Pickens, Moore) is a rare luxury, and pairing that with two keeper RBs at real discount rounds gives this roster both a ceiling and a floor few others can match. Breece Hall's keeper window closes after this year (can't advance past round 3), so there's a one-year clock on getting max value from him — worth remembering for next year's keeper math. The TE spot (Ferguson, Sadiq) is a soft spot, and Caleb Williams as the lone QB is more streamer than sure thing, but with this much WR/RB firepower, those are minor concerns. This is a team built to win now.",
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
    picks: [
      { round: 1, player: "Christian McCaffrey", pos: "RB", team: "SF", pickGrade: "A-", note: "Elite ceiling if the injury history stays quiet." },
      { round: 2, player: "Trey McBride", pos: "TE", team: "ARI", pickGrade: "A-", note: "Locking in a true TE1 this early is a major structural advantage." },
      { round: 3, player: "Garrett Wilson", pos: "WR", team: "NYJ", pickGrade: "B+", note: "Target hog on a rebuilding offense, strong value." },
      { round: 4, player: "Lamar Jackson", pos: "QB", team: "BAL", pickGrade: "A-", note: "Elite rushing-floor QB1 fell further than expected." },
      { round: 5, player: "J.K. Dobbins", pos: "RB", team: "DEN", pickGrade: "B", note: "Solid change-of-pace value in a crowded backfield." },
      { round: 6, player: "Emeka Egbuka", pos: "WR", team: "TB", keeper: true, pickGrade: "Keeper", note: "Kept at R6 — one of the best keeper values in the whole draft." },
      { round: 7, player: "Nico Collins", pos: "WR", team: "HOU", keeper: true, pickGrade: "Keeper", note: "Kept at R7 — a true WR1 at a bargain tag." },
      { round: 8, player: "Jordan Mason", pos: "RB", team: "MIN", pickGrade: "C+", note: "Deep-bench handcuff value." },
      { round: 9, player: "KC Concepcion", pos: "WR", team: "CLE", pickGrade: "C+", note: "Speculative rookie add." },
      { round: 10, player: "Keaton Mitchell", pos: "RB", team: "LAC", pickGrade: "C+", note: "Injury-prone but explosive when healthy." },
      { round: 11, player: "Chris Rodriguez Jr.", pos: "RB", team: "JAX", pickGrade: "C", note: "Deep committee piece, low weekly relevance." },
      { round: 12, player: "Brandon Aubrey", pos: "K", team: "DAL", pickGrade: "B", note: "Elite leg, great value at kicker this late." },
      { round: 13, player: "Jonah Coleman", pos: "RB", team: "DEN", pickGrade: "C", note: "Deep-bench dart throw." },
      { round: 14, player: "Jaydon Blue", pos: "RB", team: "DAL", pickGrade: "C+", note: "Speculative rookie handcuff." },
      { round: 15, player: "Zachariah Branch", pos: "WR", team: "ATL", pickGrade: "C", note: "Deep-league flier." },
      { round: 16, player: "Chargers", pos: "DEF", team: "LAC", pickGrade: "C+", note: "Fine streaming-caliber defense." },
    ],
    breakdown:
      "McCaffrey and McBride alone would make this a solid draft, but landing Egbuka and Collins as keepers turns this into an elite WR corps — arguably the best top-4 receiving group in the league once Wilson is added in. The tradeoff is RB depth: after McCaffrey, it's Dobbins, Mason, Mitchell, and a string of committee-tier backs, none of whom project as a clear weekly starter. If McCaffrey misses time (he has a real injury history), this offense could lean uncomfortably hard on matchup-dependent RBs. But the receiving corps alone gives this team one of the higher weekly ceilings in the league, especially in a 0.5 PPR format that rewards target volume.",
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
    picks: [
      { round: 1, player: "Amon-Ra St. Brown", pos: "WR", team: "DET", pickGrade: "A", note: "Elite target-share WR1, great anchor." },
      { round: 2, player: "Josh Allen", pos: "QB", team: "BUF", pickGrade: "A", note: "Top overall QB fell to round 2 — huge value." },
      { round: 3, player: "Zay Flowers", pos: "WR", team: "BAL", pickGrade: "B+", note: "Ascending WR2 in a strong passing offense." },
      { round: 4, player: "TreVeyon Henderson", pos: "RB", team: "NE", pickGrade: "B+", note: "Real workhorse upside, strong value this round." },
      { round: 5, player: "Mike Evans", pos: "WR", team: "SF", pickGrade: "B", note: "Aging but still a reliable red-zone weapon." },
      { round: 6, player: "Brian Thomas Jr.", pos: "WR", team: "JAX", pickGrade: "B+", note: "Big-play upside receiver, good value." },
      { round: 7, player: "Quinshon Judkins", pos: "RB", team: "CLE", keeper: true, pickGrade: "Keeper", note: "Kept at R7 — a young workhorse-track RB at a bargain." },
      { round: 8, player: "Tyler Warren", pos: "TE", team: "IND", keeper: true, pickGrade: "Keeper", note: "Kept at R8 — one of the best breakout TEs, way underpriced." },
      { round: 9, player: "Quentin Johnston", pos: "WR", team: "LAC", pickGrade: "C+", note: "Boom-bust depth piece." },
      { round: 10, player: "Tyrone Tracy Jr.", pos: "RB", team: "NYG", pickGrade: "B-", note: "Solid committee back with real touches." },
      { round: 11, player: "Woody Marks", pos: "RB", team: "HOU", pickGrade: "C+", note: "Deep handcuff-tier RB." },
      { round: 12, player: "Chig Okonkwo", pos: "TE", team: "WAS", pickGrade: "C+", note: "Streamer-tier TE." },
      { round: 13, player: "Kaelon Black", pos: "RB", team: "SF", pickGrade: "C", note: "Deep-bench dart throw." },
      { round: 14, player: "Adonai Mitchell", pos: "WR", team: "NYJ", pickGrade: "C", note: "Unproven speculative flier." },
      { round: 15, player: "Eagles", pos: "DEF", team: "PHI", pickGrade: "B-", note: "Strong unit, good value this late." },
      { round: 16, player: "Eddy Pineiro", pos: "K", team: "SF", pickGrade: "C+", note: "Fine late-round kicker." },
    ],
    breakdown:
      "This roster has legitimate depth at every skill position, which is rare. St. Brown gives a true PPR-friendly WR1, Josh Allen provides a top-tier rushing/passing QB floor, and then the two keepers add a young ascending RB (Judkins) and a top-5-caliber TE (Warren) for a combined 15 rounds of draft capital. The WR room is arguably five-deep with real weekly starters (St. Brown, Flowers, Evans, Thomas, Johnston). The one soft spot is bellcow RB certainty — Henderson, Judkins, Tracy, and Marks are all committee-adjacent, so game-script-dependent RB scoring is the biggest variance factor here. Overall, few holes and multiple paths to a big week.",
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
    picks: [
      { round: 1, player: "Bijan Robinson", pos: "RB", team: "ATL", pickGrade: "A", note: "Elite true RB1, one of the safest picks in the draft." },
      { round: 2, player: "Travis Etienne Jr.", pos: "RB", team: "NO", pickGrade: "B+", note: "Strong workhorse volume, good value." },
      { round: 3, player: "DeVonta Smith", pos: "WR", team: "PHI", pickGrade: "B+", note: "Steady WR1 floor in a strong offense." },
      { round: 4, player: "Luther Burden III", pos: "WR", team: "CHI", pickGrade: "B", note: "Talented rookie with a real path to targets." },
      { round: 5, player: "Jaylen Warren", pos: "RB", team: "PIT", pickGrade: "B", note: "Reliable committee back with pass-catching value." },
      { round: 6, player: "Jayden Daniels", pos: "QB", team: "WAS", pickGrade: "A-", note: "Elite dual-threat QB1 fell four rounds — great value." },
      { round: 7, player: "Dalton Kincaid", pos: "TE", team: "BUF", pickGrade: "B-", note: "Streaky but talented TE with real upside." },
      { round: 8, player: "Michael Wilson", pos: "WR", team: "ARI", pickGrade: "C+", note: "Deep WR4/5-caliber depth." },
      { round: 9, player: "Jameson Williams", pos: "WR", team: "DET", keeper: true, pickGrade: "Keeper", note: "Kept at R9 — solid deep-threat value." },
      { round: 10, player: "Jakobi Meyers", pos: "WR", team: "JAX", pickGrade: "C+", note: "Volume-based WR3/4." },
      { round: 11, player: "Brian Robinson", pos: "RB", team: "ATL", pickGrade: "C+", note: "Committee/handcuff back." },
      { round: 12, player: "Cameron Dicker", pos: "K", team: "LAC", pickGrade: "B", note: "Solid kicker value." },
      { round: 13, player: "Ravens", pos: "DEF", team: "BAL", pickGrade: "B-", note: "Strong defensive talent, good this late." },
      { round: 14, player: "Bo Nix", pos: "QB", team: "DEN", pickGrade: "B", note: "Nice QB2 insurance with real weekly upside." },
      { round: 15, player: "Mark Andrews", pos: "TE", team: "BAL", pickGrade: "C+", note: "Aging TE with touchdown-only appeal." },
      { round: 16, player: "Tyjae Spears", pos: "RB", team: "TEN", pickGrade: "C", note: "Deep-bench dart throw." },
    ],
    breakdown:
      "Bijan and Etienne give this roster one of the deeper true RB1/2 combos in the league, and DeVonta Smith is a steady weekly WR1 floor. Waiting on QB until round 6 for Daniels — a legitimate dual-threat QB1 — was efficient team-building, freeing up early capital for skill positions. The lone keeper, Jameson Williams, is solid but not a needle-mover the way some other teams' keepers are. TE is a genuine question mark (Kincaid, Andrews both carry injury/target-share uncertainty). This is a roster with a high floor thanks to the RB depth, but it lacks a standout top-3-at-position piece to push it into true title-favorite territory.",
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
    picks: [
      { round: 1, player: "Puka Nacua", pos: "WR", team: "LAR", pickGrade: "A", note: "True elite target-earner, one of the safest WR1s." },
      { round: 2, player: "Malik Nabers", pos: "WR", team: "NYG", pickGrade: "A-", note: "Young alpha receiver, excellent WR2." },
      { round: 3, player: "De'Von Achane", pos: "RB", team: "MIA", keeper: true, pickGrade: "Keeper", note: "Kept at R3 — this is his final keeper-eligible year." },
      { round: 4, player: "Chase Brown", pos: "RB", team: "CIN", keeper: true, pickGrade: "Keeper", note: "Kept at R4 — this is also his final keeper-eligible year." },
      { round: 5, player: "Michael Pittman Jr.", pos: "WR", team: "PIT", pickGrade: "B", note: "Solid target volume in a new offense." },
      { round: 6, player: "Sam LaPorta", pos: "TE", team: "DET", pickGrade: "B", note: "Reliable mid-tier TE1." },
      { round: 7, player: "Josh Downs", pos: "WR", team: "IND", pickGrade: "B-", note: "Steady slot role, fine WR4." },
      { round: 8, player: "Jonathon Brooks", pos: "RB", team: "CAR", pickGrade: "C+", note: "Boom-bust committee back." },
      { round: 9, player: "Brock Purdy", pos: "QB", team: "SF", pickGrade: "B", note: "Efficient offense QB, fair value here." },
      { round: 10, player: "De'Zhaun Stribling", pos: "WR", team: "SF", pickGrade: "C", note: "Deep-bench speculative add." },
      { round: 11, player: "Tank Bigsby", pos: "RB", team: "PHI", pickGrade: "C+", note: "Handcuff-tier value." },
      { round: 12, player: "Broncos", pos: "DEF", team: "DEN", pickGrade: "B-", note: "Solid streaming defense." },
      { round: 13, player: "Harrison Mevis", pos: "K", team: "LAR", pickGrade: "C+", note: "Deep-bench kicker." },
      { round: 14, player: "Malik Willis", pos: "QB", team: "MIA", pickGrade: "C", note: "Emergency-only QB depth." },
      { round: 15, player: "Mike Washington Jr.", pos: "RB", team: "LV", pickGrade: "C", note: "Deep committee dart throw." },
      { round: 16, player: "Malik Washington", pos: "WR", team: "MIA", pickGrade: "C", note: "Deep-bench flier." },
    ],
    breakdown:
      "Puka Nacua and Malik Nabers give an elite young WR duo, and both keepers here were outstanding value — Achane and Chase Brown are legitimate RB1-caliber backs at third- and fourth-round tags. That's four difference-makers in the first four rounds, matching the top teams in the league. The concern is what happens after: LaPorta at TE is fine but unspectacular, and the RB/WR depth from round 10 on (Stribling, Bigsby, two separate Miami Washingtons) is replacement-level. This team's weekly ceiling in the first 6-9 weeks could be top-3 in the league, but a single injury to Nacua, Nabers, Achane, or Brown would expose real thinness underneath.",
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
    picks: [
      { round: 1, player: "CeeDee Lamb", pos: "WR", team: "DAL", pickGrade: "A", note: "Elite true WR1, top-5 value at 1.1." },
      { round: 2, player: "Josh Jacobs", pos: "RB", team: "GB", pickGrade: "B+", note: "Proven workhorse volume, solid RB2." },
      { round: 3, player: "Tee Higgins", pos: "WR", team: "CIN", pickGrade: "B+", note: "Strong WR2 in a high-powered passing offense." },
      { round: 4, player: "Bhayshul Tuten", pos: "RB", team: "JAX", pickGrade: "B", note: "Real change-of-pace role with upside." },
      { round: 5, player: "Tony Pollard", pos: "RB", team: "TEN", pickGrade: "B", note: "Reliable veteran volume back." },
      { round: 6, player: "Ladd McConkey", pos: "WR", team: "LAC", keeper: true, pickGrade: "Keeper", note: "Kept at R6 — very strong WR2 value." },
      { round: 7, player: "Isaiah Likely", pos: "TE", team: "NYG", pickGrade: "C+", note: "Streamer-tier TE." },
      { round: 8, player: "Joe Burrow", pos: "QB", team: "CIN", pickGrade: "A-", note: "Elite QB1 fell to round 8 — huge value." },
      { round: 9, player: "Dylan Sampson", pos: "RB", team: "CLE", pickGrade: "C+", note: "Speculative committee back." },
      { round: 10, player: "Kyren Williams", pos: "RB", team: "LAR", keeper: true, pickGrade: "Keeper", note: "Kept at R10 — a solid RB2/3 add." },
      { round: 11, player: "Xavier Worthy", pos: "WR", team: "KC", pickGrade: "B", note: "Explosive big-play receiver, fine value." },
      { round: 12, player: "Jalen McMillan", pos: "WR", team: "TB", pickGrade: "C+", note: "Deep WR4/5-caliber depth." },
      { round: 13, player: "Nicholas Singleton", pos: "RB", team: "TEN", pickGrade: "C", note: "Deep committee back." },
      { round: 14, player: "Steelers", pos: "DEF", team: "PIT", pickGrade: "C+", note: "Fine streaming defense." },
      { round: 15, player: "Ka'imi Fairbairn", pos: "K", team: "HOU", pickGrade: "C+", note: "Deep-bench kicker." },
      { round: 16, player: "Emmett Johnson", pos: "RB", team: "KC", pickGrade: "C", note: "Deep-bench dart throw." },
    ],
    breakdown:
      "This is a well-constructed, well-balanced roster without a glaring weakness. Lamb and Higgins give strong WR anchors, Jacobs and Pollard provide veteran RB volume, and McConkey (kept at a sixth-round tag) is a legitimate WR2 bargain. Kyren Williams as a second keeper adds a proven starting-caliber RB for cheap. QB is a strength with Burrow, and even the RB depth (Tuten, Sampson, Singleton) offers real handcuff/breakout upside. Nothing here screams league-winner, but there's also very little that can go wrong — this is the kind of roster that grinds out a playoff spot through consistency rather than ceiling.",
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
    picks: [
      { round: 1, player: "James Cook III", pos: "RB", team: "BUF", pickGrade: "A-", note: "Elite volume back, strong RB1." },
      { round: 2, player: "Derrick Henry", pos: "RB", team: "BAL", pickGrade: "A-", note: "Still a bellcow workhorse, great RB1/2 value." },
      { round: 3, player: "Davante Adams", pos: "WR", team: "LAR", pickGrade: "B", note: "Aging but still a reliable target earner." },
      { round: 4, player: "Rashee Rice", pos: "WR", team: "KC", keeper: true, pickGrade: "Keeper", note: "Kept at R4 — this is his final keeper-eligible year." },
      { round: 5, player: "Christian Watson", pos: "WR", team: "GB", pickGrade: "C+", note: "Boom-bust big-play threat, inconsistent role." },
      { round: 6, player: "Parker Washington", pos: "WR", team: "JAX", keeper: true, pickGrade: "Keeper", note: "Kept at R6 — solid ascending value." },
      { round: 7, player: "DK Metcalf", pos: "WR", team: "PIT", pickGrade: "B", note: "Solid WR2/3 in a new offense." },
      { round: 8, player: "Rhamondre Stevenson", pos: "RB", team: "NE", pickGrade: "C+", note: "Committee back with limited upside." },
      { round: 9, player: "Chris Godwin Jr.", pos: "WR", team: "TB", pickGrade: "B-", note: "Reliable if healthy, fair value here." },
      { round: 10, player: "Rachaad White", pos: "RB", team: "WAS", pickGrade: "C+", note: "Committee-tier RB depth." },
      { round: 11, player: "Justin Herbert", pos: "QB", team: "LAC", pickGrade: "B", note: "Solid QB1 value fell a bit further than expected." },
      { round: 12, player: "Travis Kelce", pos: "TE", team: "KC", pickGrade: "C+", note: "Name-value pick at this stage of his career." },
      { round: 13, player: "Rams", pos: "DEF", team: "LAR", pickGrade: "B-", note: "Strong unit, good value this late." },
      { round: 14, player: "Cam Little", pos: "K", team: "JAX", pickGrade: "C+", note: "Fine deep-bench kicker." },
      { round: 15, player: "Kyler Murray", pos: "QB", team: "MIN", pickGrade: "B-", note: "Nice QB2 insurance with rushing upside." },
      { round: 16, player: "Omar Cooper Jr.", pos: "WR", team: "NYJ", pickGrade: "C", note: "Deep-bench flier." },
    ],
    breakdown:
      "James Cook and Derrick Henry give this team two workhorse-volume backs to build around, which is a real luxury in a league where bellcow RBs are scarce. Rashee Rice returning from a lost year as a keeper at round 4 is a savvy bet on a talented, high-target-share receiver, and Parker Washington adds further upside. The WR room is deep in bodies (Adams, Watson, Metcalf, Godwin) but light on true certainty — several of those are boom/bust or aging veterans. Kelce at TE is a name-value pick that carries real decline risk at this stage of his career. Overall, a strong RB-anchored build with enough receiving volume to survive most weeks.",
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
    picks: [
      { round: 1, player: "Jahmyr Gibbs", pos: "RB", team: "DET", pickGrade: "A", note: "One of the best true RB1s in the league." },
      { round: 2, player: "Cam Skattebo", pos: "RB", team: "NYG", pickGrade: "C+", note: "Unproven committee back, a bit of a reach." },
      { round: 3, player: "Tetairoa McMillan", pos: "WR", team: "CAR", pickGrade: "B-", note: "Talented rookie but role still developing, fair-to-slight-reach." },
      { round: 4, player: "Harold Fannin Jr.", pos: "TE", team: "CLE", pickGrade: "C+", note: "Speculative rookie TE with an unclear path to targets." },
      { round: 5, player: "Jadarian Price", pos: "RB", team: "SEA", pickGrade: "C+", note: "Deep committee back, limited proven role." },
      { round: 6, player: "Rome Odunze", pos: "WR", team: "CHI", keeper: true, pickGrade: "Keeper", note: "Kept at R6 — solid WR2/3 value." },
      { round: 7, player: "Alec Pierce", pos: "WR", team: "IND", pickGrade: "B-", note: "Solid deep-threat complementary piece." },
      { round: 8, player: "Trevor Lawrence", pos: "QB", team: "JAX", pickGrade: "A-", note: "Excellent QB1 value falling to round 8." },
      { round: 9, player: "Wan'Dale Robinson", pos: "WR", team: "TEN", pickGrade: "C+", note: "Limited target share in his new offense." },
      { round: 10, player: "Jordan Addison", pos: "WR", team: "MIN", pickGrade: "B-", note: "Reasonable WR3/4 value." },
      { round: 11, player: "Dallas Goedert", pos: "TE", team: "PHI", pickGrade: "B-", note: "Steady, low-ceiling TE streamer." },
      { round: 12, player: "Ray Davis", pos: "RB", team: "BUF", pickGrade: "C+", note: "Deep committee handcuff." },
      { round: 13, player: "Jalen Coker", pos: "WR", team: "CAR", pickGrade: "C", note: "Speculative depth flier." },
      { round: 14, player: "Jason Myers", pos: "K", team: "SEA", pickGrade: "B", note: "Reliable kicker, solid value." },
      { round: 15, player: "Travis Hunter", pos: "WR", team: "JAX", pickGrade: "B", note: "Talented two-way star, nice value this late for the upside." },
      { round: 16, player: "Chiefs", pos: "DEF", team: "KC", pickGrade: "C+", note: "Fine streaming defense." },
    ],
    breakdown:
      "Jahmyr Gibbs is a top-3 overall asset and the clear engine of this roster, but Cam Skattebo at RB2 is unproven, and the offense pivots hard into a WR-by-committee approach after that (McMillan, Odunze, Pierce, Robinson, Addison, Coker, Hunter — seven WRs total). That's a lot of WR3/4-caliber depth without a true second alpha at the position. Fannin and Goedert at TE are both fine but unspectacular. This roster's success is heavily tied to Gibbs staying on the field and one of the many mid-tier WRs breaking out into a true starter — without that, the ceiling is capped.",
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
    picks: [
      { round: 1, player: "Jonathan Taylor", pos: "RB", team: "IND", pickGrade: "A", note: "Elite workhorse RB1, one of the safest picks available." },
      { round: 2, player: "Drake London", pos: "WR", team: "ATL", pickGrade: "B+", note: "Strong true WR1 in a run-heavy offense." },
      { round: 3, player: "Kenneth Walker III", pos: "RB", team: "KC", keeper: true, pickGrade: "Keeper", note: "Kept at R3 — this is his final keeper-eligible year." },
      { round: 4, player: "Colston Loveland", pos: "TE", team: "CHI", pickGrade: "B", note: "Talented rookie TE with real long-term upside." },
      { round: 5, player: "Jaylen Waddle", pos: "WR", team: "DEN", keeper: true, pickGrade: "Keeper", note: "Kept at R5 — becomes ineligible next year, advances past round 2." },
      { round: 6, player: "Jordyn Tyson", pos: "WR", team: "NO", pickGrade: "C+", note: "Speculative rookie add." },
      { round: 7, player: "RJ Harvey", pos: "RB", team: "DEN", pickGrade: "B-", note: "Real touches in a crowded backfield." },
      { round: 8, player: "Drake Maye", pos: "QB", team: "NE", pickGrade: "B", note: "Ascending young QB1, solid value here." },
      { round: 9, player: "Rico Dowdle", pos: "RB", team: "PIT", pickGrade: "C+", note: "Committee-tier depth." },
      { round: 10, player: "Zach Charbonnet", pos: "RB", team: "SEA", pickGrade: "B-", note: "Handcuff with real standalone value." },
      { round: 11, player: "Romeo Doubs", pos: "WR", team: "NE", pickGrade: "C+", note: "Deep WR4/5-caliber depth." },
      { round: 12, player: "Texans", pos: "DEF", team: "HOU", pickGrade: "B-", note: "Strong unit, good value this late." },
      { round: 13, player: "Oronde Gadsden", pos: "TE", team: "LAC", pickGrade: "C+", note: "Speculative rookie TE." },
      { round: 14, player: "Braelon Allen", pos: "RB", team: "NYJ", pickGrade: "C", note: "Deep committee back." },
      { round: 15, player: "Matthew Stafford", pos: "QB", team: "LAR", pickGrade: "B-", note: "Fine QB2 insurance." },
      { round: 16, player: "Tyler Loop", pos: "K", team: "BAL", pickGrade: "C+", note: "Deep-bench kicker." },
    ],
    breakdown:
      "Jonathan Taylor gives this team a legitimate RB1 floor, and Drake London is a steady WR1. Both keepers were solid value at the time, though it's worth noting Waddle's tag is a one-year rental — his advanced value would drop into round 2 next year, making him ineligible going forward. The RB room is deep in bodies (Harvey, Dowdle, Charbonnet, Allen) but shallow in certainty, mostly committee or handcuff-type pieces. Colston Loveland at TE is a solid rookie bet. This is a roster that should compete for a playoff spot on the strength of Taylor and London, but doesn't have a clear third star to elevate it into title contention.",
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
    picks: [
      { round: 1, player: "Justin Jefferson", pos: "WR", team: "MIN", pickGrade: "A", note: "The best true WR1 in the league, elite value at 1.1." },
      { round: 2, player: "Omarion Hampton", pos: "RB", team: "LAC", pickGrade: "A-", note: "Young workhorse RB with a real path to bellcow touches." },
      { round: 3, player: "Bucky Irving", pos: "RB", team: "TB", pickGrade: "B", note: "Solid RB2 with real receiving work." },
      { round: 4, player: "D'Andre Swift", pos: "RB", team: "CHI", pickGrade: "B-", note: "Committee-tier back with touchdown-dependent scoring." },
      { round: 5, player: "Courtland Sutton", pos: "WR", team: "DEN", pickGrade: "B-", note: "Reliable red-zone target earner." },
      { round: 6, player: "Kyle Pitts Sr.", pos: "TE", team: "ATL", pickGrade: "C+", note: "Boom-bust talent bet that hasn't paid off yet." },
      { round: 7, player: "Dak Prescott", pos: "QB", team: "DAL", pickGrade: "B", note: "Solid QB1 value falling a bit further than expected." },
      { round: 8, player: "Chris Olave", pos: "WR", team: "NO", keeper: true, pickGrade: "Keeper", note: "Kept at R8 — solid WR2/3 value." },
      { round: 9, player: "Jordan Love", pos: "QB", team: "GB", pickGrade: "C+", note: "Streamer-tier QB2." },
      { round: 10, player: "Khalil Shakir", pos: "WR", team: "BUF", pickGrade: "C+", note: "Deep WR4/5-caliber depth." },
      { round: 11, player: "Jayden Higgins", pos: "WR", team: "HOU", pickGrade: "C+", note: "Speculative rookie flier." },
      { round: 12, player: "Kimani Vidal", pos: "RB", team: "LAC", pickGrade: "C", note: "Deep committee handcuff." },
      { round: 13, player: "Vikings", pos: "DEF", team: "MIN", pickGrade: "B-", note: "Strong unit, good value this late." },
      { round: 14, player: "Chase McLaughlin", pos: "K", team: "TB", pickGrade: "C+", note: "Deep-bench kicker." },
      { round: 15, player: "Jaylen Wright", pos: "RB", team: "MIA", pickGrade: "C", note: "Deep committee dart throw." },
      { round: 16, player: "Ja'Kobi Lane", pos: "WR", team: "BAL", pickGrade: "C", note: "Deep-bench flier." },
    ],
    breakdown:
      "Justin Jefferson is the best true WR1 in this entire league, and Omarion Hampton gives a promising young RB1 to build around. With only one modest keeper (Olave, at round 8), though, this team essentially drafted a full roster with no discount edge over the field — every other roster on this list got at least one, usually two, players well below market rate, and this one didn't. The RB room past Hampton (Irving, Swift, Vidal, Wright) is committee-heavy, and Pitts at TE remains a boom-or-bust bet on unlocked potential. Talented top of the roster, but the lack of a keeper advantage means this team has to outdraft the league in-season through waivers rather than starting a round ahead.",
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
    picks: [
      { round: 1, player: "Ashton Jeanty", pos: "RB", team: "LV", pickGrade: "A-", note: "Excellent rookie workhorse, strong true RB1." },
      { round: 2, player: "Jeremiyah Love", pos: "RB", team: "ARI", pickGrade: "C+", note: "Unproven committee back, a bit of a reach." },
      { round: 3, player: "Carnell Tate", pos: "WR", team: "TEN", pickGrade: "C+", note: "Speculative rookie add, unclear immediate role." },
      { round: 4, player: "Terry McLaurin", pos: "WR", team: "WAS", pickGrade: "B", note: "Steady, reliable WR1/2 target earner." },
      { round: 5, player: "Jalen Hurts", pos: "QB", team: "PHI", pickGrade: "B+", note: "Elite rushing-floor QB1, solid value this round." },
      { round: 6, player: "Chuba Hubbard", pos: "RB", team: "CAR", pickGrade: "B-", note: "Reliable committee lead-back." },
      { round: 7, player: "George Kittle", pos: "TE", team: "SF", pickGrade: "B", note: "Established TE1 with real weekly upside." },
      { round: 8, player: "Matthew Golden", pos: "WR", team: "GB", pickGrade: "C+", note: "Speculative rookie flier." },
      { round: 9, player: "Kenny Gainwell", pos: "RB", team: "TB", pickGrade: "C+", note: "Deep committee depth." },
      { round: 10, player: "Tucker Kraft", pos: "TE", team: "GB", keeper: true, pickGrade: "Keeper", note: "Kept at R10 — decent TE2/streamer value." },
      { round: 11, player: "Isiah Pacheco", pos: "RB", team: "DET", pickGrade: "C+", note: "Deep committee handcuff." },
      { round: 12, player: "Rashid Shaheed", pos: "WR", team: "SEA", pickGrade: "C+", note: "Boom-bust deep threat." },
      { round: 13, player: "Jacory Croskey-Merritt", pos: "RB", team: "WAS", keeper: true, pickGrade: "Keeper", note: "Kept at R13 — deep-bench flier value." },
      { round: 14, player: "Deebo Samuel Sr.", pos: "WR", team: "SF", pickGrade: "C", note: "Aging, declining role." },
      { round: 15, player: "Jake Bates", pos: "K", team: "GB", pickGrade: "C+", note: "Deep-bench kicker." },
      { round: 16, player: "Patriots", pos: "DEF", team: "NE", pickGrade: "C+", note: "Fine streaming defense." },
    ],
    breakdown:
      "Ashton Jeanty is a legitimate RB1 and a fine foundation, but the rest of the draft never quite finds a second star. Terry McLaurin is the clear WR1, but after him it's a collection of unproven or role-limited names (Tate, Golden, Shaheed, Deebo in decline). Two RBs early (Jeanty, Love) is a reasonable strategy, but neither keeper — Kraft at TE and Croskey-Merritt at RB — moves the needle much; they're useful depth pieces, not difference-makers. Kittle and Kraft gives two-TE-flex flexibility, which is a nice touch, but overall this roster reads as a rebuild year: solid floor at RB1, thin ceiling everywhere else.",
  },
];

const gradeColor: Record<string, string> = {
  A: "text-gold", "A-": "text-gold",
  "B+": "text-teal", B: "text-teal", "B-": "text-teal",
  "C+": "text-mute", C: "text-mute",
};

const pickGradeColor: Record<string, string> = {
  A: "text-gold", "A-": "text-gold",
  "B+": "text-teal", B: "text-teal", "B-": "text-teal",
  "C+": "text-mute", C: "text-mute", D: "text-ember",
};

export default function DraftGradesPage() {
  const [openTeam, setOpenTeam] = useState<string | null>(null);

  return (
    <div className="max-w-4xl">
      <h1 className="font-display text-4xl tracking-wide text-bone">Draft Grades</h1>
      <p className="mt-2 text-sm text-mute">2026-27 season — grades, breakdowns, and predictions for every team. Click a team for a pick-by-pick breakdown with a grade on every single selection.</p>
      <div className="divider-tentacle my-6" />

      <div className="space-y-4">
        {grades.map((g) => {
          const isOpen = openTeam === g.team;
          return (
            <div key={g.team} className="stat-card overflow-hidden rounded-xl">
              <button
                onClick={() => setOpenTeam(isOpen ? null : g.team)}
                className="flex w-full flex-wrap items-center justify-between gap-3 p-5 text-left"
              >
                <div className="flex items-center gap-4">
                  <span className="font-display text-2xl text-mute">#{g.rank}</span>
                  <div>
                    <div className="font-display text-xl text-bone">{g.team}</div>
                    <div className="text-xs uppercase tracking-widest text-mute">{g.owner}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className={`font-display text-4xl ${gradeColor[g.grade] ?? "text-bone"}`}>{g.grade}</span>
                    <div className="text-xs font-semibold text-mute">{g.score.toFixed(1)}%</div>
                  </div>
                  <span className="text-teal">{isOpen ? "▲" : "▼"}</span>
                </div>
              </button>

              <div className="px-5 pb-5">
                <p className="text-sm leading-relaxed text-bone">{g.blurb}</p>
                <p className="mt-2 text-sm italic leading-relaxed text-teal">{g.prediction}</p>
              </div>

              {isOpen && (
                <div className="border-t border-line/60 bg-panel/40 p-5">
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-teal">Overall Breakdown</h3>
                  <p className="mb-5 text-sm leading-relaxed text-bone">{g.breakdown}</p>

                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-teal">Pick-by-Pick Grades</h3>
                  <div className="space-y-1.5">
                    {g.picks.map((p) => (
                      <div key={p.round} className="rounded border border-line/60 px-3 py-2 text-xs">
                        <div className="flex items-center justify-between gap-2">
                          <span className="flex flex-1 items-center gap-2">
                            <span className="w-8 shrink-0 font-semibold text-mute">R{p.round}</span>
                            <span className="font-semibold text-bone">{p.player}</span>
                            <span className="text-mute">{p.pos} · {p.team}</span>
                          </span>
                          <span
                            className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                              p.keeper ? "bg-gold/20 text-gold" : `bg-line/40 ${pickGradeColor[p.pickGrade] ?? "text-bone"}`
                            }`}
                          >
                            {p.keeper ? "Keeper" : p.pickGrade}
                          </span>
                        </div>
                        <p className="mt-1 pl-10 text-mute">{p.note}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

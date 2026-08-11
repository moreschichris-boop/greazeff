// Snake draft math shared between the public /draft board and the admin
// draft control tab.

export function teamOrderForRound(draftOrder: string[], round: number): string[] {
  // Odd rounds go in the original order, even rounds reverse (snake).
  return round % 2 === 1 ? draftOrder : [...draftOrder].reverse();
}

export function ownerForPick(draftOrder: string[], pickNumber: number): { round: number; pickInRound: number; ownerId: string } {
  const teamCount = draftOrder.length;
  const round = Math.ceil(pickNumber / teamCount);
  const pickInRound = pickNumber - (round - 1) * teamCount; // 1-indexed
  const order = teamOrderForRound(draftOrder, round);
  const ownerId = order[pickInRound - 1];
  return { round, pickInRound, ownerId };
}

export function totalPicks(draftOrder: string[], rounds: number): number {
  return draftOrder.length * rounds;
}

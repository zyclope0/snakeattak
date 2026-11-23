/** The question asked to an adult before Android's share sheet (src/ui/adultGate.ts). */

/** The two numbers asked: 12 to 19 times 6 to 9, new each time. */
export function gateNumbers(random: () => number = Math.random): [number, number] {
  return [12 + Math.floor(random() * 8), 6 + Math.floor(random() * 4)];
}

/** True when what was typed is the product, written in digits and nothing else. */
export function rightAnswer(a: number, b: number, typed: string): boolean {
  const answer = typed.trim();
  return /^\d+$/.test(answer) && Number(answer) === a * b;
}

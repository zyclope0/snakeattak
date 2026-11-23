/** The question asked to an adult before Android's share sheet (src/ui/adultGate.ts). */

/** The first number asked, from its smallest to its largest. */
export const GATE_FIRST = { from: 12, to: 19 } as const;
/** The second number asked, from its smallest to its largest. */
export const GATE_SECOND = { from: 6, to: 9 } as const;

const pick = (range: { from: number; to: number }, random: () => number) =>
  range.from + Math.floor(random() * (range.to - range.from + 1));

/** The two numbers asked, new each time. */
export function gateNumbers(random: () => number = Math.random): [number, number] {
  return [pick(GATE_FIRST, random), pick(GATE_SECOND, random)];
}

/** True when what was typed is the product, written in digits and nothing else. */
export function rightAnswer(a: number, b: number, typed: string): boolean {
  const answer = typed.trim();
  return /^\d+$/.test(answer) && Number(answer) === a * b;
}

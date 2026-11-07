export const enemies = {
  normal: {
    name: 'Serpent',
    hp: 1,
    speed: 1,
    damage: 1,
    range: 44,
    armor: 0,
    tint: 0xffffff,
    scale: 1,
  },
  runner: {
    name: 'Vif',
    hp: 0.65,
    speed: 1.55,
    damage: 0.8,
    range: 44,
    armor: 0,
    tint: 0xc8f19b,
    scale: 0.85,
  },
  armored: {
    name: 'Carapace',
    hp: 1.9,
    speed: 0.72,
    damage: 1.2,
    range: 44,
    armor: 0.28,
    tint: 0x9fb9d0,
    scale: 1.15,
  },
  clockwork: {
    name: 'Serpent à rouages',
    hp: 1.65,
    speed: 0.82,
    damage: 1.1,
    range: 44,
    armor: 0.42,
    tint: 0xd8b06e,
    scale: 1.12,
  },
  spring: {
    name: 'Serpent à ressort',
    hp: 0.85,
    speed: 1,
    damage: 0.9,
    range: 44,
    armor: 0.08,
    tint: 0xb6cbd0,
    scale: 0.95,
  },
  umbrella: {
    name: 'Serpent parapluie',
    hp: 1.35,
    speed: 0.82,
    damage: 0.9,
    range: 44,
    armor: 0,
    tint: 0xb9d69d,
    scale: 1.05,
  },
  spitter: {
    name: 'Cracheur',
    hp: 0.9,
    speed: 0.9,
    damage: 0.8,
    range: 220,
    armor: 0,
    tint: 0xd6a4ec,
    scale: 1,
  },
  rattlesnake: {
    name: 'Serpent à sonnette',
    hp: 0.95,
    speed: 0.9,
    damage: 0.8,
    range: 44,
    armor: 0,
    tint: 0xe8c29a,
    scale: 1,
  },
  royal: {
    name: 'Cobra royal',
    hp: 1.15,
    speed: 0.9,
    damage: 1,
    range: 44,
    armor: 0,
    tint: 0xf2d482,
    scale: 1.08,
  },
  mamba: {
    name: 'Mamba noir',
    hp: 0.85,
    speed: 1.25,
    damage: 1,
    range: 44,
    armor: 0,
    tint: 0xabb5ce,
    scale: 0.95,
  },
} as const;
export type EnemyKind = keyof typeof enemies;

/** The plate stays broken once health crosses half; enemies never receive healing. */
export function enemyArmor(enemy: { variant: EnemyKind; hp: number; maxHp: number }): number {
  return enemy.variant === 'clockwork' && enemy.hp <= enemy.maxHp * 0.5
    ? 0.06
    : enemies[enemy.variant].armor;
}
/** Simulation time freezes in pause and gives reproducible mechanical impulses. */
export function enemySpeed(variant: EnemyKind, time: number): number {
  return enemies[variant].speed * (variant === 'spring' ? (time % 1.6 < 1 ? 0.35 : 2.4) : 1);
}

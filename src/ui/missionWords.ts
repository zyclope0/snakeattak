import * as TEXT from '../texts/fr/missionScreens.ts';

/**
 * What a departure is called, apart from the preparation window: the result of a mission and
 * the voyage name its terrain and its attack without loading the preparation.
 */
export const freshSeed = () => crypto.getRandomValues(new Uint32Array(1))[0];
/** The three terrains of a mission, as the preparation and the voyage map name them. */
export const lands = [TEXT.detours, TEXT.meandres, TEXT.carrefour];
export const assaults = {
  balanced: TEXT.arriveesRegulieres,
  rush: TEXT.petitsGroupesRapides,
  escort: TEXT.avanceesGroupees,
};
export const nests = { spread: TEXT.eclosionsDecalees, clustered: TEXT.couveeGroupee };

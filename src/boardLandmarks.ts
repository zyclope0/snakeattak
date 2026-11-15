/**
 * Landmarks of the 1100 × 620 board that the rules refer to. They are part of the game:
 * changing one changes every recorded game. A module without imports, so that the rules of
 * a step, the camp and the pathfinding can all name the same lines.
 */

/** Snakes leave their den here. */
export const DEN_EXIT_X = 108;
/** Far end of the three bridges: from here the king lays eggs and spits. */
export const BRIDGE_END_X = 576;
/** The camp, where allies may stand. */
export const CAMP_LEFT = 600;
export const CAMP_RIGHT = 984;
export const CAMP_TOP = 108;
export const CAMP_BOTTOM = 540;
/** First column of the camp for a fight: snakes use their full reach, helpers stop here. */
export const CAMP_FRONT_X = 612;
/** A snake this close to the crystal outranks every other target. */
export const CRYSTAL_ALERT_X = 900;
/** Past this line a snake has reached the crystal. */
export const CRYSTAL_X = 1000;
/** Body contact: a bite outside the camp, a court guard's reach, the king's close combat. */
export const CONTACT_RANGE = 44;

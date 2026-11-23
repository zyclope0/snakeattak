import { buildIsApp, type Handover } from './download.ts';
import * as TEXT from '../texts/fr/family.ts';

/**
 * What to say once a file was asked for: « ready » only when one was handed over. In the
 * application Android says only that the family chose an app, never that the file arrived;
 * and it may call « closed » a share that went out without leaving the game (tried in the
 * plugin's code, not on a phone): neither sentence says more than that.
 */
export const told = (
  result: Handover,
  ready: string,
  closed = TEXT.lePartageSEstFermeSiLeFichierNEstArriveNullePart,
) =>
  result === 'saved'
    ? ready
    : result === 'canceled'
      ? closed
      : TEXT.impossibleDePreparerLeFichierDe;
/** The family's own adventure: in the application it goes to the app chosen, not a browser. */
export const toldAdventure = (result: Handover, app = buildIsApp()) =>
  told(
    result,
    app ? TEXT.leFichierEstPartiVerifieQuIlEstBienArrive : TEXT.fichierPretConserveLePourReprendre,
  );
/** A file put aside that this version cannot read: never « ton aventure ». */
export const toldSetAside = (result: Handover, app = buildIsApp()) =>
  told(
    result,
    app
      ? TEXT.leFichierEstPartiCetteVersionNeSaitPasLeRelire
      : TEXT.fichierRemisCetteVersionNeSaitPasLeRelire,
    TEXT.lePartageSEstFermeSiLeFichierNEstArriveRecommence,
  );

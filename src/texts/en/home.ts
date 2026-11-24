import { CRYSTAL_MAX, ENCOURAGEMENT_SECONDS, STAR_MAX } from '../../gameConstants.ts';

export const reprendre = 'Resume';
export const reprendreMaMission = 'Resume my mission';
export const reprendreMonAventureClassique = 'Resume my classic adventure';
export const unePartieSeulementDuFichierAEteGardee =
  'The device refused a write along the way: only part of the file could be kept. Close the game, open it again, then start over.';
export const fichierInvalideRienNAEteModifie = 'Invalid file: nothing has changed.';
export const impossibleDeConserverCeFichierSur =
  'This browser could not save the file. Your current adventure is still safe.';
export const aventureFamilialeRetrouvee = 'Family adventure restored.';
export const encourager = 'Encourage';
export const encouragesNS = 'Encouraged · {0} s';
export const revientALaProchaineVague = 'Returns next wave';
export const n1FoisParVagueAttaquesPlusRapides = `Once per wave · faster attacks for ${ENCOURAGEMENT_SECONDS} s`;
export const chapitreNAccompliNNN = 'Chapter {0} complete · {1} · {2}{3}';
export const minimumHistoriqueNonDisponible = 'past minimum unavailable';
export const minimumDuChapitreN100Pv = `chapter minimum {0}/${CRYSTAL_MAX} HP`;
export const conserveeN = 'kept';
export const pourCePassage = 'for this run';
export const nEtoileNSur3NCristalNActuellementN = `Stars: {0} out of ${STAR_MAX} {2}. Crystal: {3} · now {4}/${CRYSTAL_MAX} HP. Allies present: {5}. Snakes defeated since the adventure began: {8}.`;
export const reessayerLaVague = 'Retry wave';
export const continuerLaBatailleVagueN = 'Continue the battle · wave {0}';
export const continuerVagueN = 'Continue · wave {0}';
export const commencerIci = 'Start here';
export const rejouerDepuisMonCamp = 'Replay from my camp';
export const aDecouvrirDansLAventure = 'Discover during the adventure';
export const nEtoilesSur3 = `{0} stars out of ${STAR_MAX}`;
export const n9Etoiles = '{0} / 9 stars';
export const lesFavorisSePreparentEntreLes = 'Set up your favorites between waves.';
export const preparerTroisGroupesDeHuitFavoris = 'Prepare three groups of eight favorites.';
export const favorisN = 'Favorites · {0}';
export const reprendreLeVoyage = 'Resume the voyage';
export const laGrandeExpedition = 'The Great Expedition';
export const reprendreLExpedition = 'Resume the expedition';
export const nouveau = 'New';
export const leVoyageNAPasPuSOuvrirRecharge = 'The voyage could not open. Reload the page.';
export const laGrandeExpeditionNAPasPuSOuvrir =
  'The Great Expedition could not open. Reload the page.';
export const confidentialite = 'Privacy policy';
export const confidentialiteIndisponible = 'Privacy policy unavailable. Reload the page.';
/** The best endless adventure of the active player: the wave, the kings beaten. */
export const tonRecordVagueNNRois = 'Your record: wave {0}';
/** Under a mission, when the camp waiting is an endless adventure. */
export const reprendreMonAventureSansFin = 'Resume my endless adventure';
/** The endless adventure open, no game of this player yet. */
export const pasEncoreDeRecord = 'No record yet';

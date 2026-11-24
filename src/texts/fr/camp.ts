import {
  CRYSTAL_MAX,
  ENCOURAGEMENT_SECONDS,
  HERO_TRAINING_COST,
  HERO_TRAINING_FROM,
  REPAIR_AMOUNT,
} from '../../gameConstants.ts';

export const pasDeMielDansCeCaprice = 'Pas de miel dans ce caprice';
export const reserveBancaireProtegee = 'Réserve bancaire protégée · ';
export const leHerosEstTombeAucunEntrainement = 'Le héros est tombé. Aucun entraînement possible.';
export const frappeRenforcee15DeDegatsDuHeros = 'Frappe renforcée · +15 % de dégâts du héros';
export const gardien15SurLesCoupsEtTirsRecus = 'Gardien · −15 % sur les coups et tirs reçus';
export const dansUneAutreExpeditionDesLesTrois = 'Dans une autre expédition, dès Les trois ponts';
export const disponibleApresLaVague4 = `Disponible après la vague ${HERO_TRAINING_FROM}`;
export const entreDeuxVagues90Pieces = `Entre deux vagues · ${HERO_TRAINING_COST} pièces`;
export const ilManqueNPiecesPourLEntrainement = 'Il manque {0} pièces pour l’entraînement';
export const n90PiecesUnSeulEntrainementPourCes = `${HERO_TRAINING_COST} pièces · un seul entraînement pour ces alliés`;
export const entrainerLeHeros = 'Entraîner le héros';
export const entreDeuxVaguesDesLesTroisPontsEn = `Entre deux vagues. Dès Les trois ponts en expédition ; après la vague ${HERO_TRAINING_FROM} en classique.`;
export const tousLesAlliesConseilsEtOutils =
  'Tous les alliés → Conseils et outils → Actions du camp → Entraîner le héros. Choisis Frappe ou Gardien.';
export const frappe15DeDegatsGardien15SurLes =
  'Frappe : +15 % de dégâts. Gardien : −15 % sur les coups reçus. Un seul choix pour ces alliés.';
export const reparerLeCristal = 'Réparer le cristal';
export const siLeCristalAPerduDeLaVieAvantOu =
  'Si le cristal a perdu de la vie, avant ou pendant une vague.';
export const tousLesAlliesConseilsEtOutils2 =
  'Tous les alliés → Conseils et outils → Actions du camp → Réparer le cristal.';
export const leCristalRegagneJusquA25PointsDe = `Le cristal regagne jusqu’à ${REPAIR_AMOUNT} points de vie, sans dépasser ${CRYSTAL_MAX}.`;
export const lesDegatsSubisRestentComptesPour =
  ' Les dégâts subis restent comptés pour tes étoiles.';
export const laPartieEstTerminee = 'La partie est terminée';
export const tonCristalEstIntact = 'Ton cristal est intact';
export const ilManqueNPiecesPourReparer = 'Il manque {0} pièces pour réparer';
export const cristalN100ReparationPossible = `Cristal : {0} / ${CRYSTAL_MAX} · réparation possible`;
export const encourager = 'Encourager';
export const pendantLeCombatQuandTesAllies = 'Pendant le combat, quand tes alliés peuvent frapper.';
export const tousLesAlliesConseilsEtOutils3 =
  'Pendant la vague, touche « Encourager » en haut de l’écran. Aussi dans Tous les alliés → Conseils et outils → Actions du camp.';
export const leursAttaquesAccelerentPendant8S = `Leurs attaques accélèrent pendant ${ENCOURAGEMENT_SECONDS} s. Une fois par vague.`;
export const encouragesNS = 'Encouragés · {0} s';
export const revientALaProchaineVague = 'Revient à la prochaine vague';
export const aUtiliserPendantLeCombat = 'À utiliser pendant le combat';
export const unEncouragementGratuitPourCette = 'Un encouragement gratuit pour cette vague';
export const aucunAllieCapableDeFrapper = 'Aucun allié capable de frapper';
export const leMiel = 'Le miel';
export const pendantUneVagueSurUnCheminAttaque =
  'Pendant une vague, sur un chemin attaqué. Un pot gratuit par vague.';
export const choisisAttirerOuRalentirPuisTouche =
  'Choisis Attirer ou Ralentir, puis touche un chemin. Annuler garde ton pot.';
export const attirerDetourneLesGourmandsAux =
  'Attirer détourne les gourmands aux jonctions. Ralentir freine sur la flaque. Le miel dure {0} s.';
export const potUtiliseRevientALaProchaineVague = 'Pot utilisé · revient à la prochaine vague';
export const tonPotAttendLeCombat = 'Ton pot attend le combat';
export const tonPotEstPret = 'Ton pot est prêt';
export const attirer = 'Attirer';
export const attireLesGourmandsVersCetteVoieAux =
  'Attire les gourmands vers cette voie aux prochaines jonctions.';
export const ralentir = 'Ralentir';
export const poseUneFlaqueDeMielCollantSurLe =
  'Pose une flaque de miel collant sur le passage choisi.';
export const mielCollant = 'Miel collant';
export const mielAttirant = 'Miel attirant';
export const cetteVoieRestePaisiblePendantCette = 'Cette voie reste paisible pendant cette vague.';
export const nNPendantNSecondes = '{0} {1} pendant {2} secondes';
export const ralentirLesSerpentsSurLePassage = 'Ralentir les serpents sur le passage';
export const attirerLesSerpentsVersLaVoie = 'Attirer les serpents vers la voie';
export const toucheUnCheminPourPoserLeMielOu =
  'Touche un chemin pour poser le miel, ou utilise les boutons ci-dessous. ';
export const voieNAttaqueeNNPaisible = ' Voie{0} attaquée{1} : {2}. « — » : paisible.';
/** Between the names of two lanes: « Haut et Bas ». */
export const et = ' et ';
export const nDetourN = '{0} détour{1}';
export const aRetrouverDansLaProchainePartie = 'À retrouver dans la prochaine partie';
export const mielCollantNNSRalentitSurLePassage =
  'Miel collant · {0} · {1} s · ralentit sur le passage';
export const mielAttirantNNSN = 'Miel attirant · {0} · {1} s · {2}';
export const nUtiliseNRevientALaProchaineVague = '{0} utilisé{1} · revient à la prochaine vague';
export const unPotGratuitParVagueNSChoisisTon =
  'Un pot gratuit par vague · {0} s · choisis ton miel';
export const pretChoisisLaVoieAN = 'Prêt ! Choisis la voie à {0}';
export const vagueNRepousseeChoisisTonBonus = 'Vague {0} repoussée ! Choisis ton bonus';
export const choisirCeBonus = 'Choisir ce bonus';
export const nBonusChoisiNPourCetteAventure = '{0} bonus choisi{1} pour cette aventure';
export const nProtection = '+{0} protection';
export const mielNS = 'Miel : {0} s';
export const cristalNPointsDeProtection = 'Cristal : {0} points de protection';
export const nOffertAPlacer = '{0} offert à placer';

// --- The endless adventure: lasting gifts, their levels, the five places.
export const laForge = 'La forge';
export const tesAlliesFrappentPlusFortN = 'Tes alliés frappent plus fort : +{0} %';
export const lArmure = 'L’armure';
export const tesAlliesOntPlusDeVieN = 'Tes alliés ont plus de vie : +{0} %';
export const leMarche = 'Le marché';
export const recruterCouteNMoins = 'Recruter coûte {0} % de moins';
export const laRente = 'La rente';
export const nPiecesAChaqueVague = '+{0} pièces à chaque vague';
export const leCristalSolide = 'Le cristal solide';
export const leCristalSeRepareDeN = 'Le cristal se répare de {0} à chaque vague';
export const laLongueVue = 'La longue-vue';
export const tesTireursVoientNPlusLoin = 'Tes tireurs voient {0} % plus loin';
export const nSecondesPourChaquePotDeMiel = '+{0} secondes pour chaque pot de miel';
/** On a gift already taken: taking it again climbs this level. */
export const monterAuNiveauN = 'Monter au niveau {0}';
/** The five places are full: the child picks the gift that gives its place. */
export const tesNPlacesSontPrises = 'Tes {0} places sont prises';
export const choisisLeCadeauARemplacerParN = 'Choisis le cadeau à remplacer par {0}.';
export const remplacer = 'Remplacer';
export const garderMesCadeaux = 'Garder mes cadeaux';
/** The gift after a king. */
export const kingSnakeEstVaincuChoisisTonCadeau = 'King Snake est vaincu ! Choisis ton cadeau';
/** A gift and its level, under the camp: « La forge ★★ ». */
export const nNiveauEtoiles = '{0} {1}';
/** The start button after a king. */
export const continuer = 'Continuer';

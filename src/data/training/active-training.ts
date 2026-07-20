import type { CompassTrainingPage } from "./types";
import { compassTrainingMexico } from "./compass-training-mexico";
import { compassTrainingNz } from "./compass-training-nz";

/**
 * Legacy training-page data modules.
 * Public `/compass/` uses `compass-page.ts` for metadata and `compass-cohorts.ts` for schedule.
 * Do not treat this export as the live commercial source of truth.
 */
export const activeCompassTraining: CompassTrainingPage = compassTrainingMexico;

export { compassTrainingMexico, compassTrainingNz };

import type { CompassTrainingPage } from "./types";
import { compassTrainingMexico } from "./compass-training-mexico";
import { compassTrainingNz } from "./compass-training-nz";

// Switch to the Mexico City version on or after 2026-08-01 once pricing, cohorts, schedule, and application flow are confirmed.
export const activeCompassTraining: CompassTrainingPage = compassTrainingNz;

export { compassTrainingMexico, compassTrainingNz };

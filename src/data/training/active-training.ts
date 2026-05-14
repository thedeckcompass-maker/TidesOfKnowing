import type { CompassTrainingPage } from "./types";
import { compassTrainingMexico } from "./compass-training-mexico";
import { compassTrainingNz } from "./compass-training-nz";

// Mexico City cohorts use the standard tier pricing in `compass-training-mexico.ts` (see docs/copy/compass-training-page-copy-mexico.md).
export const activeCompassTraining: CompassTrainingPage = compassTrainingMexico;

export { compassTrainingMexico, compassTrainingNz };

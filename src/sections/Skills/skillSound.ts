import { playSelect } from "../shared/audio";

/** Skill tile hover/select blip. Uses the shared audio graph. */
export function playSelectBlip(rising: boolean) {
  playSelect(rising);
}

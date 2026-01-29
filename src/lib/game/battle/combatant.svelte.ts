import type { Character } from '$lib/game/character/index.svelte';
import { NEUTRAL_BUFF_ARRAY, type BuffArray } from '$lib/game/gameTypes';

export class Combatant {
	character: Character;
	buffLevels: BuffArray;
	smirking: boolean;
	constructor(character: Character) {
		this.character = $state(character);
		this.buffLevels = $state(NEUTRAL_BUFF_ARRAY);
		this.smirking = $state(false);
	}
}

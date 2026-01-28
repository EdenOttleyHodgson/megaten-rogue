import type { Character } from '$lib/game/character';
import { NEUTRAL_BUFF_ARRAY, type BuffArray } from '$lib/game/gameTypes';

export class Combatant {
	character: Character;
	buffLevels: BuffArray;
	smirking: boolean;
	constructor(character: Character) {
		this.character = character;
		this.buffLevels = NEUTRAL_BUFF_ARRAY;
		this.smirking = false;
	}
}

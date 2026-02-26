import type { Character } from '$lib/game/character/index.svelte';
import {
	NEUTRAL_BUFF_ARRAY,
	NULL_RESIST_ARRAY,
	resistArrayGet,
	type BuffArray,
	type BuffType,
	type NullableResistArray,
	type ResistType,
	type SMTElement
} from '$lib/game/gameTypes';
import { SvelteMap } from 'svelte/reactivity';
import type { Side } from './index.svelte';
import { withinBounds } from '../calculationUtils';

export class Combatant {
	character: Character;
	side: Side;
	buffLevels: BuffArray = $state(NEUTRAL_BUFF_ARRAY);
	smirking: boolean = $state(false);
	concentrating: number | undefined = $state(undefined);
	pierces: SMTElement[] = $state([]);
	tempResistMods = new SvelteMap<SMTElement, ResistType>();
	constructor(character: Character, side: Side) {
		this.character = $state(character);
		this.side = side;
	}

	getResist(elem: SMTElement): ResistType {
		const tempResist = this.tempResistMods.get(elem);
		return tempResist || resistArrayGet(this.character.resists, elem);
	}

	modifyBuff(buff: BuffType, amount: number) {
		switch (buff) {
			case 'Attack':
				this.buffLevels.attack = withinBounds(this.buffLevels.attack + amount, -3, 3);
				break;
			case 'Defence':
				this.buffLevels.defence = withinBounds(this.buffLevels.defence + amount, -3, 3);
				break;
			case 'Evasion':
				this.buffLevels.evasion = withinBounds(this.buffLevels.evasion + amount, -3, 3);
				break;
			case 'Accuracy':
				this.buffLevels.accuracy = withinBounds(this.buffLevels.accuracy + amount, -3, 3);
				break;
		}
	}
}

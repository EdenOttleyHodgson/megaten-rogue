import type { StatArray } from '$lib/game/gameTypes';
import type { Combatant } from './combatant.svelte';

export class Party {
	combatants: Combatant[];
	maxSize: number = 4;
	constructor(combatants: Combatant[]) {
		this.combatants = $state(combatants);
	}

	public stats(): StatArray[] {
		return this.combatants.map((x) => x.character.stats);
	}

	public specificStats(statFunc: (stats: StatArray) => number): number[] {
		return this.stats().map(statFunc);
	}
	public size(): number {
		return this.combatants.length;
	}
}

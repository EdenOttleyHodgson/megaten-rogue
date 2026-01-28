import type { StatArray } from '$lib/gameTypes';
import type { Combatant } from './combatant';

export class Party {
	private combatants: Combatant[];
	constructor(combatants: Combatant[]) {
		this.combatants = combatants;
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

import { getCompendium } from '$lib/compendium';
import type { AffinityArray, AilmentType, ResistArray, StatArray } from '$lib/gameTypes';

//This is an instance of a compendium character
export class Character {
	compendium_id: string | null = null;
	stats: StatArray;
	resists: ResistArray;
	affinities: AffinityArray;
	currentHp: number;
	currentMp: number;
	currentAilments: AilmentType[];
	dead: boolean;

	//Create a fresh new instance of a character from a compendium template
	constructor(compendium_id: string) {
		const compendium = getCompendium();
		this.compendium_id = compendium_id;
		const compendiumChar = compendium.characters.get(compendium_id)?.data;
		if (compendiumChar) {
			this.stats = compendiumChar.baseStats;
			this.resists = compendiumChar.baseResists;
			this.affinities = compendiumChar.baseAffinities;
			this.currentHp = this.stats.hp;
			this.currentMp = this.stats.mp;
			this.currentAilments = [];
			this.dead = false;
		} else {
			throw new Error('nonexistent compendium character');
		}
	}
}

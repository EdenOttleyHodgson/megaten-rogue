import { getCompendium } from '$lib/game/compendium';
import type {
	AffinityArray,
	AilmentType,
	CharacterType,
	ResistArray,
	StatArray
} from '$lib/game/gameTypes';
import type { CompendiumCharacter } from '../compendium/character';
import type { CompendiumSkill } from '../compendium/skill';
import { demonClassFromCompendium, type DemonClass } from './demon.svelte';

//This is an instance of a compendium character
export class Character {
	compendium_id: string | null = null;
	sprite: string;
	displayName: string;
	level: number;
	stats: StatArray;
	resists: ResistArray;
	affinities: AffinityArray;
	currentHp: number;
	currentMp: number;
	currentAilments: AilmentType[];
	dead: boolean;
	characterClass: CharacterClass;
	//There needs to be like. the other demon/atma avatar/summoner stuff

	//Create a fresh new instance of a character from a compendium template
	constructor(compendium_id: string) {
		const compendium = getCompendium();
		this.compendium_id = compendium_id;
		const compendiumChar = compendium.characters.get(compendium_id);
		if (!compendiumChar) {
			throw new Error('nonexistent compendium character');
		}
		this.displayName = $state(compendiumChar.data.displayName);
		this.sprite = $state(compendiumChar.data.sprite || 'JackFrost.webp');
		this.level = $state(compendiumChar.data.baseLevel);
		this.stats = $state(compendiumChar.data.baseStats);
		this.resists = $state(compendiumChar.data.baseResists);
		this.affinities = $state(compendiumChar.data.baseAffinities);
		this.currentHp = $state(this.stats.hp);
		this.currentMp = $state(this.stats.mp);
		this.currentAilments = $state([]);
		this.dead = $state(false);
		this.characterClass = $state(classFromCompendiumChar(this.level, compendiumChar));
	}

	//Damage a character
	damage(amount: number) {
		this.currentHp = Math.max(0, this.currentHp - amount);
		if (this.currentHp == 0) {
			this.dead = true;
		}
	}
}

export type CharacterClass = { kind: 'Demon'; data: DemonClass };
function classFromCompendiumChar(
	level: number,
	compendiumChar: CompendiumCharacter
): CharacterClass {
	switch (compendiumChar.kind) {
		case 'Demon':
			return { kind: 'Demon', data: demonClassFromCompendium(level, compendiumChar.data) };
	}
}

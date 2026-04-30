import { getCompendium } from '$lib/game/compendium';
import type { AffinityArray, AilmentType, ResistArray, StatArray } from '$lib/game/gameTypes';
import { SvelteMap } from 'svelte/reactivity';
import { withinBounds } from '../calculationUtils';
import type { CompendiumCharacter } from '../compendium/character';
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
	currentAilments: SvelteMap<AilmentType, number>;
	endurance: number[];
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
		this.currentAilments = new SvelteMap();
		this.dead = $state(false);
		this.characterClass = $state(classFromCompendiumChar(this.level, compendiumChar));
		this.endurance = $state([]);
	}

	//Damage a character
	damage(amount: number) {
		this.currentHp = Math.max(0, this.currentHp - amount);
		if (this.currentHp == 0) {
			const endurance = this.endurance.pop();
			if (endurance) {
				this.currentHp = endurance * this.stats.hp;
			} else {
				this.dead = true;
			}
		}
	}
	heal(amount: number) {
		this.currentHp = Math.min(this.currentHp + amount, this.stats.hp);
	}
	revive(percent: number) {
		if (this.dead) {
			this.currentHp = Math.floor((percent / 100) * this.stats.hp);
			this.dead = false;
		} else {
			console.error('Tried to revive living character!');
		}
	}
	addAilment(ailment: AilmentType) {
		this.currentAilments.set(ailment, 0);
	}

	removeAilment(ailment: AilmentType) {
		this.currentAilments.delete(ailment);
	}
	modifyMp(amount: number) {
		this.currentMp = withinBounds(this.currentMp + amount, 0, this.stats.mp);
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

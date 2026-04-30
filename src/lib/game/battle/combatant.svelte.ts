import type { Character } from '$lib/game/character/index.svelte';
import {
	ailmentExpires,
	NEUTRAL_BUFF_ARRAY,
	resistArrayGet,
	type BuffArray,
	type BuffType,
	type EffectDuration,
	type ResistType,
	type SMTElement
} from '$lib/game/gameTypes';
import { SvelteMap } from 'svelte/reactivity';
import type { Side } from './index.svelte';
import { randomOutcome, withinBounds } from '../calculationUtils';
import { hasSkills } from '../type_guards';
import type { CompendiumPassiveSkill } from '../compendium/skill';
import _ from 'underscore';

export class Combatant {
	character: Character;
	side: Side;
	buffLevels: BuffArray = $state(NEUTRAL_BUFF_ARRAY);
	smirking: boolean = $state(false);
	concentrating: number | undefined = $state(undefined);
	pierces = new SvelteMap<SMTElement | 'all', EffectDuration>();
	tempResistMods = new SvelteMap<SMTElement, [ResistType, EffectDuration]>();
	tetrakarn = $state(false);
	makarakarn = $state(false);
	hasQuickCleanse = false;
	constructor(character: Character, side: Side) {
		this.character = $state(character);
		this.side = side;
		if (hasSkills(character.characterClass.data)) {
			character.characterClass.data.skills
				.filter((s) => s.kind == 'Passive')
				.forEach((s) => {
					if (s.skill.resistMod) {
						s.skill.resistMod.forEach(({ element, resist }) => {
							this.tempResistMods.set(element, [resist, 'Permanent']);
						});
					}
					if (s.skill.pierce) {
						if (s.skill.pierce == 'all') {
							this.pierces.set('all', 'Permanent');
						} else {
							s.skill.pierce.forEach((elem) => this.pierces.set(elem, 'Permanent'));
						}
					}
					if (s.skill.endure) {
						this.character.endurance.push(s.skill.endure);
					}
					if (s.skill.quickCleanse) {
						this.hasQuickCleanse = true;
					}
				});
			this.character.endurance.sort();
		}
	}

	handleEndTurn() {
		this.pierces.entries().forEach(([elem, duration]) => {
			if (duration != 'Permanent' && duration != 'NextAttack') {
				if (duration - 1 == 0) {
					this.pierces.delete(elem);
				} else {
					this.pierces.set(elem, duration - 1);
				}
			}
		});
		this.tempResistMods.entries().forEach(([elem, [resistType, duration]]) => {
			if (duration != 'Permanent' && duration != 'NextAttack') {
				if (duration - 1 == 0) {
					this.tempResistMods.delete(elem);
				} else {
					this.tempResistMods.set(elem, [resistType, duration - 1]);
				}
			}
		});
		this.character.currentAilments
			.entries()
			.filter(([ailment, _]) => ailmentExpires(ailment))
			.forEach(([ailment, rounds]) => {
				const cleanseChance = rounds * 33 + this.character.stats.luck / 2;
				const cleanses = this.hasQuickCleanse || randomOutcome(cleanseChance);
				if (cleanses) {
					this.character.removeAilment(ailment);
				}
			});
	}

	getResist(elem: SMTElement): ResistType {
		const tempResist = this.tempResistMods.get(elem)?.[0];
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
	removeBuffs() {
		this.buffLevels.attack = Math.min(0, this.buffLevels.attack);
		this.buffLevels.defence = Math.min(0, this.buffLevels.defence);
		this.buffLevels.accuracy = Math.min(0, this.buffLevels.accuracy);
		this.buffLevels.evasion = Math.min(0, this.buffLevels.evasion);
	}
	removeDebuffs() {
		this.buffLevels.attack = Math.max(0, this.buffLevels.attack);
		this.buffLevels.defence = Math.max(0, this.buffLevels.defence);
		this.buffLevels.accuracy = Math.max(0, this.buffLevels.accuracy);
		this.buffLevels.evasion = Math.max(0, this.buffLevels.evasion);
	}
	setTetrakarn(value: boolean) {
		this.tetrakarn = value;
	}
	setMakarakarn(value: boolean) {
		this.makarakarn = value;
	}
	setSmirk(value: boolean) {
		this.smirking = value;
	}
	setConcentrate(value: number | undefined) {
		this.concentrating = value;
	}
	setPierce(elements: SMTElement[] | 'all', duration: EffectDuration) {
		if (elements == 'all') {
			this.pierces.set('all', duration);
		} else {
			elements.forEach((element) => {
				this.pierces.set(element, duration);
			});
		}
	}
	modifyResists(
		elements: { element: SMTElement; resistType: ResistType; duration: EffectDuration }[]
	) {
		elements.forEach(({ element, resistType, duration }) => {
			this.tempResistMods.set(element, [resistType, duration]);
		});
	}
	//TODO: Implement these checks
	canSummon(): boolean {
		return true;
	}
	canUseItems(): boolean {
		return true;
	}
	getPassives(): CompendiumPassiveSkill[] {
		if (hasSkills(this.character.characterClass)) {
			return this.character.characterClass.skills
				.filter((s) => s.kind == 'Passive')
				.map((s) => s.skill);
		}
		return [];
	}

	rollCounter(damage: number, element: SMTElement): number | null {
		const counters: { chance: number; reflectPercent: number }[] = [];
		this.getPassives().forEach((s) => {
			if (s.counter && (s.counter.elements == 'all' || _.contains(s.counter.elements, element))) {
				counters.push(s.counter);
			}
		});
		counters.sort((a, b) => a.chance - b.chance);

		for (let idx = 0; idx < counters.length; idx++) {
			const counter = counters[idx];
			if (randomOutcome(counter.chance)) {
				return damage * (counter.reflectPercent / 100);
			}
		}
		return null;
	}
}

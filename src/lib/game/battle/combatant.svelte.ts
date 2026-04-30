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
	constructor(character: Character, side: Side) {
		this.character = $state(character);
		this.side = side;
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
				const cleanses = randomOutcome(cleanseChance);
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
}

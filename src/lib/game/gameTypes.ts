import _ from 'underscore';

export interface StatArray {
	hp: number;
	mp: number;
	strength: number;
	intelligence: number;
	vitality: number;
	magic: number;
	agility: number;
	luck: number;
}

export interface ResistArray {
	phys: ResistType;
	gun: ResistType;
	fire: ResistType;
	ice: ResistType;
	elec: ResistType;
	force: ResistType;
	light: ResistType;
	dark: ResistType;
	almighty: ResistType;
	recovery: ResistType;
	support: ResistType;
	bind: ResistType;
	charm: ResistType;
	daze: ResistType;
	mute: ResistType;
	panic: ResistType;
	poison: ResistType;
	sick: ResistType;
	sleep: ResistType;
}

//Used for temp resistance overrides, makes the ergonomics slightly nicer
//with an accessor at the cost of a bit of repetition
export interface NullableResistArray {
	phys: ResistType | null;
	gun: ResistType | null;
	fire: ResistType | null;
	ice: ResistType | null;
	elec: ResistType | null;
	force: ResistType | null;
	light: ResistType | null;
	dark: ResistType | null;
	almighty: ResistType | null;
	recovery: ResistType | null;
	support: ResistType | null;
	bind: ResistType | null;
	charm: ResistType | null;
	daze: ResistType | null;
	mute: ResistType | null;
	panic: ResistType | null;
	poison: ResistType | null;
	sick: ResistType | null;
	sleep: ResistType | null;
}
export const NULL_RESIST_ARRAY = {
	phys: null,
	gun: null,
	fire: null,
	ice: null,
	elec: null,
	force: null,
	light: null,
	dark: null,
	almighty: null,
	recovery: null,
	support: null,
	bind: null,
	charm: null,
	daze: null,
	mute: null,
	panic: null,
	poison: null,
	sick: null,
	sleep: null
};

export function resistArrayGet(resists: ResistArray, elem: SMTElement) {
	switch (elem) {
		case 'Phys':
			return resists.phys;
		case 'Gun':
			return resists.gun;
		case 'Fire':
			return resists.fire;
		case 'Ice':
			return resists.ice;
		case 'Elec':
			return resists.elec;
		case 'Force':
			return resists.force;
		case 'Light':
			return resists.light;
		case 'Dark':
			return resists.dark;
		case 'Almighty':
			return resists.almighty;
		case 'Recovery':
			return resists.recovery;
		case 'Support':
			return resists.support;
		case 'Bind':
			return resists.bind;
		case 'Charm':
			return resists.charm;
		case 'Daze':
			return resists.daze;
		case 'Mute':
			return resists.mute;
		case 'Panic':
			return resists.panic;
		case 'Poison':
			return resists.poison;
		case 'Sick':
			return resists.sick;
		case 'Sleep':
			return resists.sleep;
	}
}

export interface AffinityArray {
	phys: number;
	gun: number;
	fire: number;
	ice: number;
	elec: number;
	force: number;
	light: number;
	dark: number;
	ailment: number;
	recovery: number;
	support: number;
	almighty: number;
}

export type AffinityEffect =
	| 'EffectIncrease'
	| 'CostReduction'
	| 'CostIncrease'
	| 'EffectReduction';

export function getAffinityValue(affinities: AffinityArray, elem: SMTElement): number {
	switch (elem) {
		case 'Phys':
			return affinities.phys;
		case 'Gun':
			return affinities.gun;
		case 'Fire':
			return affinities.fire;
		case 'Ice':
			return affinities.ice;
		case 'Elec':
			return affinities.elec;
		case 'Force':
			return affinities.force;
		case 'Light':
			return affinities.light;
		case 'Dark':
			return affinities.dark;
		case 'Recovery':
			return affinities.recovery;
		case 'Support':
			return affinities.support;
		case 'Almighty':
			return affinities.almighty;
		default:
			return affinities.ailment;
	}
}

const OFFENSIVE_AFFINITY_EFFECTS: AffinityEffect[] = [
	'EffectReduction',
	'EffectIncrease',
	'CostReduction',
	'EffectIncrease',
	'EffectIncrease',
	'CostReduction',
	'EffectIncrease',
	'EffectIncrease',
	'EffectIncrease',
	'EffectIncrease'
];
const SUPPORT_AFFINITY_EFFECTS: AffinityEffect[] = [
	'CostIncrease',
	'CostReduction',
	'CostReduction',
	'CostReduction',
	'CostReduction',
	'CostReduction'
];
const RECOVERY_AFFINITY_EFFECTS: AffinityEffect[] = [
	'CostIncrease',
	'EffectIncrease',
	'CostReduction',
	'EffectIncrease',
	'EffectIncrease',
	'CostReduction'
];

export function getAffinityEffects(affinities: AffinityArray, elem: SMTElement): AffinityEffect[] {
	const affinity = getAffinityValue(affinities, elem);
	if (affinity == 0) {
		return [];
	}
	let effects: AffinityEffect[];
	switch (elementToElementType(elem)) {
		case 'Offensive':
		case 'Ailment':
			effects = OFFENSIVE_AFFINITY_EFFECTS;
			break;
		case 'Support':
			effects = SUPPORT_AFFINITY_EFFECTS;
			break;
		case 'Recovery':
			effects = RECOVERY_AFFINITY_EFFECTS;
			break;
	}
	if (affinity < 0) {
		return _.range(0, Math.abs(affinity) - 1).map((_) => effects[0]);
	} else {
		return effects.slice(1, Math.min(affinity + 1, effects.length));
	}
}

export function affinityEffectMult(effects: AffinityEffect[]): number {
	const increases = effects.filter((x) => x == 'EffectIncrease').length;
	const decreases = effects.filter((x) => x == 'EffectReduction').length;
	return 1 + 0.1 * (increases - decreases);
}

export interface BuffArray {
	attack: number;
	defence: number;
	accuracy: number;
	evasion: number;
}
export const NEUTRAL_BUFF_ARRAY = {
	attack: 0,
	defence: 0,
	accuracy: 0,
	evasion: 0
};

export type SMTElement =
	| 'Phys'
	| 'Gun'
	| 'Fire'
	| 'Ice'
	| 'Elec'
	| 'Force'
	| 'Light'
	| 'Dark'
	| 'Bind'
	| 'Charm'
	| 'Daze'
	| 'Mute'
	| 'Panic'
	| 'Poison'
	| 'Sick'
	| 'Sleep'
	| 'Almighty'
	| 'Recovery'
	| 'Support';

export type AilmentType =
	| 'Bind'
	| 'Charm'
	| 'Daze'
	| 'Mute'
	| 'Panic'
	| 'Poison'
	| 'Sick'
	| 'Sleep';

export type BuffType = 'Attack' | 'Defence' | 'Accuracy' | 'Evasion';

export type ResistType = 'Neutral' | 'Weak' | 'Strong' | 'Null' | 'Drain' | 'Reflect';

export type ElementType = 'Offensive' | 'Recovery' | 'Ailment' | 'Support';

export function elementToElementType(elem: SMTElement): ElementType {
	switch (elem) {
		case 'Phys':
		case 'Gun':
		case 'Fire':
		case 'Ice':
		case 'Elec':
		case 'Force':
		case 'Light':
		case 'Dark':
		case 'Almighty':
			return 'Offensive';
		case 'Bind':
		case 'Charm':
		case 'Daze':
		case 'Mute':
		case 'Panic':
		case 'Poison':
		case 'Sick':
		case 'Sleep':
			return 'Ailment';
		case 'Recovery':
			return 'Recovery';
		case 'Support':
			return 'Support';
	}
}

export type LevelSkillMap = { level: number; skill_id: string }[];

export type DemonRace = 'Foul';

export type CharacterType = 'Demon' | 'Summoner';

const BUFF_MULT = 0.25;
export function buffToBuffMult(
	attackerBuffs: BuffArray,
	defenderBuffs: BuffArray,
	buffType: BuffType
): number {
	let attackerBuff;
	let defenderBuff;
	switch (buffType) {
		case 'Attack':
		case 'Defence':
			attackerBuff = attackerBuffs.attack;
			defenderBuff = defenderBuffs.defence;
			break;
		case 'Accuracy':
		case 'Evasion':
			attackerBuff = attackerBuffs.accuracy;
			defenderBuff = defenderBuffs.evasion;
			break;
	}
	return 1 + (1 + attackerBuff * BUFF_MULT) - (1 + defenderBuff * BUFF_MULT);
}

//this'll need to be moved
//
//
//

export interface BasicAttackData {
	power: number;
	hits: number;
	accuracy: number;
	element: SMTElement;
	targeting: CompendiumTargeting;
}
export type BasicAttack =
	| { kind: 'SkillAttack'; skill_id: string }
	| { kind: 'BasicAttack'; data: BasicAttackData };

export type CompendiumTargeting =
	| 'OneAlly'
	| 'OneEnemy'
	| 'AllAllies'
	| 'AllEnemies'
	| 'RandomAllies'
	| 'RandomEnemies'
	| 'Self'
	| 'Everyone';

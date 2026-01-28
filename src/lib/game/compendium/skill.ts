import type {
	AilmentType,
	BuffType,
	CompendiumTargeting,
	ResistType,
	SMTElement
} from '$lib/game/gameTypes';
import type { CompendiumItem } from '$lib/game/compendium';

export type CompendiumSkill =
	| { kind: 'Attack'; skill: CompendiumAttackSkill }
	| { kind: 'Recovery'; skill: CompendiumRecoverySkill }
	| { kind: 'Ailment'; skill: CompendiumAilmentSkill }
	| { kind: 'Support'; skill: CompendiumSupportSkill }
	| { kind: 'Passive'; skill: CompendiumPassiveSkill }
	| { kind: 'special'; skill: CompendiumSpecialSkill };

export interface BaseCompendiumSkill extends CompendiumItem {
	mpCost: number;
	targeting: CompendiumTargeting;
	extraEffects: string[] | CompendiumSkill[];
}

export interface CompendiumAttackSkill extends BaseCompendiumSkill {
	element: SMTElement;
	power: number;
	hits: number;
	accuracy: number;
	critMod: number;
}

export interface CompendiumRecoverySkill extends BaseCompendiumSkill {
	healPercent: null | number;
	revives: null | number;
	ailmentsCleansed: null | AilmentType[];
}

export interface CompendiumSupportSkill extends BaseCompendiumSkill {
	dekaja: null | boolean;
	dekunda: null | boolean;
	buffMods: null | [BuffType, number][];
	concentrate: null | number;
	smileCharge: null | boolean;
	tetrakarn: null | boolean;
	makarakarn: null | boolean;
	doping: null | number;
	pierce: null | SMTElement[] | 'all';
	tetrabreak: null | boolean;
	makarabreak: null | boolean;
}

export interface CompendiumAilmentSkill extends BaseCompendiumSkill {
	ailmentType: AilmentType;
	accuracy: number;
}

export interface CompendiumPassiveSkill extends BaseCompendiumSkill {
	elementBoost: null | { element: SMTElement; boost: number };
	resistMod: null | { element: SMTElement; resist: ResistType }[];
	hpMod: null | number;
	mpMod: null | number;
	pierce: null | SMTElement[];
	xpBoost: null | number;
	victoryCry: null | boolean;
	endure: null | number;
	counter: null | { chance: number; reflectPercent: number };
}

export interface CompendiumSpecialSkill extends BaseCompendiumSkill {
	effect: SpecialEffect;
}
export type SpecialEffect = 'Trafuri' | 'Sabbatma' | 'Estoma';

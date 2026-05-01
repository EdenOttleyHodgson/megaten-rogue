import { Compendium } from '$lib/game/compendium';
import type { CompendiumCharacter } from '$lib/game/compendium/character';
import type { CompendiumSkill } from '$lib/game/compendium/skill';

const DEBUG_DEMON: CompendiumCharacter = {
	kind: 'Demon',
	data: {
		id: 'debug.demons.debugDemon',
		sprite: null,
		displayName: 'John Demon',
		race: 'Foul',
		baseLevel: 10,
		baseStats: {
			hp: 100,
			mp: 100,
			strength: 10,
			agility: 10,
			intelligence: 10,
			vitality: 10,
			magic: 10,
			luck: 10
		},
		baseResists: {
			phys: 'Weak',
			gun: 'Neutral',
			fire: 'Neutral',
			ice: 'Neutral',
			elec: 'Neutral',
			force: 'Neutral',
			light: 'Neutral',
			dark: 'Neutral',
			almighty: 'Neutral',
			recovery: 'Neutral',
			support: 'Neutral',
			paralyze: 'Neutral',
			bind: 'Neutral',
			charm: 'Neutral',
			daze: 'Neutral',
			mute: 'Neutral',
			panic: 'Neutral',
			poison: 'Neutral',
			sick: 'Neutral',
			sleep: 'Neutral'
		},
		baseAffinities: {
			phys: 0,
			gun: 0,
			fire: 0,
			ice: 0,
			elec: 0,
			force: 0,
			light: 0,
			dark: 0,
			almighty: 0,
			ailment: 0,
			recovery: 0,
			support: 0
		},
		basicAttack: {
			power: 100,
			accuracy: 100,
			hits: 1,
			element: 'Phys',
			targeting: 'OneEnemy'
		},
		skills: [
			{ level: 0, skill_id: 'debug.skills.debugFlames' },
			{ level: 0, skill_id: 'debug.skills.debugHeal' },
			{ level: 0, skill_id: 'debug.skills.debugAilment' },
			{ level: 0, skill_id: 'debug.skills.debugStrike' },
			{ level: 0, skill_id: 'debug.skills.debugSupport' },
			{ level: 0, skill_id: 'debug.skills.theSkillThatNormallyMisses' }
		]
	}
};

const DEBUG_STRIKE: CompendiumSkill = {
	kind: 'Attack',
	skill: {
		id: 'debug.skills.debugStrike',
		displayName: 'Debug Strike',
		element: 'Phys',
		mpCost: 10,
		targeting: 'AllEnemies',
		endsTurn: true,
		power: 100,
		hits: 2,
		accuracy: 80,
		critRate: 10
	}
};

const DEBUG_FLAMES: CompendiumSkill = {
	kind: 'Attack',
	skill: {
		id: 'debug.skills.debugFlames',
		displayName: 'Debug Flames',
		element: 'Fire',
		mpCost: 10,
		targeting: 'OneEnemy',
		endsTurn: true,
		//		extraEffects: [],

		power: 100,
		hits: 1,
		accuracy: 80,
		critRate: 10
	}
};
const DEBUG_HEAL: CompendiumSkill = {
	kind: 'Recovery',
	skill: {
		id: 'debug.skills.debugHeal',
		displayName: 'Debug Recovery',
		mpCost: 10,
		targeting: 'Self',
		healPercent: 20,
		revives: null,
		ailmentsCleansed: null,
		endsTurn: true,
		hits: 1
		//		extraEffects: []
	}
};
const DEBUG_AILMENT: CompendiumSkill = {
	kind: 'Ailment',
	skill: {
		id: 'debug.skills.debugAilment',
		displayName: 'Debug Ailment',
		mpCost: 10,
		targeting: 'OneEnemy',
		ailmentType: 'Poison',
		accuracy: 75,
		endsTurn: true,
		hits: 1
		//		extraEffects: []
	}
};

const DEBUG_SUPPORT: CompendiumSkill = {
	kind: 'Support',
	skill: {
		id: 'debug.skills.debugSupport',
		displayName: 'Debug Support',
		mpCost: 10,
		targeting: 'Everyone',
		endsTurn: true,
		hits: 1,
		buffMods: [
			['Attack', 3],
			['Evasion', 6]
		],
		dekaja: null,
		dekunda: null,
		concentrate: null,
		smileCharge: null,
		tetrakarn: null,
		makarakarn: null,
		doping: null,
		pierce: null,
		tetrabreak: null,
		makarabreak: null
	}
};
const THE_SKILL_THAT_NORMALLY_MISSES: CompendiumSkill = {
	kind: 'Attack',
	skill: {
		id: 'debug.skills.theSkillThatNormallyMisses',
		displayName: 'The Skill That Normally Misses',
		element: 'Phys',
		mpCost: 10,
		targeting: 'AllEnemies',
		endsTurn: true,
		power: 100,
		hits: 1,
		accuracy: 1,
		critRate: 10
	}
};
const DEBUG_SKILLS = [
	DEBUG_FLAMES,
	DEBUG_HEAL,
	DEBUG_AILMENT,
	DEBUG_STRIKE,
	DEBUG_SUPPORT,
	THE_SKILL_THAT_NORMALLY_MISSES
];

const DEBUG_CHARACTERS = [DEBUG_DEMON];

export function debugCompendium(): Compendium {
	if (!DebugCompendium) {
		DebugCompendium = new Compendium(DEBUG_CHARACTERS, DEBUG_SKILLS);
	}
	return DebugCompendium;
}

export let DebugCompendium: Compendium | null = null;

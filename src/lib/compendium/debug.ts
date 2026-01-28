import { Compendium } from '.';
import type { CompendiumDemon, CompendiumCharacter } from './character/character';
import type { CompendiumSkill } from './skill';

const DEBUG_DEMON: CompendiumCharacter = {
	kind: 'Demon',
	data: {
		id: 'debug.demons.debugDemon',
		displayName: 'John Demon',
		race: 'Foul',
		baseLevel: 10,
		baseStats: {
			hp: 100,
			mp: 100,
			strength: 10,
			agility: 10,
			dexterity: 10,
			magic: 10,
			luck: 10
		},
		baseResists: {
			phys: 'Neutral',
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
			{ level: 11, skill_id: 'debug.skills.debugHeal' },
			{ level: 11, skill_id: 'debug.skills.debugAilment' }
		]
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
		extraEffects: [],
		power: 100,
		hits: 1,
		accuracy: 80,
		critMod: 0
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
		extraEffects: []
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
		accuracy: 100,
		extraEffects: []
	}
};

const DEBUG_SKILLS = [DEBUG_FLAMES, DEBUG_HEAL, DEBUG_AILMENT];

const DEBUG_CHARACTERS = [DEBUG_DEMON];

export const DebugCompendium: Compendium = new Compendium(DEBUG_CHARACTERS, DEBUG_SKILLS);

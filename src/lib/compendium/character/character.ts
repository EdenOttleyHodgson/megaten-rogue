import type {
	AffinityArray,
	LevelSkillMap,
	ResistArray,
	StatArray,
	DemonRace,
	BasicAttackData
} from '$lib/gameTypes';
import type { CompendiumItem } from '..';

export type CompendiumCharacter = { kind: 'Demon'; data: CompendiumDemon };

export interface BaseCompendiumCharacter extends CompendiumItem {
	baseLevel: number;
	baseStats: StatArray;
	baseResists: ResistArray;
	baseAffinities: AffinityArray;
}

export interface CompendiumDemon extends BaseCompendiumCharacter {
	race: DemonRace;
	basicAttack: BasicAttackData;
	skills: LevelSkillMap;
}

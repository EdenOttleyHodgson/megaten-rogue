import type {
	AffinityArray,
	LevelSkillMap,
	ResistArray,
	StatArray,
	DemonRace,
	BasicAttackData
} from '$lib/game/gameTypes';
import type { CompendiumItem } from '$lib/game/compendium';

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

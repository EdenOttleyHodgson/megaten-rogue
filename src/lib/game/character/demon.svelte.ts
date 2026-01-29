import { getCompendium } from '../compendium';
import type { CompendiumDemon } from '../compendium/character';
import type { CompendiumSkill } from '../compendium/skill';
import type { BasicAttackData, DemonRace } from '../gameTypes';

export interface DemonClass {
	race: DemonRace;
	basicAttack: BasicAttackData;
	skills: CompendiumSkill[];
}
export function demonClassFromCompendium(level: number, demonData: CompendiumDemon): DemonClass {
	const compendium = getCompendium();
	const skills = demonData.skills
		.filter((x) => x.level <= level)
		.map((skill) => {
			const skillData = compendium.skills.get(skill.skill_id);
			if (!skillData) {
				throw new Error('Nonexistent skill');
			}
			return skillData;
		});
	return {
		race: demonData.race,
		basicAttack: demonData.basicAttack,
		skills
	};
}

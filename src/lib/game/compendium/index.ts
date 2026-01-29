import type { CompendiumCharacter } from '$lib/game/compendium/character';
import { debugCompendium, DebugCompendium } from '$lib/game/compendium/debug';
import type { CompendiumSkill } from '$lib/game/compendium/skill';

//A compendium item is a *template* which is then instanced in the actual game
export interface CompendiumItem {
	id: string;
	displayName: string;
}

export class Compendium {
	characters: Map<string, CompendiumCharacter> = new Map();
	skills: Map<string, CompendiumSkill> = new Map();
	constructor(characters: CompendiumCharacter[], skills: CompendiumSkill[]) {
		characters.forEach((char) => {
			this.characters.set(char.data.id, char);
		});
		skills.forEach((skill) => {
			this.skills.set(skill.skill.id, skill);
		});
	}
}

const compendium: Compendium | null = null;

export function getCompendium(): Compendium {
	if (compendium) {
		return compendium;
	} else {
		//init compendium
		return debugCompendium();
	}
}

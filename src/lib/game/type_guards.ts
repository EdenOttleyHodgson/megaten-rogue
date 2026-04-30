import type { CompendiumSkill } from './compendium/skill';
import type { CompendiumTargeting } from './gameTypes';

interface SkillClass {
	skills: CompendiumSkill[];
}

export function hasSkills(c: any): c is SkillClass {
	return (c as SkillClass).skills !== undefined;
}

interface TargetingObject {
	targeting: CompendiumTargeting;
}

export function hasTargeting(c: any): c is TargetingObject {
	return (c as TargetingObject).targeting !== undefined;
}

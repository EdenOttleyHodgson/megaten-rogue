import type { CompendiumSkill } from '$lib/game/compendium/skill';
import { actsFirst } from './calcualations';
import type { Combatant } from './combatant.svelte';
import type { Party } from './party.svelte';

export class BattleState {
	playerParty: Party;
	enemyParty: Party;
	currentSide: Side;
	currentPressTurns: number = $state(0);
	//Turn order is always first slot, SMTV style
	currentCombatantTurn: number = 0;
	constructor(playerParty: Party, enemyParty: Party) {
		this.playerParty = $state(playerParty);
		this.enemyParty = $state(enemyParty);
		//determine which side goes first;
		this.currentSide = $state(actsFirst(playerParty, enemyParty));

		//add press turns accordingly
		if (this.currentSide == 'Player') {
			this.currentPressTurns = playerParty.size();
		} else {
			this.currentPressTurns = enemyParty.size();
		}
	}

	damageTest() {
		this.playerParty.combatants[0].character.damage(1);
	}

	//Checks if skill can be used
	canUseSkill(user: Combatant, skill: CompendiumSkill): boolean {
		//TODO
		return true;
	}

	validSkillTargets(user: Combatant, skill: CompendiumSkill): Combatant[] {
		return [];
	}

	resolveSkill(user: Combatant, skill: CompendiumSkill, targets: Combatant[]): SkillUseResult {
		//TODO
		return {
			endsTurn: true,
			pressTurnImpact: 0
		};
	}
	//Take the result of an action and use it to modify the state of the battle.
	//All actions return an action result. This allows for skill resolution to abort if something errors.
	applyActionResult(result: ActionResult) {}
}

//TODO: This interface needs to be like bee put in the log - tbh there needs to be a whole interface
//hierarchy of results
//

export type ActionResult = '';
export interface BaseActionResult {
	endsTurn: boolean;
	pressTurnImpact: number;
}
export interface SkillUseResult extends BaseActionResult {}

export type Side = 'Player' | 'Enemy';

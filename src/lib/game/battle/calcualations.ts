import { meanOfArray, randomArbitrary, randomOutcome } from '$lib/game/calculationUtils';
import type { StatArray } from '$lib/game/gameTypes';
import { type Side } from '$lib/game/battle/index.svelte';
import type { Party } from '$lib/game/battle/party.svelte';
import { random } from 'underscore';

//Player acts first chance = 50 + (Mean(agility of all player combatants) - Mean(agility of all enemy combatants)) %
export function actsFirst(playerParty: Party, enemyParty: Party): Side {
	const agi = (s: StatArray) => s.agility;
	const playerAvgAgi = meanOfArray(playerParty.specificStats(agi));
	const enemyAvgAgi = meanOfArray(enemyParty.specificStats(agi));
	const agiDiff = playerAvgAgi - enemyAvgAgi;
	const playerFirstChance = 50 + agiDiff;
	return randomOutcome(playerFirstChance) ? 'Player' : 'Enemy';
}

export function calculateDamage(
	skillPower: number,
	attackerOffence: number,
	defenderDefence: number,
	affinityMult: number = 1,
	resistMult: number = 1,
	critMult: number = 1,
	concentrateMult: number = 1,
	buffMult: number = 1
) {
	return Math.round(
		((skillPower + attackerOffence) / 2) *
			critMult *
			affinityMult *
			buffMult *
			concentrateMult *
			resistMult *
			(1 - defenderDefence / 200) *
			randomArbitrary(0.95, 1.05)
	);
}

export function rollHit(
	skillAccuracy: number,
	attackerAgi: number,
	defenderAgi: number,
	buffMult: number
): boolean {
	const chance = skillAccuracy * (100 + (attackerAgi - defenderAgi) / 2 / 100) * buffMult;
	return randomOutcome(chance);
}

export function rollCrit(critRate: number, attackerLuck: number, defenderLuck: number): boolean {
	const chance = critRate * (1 + (attackerLuck - defenderLuck) / 50);
	return randomOutcome(chance);
}

export const CRIT_DAMAGE_MULT = 1.5;

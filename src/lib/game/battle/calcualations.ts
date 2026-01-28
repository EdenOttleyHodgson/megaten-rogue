import { meanOfArray, randomOutcome } from '$lib/game/calculationUtils';
import type { StatArray } from '$lib/game/gameTypes';
import { type Side } from '.';
import type { Party } from './party';

//Player acts first chance = 50 + (Mean(agility of all player combatants) - Mean(agility of all enemy combatants)) %
export function actsFirst(playerParty: Party, enemyParty: Party): Side {
	const agi = (s: StatArray) => s.agility;
	const playerAvgAgi = meanOfArray(playerParty.specificStats(agi));
	const enemyAvgAgi = meanOfArray(enemyParty.specificStats(agi));
	const agiDiff = playerAvgAgi - enemyAvgAgi;
	const playerFirstChance = 50 + agiDiff;
	return randomOutcome(playerFirstChance) ? 'Player' : 'Enemy';
}

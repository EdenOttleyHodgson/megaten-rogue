import type {
	CompendiumAilmentSkill,
	CompendiumAttackSkill,
	CompendiumRecoverySkill,
	CompendiumSkill,
	CompendiumSpecialSkill,
	CompendiumSupportSkill
} from '$lib/game/compendium/skill';
import {
	affinityEffectMult,
	buffToBuffMult,
	getAffinityEffects,
	type AilmentType,
	type BuffType,
	type ResistType
} from '../gameTypes';
import { actsFirst, calculateDamage, CRIT_DAMAGE_MULT, rollCrit, rollHit } from './calcualations';
import type { Combatant } from './combatant.svelte';
import type { Party } from './party.svelte';
import _, { partition } from 'underscore';

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

	resolveSkill(user: Combatant, skill: CompendiumSkill, targets: Combatant[]): ActionResult[] {
		//TODO
		const results = new Array<ActionResult>();
		// Dispatch based on skill type
		// handle extra effects
		switch (skill.kind) {
			case 'Attack':
				results.push(...this.resolveAttack(skill.skill, user, targets));
				break;
			case 'Ailment':
				results.push(...this.resolveAilment(skill.skill, targets));
				break;
			case 'Support':
				results.push(...this.resolveSupport(skill.skill, targets));
				break;
			case 'Passive':
				break;
			case 'Recovery':
				results.push(...this.resolveRecovery(skill.skill, targets));
				break;
			case 'special':
				results.push(...this.resolveSpecial(skill.skill, targets));
				break;
		}
		//Extra effects probably need special treatment to avoid double countering press turn mods etc;
		console.debug(results);
		return results;
	}

	private resolveAttack(
		skill: CompendiumAttackSkill,
		attacker: Combatant,
		targets: Combatant[]
	): ActionResult[] {
		let failPressTurnMod = 0;
		let critFlag = false;
		const results = new Array<ActionResult>();

		const physAttack: boolean = skill.element == 'Phys' || skill.element == 'Gun';

		const [hits, misses] = _.partition(targets, (target: Combatant) =>
			rollHit(
				skill.accuracy,
				attacker.character.stats.agility,
				target.character.stats.agility,
				buffToBuffMult(attacker.buffLevels, target.buffLevels, 'Accuracy')
			)
		);
		if (misses.length > 0) {
			failPressTurnMod = 4;
		}
		misses.forEach((miss) => results.push({ kind: 'SkillMissed', args: miss }));

		const pierces = _.contains(attacker.pierces, skill.element);

		const hitTargetsWithResists: [Combatant, ResistType][] = hits.map((target) => [
			target,
			target.getResist(skill.element)
		]);

		const attackerOffence = physAttack
			? attacker.character.stats.strength
			: attacker.character.stats.intelligence;
		const defenceAccessor = physAttack
			? (target: Combatant) => target.character.stats.vitality
			: (target: Combatant) => target.character.stats.magic;
		const calcBuffMult = (target: Combatant) =>
			buffToBuffMult(attacker.buffLevels, target.buffLevels, 'Attack');
		const affinityEffects = getAffinityEffects(attacker.character.affinities, skill.element);
		const affinityDamageMult = affinityEffectMult(affinityEffects);

		console.debug('hitTargetsWithResists', hitTargetsWithResists);
		let toProcess = hitTargetsWithResists;
		if (!pierces) {
			//Check reflections
			const [fails, successes] = _.partition(
				hitTargetsWithResists,
				([_, resistType]) =>
					resistType == 'Reflect' || resistType == 'Drain' || resistType == 'Null'
			);
			console.debug('fails', fails);

			fails.forEach(([target, res]) => {
				let damageRoll = calculateDamage(
					skill.power,
					attackerOffence,
					defenceAccessor(target),
					affinityDamageMult,
					1,
					1,
					calcBuffMult(target)
				);

				switch (res) {
					case 'Drain':
						failPressTurnMod = 8;
						results.push({ kind: 'DamageDrained', args: { target, arg: damageRoll } });
						results.push({ kind: 'HealingDone', args: { target, arg: damageRoll } });
						break;
					case 'Reflect':
						failPressTurnMod = 8;
						results.push({
							kind: 'DamageReflected',
							args: {
								reflector: [target.side, target],
								reciever: [attacker.side, attacker],
								amount: damageRoll
							}
						});
						results.push({
							kind: 'DamageDealt',
							args: { target, resistHit: 'Neutral', amount: damageRoll }
						});
						break;
					case 'Null':
						failPressTurnMod = Math.max(4, failPressTurnMod);
						results.push({ kind: 'DamageNulled', args: target });
						break;
				}
			});
			console.debug('successes', successes);
			toProcess = successes;
		}
		console.debug('toProcess:', toProcess);
		console.debug('Results', results);
		results.push(
			...toProcess.flatMap(([target, resistType]) => {
				const results = new Array<ActionResult>();
				let damageRoll;
				switch (resistType) {
					case 'Strong':
						damageRoll = calculateDamage(
							skill.power,
							attackerOffence,
							defenceAccessor(target),
							affinityDamageMult,
							0.5,
							undefined,
							attacker.concentrating,
							buffToBuffMult(attacker.buffLevels, target.buffLevels, 'Attack')
						);

						results.push({
							kind: 'DamageDealt',
							args: { target, resistHit: 'Strong', amount: damageRoll }
						});
						break;
					case 'Weak':
						damageRoll = calculateDamage(
							skill.power,
							attackerOffence,
							defenceAccessor(target),
							affinityDamageMult,
							1.5,
							undefined,
							attacker.concentrating,
							buffToBuffMult(attacker.buffLevels, target.buffLevels, 'Attack')
						);
						critFlag = true;

						results.push({ kind: 'WeaknessHit', args: target });
						results.push({
							kind: 'DamageDealt',
							args: { target, resistHit: 'Weak', amount: damageRoll }
						});

						break;
					case 'Neutral':
						const crit =
							attacker.smirking ||
							(physAttack &&
								rollCrit(
									skill.critRate,
									attacker.character.stats.luck,
									target.character.stats.luck
								));
						let critMod;
						if (crit) {
							results.push({ kind: 'Critical', args: target });
							critMod = CRIT_DAMAGE_MULT; //Whatever crit is
							critFlag = true;
						}
						damageRoll = calculateDamage(
							skill.power,
							attackerOffence,
							defenceAccessor(target),
							affinityDamageMult,
							1,
							critMod,
							attacker.concentrating,
							buffToBuffMult(attacker.buffLevels, target.buffLevels, 'Attack')
						);
						const resistHit = crit ? 'Crit' : 'Neutral';
						results.push({ kind: 'DamageDealt', args: { target, resistHit, amount: damageRoll } });
						break;

					default:
						throw new Error('Impossible resist');
				}
				return results;
			})
		);

		if (failPressTurnMod > 0) {
			results.push({ kind: 'PressTurnMod', amount: failPressTurnMod });
		} else if (critFlag) {
			results.push({ kind: 'PressTurnMod', amount: 1 });
		} else {
			results.push({ kind: 'PressTurnMod', amount: 2 });
		}
		//
		return results;
	}
	private resolveAilment(skill: CompendiumAilmentSkill, targets: Combatant[]): ActionResult[] {
		return [];
	}
	private resolveSupport(skill: CompendiumSupportSkill, targets: Combatant[]): ActionResult[] {
		return [];
	}
	private resolveRecovery(skill: CompendiumRecoverySkill, targets: Combatant[]): ActionResult[] {
		return [];
	}
	private resolveSpecial(skill: CompendiumSpecialSkill, targets: Combatant[]): ActionResult[] {
		return [];
	}
	//Take the result of an action and use it to modify the state of the battle.
	//All actions return an action result. This allows for skill resolution to abort if something errors.
	applyActionResult(result: ActionResult) {}

	private actionResultToMessage(result: ActionResult): string {
		return '';
	}
}

//TODO: This interface needs to be like bee put in the log - tbh there needs to be a whole interface
//hierarchy of results
//

//Type alias for a target, and an amount
type TargetResult<T> = { target: Combatant; arg: T };

export type ActionResult =
	| { kind: 'EndsTurn' }
	| { kind: 'PressTurnMod'; amount: number }
	| { kind: 'MPSpent'; args: TargetResult<number> }
	| { kind: 'SkillUsed'; args: TargetResult<string> }
	| {
			kind: 'DamageDealt';
			args: {
				target: Combatant;
				resistHit: 'Weak' | 'Neutral' | 'Strong' | 'Crit';
				amount: number;
			};
	  }
	| { kind: 'HealingDone'; args: TargetResult<number> }
	| { kind: 'Revived'; args: TargetResult<number> }
	| { kind: 'AilmentApplied'; args: TargetResult<AilmentType> }
	| { kind: 'AilmentCleansed'; args: TargetResult<AilmentType> }
	| { kind: 'BuffModified'; args: TargetResult<{ buff: BuffType; amount: number }> }
	| { kind: 'SkillMissed'; args: Combatant }
	| { kind: 'WeaknessHit'; args: Combatant }
	| { kind: 'Critical'; args: Combatant }
	| {
			kind: 'DamageReflected';
			args: { reflector: [Side, Combatant]; reciever: [Side, Combatant]; amount: number };
	  }
	| { kind: 'DamageDrained'; args: TargetResult<number> }
	| { kind: 'DamageNulled'; args: Combatant };

export type Side = 'Player' | 'Enemy';

type AttackResolveRes = 'Fail' | 'Neutral' | 'CritWeak';

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
	battleLog: ActionResult[] = $state([]);
	battleLogTexts = $derived(this.battleLog.map((x) => this.actionResultToMessage(x)));
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

	modifyTurns(amount: number) {
		this.currentPressTurns += amount;
		if (this.currentPressTurns <= 0) {
			this.sideSwitch();
		}
	}
	sideSwitch() {}

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

	resolveSkill(user: Combatant, skill: CompendiumSkill, targets: Combatant[]) {
		let results;

		try {
			results = [
				{ kind: 'SkillUsed', args: { target: user, arg: skill.skill.displayName } },
				...this.calculateSkillResult(user, skill, targets)
			];
		} catch (err) {
			console.error(err);
			return;
		}
		let endsTurn = false;
		results.forEach((result) => {
			if (result.kind == 'EndsTurn') {
				endsTurn = true;
			} else {
				this.applyActionResult(result);
			}
		});
		if (endsTurn) {
		}

		this.battleLog = [...this.battleLog, ...results.filter((x) => x)];
	}

	private calculateSkillResult(
		user: Combatant,
		skill: CompendiumSkill,
		targets: Combatant[]
	): ActionResult[] {
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

		let toProcess = hitTargetsWithResists;
		if (!pierces) {
			//Check reflections
			const [fails, successes] = _.partition(
				hitTargetsWithResists,
				([_, resistType]) =>
					resistType == 'Reflect' || resistType == 'Drain' || resistType == 'Null'
			);

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
								reflector: target,
								reciever: attacker,
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
			toProcess = successes;
		}
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
	applyActionResult(result: ActionResult) {
		switch (result.kind) {
			case 'SkillUsed':
			case 'WeaknessHit':
			case 'Critical':
			case 'SkillMissed':
			case 'DamageNulled':
				break;
			case 'DamageDealt':
				result.args.target.character.damage(result.args.amount);
				break;
			case 'DamageReflected':
				result.args.reciever.character.damage(result.args.amount);
				break;
			case 'DamageDrained':
			case 'HealingDone':
				result.args.target.character.heal(result.args.arg);
				break;
			case 'Revived':
				result.args.target.character.revive(result.args.arg);
				break;
			case 'AilmentApplied':
				result.args.target.character.addAilment(result.args.arg);
				break;
			case 'AilmentCleansed':
				result.args.target.character.removeAilment(result.args.arg);
				break;
			case 'MPSpent':
				result.args.target.character.modifyMp(-1 * result.args.arg);
				break;
			case 'EndsTurn':
				//handle later
				break;
			case 'PressTurnMod':
				this.modifyTurns(result.amount);
				break;
			case 'BuffModified':
				result.args.target.modifyBuff(result.args.arg.buff, result.args.arg.amount);
				break;
		}
	}

	private actionResultToMessage(result: ActionResult): string | null {
		switch (result.kind) {
			case 'SkillUsed':
				return `${result.args.target.character.displayName} used ${result.args.arg}!`;
			case 'WeaknessHit':
				return `${result.args.character.displayName} weakness hit!`;
			case 'Critical':
				return `${result.args.character.displayName} was critically hit!`;
			case 'SkillMissed':
				return `${result.args.character.displayName} missed!`;
			case 'DamageNulled':
				return `${result.args.character.displayName} nulled damage!`;
			case 'DamageDealt':
				return `${result.args.target.character.displayName} took ${result.args.amount} damage!`;
			case 'DamageReflected':
				return `${result.args.reflector.character.displayName} reflected ${result.args.amount} damage to ${result.args.reciever.character.displayName}`;
			case 'DamageDrained':
				return `${result.args.target.character.displayName} drained ${result.args.arg} damage!`;
			case 'HealingDone':
				return `${result.args.target.character.displayName} healed for ${result.args.arg} damage!`;
			case 'Revived':
				return `${result.args.target.character.displayName} was revived!`;
			case 'AilmentApplied':
				return `${result.args.target.character.displayName} was ${result.args.arg}`;
			case 'AilmentCleansed':
				return '';
		}
		return null;
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
			args: { reflector: Combatant; reciever: Combatant; amount: number };
	  }
	| { kind: 'DamageDrained'; args: TargetResult<number> }
	| { kind: 'DamageNulled'; args: Combatant };

export type Side = 'Player' | 'Enemy';

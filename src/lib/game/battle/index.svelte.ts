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
	type ResistType,
	type SMTElement
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
		let skillUsed: ActionResult = {
			kind: 'SkillUsed',
			args: { target: user, arg: skill.skill.displayName }
		};

		try {
			results = [skillUsed, ...this.calculateSkillResult(user, skill, targets)];
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
				results.push(...this.resolveAilment(skill.skill, user, targets));
				break;
			case 'Support':
				results.push(...this.resolveSupport(skill.skill, user, targets));
				break;
			case 'Passive':
				console.error("Can't use a passive!");
				break;
			case 'Recovery':
				results.push(...this.resolveRecovery(skill.skill, user, targets));
				break;
			case 'special':
				results.push(...this.resolveSpecial(skill.skill, user, targets));
				break;
		}
		//Extra effects probably need special treatment to avoid double counting press turn mods etc;
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

		//TODO: Get passive mods
		const damageMult = 1;
		const critMult = 1;
		const accuracyMult = 1;

		const [hits, misses] = _.partition(targets, (target: Combatant) =>
			rollHit(
				skill.accuracy * accuracyMult,
				attacker.character.stats.agility,
				target.character.stats.agility,
				buffToBuffMult(attacker.buffLevels, target.buffLevels, 'Accuracy')
			)
		);
		if (misses.length > 0) {
			failPressTurnMod = 4;
		}
		misses.forEach((miss) => results.push({ kind: 'SkillMissed', target: miss }));

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
				let damageRoll =
					calculateDamage(
						skill.power,
						attackerOffence,
						defenceAccessor(target),
						affinityDamageMult,
						1,
						1,
						calcBuffMult(target)
					) * damageMult;

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
						damageRoll =
							calculateDamage(
								skill.power,
								attackerOffence,
								defenceAccessor(target),
								affinityDamageMult,
								0.5,
								undefined,
								attacker.concentrating,
								buffToBuffMult(attacker.buffLevels, target.buffLevels, 'Attack')
							) * damageMult;

						results.push({
							kind: 'DamageDealt',
							args: { target, resistHit: 'Strong', amount: damageRoll }
						});
						break;
					case 'Weak':
						damageRoll =
							calculateDamage(
								skill.power,
								attackerOffence,
								defenceAccessor(target),
								affinityDamageMult,
								1.5,
								undefined,
								attacker.concentrating,
								buffToBuffMult(attacker.buffLevels, target.buffLevels, 'Attack')
							) * damageMult;
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
									skill.critRate * critMult,
									attacker.character.stats.luck,
									target.character.stats.luck
								));
						let critMod;
						if (crit) {
							results.push({ kind: 'Critical', args: target });
							critMod = CRIT_DAMAGE_MULT; //Whatever crit is
							critFlag = true;
						}
						damageRoll =
							calculateDamage(
								skill.power,
								attackerOffence,
								defenceAccessor(target),
								affinityDamageMult,
								1,
								critMod,
								attacker.concentrating,
								buffToBuffMult(attacker.buffLevels, target.buffLevels, 'Attack')
							) * damageMult;
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
	private resolveAilment(
		skill: CompendiumAilmentSkill,
		user: Combatant,
		targets: Combatant[]
	): ActionResult[] {
		const results = new Array<ActionResult>();
		let weakFlag = false;
		let failPressTurnMod = 0;
		//Check resists
		const withResists: [Combatant, ResistType][] = targets.map((x) => [
			x,
			x.getResist(skill.ailmentType)
		]);
		const [pierced, blocked] = _.partition(
			withResists,
			([_, resist]) => resist == 'Weak' || resist == 'Neutral' || resist == 'Strong'
		);
		if (blocked.length != 0) {
			failPressTurnMod = 4;
		}
		blocked.forEach(([target, _]) => {
			results.push({ kind: 'AilmentBlocked', target: target });
		});

		//TODO: Get passive mods
		const accuracyMult = 1;

		//Roll hits
		const [hits, misses] = _.partition(pierced, ([target, resist]) => {
			let accuracy = skill.accuracy * accuracyMult;
			if (resist == 'Weak') {
				accuracy = Math.floor(accuracy * 1.5);
			} else if (resist == 'Strong') {
				accuracy = Math.floor(accuracy * 0.5);
			}
			return rollHit(
				accuracy,
				user.character.stats.agility,
				target.character.stats.agility,
				buffToBuffMult(user.buffLevels, target.buffLevels, 'Accuracy')
			);
		});

		misses.forEach(([target, _]) => results.push({ kind: 'AilmentMissed', target }));
		hits.forEach(([target, _]) =>
			results.push({ kind: 'AilmentApplied', args: { arg: skill.ailmentType, target } })
		);
		//apply ailments
		if (failPressTurnMod > 0) {
			results.push({ kind: 'PressTurnMod', amount: failPressTurnMod });
		} else if (weakFlag) {
			results.push({ kind: 'PressTurnMod', amount: 1 });
		} else {
			results.push({ kind: 'PressTurnMod', amount: 2 });
		}

		return results;
	}
	private resolveSupport(
		skill: CompendiumSupportSkill,
		user: Combatant,
		targets: Combatant[]
	): ActionResult[] {
		const results = new Array<ActionResult>();

		if (skill.dekaja) {
		}
		if (skill.dekunda) {
		}
		if (skill.doping) {
		}
		if (skill.pierce) {
		}
		if (skill.buffMods) {
		}
		if (skill.tetrakarn) {
		}
		if (skill.makarakarn) {
		}
		if (skill.tetrabreak) {
		}
		if (skill.makarabreak) {
		}
		if (skill.concentrate) {
		}
		if (skill.smileCharge) {
		}

		return [];
	}
	private resolveRecovery(
		skill: CompendiumRecoverySkill,
		user: Combatant,
		targets: Combatant[]
	): ActionResult[] {
		return [];
	}
	private resolveSpecial(
		skill: CompendiumSpecialSkill,
		user: Combatant,
		targets: Combatant[]
	): ActionResult[] {
		return [];
	}
	//Take the result of an action and use it to modify the state of the battle.
	//All actions return an action result. This allows for skill resolution to abort if something errors.
	applyActionResult(result: ActionResult) {
		switch (result.kind) {
			case 'SkillUsed':
				break;
			case 'WeaknessHit':
			case 'SkillMissed':
			case 'Critical':
			//check for smirk
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
			case 'AilmentMissed':
			case 'SkillMissed':
				return `${result.target.character.displayName} dodged!`;
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
				return `${result.args.target.character.displayName} was cured of ${result.args.arg}`;
			case 'ResistanceChange':
				return `${result.target.character.displayName}'s resistances changed!`;
			case 'AilmentBlocked':
				return `${result.target.character.displayName} blocked the attack!`;
			case 'Dekaja':
				return `${result.target.character.displayName}'s buffs were dispelled!`;
			case 'Dekunda':
				return `${result.target.character.displayName}'s debuffs were dispelled!`;
			case 'Doping':
				return `${result.args.target.character.displayName}'s max health temporarily increased!`;
			case 'Tetrakarn':
				return `${result.target.character.displayName} gained a physical barrier!`;
			case 'Makarakarn':
				return `${result.target.character.displayName} gained a magical barrier!`;
			case 'Tetrabreak':
				return `${result.target.character.displayName}'s physical barrier was broken!`;
			case 'Makarabreak':
				return `${result.target.character.displayName}'s magical barrier was broken!`;
			case 'Concentrate':
				return `${result.target.character.displayName}'s next attack was empowered!`;
			case 'Smirk':
				return `${result.target.character.displayName} began smirking!`;
			case 'SmirkRemoved':
				return `${result.target.character.displayName} stopped smirking!`;
			case 'PierceCharge':
				return `${result.args.target.character.displayName}'s next attack will pierce!`;
			case 'BuffModified':
				let lastPart: string;
				if (result.args.arg.amount < 0) {
					lastPart = `was decreased ${Math.abs(result.args.arg.amount)} stages!`;
				} else {
					lastPart = `was increased ${Math.abs(result.args.arg.amount)} stages!`;
				}
				return `${result.args.target.character.displayName}'s ${result.args.arg.buff} ${lastPart}`;
			case 'MPSpent':
			case 'EndsTurn':
			case 'PressTurnMod':
				return null;
		}
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
	| { kind: 'AilmentBlocked'; target: Combatant }
	| { kind: 'AilmentMissed'; target: Combatant }
	| { kind: 'BuffModified'; args: TargetResult<{ buff: BuffType; amount: number }> }
	| { kind: 'SkillMissed'; target: Combatant }
	| { kind: 'WeaknessHit'; args: Combatant }
	| { kind: 'Critical'; args: Combatant }
	| {
			kind: 'DamageReflected';
			args: { reflector: Combatant; reciever: Combatant; amount: number };
	  }
	| { kind: 'DamageDrained'; args: TargetResult<number> }
	| { kind: 'DamageNulled'; args: Combatant }
	| { kind: 'Dekaja'; target: Combatant }
	| { kind: 'Dekunda'; target: Combatant }
	| { kind: 'Doping'; args: TargetResult<number> }
	| { kind: 'PierceCharge'; args: TargetResult<SMTElement> }
	| { kind: 'Tetrakarn'; target: Combatant }
	| { kind: 'Makarakarn'; target: Combatant }
	| { kind: 'Tetrabreak'; target: Combatant }
	| { kind: 'Makarabreak'; target: Combatant }
	| { kind: 'Concentrate'; target: Combatant }
	| { kind: 'ResistanceChange'; target: Combatant; resists: [SMTElement, ResistType][] }
	| { kind: 'Smirk'; target: Combatant }
	| { kind: 'SmirkRemoved'; target: Combatant };

export type Side = 'Player' | 'Enemy';

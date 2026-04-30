import type {
	CompendiumAilmentSkill,
	CompendiumAttackSkill,
	CompendiumRecoverySkill,
	CompendiumSkill,
	CompendiumSpecialSkill,
	CompendiumSupportSkill
} from '$lib/game/compendium/skill';
import { exhaustGuard } from '$lib/utils';
import { productOfArray } from '../calculationUtils';
import {
	affinityEffectMult,
	buffToBuffMult,
	getAffinityEffects,
	getBuff,
	type AilmentType,
	type BuffType,
	type CompendiumTargeting,
	type EffectDuration,
	type ResistType,
	type SMTElement
} from '../gameTypes';
import {
	actsFirst,
	calculateDamage,
	calculateHeal,
	CRIT_DAMAGE_MULT,
	rollAilmentCancel,
	rollCrit,
	rollHit
} from './calculations';
import type { Combatant } from './combatant.svelte';
import type { Party } from './party.svelte';
import _ from 'underscore';

export class BattleState {
	playerParty: Party;
	enemyParty: Party;
	currentSide: Side;
	currentPressTurns: number = $state(0);
	battleLog: ActionResult[] = $state([]);
	battleLogTexts = $derived(this.battleLog.map((x) => this.actionResultToMessage(x)));
	//Turn order is always first slot, SMTV style
	currentCombatantTurn: number = $state(0);
	currentCombatant: Combatant = $derived.by(
		() => this.currentParty().combatants[this.currentCombatantTurn]
	);
	constructor(playerParty: Party, enemyParty: Party) {
		this.playerParty = $state(playerParty);
		this.enemyParty = $state(enemyParty);
		//determine which side goes first;
		this.currentSide = $state(actsFirst(playerParty, enemyParty));

		//add press turns accordingly
		if (this.currentSide == 'Player') {
			this.currentPressTurns = playerParty.size() * 2;
		} else {
			this.currentPressTurns = enemyParty.size() * 2;
		}
	}

	reduceTurns(amount: number) {
		this.currentPressTurns -= amount;
	}
	sideSwitch() {
		const newSide = flipSide(this.currentSide);
		const nextParty = newSide == 'Enemy' ? this.enemyParty : this.playerParty;
		this.currentCombatantTurn = 0;
		this.currentPressTurns = nextParty.size() * 2;
		this.currentSide = newSide;
		this.battleLog = [...this.battleLog, { kind: 'SideSwitch', newSide }];
	}

	getCombatantsParty(c: Combatant): Party {
		return this.getPartyForSide(c.side);
	}
	getPartyForSide(s: Side): Party {
		return s == 'Player' ? this.playerParty : this.enemyParty;
	}

	currentParty() {
		return this.currentSide == 'Player' ? this.playerParty : this.enemyParty;
	}

	damageTest() {
		this.playerParty.combatants[0].character.damage(1);
	}

	//Checks if skill can be used
	canUseSkill(user: Combatant, skill: CompendiumSkill): boolean {
		return (
			user.character.currentMp >= skill.skill.mpCost && !user.character.currentAilments.has('Mute')
		);
	}

	validSkillTargets(user: Combatant, skill: CompendiumSkill): Combatant[] | 'All' {
		let validFunction: (v: Combatant) => boolean = (v) => !v.character.dead;
		if (skill.kind == 'Recovery') {
			if (skill.skill.revives && skill.skill.healPercent) {
				validFunction = (_) => true;
			} else if (skill.skill.revives) {
				validFunction = (v) => v.character.dead;
			}
		}

		switch (skill.skill.targeting) {
			case 'Self':
				return validFunction(user) ? [user] : [];
			case 'OneAlly':
				return this.getPartyForSide(user.side).combatants.filter(validFunction);
			case 'OneEnemy':
				return this.getPartyForSide(flipSide(user.side)).combatants.filter(validFunction);
			case 'AllAllies':
			case 'AllEnemies':
			case 'RandomAllies':
			case 'RandomEnemies':
			case 'Everyone':
				return 'All';
		}
	}

	//beforeAction(user: Combatant): boolean {}

	afterAction(endsTurn: boolean) {
		const sideSwitch = this.currentPressTurns <= 0;
		if (sideSwitch || endsTurn) {
			this.currentCombatant.handleEndTurn();
			if (this.currentCombatant.character.currentAilments.has('Poison')) {
				this.applyActionResult({
					kind: 'DamageDealt',
					args: {
						target: this.currentCombatant,
						resistHit: 'Neutral',
						amount: this.currentCombatant.character.stats.hp / 10
					}
				});
			}
		}
		if (endsTurn && !sideSwitch) {
			if (this.currentParty().size() != 0) {
				do {
					this.currentCombatantTurn = (this.currentCombatantTurn + 1) % this.currentParty().size();
					if (this.currentCombatant.character.currentAilments.has('Sleep')) {
						this.applyActionResult({ kind: 'Sleeping', victim: this.currentCombatant });
						this.applyActionResult({ kind: 'PressTurnMod', amount: 2 });
					}
				} while (
					this.currentCombatant.character.dead &&
					this.currentCombatant.character.currentAilments.has('Sleep')
				);
			}
		}
		if (sideSwitch) {
			this.sideSwitch();
		}
	}

	resolveSkill(user: Combatant, skill: CompendiumSkill, targets: Combatant[]) {
		let results;

		const ailmentCancel = rollAilmentCancel(
			new Set(user.character.currentAilments.keys()),
			user.character.stats.luck
		);
		if (ailmentCancel) {
			results = this.resolveAilmentCancel(user, ailmentCancel);
		} else {
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
		}
		results.forEach((result) => {
			this.applyActionResult(result);
		});

		this.afterAction(skill.skill.endsTurn);
	}

	private calculateSkillResult(
		user: Combatant,
		skill: CompendiumSkill,
		targets: Combatant[]
	): ActionResult[] {
		const results = new Array<ActionResult>();
		//TODO: random target allocation
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

	private resolveAilmentCancel(
		user: Combatant,
		ailment: 'Paralyze' | 'Panic' | 'Charm'
	): ActionResult[] {
		switch (ailment) {
			case 'Charm':
				//Basically choose a random offensive skill against an ally or a random support skill against an enemy
				return [{ kind: 'Charmed', victim: user }];
			case 'Paralyze':
				return [{ kind: 'Paralyzed', victim: user }];
			case 'Panic':
				//TODO: actually implement these
				//Options: random skill - discard money - return to stock/flee // nuthin
				return [{ kind: 'Panicked', victim: user }];

			default:
				exhaustGuard(ailment);
		}
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

		const passives = attacker.getPassives();
		const damageMult =
			productOfArray(
				passives
					.filter(
						(passive) => passive.elementBoost && passive.elementBoost.element == skill.element
					)
					.map((s) => s.elementBoost?.boost || 1)
			) * (attacker.character.currentAilments.has('Sick') ? 0.25 : 1);
		const critMult = productOfArray(passives.map((s) => s.critBoost || 1));
		const accuracyMult = productOfArray(passives.map((s) => s.accuracyBoost || 1));
		const ailmentAccuracyMult = attacker.character.currentAilments.has('Daze') ? 0.25 : 1;

		const [hits, misses] = _.partition(targets, (target: Combatant) =>
			rollHit(
				skill.accuracy * accuracyMult * ailmentAccuracyMult,
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
						const counterRoll = target.rollCounter(damageRoll, skill.element);
						if (counterRoll) {
							results.push({
								kind: 'CounterDamage',
								args: { target: attacker, counterer: target }
							});
							results.push({
								kind: 'DamageDealt',
								args: { target: attacker, resistHit: 'Neutral', amount: counterRoll }
							});
						}
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

		const passives = user.getPassives();
		const accuracyMult = productOfArray(
			passives.map((s) => {
				let accBoost = s.accuracyBoost || 1;
				if (s.elementBoost && s.elementBoost.element == skill.ailmentType) {
					accBoost *= s.elementBoost.boost;
				}
				return accBoost;
			})
		);
		const passiveAilmentResist = productOfArray(
			passives
				.filter((s) => s.ailmentResist && s.ailmentResist.element == skill.ailmentType)
				.map((s) => (100 - (s.ailmentResist?.value || 0)) / 100)
		);

		//Roll hits
		const [hits, misses] = _.partition(pierced, ([target, resist]) => {
			let accuracy = skill.accuracy * accuracyMult * passiveAilmentResist;
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
		targets.forEach((target) => {
			if (skill.dekaja) {
				results.push({ kind: 'Dekaja', target });
			}
			if (skill.dekunda) {
				results.push({ kind: 'Dekunda', target });
			}
			if (skill.pierce) {
				results.push({
					kind: 'PierceCharge',
					target,
					elements: skill.pierce.elements,
					duration: skill.pierce.duration
				});
			}
			if (skill.buffMods) {
				skill.buffMods.forEach(([buff, amount]) => {
					results.push({ kind: 'BuffModified', args: { target, arg: { buff, amount } } });
				});
			}
			if (skill.tetrakarn) {
				results.push({ kind: 'Tetrakarn', target });
			}
			if (skill.makarakarn) {
				results.push({ kind: 'Makarakarn', target });
			}
			if (skill.tetrabreak) {
				results.push({ kind: 'Tetrabreak', target });
			}
			if (skill.makarabreak) {
				results.push({ kind: 'Makarabreak', target });
			}
			if (skill.concentrate) {
				results.push({ kind: 'Concentrate', args: { target, arg: skill.concentrate } });
			}
			if (skill.smileCharge) {
				results.push({ kind: 'Smirk', target });
			}
		});

		return results;
	}
	private resolveRecovery(
		skill: CompendiumRecoverySkill,
		user: Combatant,
		targets: Combatant[]
	): ActionResult[] {
		const results: ActionResult[] = [];
		targets.forEach((target) => {
			if (skill.revives) {
				results.push({ kind: 'Revived', args: { target, arg: skill.revives } });
			}
			if (skill.healPercent) {
				results.push({
					kind: 'HealingDone',
					args: {
						target,
						arg: calculateHeal(
							skill.healPercent,
							user.character.stats.magic,
							target.character.stats.hp
						)
					}
				});
			}
			if (skill.ailmentsCleansed) {
				skill.ailmentsCleansed.forEach((ailment) => {
					results.push({ kind: 'AilmentCleansed', args: { target, arg: ailment } });
				});
			}
		});
		return results;
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
			case 'SideSwitch':
			case 'AilmentMissed':
			case 'Panicked':
			case 'Sleeping':
			case 'Paralyzed':
			case 'Charmed':
			case 'BuffLimitReached':
			case 'CounterDamage':
				break;
			case 'AilmentBlocked':
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
				this.reduceTurns(result.amount);
				break;
			case 'BuffModified':
				result.args.target.modifyBuff(result.args.arg.buff, result.args.arg.amount);
				break;
			case 'Dekaja':
				result.target.removeBuffs();
				break;

			case 'Dekunda':
				result.target.removeDebuffs();
				break;
			case 'Tetrakarn':
				result.target.setTetrakarn(true);
				break;
			case 'Makarakarn':
				result.target.setMakarakarn(true);
				break;
			case 'Tetrabreak':
				result.target.setTetrakarn(false);
				break;
			case 'Makarabreak':
				result.target.setMakarakarn(false);
				break;
			case 'ResistanceChange':
				result.target.modifyResists(result.resists);
				break;
			case 'Smirk':
				result.target.setSmirk(true);
				break;
			case 'SmirkRemoved':
				result.target.setSmirk(false);
				break;
			case 'Concentrate':
				result.args.target.setConcentrate(result.args.arg);
				break;
			case 'PierceCharge':
				result.target.setPierce(result.elements, result.duration);
				break;
			default:
				exhaustGuard(result);
		}
		this.battleLog = [...this.battleLog, result];
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
			case 'CounterDamage':
				return `${result.args.target.character.displayName}'s attack was countered by ${result.args.counterer.character.displayName}!`;
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
			case 'Tetrakarn':
				return `${result.target.character.displayName} gained a physical barrier!`;
			case 'Makarakarn':
				return `${result.target.character.displayName} gained a magical barrier!`;
			case 'Tetrabreak':
				return `${result.target.character.displayName}'s physical barrier was broken!`;
			case 'Makarabreak':
				return `${result.target.character.displayName}'s magical barrier was broken!`;
			case 'Concentrate':
				return `${result.args.target.character.displayName}'s next attack was empowered!`;
			case 'Smirk':
				return `${result.target.character.displayName} began smirking!`;
			case 'SmirkRemoved':
				return `${result.target.character.displayName} stopped smirking!`;
			case 'PierceCharge':
				return `${result.target.character.displayName}'s next attack will pierce!`;
			case 'BuffModified':
				let lastPart: string;
				if (result.args.arg.amount < 0) {
					lastPart = `was decreased ${Math.abs(result.args.arg.amount)} stages!`;
				} else {
					lastPart = `was increased ${Math.abs(result.args.arg.amount)} stages!`;
				}
				return `${result.args.target.character.displayName}'s ${result.args.arg.buff} ${lastPart}`;
			case 'BuffLimitReached':
				const direction =
					getBuff(result.target.buffLevels, result.buffType) < 0 ? 'decreased' : 'increased';
				return `${result.target.character.displayName}'s ${result.buffType} cannot be ${direction} further!`;
			case 'SideSwitch':
				return `${result.newSide} Turn!`;
			case 'Charmed':
				return `${result.victim} is charmed!`;
			case 'Paralyzed':
				return `${result.victim} cannot move!`;
			case 'Sleeping':
				return `${result.victim} is asleep!`;
			case 'Panicked':
				return `${result.victim} is panicking!`;
			case 'MPSpent':
			case 'EndsTurn':
			case 'PressTurnMod':
				return null;
		}
	}

	resolveTargets(targeting: CompendiumTargeting, target: Combatant | null): Combatant[] {
		switch (targeting) {
			case 'Self':
				return [this.currentCombatant];
			case 'OneAlly':
			case 'OneEnemy':
				if (target) {
					return [target];
				} else {
					throw Error('No target given to resolve targets when it is needed');
				}
			case 'AllAllies':
				[...this.playerParty.combatants];
			case 'AllEnemies':
				[...this.enemyParty.combatants];
			case 'RandomAllies':
				throw Error('This needs a rethink');
			case 'RandomEnemies':
				throw Error('This needs a rethink');
			case 'Everyone':
				return [...this.playerParty.combatants, ...this.enemyParty.combatants];

			default:
				exhaustGuard(targeting);
		}
	}
}

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
	| { kind: 'CounterDamage'; args: { target: Combatant; counterer: Combatant } }
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
	| {
			kind: 'PierceCharge';
			target: Combatant;
			elements: SMTElement[] | 'all';
			duration: EffectDuration;
	  }
	| { kind: 'Tetrakarn'; target: Combatant }
	| { kind: 'Makarakarn'; target: Combatant }
	| { kind: 'Tetrabreak'; target: Combatant }
	| { kind: 'Makarabreak'; target: Combatant }
	| { kind: 'Concentrate'; args: TargetResult<number> }
	| {
			kind: 'ResistanceChange';
			target: Combatant;
			resists: { element: SMTElement; resistType: ResistType; duration: EffectDuration }[];
	  }
	| { kind: 'Smirk'; target: Combatant }
	| { kind: 'SmirkRemoved'; target: Combatant }
	| { kind: 'SideSwitch'; newSide: Side }
	| { kind: 'Panicked'; victim: Combatant }
	| { kind: 'Charmed'; victim: Combatant }
	| { kind: 'Sleeping'; victim: Combatant }
	| { kind: 'Paralyzed'; victim: Combatant }
	| { kind: 'BuffLimitReached'; target: Combatant; buffType: BuffType };

export type Side = 'Player' | 'Enemy';
function flipSide(side: Side) {
	return side == 'Player' ? 'Enemy' : 'Player';
}

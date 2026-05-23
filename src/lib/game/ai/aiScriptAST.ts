import type { Side } from '../battle/index.svelte';
import type { ResistType, SMTElement } from '../gameTypes';

export interface CombatAI {
	id: string;
	choiceBrackets: AIChoiceBracket[];
}

type AIChoiceBracket = { weighting: number; choice: AIChoice }[];

export interface AIChoice {
	condition: AIConditionExpr | true;
	actionSequence: AIAction[];
}

export type AIAction =
	| { kind: 'BasicAttack'; targeting: AIActionTargeting }
	| { kind: 'Skill'; skillID: string; targeting: AIActionTargeting }
	| { kind: 'Random' }
	| { kind: 'RandomSkill' };

export type AIActionTargeting =
	| null
	| AIConditionExpr
	| { side: Side; id: number }
	| AIActionTargetingLiterals;
export type AIActionTargetingLiterals = 'LowestHP' | 'HighestHP' | 'LowestLevel' | 'HighestLevel';

export type AIConditionExpr =
	| { kind: 'Term'; terminal: AIConditionTerminal }
	| { kind: 'And'; lExpr: AIConditionExpr; rExpr: AIConditionExpr }
	| { kind: 'Or'; lExpr: AIConditionExpr; rExpr: AIConditionExpr }
	| { kind: 'Not'; expr: AIConditionExpr }
	| { kind: 'Equal'; lExpr: AIConditionExpr; rExpr: AIConditionExpr }
	| { kind: 'Not Equal'; lExpr: AIConditionExpr; rExpr: AIConditionExpr }
	| { kind: 'Greater Than'; lExpr: AIConditionExpr; rExpr: AIConditionExpr }
	| { kind: 'Less Than'; lExpr: AIConditionExpr; rExpr: AIConditionExpr }
	| { kind: 'Divisible By'; lExpr: AIConditionExpr; rExpr: AIConditionExpr };

export type AIConditionTerminal =
	| { kind: 'Literal'; literal: AIConditionLiteral }
	| { kind: 'TargetProperty'; target: AITarget; property: AIConditionTargetProperty };

export type AITarget = { kind: 'Party'; side: Side } | { kind: 'Any'; side: Side };

export type AIConditionLiteral =
	| { kind: 'Resistance'; value: ResistType }
	| { kind: 'Element'; value: SMTElement }
	| { kind: 'Percentage'; value: number }
	| { kind: 'Number'; value: number }
	| { kind: 'Boolean'; value: boolean }
	| { kind: 'TurnCount' };

export type AIConditionTargetProperty =
	| { kind: 'HP' }
	| { kind: 'MP' }
	| { kind: 'Attack' }
	| { kind: 'Defence' }
	| { kind: 'Evasion' }
	| { kind: 'Accuracy' }
	| { kind: 'Smirking' }
	| { kind: 'Resistance'; element: SMTElement };

/**
 *  core.debug.scratchAI={
 *  	[
 *  		2:{(Enemy.Hp < 100) => {BASIC_ATTACK ON RANDOM_WHERE(Enemy.HP < 100); core.debug.skill.debugFlames ON Combatant[1]}}
 *  		1:{() => {core.debug.skill.debugFlames on RANDOM}}
 *  	];
 *  	[];
 *
 *  };
 *
 */

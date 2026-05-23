import type { CombatAI } from './aiScriptAST';

export const DEBUG_AI: CombatAI = {
	id: 'core.debug.ai.defaultAI',
	choiceBrackets: [
		[
			{
				weighting: 1,
				choice: {
					condition: {
						kind: 'Divisible By',
						lExpr: {
							kind: 'Term',
							terminal: { kind: 'Literal', literal: { kind: 'TurnCount' } }
						},
						rExpr: {
							kind: 'Term',
							terminal: { kind: 'Literal', literal: { kind: 'Number', value: 2 } }
						}
					},
					actionSequence: [
						{ kind: 'Skill', skillID: 'core.debug.skills.debugSupport', targeting: null },
						{ kind: 'Random' }
					]
				}
			}
		],
		[
			{
				weighting: 2,
				choice: {
					condition: true,
					actionSequence: [{ kind: 'BasicAttack', targeting: 'LowestHP' }]
				}
			},
			{
				weighting: 1,
				choice: {
					condition: true,
					actionSequence: [
						{ kind: 'Skill', skillID: 'core.debug.skills.debugFlames', targeting: 'HighestHP' }
					]
				}
			},
			{
				weighting: 1,
				choice: {
					condition: true,
					actionSequence: [
						{ kind: 'Skill', skillID: 'core.debug.skills.debugAilment', targeting: null }
					]
				}
			}
		]
	]
};

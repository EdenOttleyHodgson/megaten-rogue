import type { CombatAI } from './aiScriptAST';

export const DEFAULT_AI: CombatAI = {
	id: 'core.ai.defaultAI',
	choiceBrackets: [
		[
			{
				weighting: 1,
				choice: {
					condition: true,
					actionSequence: [{ kind: 'Random' }]
				}
			}
		]
	]
};

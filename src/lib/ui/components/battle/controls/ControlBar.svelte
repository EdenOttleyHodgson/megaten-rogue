<script lang="ts">
	import type { Combatant } from '$lib/game/battle/combatant.svelte';
	import type { BattleState } from '$lib/game/battle/index.svelte';
	import type { CompendiumItem } from '$lib/game/compendium';
	import type { CompendiumSkill } from '$lib/game/compendium/skill';
	import { hasTargeting } from '$lib/game/type_guards';
	import ConfirmationBar from './ConfirmationBar.svelte';
	import MainBar from './MainBar.svelte';
	import SkillsBar from './SkillsBar.svelte';

	type ControlBarState = 'Main' | 'Skills' | 'Items' | 'Talk' | 'Summon';

	let currentState: ControlBarState = $state('Main');

	//This type needs to be expanded with items and talks and stuff
	//let selected: CompendiumSkill | null = $state(null);
	//const targeting = hasTargeting(selectedSkill) ? selectedSkill.targeting : null

	let {
		currentCombatant,
		selectedTarget,
		clearSelection,
		onSkillUse
	}: {
		currentCombatant: Combatant;
		selectedTarget: Combatant | null;
		clearSelection: () => void;
		onSkillUse: (s: CompendiumSkill, t: Combatant | null) => void;
	} = $props();
</script>

<div>
	{#if currentState == 'Main'}
		<MainBar
			onSkillsClicked={() => (currentState = 'Skills')}
			onEscapeClicked={() => {}}
			onTalkClicked={() => {}}
			onSummonClicked={() => (currentState = 'Summon')}
			onItemsClicked={() => (currentState = 'Items')}
			showItems={currentCombatant.canUseItems()}
			showSummon={currentCombatant.canSummon()}
		/>
	{:else if currentState == 'Skills'}
		<SkillsBar
			combatant={currentCombatant}
			onSkillUse={(s, t) => {
				onSkillUse(s, t);
				currentState = 'Main';
			}}
			onCancel={() => (currentState = 'Main')}
			{selectedTarget}
		/>
	{:else if currentState == 'Items'}{:else if currentState == 'Talk'}{:else if currentState == 'Summon'}{/if}
</div>

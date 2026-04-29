<script lang="ts">
	import type { Combatant } from '$lib/game/battle/combatant.svelte';
	import type { CompendiumSkill } from '$lib/game/compendium/skill';
	import { hasSkills } from '$lib/game/type_guards';
	import ConfirmationBar from './ConfirmationBar.svelte';
	import SkillSelector from './SkillSelector.svelte';

	let {
		combatant,
		selectedTarget,
		onCancel,
		onSkillUse
	}: {
		combatant: Combatant;
		selectedTarget: Combatant | null;
		onCancel: () => void;
		onSkillUse: (s: CompendiumSkill, target: Combatant | null) => void;
	} = $props();
	const skills = (() => {
		if (hasSkills(combatant.character.characterClass.data)) {
			return combatant.character.characterClass.data.skills;
		}
		return [];
	})();
	let selectedSkill: CompendiumSkill | null = $state(null);
</script>

<div>
	{#if selectedSkill}
		<ConfirmationBar
			onConfirm={() => {
				selectedSkill && onSkillUse(selectedSkill, selectedTarget);
				selectedSkill = null;
			}}
			onCancel={() => (selectedSkill = null)}
			targeting={selectedSkill.skill.targeting}
			{selectedTarget}
			displayName={selectedSkill.skill.displayName}
		/>
	{:else}
		{#each skills as skill}
			<SkillSelector onClick={() => (selectedSkill = skill)} {skill} />
		{/each}
		<button onclick={onCancel}>Cancel</button>
	{/if}
</div>

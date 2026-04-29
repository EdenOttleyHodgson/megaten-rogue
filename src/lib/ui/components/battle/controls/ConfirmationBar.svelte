<script lang="ts">
	import type { Combatant } from '$lib/game/battle/combatant.svelte';
	import type { CompendiumTargeting } from '$lib/game/gameTypes';

	let {
		onConfirm,
		onCancel,
		targeting,
		selectedTarget,
		displayName
	}: {
		onConfirm: () => void;
		onCancel: () => void;
		targeting: CompendiumTargeting | null;
		selectedTarget: Combatant | null;
		displayName: string;
	} = $props();
</script>

<div class="flex">
	{#if (targeting !== 'OneEnemy' && targeting !== 'OneAlly') || selectedTarget}
		<p>Using {displayName} on {selectedTarget?.character.displayName}</p>
		<button onclick={onConfirm}>Confirm</button>
	{:else}
		<p>Select a target</p>
	{/if}
	<button onclick={onCancel}>Cancel</button>
</div>

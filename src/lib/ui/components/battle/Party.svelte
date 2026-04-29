<script lang="ts">
	import type { Combatant } from '$lib/game/battle/combatant.svelte';
	import type { Party } from '$lib/game/battle/party.svelte';
	import CombatantComponent from './Combatant.svelte';

	let { party, onCombatantClick }: { party: Party; onCombatantClick: (c: Combatant) => void } =
		$props();
</script>

<div class="flex w-full flex-col">
	{#each party.combatants as combatant}
		<CombatantComponent {combatant} {onCombatantClick}></CombatantComponent>
	{/each}
</div>

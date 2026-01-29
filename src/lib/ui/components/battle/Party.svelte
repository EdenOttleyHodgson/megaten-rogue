<script lang="ts">
	import type { Party } from '$lib/game/battle/party.svelte';
	import Combatant from './Combatant.svelte';

	let { party }: { party: Party } = $props();
</script>

<div class="flex w-full flex-row">
	{#each party.combatants as combatant}
		<Combatant {combatant}></Combatant>
	{/each}
</div>

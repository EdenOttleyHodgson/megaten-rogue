<script lang="ts">
	import type { Combatant } from '$lib/game/battle/combatant.svelte';
	let { combatant }: { combatant: Combatant } = $props();
</script>

<div class="w-full border">
	<div>
		<!-- enhanced:img src={'./sprites/' + combatant.character.sprite}></enhanced:img -->
	</div>
	<div>
		<h3>{combatant.character.displayName}</h3>
		<div>
			{#if combatant.character.dead}
				<p>DEAD</p>
			{:else}
				<p>HP: {combatant.character.currentHp}/{combatant.character.stats.hp}</p>
				<!-- else content here -->
			{/if}

			<p>MP: {combatant.character.currentMp}/{combatant.character.stats.mp}</p>
		</div>
		<ul>
			{#each combatant.character.currentAilments as ailment}
				<!--TODO: convert to icons later -->
				<li>{ailment}</li>
				<!-- content here -->
			{/each}
		</ul>
	</div>
</div>

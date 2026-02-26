<script lang="ts">
	import type { ActionResult, BattleState } from '$lib/game/battle/index.svelte';
	import { getCompendium } from '$lib/game/compendium';
	import Party from './Party.svelte';

	let { battle }: { battle: BattleState } = $props();
	let test = $state(new Array<ActionResult>());
	const debugFlames = getCompendium().skills.get('debug.skills.debugFlames');
</script>

<div>
	<div class="flex w-full justify-evenly">
		<!-- top -->
		<div class="w-1/5">
			<Party party={battle.playerParty}></Party>
		</div>
		<div class="overflow-scroll">
			{#each battle.battleLogTexts as text}
				<p>{text}</p>
			{/each}
		</div>
		<div class="w-1/5">
			<Party party={battle.enemyParty}></Party>
		</div>
	</div>
	<div class="flex flex-col">
		<button onclick={() => battle.damageTest()}>Damage Test</button>
		{#if debugFlames}
			<button
				onclick={() =>
					battle.resolveSkill(battle.playerParty.combatants[0], debugFlames, [
						battle.enemyParty.combatants[0]
					])}>Debug Flames Test</button
			>

			<button
				onclick={() =>
					console.log(
						battle.resolveSkill(battle.playerParty.combatants[0], debugFlames, [
							battle.enemyParty.combatants[0]
						])
					)}
			>
				button
			</button>
			<!-- content here -->
		{/if}
		<button onclick={() => console.log($state.snapshot(test))}>Log Test</button>
		<div></div>
		<!-- bottom -->
	</div>
</div>

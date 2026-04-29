<script lang="ts">
	import type { Combatant } from '$lib/game/battle/combatant.svelte';
	import type { ActionResult, BattleState } from '$lib/game/battle/index.svelte';
	import { getCompendium } from '$lib/game/compendium';
	import ControlBar from './controls/ControlBar.svelte';
	import Party from './Party.svelte';

	let { battle }: { battle: BattleState } = $props();
	let test = $state(new Array<ActionResult>());
	const debugFlames = getCompendium().skills.get('debug.skills.debugFlames');
	const debugPoison = getCompendium().skills.get('debug.skills.debugAilment');
	const debugHeal = getCompendium().skills.get('debug.skills.debugHeal');
	let selectedTarget: Combatant | null = $state(null);

	const onCombatantClick = (c: Combatant) => (selectedTarget = c);
</script>

<div>
	<div class="w-full text-center">
		<p>Current Press Turns: {battle.currentPressTurns}</p>
		<p>Current Combatant: {battle.currentCombatant.character.displayName}</p>
	</div>
	<div class="flex w-full justify-evenly">
		<!-- top -->
		<div class="w-1/5">
			<Party party={battle.playerParty} {onCombatantClick}></Party>
		</div>
		<div class="flex flex-col overflow-scroll">
			{#each battle.battleLogTexts as text}
				<p>{text}</p>
			{/each}
		</div>
		<div class="w-1/5">
			<Party party={battle.enemyParty} {onCombatantClick}></Party>
		</div>
	</div>
	<div class="flex flex-col">
		<button class="border" onclick={() => battle.damageTest()}>Damage Test</button>
		{#if debugFlames}
			<button
				class="border"
				onclick={() =>
					battle.resolveSkill(battle.playerParty.combatants[0], debugFlames, [
						battle.enemyParty.combatants[0]
					])}>Debug Flames Test</button
			>

			<button
				class="border"
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
		{#if debugPoison}
			<button
				class="border"
				onclick={() => {
					battle.resolveSkill(battle.playerParty.combatants[0], debugPoison, [
						battle.enemyParty.combatants[0]
					]);
				}}
			>
				Debug Poison Test
			</button>
		{/if}
		{#if debugHeal}
			<button
				class="border-1"
				onclick={() => {
					battle.resolveSkill(battle.playerParty.combatants[0], debugHeal, [
						battle.enemyParty.combatants[0]
					]);
				}}>Debug Heal Test</button
			>
		{/if}

		<button onclick={() => console.log($state.snapshot(test))}>Log Test</button>
		<div>
			<ControlBar
				onSkillUse={(skill, target) => {
					const targets = battle.resolveTargets(skill.skill.targeting, target);
					battle.resolveSkill(battle.currentCombatant, skill, targets);
					selectedTarget = null;
				}}
				currentCombatant={battle.currentCombatant}
				{selectedTarget}
				clearSelection={() => (selectedTarget = null)}
			></ControlBar>
		</div>
		<!-- bottom -->
	</div>
</div>

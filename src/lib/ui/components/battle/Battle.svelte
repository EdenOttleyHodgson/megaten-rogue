<script lang="ts">
	import type { BattleState } from '$lib/game/battle/index.svelte';
	import Party from './Party.svelte';

	let { battle }: { battle: BattleState } = $props();
</script>

<div>
	<div class="flex w-full justify-evenly">
		<!-- top -->
		<div class="w-1/5">
			<Party party={battle.playerParty}></Party>
		</div>
		<div>log</div>
		<div class="w-1/5">
			<Party party={battle.enemyParty}></Party>
		</div>
	</div>
	<div>
		<button onclick={() => battle.damageTest()}>Damage Test</button>
		<!-- bottom -->
	</div>
</div>

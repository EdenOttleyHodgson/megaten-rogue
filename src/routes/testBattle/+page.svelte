<script lang="ts">
	import { Combatant } from '$lib/game/battle/combatant.svelte';
	import { BattleState } from '$lib/game/battle/index.svelte';
	import { Party } from '$lib/game/battle/party.svelte';
	import { Character } from '$lib/game/character/index.svelte';
	import Battle from '$lib/ui/components/battle/Battle.svelte';
	let friendlyJohnDemon = $state(new Character('debug.demons.debugDemon'));
	let friendlyJohnDemon2 = $state(new Character('debug.demons.debugDemon'));
	let friendlyJohnDemon3 = $state(new Character('debug.demons.debugDemon'));
	friendlyJohnDemon.displayName = 'friendlyJohnDemon1';
	friendlyJohnDemon2.displayName = 'friendlyJohnDemon2';
	friendlyJohnDemon3.displayName = 'friendlyJohnDemon3';

	let enemyJohnDemon = $state(new Character('debug.demons.debugDemon'));
	let enemyJohnDemon2 = $state(new Character('debug.demons.debugDemon'));
	let enemyJohnDemon3 = $state(new Character('debug.demons.debugDemon'));
	enemyJohnDemon.displayName = 'enemyJohnDemon';
	enemyJohnDemon2.displayName = 'enemyJohnDemon2';
	enemyJohnDemon3.displayName = 'enemyJohnDemon3';
	let playerParty = $state(
		new Party([
			new Combatant(friendlyJohnDemon, 'Player'),
			new Combatant(friendlyJohnDemon2, 'Player'),
			new Combatant(friendlyJohnDemon3, 'Player')
		])
	);
	let enemyParty = $state(
		new Party([
			new Combatant(enemyJohnDemon, 'Enemy'),
			new Combatant(enemyJohnDemon2, 'Enemy'),
			new Combatant(enemyJohnDemon3, 'Enemy')
		])
	);
	let battle = $state(new BattleState(playerParty, enemyParty));
</script>

<Battle {battle}></Battle>

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
	enemyJohnDemon.displayName = 'enemyJohnDemon';
	let playerParty = $state(
		new Party([
			new Combatant(friendlyJohnDemon, 'Player'),
			new Combatant(friendlyJohnDemon2, 'Player'),
			new Combatant(friendlyJohnDemon3, 'Player')
		])
	);
	let enemyParty = $state(new Party([new Combatant(enemyJohnDemon, 'Enemy')]));
	let battle = $state(new BattleState(playerParty, enemyParty));
</script>

<Battle {battle}></Battle>

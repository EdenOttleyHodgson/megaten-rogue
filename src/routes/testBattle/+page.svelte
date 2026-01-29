<script lang="ts">
	import { Combatant } from '$lib/game/battle/combatant.svelte';
	import { BattleState } from '$lib/game/battle/index.svelte';
	import { Party } from '$lib/game/battle/party.svelte';
	import { Character } from '$lib/game/character/index.svelte';
	import Battle from '$lib/ui/components/battle/Battle.svelte';
	let friendlyJohnDemon = $state(new Character('debug.demons.debugDemon'));
	let enemyJohnDemon = $state(new Character('debug.demons.debugDemon'));
	let playerParty = $state(new Party([new Combatant(friendlyJohnDemon)]));
	let enemyParty = $state(new Party([new Combatant(enemyJohnDemon)]));
	let battle = $state(new BattleState(playerParty, enemyParty));
</script>

<Battle {battle}></Battle>

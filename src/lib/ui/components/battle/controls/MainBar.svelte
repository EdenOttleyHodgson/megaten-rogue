<script lang="ts">
	let {
		showSummon,
		showItems,
		onSkillsClicked,
		onSummonClicked,
		onItemsClicked,
		onTalkClicked,
		onEscapeClicked
	}: {
		showSummon: boolean;
		showItems: boolean;
		onSkillsClicked: () => void;
		onItemsClicked: () => void;
		onSummonClicked: () => void;
		onTalkClicked: () => void;
		onEscapeClicked: () => void;
	} = $props();
</script>

<div class="flex p-2">
	<button onclick={onSkillsClicked}>Skills</button>
	{#if showItems}
		<button onclick={onItemsClicked}>Items</button>
	{/if}
	{#if showSummon}
		<button onclick={onSummonClicked}>Summon</button>
	{/if}
	<button onclick={onTalkClicked}>Talk</button>
	<button onclick={onEscapeClicked}>Escape</button>
</div>

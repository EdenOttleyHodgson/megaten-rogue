<script lang="ts">
	import type { CompendiumSkill } from '$lib/game/compendium/skill';

	let { skill, onClick }: { skill: CompendiumSkill; onClick: (s: CompendiumSkill) => void } =
		$props();
</script>

<div
	class="flex border-2"
	onclick={() => onClick(skill)}
	onkeydown={() => onClick(skill)}
	tabindex="0"
	role="button"
>
	<!-- element icon -->
	<p>{skill.skill.displayName}</p>
	<p>{skill.skill.mpCost} MP</p>
</div>

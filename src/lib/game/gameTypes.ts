export interface StatArray {
	hp: number;
	mp: number;
	strength: number;
	dexterity: number;
	magic: number;
	agility: number;
	luck: number;
}

export interface ResistArray {
	phys: ResistType;
	gun: ResistType;
	fire: ResistType;
	ice: ResistType;
	elec: ResistType;
	force: ResistType;
	light: ResistType;
	dark: ResistType;
	almighty: ResistType;
	recovery: ResistType;
	support: ResistType;
	bind: ResistType;
	charm: ResistType;
	daze: ResistType;
	mute: ResistType;
	panic: ResistType;
	poison: ResistType;
	sick: ResistType;
	sleep: ResistType;
}

export interface AffinityArray {
	phys: number;
	gun: number;
	fire: number;
	ice: number;
	elec: number;
	force: number;
	light: number;
	dark: number;
	ailment: number;
	recovery: number;
	support: number;
	almighty: number;
}

export interface BuffArray {
	attack: number;
	defence: number;
	accuracy: number;
	evasion: number;
}
export const NEUTRAL_BUFF_ARRAY = {
	attack: 0,
	defence: 0,
	accuracy: 0,
	evasion: 0
};

export type SMTElement =
	| 'Phys'
	| 'Gun'
	| 'Fire'
	| 'Ice'
	| 'Elec'
	| 'Force'
	| 'Light'
	| 'Dark'
	| 'Ailment'
	| 'Almighty'
	| 'Recovery'
	| 'Support';

export type AilmentType =
	| 'Bind'
	| 'Charm'
	| 'Daze'
	| 'Mute'
	| 'Panic'
	| 'Poison'
	| 'Sick'
	| 'Sleep';

export type BuffType = 'Attack' | 'Defence' | 'Accuracy' | 'Evasion';

export type ResistType = 'Neutral' | 'Weak' | 'Strong' | 'Null' | 'Absorb' | 'Reflect';

export type LevelSkillMap = { level: number; skill_id: string }[];

export type DemonRace = 'Foul';

export type CharacterType = 'Demon' | 'Summoner';

//this'll need to be moved
//
//
//

export interface BasicAttackData {
	power: number;
	hits: number;
	accuracy: number;
	element: SMTElement;
	targeting: CompendiumTargeting;
}
export type BasicAttack =
	| { kind: 'SkillAttack'; skill_id: string }
	| { kind: 'BasicAttack'; data: BasicAttackData };

export type CompendiumTargeting =
	| 'OneAlly'
	| 'OneEnemy'
	| 'AllAllies'
	| 'AllEnemies'
	| 'RandomAllies'
	| 'RandomEnemies'
	| 'Self'
	| 'Everyone';

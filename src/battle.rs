#![allow(dead_code)]
use std::{
    fmt::Debug,
    ops::{Deref, Mul},
};

use leptos::*;
// type BoxVec<T> = Vec<Box<T>>;
// type CombatantVec = Vec<Combatant>;

#[derive(Debug, Clone)]
pub struct BattleState {
    player_party: Vec<Combatant>,
    enemy_party: Vec<Combatant>,
}
impl BattleState {}

#[derive(Debug, Clone)]
struct Combatant {
    combatant_data: CombatantData,
    combatant_type: CombatantType,
}

// impl Clone for Box<dyn Combatant> {
//     fn clone(&self) -> Self {
//         self.clone_box()
//     }
// }
//
// trait Combatant: CombatantClone {
//     fn get_data(&self) -> CombatantType;
//     fn get_type(&self) -> CombatantData;
// }
// trait CombatantClone: Debug {
//     fn clone_box(&self) -> Box<dyn Combatant>;
// }
// impl<T> CombatantClone for T
// where
//     T: 'static + Combatant + Clone + Sized,
// {
//     fn clone_box(&self) -> Box<dyn Combatant> {
//         Box::new(self.clone())
//     }
// }

#[derive(Debug, Clone)]
enum CombatantType {
    Summoner(SummonerData),
    Demon,
    AvatarTuner,
}

#[derive(Debug, Clone)]
struct CombatantData {
    current_hp: usize,
    current_mp: usize,
    buffs: BuffArray,
    current_statuses: Vec<StatusEffect>,
    dead: bool,
    smirking: bool,
}
struct SummonerData {}

#[derive(Debug, Clone)]
struct BuffArray {
    phys_attack: BuffLevel,
    magic_attack: BuffLevel,
    defence: BuffLevel,
    agility: BuffLevel,
}
#[derive(Debug, Clone)]
enum BuffLevel {
    MinusThree,
    MinusTwo,
    MinusOne,
    Zero,
    PlusOne,
    PlusTwo,
    PlusThree,
}

impl Mul<usize> for BuffLevel {
    type Output = usize;

    fn mul(self, rhs: usize) -> Self::Output {
        let out = match self {
            BuffLevel::MinusThree => rhs as f32 * 0.25,
            BuffLevel::MinusTwo => rhs as f32 * 0.5,
            BuffLevel::MinusOne => rhs as f32 * 0.75,
            BuffLevel::Zero => rhs as f32 * 1.0,
            BuffLevel::PlusOne => rhs as f32 * 1.33,
            BuffLevel::PlusTwo => rhs as f32 * 1.66,
            BuffLevel::PlusThree => rhs as f32 * 2.0,
        };
        out.trunc() as usize
    }
}

#[derive(Debug, Clone)]
struct StatArray {
    max_hp: usize,
    max_mp: usize,
    strength: usize,
    vitality: usize,
    magic: usize,
    agility: usize,
    luck: usize,
}
#[derive(Debug, Clone)]
struct ResistArray {
    phys: ResistType,
    gun: ResistType,
    fire: ResistType,
    ice: ResistType,
    elec: ResistType,
    force: ResistType,
    wind: ResistType,
    earth: ResistType,
    light: ResistType,
    dark: ResistType,
    mind: ResistType,
    panic: ResistType,
    poison: ResistType,
    sick: ResistType,
    sleep: ResistType,
}
#[derive(Debug, Clone)]
enum ResistType {
    Weak,
    Neutral,
    Resist(usize),
    Void,
    Drain,
    Reflect,
}
#[derive(Debug, Clone)]
enum SMTElement {
    Phys,
    Gun,
    Fire,
    Ice,
    Elec,
    Force,
    Wind,
    Earth,
    Light,
    Dark,
}
#[derive(Debug, Clone)]
enum StatusEffect {
    Sleep,
    Mirage,
    Poison,
    Confusion,
    Charm,
    Seal,
    Custom,
}
#[derive(Debug, Clone)]
enum MoveType {
    Attack(AttackData),
    Status(StatusData),
    Healing(HealingData),
    Support(SupportData),
    Passive(PassiveData),
    Special(SpecialData),
}
#[derive(Debug, Clone)]
struct Skill {
    name: String,
    mp_cost: usize,
    move_type: MoveType,
    suicides: bool,
}
#[derive(Debug, Clone)]
struct AttackData {
    element: SMTElement,
    power: usize,
    targeting: Targeting,
    accuracy: usize,
    additional_effects: Vec<MoveType>,
}
#[derive(Debug, Clone)]
struct StatusData {
    status_type: StatusEffect,
    accuracy: usize,
    targeting: Targeting,
    additional_effects: Vec<MoveType>,
}
#[derive(Debug, Clone)]
struct HealingData {
    heal_power: usize,
    cleanses: Vec<StatusEffect>,
    revival_power: Option<usize>,
}
#[derive(Debug, Clone)]
struct SupportData {
    charge_power: Option<usize>,
    concentrate_power: Option<usize>,
    cleanse_buffs: bool,
    cleanse_debuffs: bool,
    attack_modifier: Option<isize>,
    defense_modifier: Option<isize>,
    agility_modifier: Option<isize>,
    targeting: Targeting,
    phys_repel: bool,
    magic_repel: bool,
    element_block: Vec<SMTElement>,
    smirks: bool,
    cleanses_smirk: bool,
}
#[derive(Debug, Clone)]
struct PassiveData {
    hp_post_battle_restore: Option<usize>,
    mp_post_battle_restore: Option<usize>,
    hp_bonus: Option<usize>,
    mp_bonus: Option<usize>,
    element_boost: Option<(SMTElement, usize)>,
    heal_boost: Option<usize>,
    counter: Option<CounterData>,
    xp_boost: Option<usize>,
    elem_resists: Option<Vec<ElemResist>>,
    status_reists: Option<Vec<StatusResist>>,
}
#[derive(Debug, Clone)]
struct CounterData {
    power: usize,
    proc_chance: usize,
}
#[derive(Debug, Clone)]
struct ElemResist {
    element: SMTElement,
    resist_type: ResistType,
}
#[derive(Debug, Clone)]
struct StatusResist {
    status: StatusEffect,
    resist_type: ResistType,
}

#[derive(Debug, Clone)]
enum Targeting {
    Caster,
    OneEnemy,
    AllEnemies,
    RandomEnemies,
    OneAlly,
    AllAllies,
    RandomAllies,
}

/// Evil enum for specifying things i am going to hard code.
#[derive(Debug, Clone)]
enum SpecialData {
    Sabbatma,
    Trafuri,
    Estoma,
}

// :c add to as needed ig
enum AdditionalEffects {}
#[component]
pub fn Battle(
    read_state: ReadSignal<BattleState>,
    write_state: WriteSignal<BattleState>,
    #[prop(into)] on_battle_end: Callback<()>,
) -> impl IntoView {
}

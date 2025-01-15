#![allow(dead_code)]
use lazy_static::lazy_static;

use std::{
    collections::HashMap,
    fmt::Debug,
    ops::{Deref, Mul},
};

use bon::{bon, vec};

lazy_static! {
    static ref DEBUG_COMBATANT: Combatant = {
        Combatant::new(
            None,
            CombatantType::DebugGuy(DebugGuyData::default()),
            StaticCombatantInfo::debug_guy_info("Debugman Jones".to_owned()),
        )
    };
    static ref DEBUG_SKILLS: HashMap<String, Skill> = {
        let debug_fire_spell: (String, Skill) = {
            let attack_data =
                AttackData::new(SMTElement::Fire, 100, Targeting::OneEnemy, 100, vec![]);
            (
                "DEBUG_FIRE".to_owned(),
                Skill::new(
                    "DEBUG-FIRE".to_owned(),
                    10,
                    MoveType::Attack(attack_data),
                    false,
                    "yeoooowch!".to_owned(),
                ),
            )
        };
        let debug_heal_spell: (String, Skill) = {
            let heal_data = HealingData::new(100, vec![], None);
            (
                "DEBUG_HEAL".to_owned(),
                Skill::new(
                    "DEBUG_HEAL".to_owned(),
                    10,
                    MoveType::Healing(heal_data),
                    false,
                    "no more ouchie".to_owned(),
                ),
            )
        };
        let debug_status_spell: (String, Skill) = {
            let status_data =
                StatusData::new(StatusEffect::Sleep, 100, Targeting::OneEnemy, vec![]);
            (
                "DEBUG_STATUS".to_owned(),
                Skill::new(
                    "DEBUG_STATUS".to_owned(),
                    10,
                    MoveType::Status(status_data),
                    false,
                    "zzzz".to_owned(),
                ),
            )
        };

        vec![debug_fire_spell, debug_heal_spell, debug_status_spell]
            .into_iter()
            .collect::<HashMap<String, Skill>>()
    };
}

#[derive(Debug, Clone)]
pub struct BattleState {
    player_party: HashMap<usize, Combatant>,
    enemy_party: HashMap<usize, (Combatant, EnemyAI)>,
    current_actor_id: usize,
    current_side: Side,
    press_turns: usize,
}
impl BattleState {
    pub fn debug_battle() -> Self {
        let player = DEBUG_COMBATANT.clone();
        let enemy = DEBUG_COMBATANT.clone();
        Self {
            player_party: vec![(1, player)].into_iter().collect(),
            enemy_party: vec![(2, (enemy, EnemyAI))].into_iter().collect(),
            current_actor_id: 1,
            current_side: Side::Player,
            press_turns: 4,
        }
    }
}

#[derive(Debug, Clone)]
enum Side {
    Player,
    Enemy,
}

#[derive(Debug, Clone)]
struct Combatant {
    image_path: Option<String>,
    combatant_data: CombatantData,
    combatant_type: CombatantType,
    static_info: StaticCombatantInfo,
}

impl Combatant {
    fn new(
        image_path: Option<String>,
        combatant_type: CombatantType,
        static_info: StaticCombatantInfo,
    ) -> Self {
        Self {
            image_path,
            combatant_data: CombatantData::from(static_info.clone()),
            combatant_type,
            static_info,
        }
    }
}

#[derive(Debug, Clone)]
enum CombatantType {
    Summoner(SummonerData),
    Demon,
    AvatarTuner,
    DebugGuy(DebugGuyData),
}

#[derive(Debug, Clone)]
struct DebugGuyData {
    basic_attack: AttackData,
    skills: Vec<Skill>,
}

impl Default for DebugGuyData {
    fn default() -> Self {
        Self {
            basic_attack: AttackData {
                element: SMTElement::Phys,
                power: 50,
                targeting: Targeting::OneEnemy,
                accuracy: 80,
                additional_effects: vec![],
            },
            skills: DEBUG_SKILLS.clone().into_iter().map(|(_, s)| s).collect(),
        }
    }
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

impl CombatantData {
    fn new(current_hp: usize, current_mp: usize) -> Self {
        Self {
            current_hp,
            current_mp,
            buffs: BuffArray::default(),
            current_statuses: Vec::new(),
            dead: false,
            smirking: false,
        }
    }
}
impl From<StaticCombatantInfo> for CombatantData {
    fn from(value: StaticCombatantInfo) -> Self {
        CombatantData::new(value.stats.max_hp, value.stats.max_mp)
    }
}
#[derive(Debug, Clone)]
struct SummonerData {}

#[derive(Debug, Clone, Default)]
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
impl Default for BuffLevel {
    fn default() -> Self {
        Self::Zero
    }
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
struct StaticCombatantInfo {
    name: String,
    stats: StatArray,
    resists: ResistArray,
}

impl StaticCombatantInfo {
    fn debug_guy_info(name: String) -> Self {
        Self {
            name,
            stats: StatArray::default(),
            resists: ResistArray::default(),
        }
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
impl Default for StatArray {
    fn default() -> Self {
        StatArray {
            max_hp: 100,
            max_mp: 100,
            strength: 50,
            vitality: 50,
            magic: 50,
            agility: 50,
            luck: 50,
        }
    }
}
#[derive(Debug, Clone, Default)]
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
impl Default for ResistType {
    fn default() -> Self {
        Self::Neutral
    }
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
    description: String,
}

impl Skill {
    fn new(
        name: String,
        mp_cost: usize,
        move_type: MoveType,
        suicides: bool,
        description: String,
    ) -> Self {
        Self {
            name,
            mp_cost,
            move_type,
            suicides,
            description,
        }
    }
}
#[derive(Debug, Clone)]
struct AttackData {
    element: SMTElement,
    power: usize,
    targeting: Targeting,
    accuracy: usize,
    additional_effects: Vec<MoveType>,
}

impl AttackData {
    fn new(
        element: SMTElement,
        power: usize,
        targeting: Targeting,
        accuracy: usize,
        additional_effects: Vec<MoveType>,
    ) -> Self {
        Self {
            element,
            power,
            targeting,
            accuracy,
            additional_effects,
        }
    }
}
#[derive(Debug, Clone)]
struct StatusData {
    status_type: StatusEffect,
    accuracy: usize,
    targeting: Targeting,
    additional_effects: Vec<MoveType>,
}

impl StatusData {
    fn new(
        status_type: StatusEffect,
        accuracy: usize,
        targeting: Targeting,
        additional_effects: Vec<MoveType>,
    ) -> Self {
        Self {
            status_type,
            accuracy,
            targeting,
            additional_effects,
        }
    }
}
#[derive(Debug, Clone)]
struct HealingData {
    heal_power: usize,
    cleanses: Vec<StatusEffect>,
    revival_power: Option<usize>,
}

impl HealingData {
    fn new(heal_power: usize, cleanses: Vec<StatusEffect>, revival_power: Option<usize>) -> Self {
        Self {
            heal_power,
            cleanses,
            revival_power,
        }
    }
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

#[bon]
impl SupportData {
    #[builder]
    fn new(
        charge_power: Option<usize>,
        concentrate_power: Option<usize>,
        cleanse_buffs: Option<bool>,
        cleanse_debuffs: Option<bool>,
        attack_modifier: Option<isize>,
        defense_modifier: Option<isize>,
        agility_modifier: Option<isize>,
        targeting: Targeting,
        phys_repel: Option<bool>,
        magic_repel: Option<bool>,
        element_block: Vec<SMTElement>,
        smirks: Option<bool>,
        cleanses_smirk: Option<bool>,
    ) -> Self {
        Self {
            charge_power,
            concentrate_power,
            cleanse_buffs: cleanse_buffs.unwrap_or(false),
            cleanse_debuffs: cleanse_debuffs.unwrap_or(false),
            attack_modifier,
            defense_modifier,
            agility_modifier,
            targeting,
            phys_repel: phys_repel.unwrap_or(false),
            magic_repel: magic_repel.unwrap_or(false),
            element_block,
            smirks: smirks.unwrap_or(false),
            cleanses_smirk: cleanses_smirk.unwrap_or(false),
        }
    }
}
impl Default for SupportData {
    fn default() -> Self {
        SupportData {
            charge_power: None,
            concentrate_power: None,
            cleanse_buffs: false,
            cleanse_debuffs: false,
            attack_modifier: None,
            defense_modifier: None,
            agility_modifier: None,
            targeting: Targeting::AllAllies,
            phys_repel: false,
            magic_repel: false,
            element_block: vec![],
            smirks: false,
            cleanses_smirk: false,
        }
    }
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

impl CounterData {
    fn new(power: usize, proc_chance: usize) -> Self {
        Self { power, proc_chance }
    }
}
#[derive(Debug, Clone)]
struct ElemResist {
    element: SMTElement,
    resist_type: ResistType,
}

impl ElemResist {
    fn new(element: SMTElement, resist_type: ResistType) -> Self {
        Self {
            element,
            resist_type,
        }
    }
}
#[derive(Debug, Clone)]
struct StatusResist {
    status: StatusEffect,
    resist_type: ResistType,
}

impl StatusResist {
    fn new(status: StatusEffect, resist_type: ResistType) -> Self {
        Self {
            status,
            resist_type,
        }
    }
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

#[derive(Debug, Clone)]
struct EnemyAI;

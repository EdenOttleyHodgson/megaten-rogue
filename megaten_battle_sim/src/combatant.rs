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

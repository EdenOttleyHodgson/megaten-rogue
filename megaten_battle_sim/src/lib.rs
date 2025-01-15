pub mod battle;
pub mod combatant;
pub mod skills;

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

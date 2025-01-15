// #![allow(dead_code)]
// use std::{
//     collections::HashMap,
//     fmt::Debug,
//     ops::{Deref, Mul},
// };
//
// use bon::{bon, vec};
// use lazy_static::lazy_static;
// use leptos::*;
//
// use crate::ExplorationState;
// // type BoxVec<T> = Vec<Box<T>>;
// // type CombatantVec = Vec<Combatant>;
//
// #[component]
// fn CombatantView(combatant: ReadSignal<Combatant>) -> impl IntoView {
//     let image_path: String = combatant()
//         .image_path
//         .unwrap_or("../resources/placeholder.jpg".to_owned());
//     let (current_hp, current_hp_set) = create_signal(0);
//     let (current_mp, current_mp_set) = create_signal(0);
//
//     combatant.with(|c| {
//         current_hp_set(c.combatant_data.current_hp);
//         current_mp_set(c.combatant_data.current_mp)
//     });
//     view! {
//         <div class="vertical-flex">
//             <img src=image_path alt="Combatant Image" />
//             <div class="horizontal-flex">
//                 <p>{move || current_hp()}</p>
//                 <p>{move || current_mp()}</p>
//             </div>
//
//         </div>
//     }
// }
//
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

mod battle;
// use battle::{Battle, BattleState};

use leptos::*;
fn main() {
    env_logger::init();
    console_error_panic_hook::set_once();
    mount_to_body(|| view! { <App /> });
}

#[derive(Debug, Clone)]
enum AppState {
    MainMenu(MenuState),
    Game(GameState),
}
#[derive(Debug, Clone)]
enum MenuState {
    Default,
    Settings,
}
#[derive(Debug, Clone)]
struct GameState {
    current_game_mode: GameMode,
    exploration_state: ExplorationState,
    // battle_state: BattleState,
}
#[derive(Debug, Clone)]
enum GameMode {
    Exploration,
    Battle,
}
#[derive(Debug, Clone)]
struct ExplorationState {}

#[component]
fn App() -> impl IntoView {
    let (read_state, write_state) = create_signal(AppState::MainMenu(MenuState::Default));
    let app_view = move || match read_state() {
        AppState::MainMenu(menu_state) => view! { <Menu state=menu_state /> },
        AppState::Game(game_state) => view! { <Game state=game_state /> },
    };
    view! { <div>{app_view}</div> }
}

#[component]
fn Menu(state: MenuState) -> impl IntoView {
    let (read_state, write_state) = create_signal(state);
    let menu_view = move || match read_state() {
        MenuState::Default => view! { <p>"Default menu"</p> },
        MenuState::Settings => view! { <p>"Settings"</p> },
    };
    view! { <div>{menu_view}</div> }
}

#[component]
fn Game(state: GameState) -> impl IntoView {
    let (read_mode, write_mode) = create_signal(state.current_game_mode);
    let (read_explore, write_explore) = create_signal(state.exploration_state);
    let (read_battle, write_battle) = create_signal(state.battle_state);

    let game_view = move || match read_mode() {
        GameMode::Exploration => {
            view! {
                <Exploration
                    read_state=read_explore
                    write_state=write_explore
                    on_battle_start=move |_| { write_mode(GameMode::Battle) }
                />
            }
        }
        GameMode::Battle => {
            todo!()
            // view! {
            //     <Battle
            //         read_state=read_battle
            //         write_state=write_battle
            //         on_battle_end=move |_| { write_mode(GameMode::Exploration) }
            //     />
            // }
        }
    };
}

#[component]
fn Exploration(
    read_state: ReadSignal<ExplorationState>,
    write_state: WriteSignal<ExplorationState>,
    #[prop(into)] on_battle_start: Callback<()>,
) -> impl IntoView {
}

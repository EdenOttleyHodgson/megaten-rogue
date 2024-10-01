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
enum GameState {
    Exploration,
    Battle,
}

#[component]
fn App() -> impl IntoView {
    let (read_state, write_state) = create_signal(AppState::MainMenu(MenuState::Default));
    let app_view = move || match read_state() {
        AppState::MainMenu(menu_state) => view! {},
        AppState::Game(game_state) => view! {},
    };
    view! {}
}

#[component]
fn Menu(state: MenuState) -> impl IntoView {
    let (read_state, write_state) = create_signal(state);
    let menu_view = move || match read_state() {
        MenuState::Default => view! {},
        MenuState::Settings => view! {},
    };
}

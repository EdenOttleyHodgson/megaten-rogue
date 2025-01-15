#[component]
pub fn Battle(
    read_state: ReadSignal<BattleState>,
    write_state: WriteSignal<BattleState>,
    #[prop(into)] on_battle_end: Callback<()>,
) -> impl IntoView {
    view! {
        <div class="horizontal-flex">
            <div id="player-team" class="vertical-flex">
            </div>
            <div id="enemy-team" class="vertical-flex">
            </div>
        </div>
    }
}

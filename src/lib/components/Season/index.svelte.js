export function create_season_manager(config) {
  let is_show_spoilers = $state(false)
  let castaway_view = $state("grid")
  return {
    season_prepped: config?.season ?? {},
    episodes_prepped: [...(config?.episodes ?? [])].sort((a, b) => a.episode_number - b.episode_number),
    castaways_prepped: config?.castaways ?? [],
    get is_show_spoilers() { return is_show_spoilers },
    set is_show_spoilers(value) { is_show_spoilers = value },
    get castaway_view() { return castaway_view },
    set castaway_view(value) { castaway_view = value },
  }
}

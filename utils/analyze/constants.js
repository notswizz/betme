// Define available actions
export const ACTIONS = {
  GET_BALANCE: 'get_balance',
  ADD_TOKENS: 'add_tokens',
  CREATE_LISTING: 'create_listing',
  PLACE_BET: 'place_bet',
  BASKETBALL_QUERY: 'basketball_query',
};

// Define direct responses that don't need confirmation
export const DIRECT_RESPONSES = {
  BALANCE_CHECK: 'balance_check',
  VIEW_LISTINGS: 'view_listings',
  VIEW_BETS: 'view_bets',
  VIEW_OPEN_BETS: 'view_open_bets',
  BASKETBALL_INFO: 'basketball_info',
};

// Define query types for basketball
export const BASKETBALL_QUERY_TYPES = {
  PLAYER_STATS: 'player_stats',
  TEAM_STATS: 'team_stats',
  LIVE_GAMES: 'live_games',
  SEASON_LEADERS: 'season_leaders',
  HEAD_TO_HEAD: 'head_to_head',
  STANDINGS: 'standings'
}; 
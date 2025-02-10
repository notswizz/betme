/**
 * Hardcoded mapping of NBA team names to their team IDs as returned by the NBA API.
 * This mapping includes only NBA franchises (nbaFranchise: true) and excludes teams that are all-star or non-NBA.
 *
 * Use this mapping to avoid unnecessary API calls for team lookups.
 */

export const teamMapping = {
  "Atlanta Hawks": 1,
  "Boston Celtics": 2,
  "Brooklyn Nets": 4,
  "Charlotte Hornets": 5,
  "Chicago Bulls": 6,
  "Cleveland Cavaliers": 7,
  "Dallas Mavericks": 8,
  "Denver Nuggets": 9,
  "Detroit Pistons": 10,
  "Golden State Warriors": 11,
  "Houston Rockets": 14,
  "Indiana Pacers": 15,
  "LA Clippers": 16,
  "Los Angeles Lakers": 17,
  "Memphis Grizzlies": 19,
  "Miami Heat": 20,
  "Milwaukee Bucks": 21,
  "Minnesota Timberwolves": 22,
  "New Orleans Pelicans": 23,
  "New York Knicks": 24,
  "Oklahoma City Thunder": 25,
  "Orlando Magic": 26,
  "Philadelphia 76ers": 27,
  "Phoenix Suns": 28,
  "Portland Trail Blazers": 29,
  "Sacramento Kings": 30,
  "San Antonio Spurs": 31,
  "Toronto Raptors": 38,
  "Utah Jazz": 40,
  "Washington Wizards": 41
}; 
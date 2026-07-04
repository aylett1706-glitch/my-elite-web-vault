export const SPORT_CATEGORIES = [
  {
    id: 'team',
    title: 'Team Sports',
    tagline: 'Football, AFL, NRL, NBA, cricket, rugby and global leagues.',
    sports: ['Football / Soccer', 'AFL', 'NRL', 'Rugby Union', 'Rugby League', 'NFL', 'NBA', 'MLB', 'NHL', 'Cricket', 'Basketball', 'Volleyball', 'Handball', 'Water Polo', 'Field Hockey', 'Futsal', 'Gaelic Football', 'Hurling', 'Lacrosse', 'Kabaddi', 'Sepak Takraw', 'Polo', 'Ultimate Frisbee', 'Roller Derby']
  },
  {
    id: 'racket_ball',
    title: 'Racket & Ball',
    tagline: 'Tennis, golf, darts, snooker, bowling, archery and target sports.',
    sports: ['Tennis', 'Badminton', 'Table Tennis', 'Squash', 'Pickleball', 'Padel', 'Golf', 'Darts', 'Snooker', 'Pool', 'Billiards', 'Bowling', 'Archery', 'Shooting', 'Curling', 'Boccia', 'Petanque']
  },
  {
    id: 'motorsport',
    title: 'Motorsport',
    tagline: 'F1, MotoGP, Supercars, rally, NASCAR, motocross and racing disciplines.',
    sports: ['F1', 'MotoGP', 'Supercars Australia', 'NASCAR', 'WRC Rally', 'Formula E', 'IndyCar', 'Dirt Racing', 'Drag Racing', 'Boat Racing', 'Jet Ski Racing', 'Motocross', 'Supercross', 'Enduro', 'Karting', 'Truck Racing', 'Drifting', 'Hill Climb']
  },
  {
    id: 'combat',
    title: 'Combat Sports',
    tagline: 'Boxing, MMA, wrestling, BJJ, Muay Thai, judo, karate and traditional combat.',
    sports: ['Boxing', 'MMA', 'UFC', 'ONE Championship', 'Bellator', 'PFL', 'Rizin', 'Kickboxing', 'Muay Thai', 'Karate', 'Taekwondo', 'Sanda', 'Savate', 'Lethwei', 'BJJ', 'ADCC', 'Wrestling', 'WWE', 'AEW', 'Judo', 'Sambo', 'Fencing', 'Kendo', 'HEMA', 'Sumo', 'Capoeira']
  },
  {
    id: 'extreme',
    title: 'Extreme Sports',
    tagline: 'Skate, surf, snowboard, BMX, MTB, climbing, parkour and air sports.',
    sports: ['Skateboarding', 'Surfing', 'WSL', 'Snowboarding', 'Skiing', 'BMX', 'Mountain Biking', 'Scootering', 'Climbing', 'Parkour', 'White Water Kayaking', 'Rafting', 'Paragliding', 'Hang Gliding', 'Skydiving', 'BASE Jumping', 'Wingsuit', 'High Diving', 'Free Diving']
  },
  {
    id: 'endurance',
    title: 'Endurance & Adventure',
    tagline: 'Triathlon, marathon, trail running, rally raid and expedition racing.',
    sports: ['Triathlon', 'Ironman', 'Ultraman', 'Marathon', 'Ultra Running', 'Trail Running', 'Obstacle Racing', 'Spartan', 'Tough Mudder', 'Skyrunning', 'Dakar Rally', 'Hard Enduro', '4x4 Off-Road', 'Rock Crawling', 'Adventure Racing']
  }
];

export const SPORTS_COLLECTIONS = [
  'Live Now', 'Upcoming Today', 'Tomorrow', 'This Weekend', 'This Week', 'Results',
  'Australian Sports', 'International', 'Local Leagues', 'World Cups', 'Olympics',
  'Finals', 'Title Fights', 'Main Cards', 'Prelims', 'Knockouts', 'Submissions',
  'Biggest Upsets', 'World Records', 'Australian Athletes', 'Close Games', 'High Scoring',
  'Big Rivalries', 'Undefeated Streaks', 'Best Tricks', 'Biggest Airs', 'Wipeouts'
];

export const OFFICIAL_SPORT_SOURCES = [
  { name: 'ABC Sport', region: 'Australia', url: 'https://www.abc.net.au/sport', tags: ['AFL', 'NRL', 'Cricket', 'Australian sport'] },
  { name: 'SBS Sport', region: 'Australia', url: 'https://www.sbs.com.au/sport', tags: ['Football', 'Cycling', 'World sport'] },
  { name: 'FIFA+', region: 'Global', url: 'https://www.fifa.com/fifaplus', tags: ['Football', 'World Cup', 'Archives'] },
  { name: 'Olympics.com', region: 'Global', url: 'https://olympics.com', tags: ['Olympics', 'Replays', 'Athletes'] },
  { name: 'World Athletics', region: 'Global', url: 'https://worldathletics.org', tags: ['Athletics', 'Results', 'Live'] },
  { name: 'World Rugby', region: 'Global', url: 'https://www.world.rugby', tags: ['Rugby', 'Sevens', 'World Cup'] },
  { name: 'ICC', region: 'Global', url: 'https://www.icc-cricket.com', tags: ['Cricket', 'Scores', 'Highlights'] },
  { name: 'ITF Tennis', region: 'Global', url: 'https://www.itftennis.com', tags: ['Tennis', 'Results', 'Tours'] },
  { name: 'Red Bull TV', region: 'Global', url: 'https://www.redbull.com/int-en/tv', tags: ['Extreme', 'Motorsport', 'Adventure'] },
  { name: 'X Games', region: 'Global', url: 'https://www.xgames.com', tags: ['Skate', 'BMX', 'Snow'] },
  { name: 'ONE Championship', region: 'Global', url: 'https://www.onefc.com', tags: ['MMA', 'Muay Thai', 'Kickboxing'] },
  { name: 'UFC', region: 'Global', url: 'https://www.ufc.com', tags: ['MMA', 'Fight cards', 'Results'] },
  { name: 'Formula 1', region: 'Global', url: 'https://www.formula1.com', tags: ['F1', 'Results', 'Highlights'] },
  { name: 'MotoGP', region: 'Global', url: 'https://www.motogp.com', tags: ['MotoGP', 'Results', 'Racing'] },
  { name: 'World Surf League', region: 'Global', url: 'https://www.worldsurfleague.com', tags: ['Surfing', 'Live', 'Rankings'] }
];

export const AI_CONTENT_TYPES = ['Live play-by-play', 'Previews', 'Recaps', 'Rules explained', 'Athlete profiles', 'Team profiles', 'Stats breakdowns', 'Predictions', 'Trivia', 'Highlights tracker', 'Training guides', 'Podcasts', 'Scoreboards', 'Win probability'];
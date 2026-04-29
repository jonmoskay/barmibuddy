export type Team = {
  id: string;
  name: string;
  short: string;
  primary: string;
  secondary: string;
};

export type League = {
  id: 'afl' | 'nba' | 'nfl' | 'mlb' | 'epl';
  name: string;
  emoji: string;
  blurb: string;
  teams: Team[];
};

const AFL: Team[] = [
  { id: 'adelaide',     name: 'Adelaide Crows',     short: 'Crows',    primary: '#002B5C', secondary: '#E21937' },
  { id: 'brisbane',     name: 'Brisbane Lions',     short: 'Lions',    primary: '#A30046', secondary: '#FDBE57' },
  { id: 'carlton',      name: 'Carlton',            short: 'Blues',    primary: '#031A29', secondary: '#FFFFFF' },
  { id: 'collingwood',  name: 'Collingwood',        short: 'Pies',     primary: '#000000', secondary: '#FFFFFF' },
  { id: 'essendon',     name: 'Essendon',           short: 'Dons',     primary: '#000000', secondary: '#CC2031' },
  { id: 'fremantle',    name: 'Fremantle',          short: 'Freo',     primary: '#2A0D54', secondary: '#FFFFFF' },
  { id: 'geelong',      name: 'Geelong Cats',       short: 'Cats',     primary: '#002B5C', secondary: '#FFFFFF' },
  { id: 'goldcoast',    name: 'Gold Coast Suns',    short: 'Suns',     primary: '#D71920', secondary: '#FDBB30' },
  { id: 'gws',          name: 'GWS Giants',         short: 'Giants',   primary: '#F47920', secondary: '#231F20' },
  { id: 'hawthorn',     name: 'Hawthorn',           short: 'Hawks',    primary: '#4D2004', secondary: '#FBBF15' },
  { id: 'melbourne',    name: 'Melbourne',          short: 'Demons',   primary: '#0F1131', secondary: '#CC2031' },
  { id: 'northmelb',    name: 'North Melbourne',    short: 'Roos',     primary: '#003F98', secondary: '#FFFFFF' },
  { id: 'porta',        name: 'Port Adelaide',      short: 'Power',    primary: '#008AAB', secondary: '#000000' },
  { id: 'richmond',     name: 'Richmond',           short: 'Tigers',   primary: '#000000', secondary: '#FFD200' },
  { id: 'stkilda',      name: 'St Kilda',           short: 'Saints',   primary: '#ED1C24', secondary: '#000000' },
  { id: 'sydney',       name: 'Sydney Swans',       short: 'Swans',    primary: '#ED171F', secondary: '#FFFFFF' },
  { id: 'westcoast',    name: 'West Coast Eagles',  short: 'Eagles',   primary: '#003087', secondary: '#F2A900' },
  { id: 'westernb',     name: 'Western Bulldogs',   short: 'Dogs',     primary: '#014896', secondary: '#E1261C' },
];

const NBA: Team[] = [
  { id: 'atl', name: 'Atlanta Hawks',        short: 'Hawks',    primary: '#E03A3E', secondary: '#C1D32F' },
  { id: 'bos', name: 'Boston Celtics',       short: 'Celtics',  primary: '#007A33', secondary: '#BA9653' },
  { id: 'bkn', name: 'Brooklyn Nets',        short: 'Nets',     primary: '#000000', secondary: '#FFFFFF' },
  { id: 'cha', name: 'Charlotte Hornets',    short: 'Hornets',  primary: '#1D1160', secondary: '#00788C' },
  { id: 'chi', name: 'Chicago Bulls',        short: 'Bulls',    primary: '#CE1141', secondary: '#000000' },
  { id: 'cle', name: 'Cleveland Cavaliers',  short: 'Cavs',     primary: '#860038', secondary: '#FDBB30' },
  { id: 'dal', name: 'Dallas Mavericks',     short: 'Mavs',     primary: '#00538C', secondary: '#002B5E' },
  { id: 'den', name: 'Denver Nuggets',       short: 'Nuggets',  primary: '#0E2240', secondary: '#FEC524' },
  { id: 'det', name: 'Detroit Pistons',      short: 'Pistons',  primary: '#C8102E', secondary: '#1D42BA' },
  { id: 'gsw', name: 'Golden State Warriors',short: 'Warriors', primary: '#1D428A', secondary: '#FFC72C' },
  { id: 'hou', name: 'Houston Rockets',      short: 'Rockets',  primary: '#CE1141', secondary: '#000000' },
  { id: 'ind', name: 'Indiana Pacers',       short: 'Pacers',   primary: '#002D62', secondary: '#FDBB30' },
  { id: 'lac', name: 'LA Clippers',          short: 'Clippers', primary: '#C8102E', secondary: '#1D428A' },
  { id: 'lal', name: 'LA Lakers',            short: 'Lakers',   primary: '#552583', secondary: '#FDB927' },
  { id: 'mem', name: 'Memphis Grizzlies',    short: 'Grizzlies',primary: '#5D76A9', secondary: '#12173F' },
  { id: 'mia', name: 'Miami Heat',           short: 'Heat',     primary: '#98002E', secondary: '#F9A01B' },
  { id: 'mil', name: 'Milwaukee Bucks',      short: 'Bucks',    primary: '#00471B', secondary: '#EEE1C6' },
  { id: 'min', name: 'Minnesota Timberwolves',short: 'Wolves',  primary: '#0C2340', secondary: '#236192' },
  { id: 'nop', name: 'New Orleans Pelicans', short: 'Pelicans', primary: '#0C2340', secondary: '#C8102E' },
  { id: 'nyk', name: 'New York Knicks',      short: 'Knicks',   primary: '#006BB6', secondary: '#F58426' },
  { id: 'okc', name: 'OKC Thunder',          short: 'Thunder',  primary: '#007AC1', secondary: '#EF3B24' },
  { id: 'orl', name: 'Orlando Magic',        short: 'Magic',    primary: '#0077C0', secondary: '#C4CED4' },
  { id: 'phi', name: 'Philadelphia 76ers',   short: '76ers',    primary: '#006BB6', secondary: '#ED174C' },
  { id: 'phx', name: 'Phoenix Suns',         short: 'Suns',     primary: '#1D1160', secondary: '#E56020' },
  { id: 'por', name: 'Portland Trail Blazers',short: 'Blazers', primary: '#E03A3E', secondary: '#000000' },
  { id: 'sac', name: 'Sacramento Kings',     short: 'Kings',    primary: '#5A2D81', secondary: '#63727A' },
  { id: 'sas', name: 'San Antonio Spurs',    short: 'Spurs',    primary: '#C4CED4', secondary: '#000000' },
  { id: 'tor', name: 'Toronto Raptors',      short: 'Raptors',  primary: '#CE1141', secondary: '#000000' },
  { id: 'uta', name: 'Utah Jazz',            short: 'Jazz',     primary: '#002B5C', secondary: '#F9A01B' },
  { id: 'was', name: 'Washington Wizards',   short: 'Wizards',  primary: '#002B5C', secondary: '#E31837' },
];

const NFL: Team[] = [
  { id: 'ari', name: 'Arizona Cardinals',    short: 'Cardinals',primary: '#97233F', secondary: '#000000' },
  { id: 'atl', name: 'Atlanta Falcons',      short: 'Falcons',  primary: '#A71930', secondary: '#000000' },
  { id: 'bal', name: 'Baltimore Ravens',     short: 'Ravens',   primary: '#241773', secondary: '#9E7C0C' },
  { id: 'buf', name: 'Buffalo Bills',        short: 'Bills',    primary: '#00338D', secondary: '#C60C30' },
  { id: 'car', name: 'Carolina Panthers',    short: 'Panthers', primary: '#0085CA', secondary: '#101820' },
  { id: 'chi', name: 'Chicago Bears',        short: 'Bears',    primary: '#0B162A', secondary: '#C83803' },
  { id: 'cin', name: 'Cincinnati Bengals',   short: 'Bengals',  primary: '#FB4F14', secondary: '#000000' },
  { id: 'cle', name: 'Cleveland Browns',     short: 'Browns',   primary: '#311D00', secondary: '#FF3C00' },
  { id: 'dal', name: 'Dallas Cowboys',       short: 'Cowboys',  primary: '#003594', secondary: '#869397' },
  { id: 'den', name: 'Denver Broncos',       short: 'Broncos',  primary: '#FB4F14', secondary: '#002244' },
  { id: 'det', name: 'Detroit Lions',        short: 'Lions',    primary: '#0076B6', secondary: '#B0B7BC' },
  { id: 'gb',  name: 'Green Bay Packers',    short: 'Packers',  primary: '#203731', secondary: '#FFB612' },
  { id: 'hou', name: 'Houston Texans',       short: 'Texans',   primary: '#03202F', secondary: '#A71930' },
  { id: 'ind', name: 'Indianapolis Colts',   short: 'Colts',    primary: '#002C5F', secondary: '#A2AAAD' },
  { id: 'jax', name: 'Jacksonville Jaguars', short: 'Jaguars',  primary: '#006778', secondary: '#D7A22A' },
  { id: 'kc',  name: 'Kansas City Chiefs',   short: 'Chiefs',   primary: '#E31837', secondary: '#FFB81C' },
  { id: 'lv',  name: 'Las Vegas Raiders',    short: 'Raiders',  primary: '#000000', secondary: '#A5ACAF' },
  { id: 'lac', name: 'LA Chargers',          short: 'Chargers', primary: '#0080C6', secondary: '#FFC20E' },
  { id: 'lar', name: 'LA Rams',              short: 'Rams',     primary: '#003594', secondary: '#FFA300' },
  { id: 'mia', name: 'Miami Dolphins',       short: 'Dolphins', primary: '#008E97', secondary: '#FC4C02' },
  { id: 'min', name: 'Minnesota Vikings',    short: 'Vikings',  primary: '#4F2683', secondary: '#FFC62F' },
  { id: 'ne',  name: 'New England Patriots', short: 'Patriots', primary: '#002244', secondary: '#C60C30' },
  { id: 'no',  name: 'New Orleans Saints',   short: 'Saints',   primary: '#D3BC8D', secondary: '#101820' },
  { id: 'nyg', name: 'New York Giants',      short: 'Giants',   primary: '#0B2265', secondary: '#A71930' },
  { id: 'nyj', name: 'New York Jets',        short: 'Jets',     primary: '#125740', secondary: '#000000' },
  { id: 'phi', name: 'Philadelphia Eagles',  short: 'Eagles',   primary: '#004C54', secondary: '#A5ACAF' },
  { id: 'pit', name: 'Pittsburgh Steelers',  short: 'Steelers', primary: '#FFB612', secondary: '#101820' },
  { id: 'sf',  name: 'San Francisco 49ers',  short: '49ers',    primary: '#AA0000', secondary: '#B3995D' },
  { id: 'sea', name: 'Seattle Seahawks',     short: 'Seahawks', primary: '#002244', secondary: '#69BE28' },
  { id: 'tb',  name: 'Tampa Bay Buccaneers', short: 'Bucs',     primary: '#D50A0A', secondary: '#FF7900' },
  { id: 'ten', name: 'Tennessee Titans',     short: 'Titans',   primary: '#0C2340', secondary: '#4B92DB' },
  { id: 'wsh', name: 'Washington Commanders',short: 'Commanders',primary:'#5A1414', secondary: '#FFB612' },
];

const MLB: Team[] = [
  { id: 'ari', name: 'Arizona Diamondbacks', short: 'D-backs',  primary: '#A71930', secondary: '#E3D4AD' },
  { id: 'atl', name: 'Atlanta Braves',       short: 'Braves',   primary: '#CE1141', secondary: '#13274F' },
  { id: 'bal', name: 'Baltimore Orioles',    short: 'Orioles',  primary: '#DF4601', secondary: '#000000' },
  { id: 'bos', name: 'Boston Red Sox',       short: 'Red Sox',  primary: '#BD3039', secondary: '#0C2340' },
  { id: 'chc', name: 'Chicago Cubs',         short: 'Cubs',     primary: '#0E3386', secondary: '#CC3433' },
  { id: 'cws', name: 'Chicago White Sox',    short: 'White Sox',primary: '#27251F', secondary: '#C4CED4' },
  { id: 'cin', name: 'Cincinnati Reds',      short: 'Reds',     primary: '#C6011F', secondary: '#000000' },
  { id: 'cle', name: 'Cleveland Guardians',  short: 'Guardians',primary: '#00385D', secondary: '#E50022' },
  { id: 'col', name: 'Colorado Rockies',     short: 'Rockies',  primary: '#33006F', secondary: '#C4CED4' },
  { id: 'det', name: 'Detroit Tigers',       short: 'Tigers',   primary: '#0C2340', secondary: '#FA4616' },
  { id: 'hou', name: 'Houston Astros',       short: 'Astros',   primary: '#002D62', secondary: '#EB6E1F' },
  { id: 'kc',  name: 'Kansas City Royals',   short: 'Royals',   primary: '#004687', secondary: '#BD9B60' },
  { id: 'laa', name: 'LA Angels',            short: 'Angels',   primary: '#BA0021', secondary: '#003263' },
  { id: 'lad', name: 'LA Dodgers',           short: 'Dodgers',  primary: '#005A9C', secondary: '#EF3E42' },
  { id: 'mia', name: 'Miami Marlins',        short: 'Marlins',  primary: '#00A3E0', secondary: '#EF3340' },
  { id: 'mil', name: 'Milwaukee Brewers',    short: 'Brewers',  primary: '#12284B', secondary: '#FFC52F' },
  { id: 'min', name: 'Minnesota Twins',      short: 'Twins',    primary: '#002B5C', secondary: '#D31145' },
  { id: 'nym', name: 'New York Mets',        short: 'Mets',     primary: '#002D72', secondary: '#FF5910' },
  { id: 'nyy', name: 'New York Yankees',     short: 'Yankees',  primary: '#003087', secondary: '#E4002C' },
  { id: 'oak', name: 'Oakland Athletics',    short: "A's",      primary: '#003831', secondary: '#EFB21E' },
  { id: 'phi', name: 'Philadelphia Phillies',short: 'Phillies', primary: '#E81828', secondary: '#002D72' },
  { id: 'pit', name: 'Pittsburgh Pirates',   short: 'Pirates',  primary: '#27251F', secondary: '#FDB827' },
  { id: 'sd',  name: 'San Diego Padres',     short: 'Padres',   primary: '#2F241D', secondary: '#FFC425' },
  { id: 'sf',  name: 'San Francisco Giants', short: 'Giants',   primary: '#FD5A1E', secondary: '#27251F' },
  { id: 'sea', name: 'Seattle Mariners',     short: 'Mariners', primary: '#0C2C56', secondary: '#005C5C' },
  { id: 'stl', name: 'St Louis Cardinals',   short: 'Cardinals',primary: '#C41E3A', secondary: '#0C2340' },
  { id: 'tb',  name: 'Tampa Bay Rays',       short: 'Rays',     primary: '#092C5C', secondary: '#8FBCE6' },
  { id: 'tex', name: 'Texas Rangers',        short: 'Rangers',  primary: '#003278', secondary: '#C0111F' },
  { id: 'tor', name: 'Toronto Blue Jays',    short: 'Blue Jays',primary: '#134A8E', secondary: '#1D2D5C' },
  { id: 'wsh', name: 'Washington Nationals', short: 'Nats',     primary: '#AB0003', secondary: '#14225A' },
];

const EPL: Team[] = [
  { id: 'ars', name: 'Arsenal',              short: 'Gunners',  primary: '#EF0107', secondary: '#FFFFFF' },
  { id: 'avl', name: 'Aston Villa',          short: 'Villa',    primary: '#670E36', secondary: '#95BFE5' },
  { id: 'bou', name: 'Bournemouth',          short: 'Cherries', primary: '#DA291C', secondary: '#000000' },
  { id: 'bre', name: 'Brentford',            short: 'Bees',     primary: '#E30613', secondary: '#FFFFFF' },
  { id: 'bha', name: 'Brighton',             short: 'Seagulls', primary: '#0057B8', secondary: '#FFCD00' },
  { id: 'che', name: 'Chelsea',              short: 'Blues',    primary: '#034694', secondary: '#FFFFFF' },
  { id: 'cry', name: 'Crystal Palace',       short: 'Palace',   primary: '#1B458F', secondary: '#C4122E' },
  { id: 'eve', name: 'Everton',              short: 'Toffees',  primary: '#003399', secondary: '#FFFFFF' },
  { id: 'ful', name: 'Fulham',               short: 'Cottagers',primary: '#000000', secondary: '#FFFFFF' },
  { id: 'ips', name: 'Ipswich Town',         short: 'Tractors', primary: '#3764A3', secondary: '#FFFFFF' },
  { id: 'lei', name: 'Leicester',            short: 'Foxes',    primary: '#003090', secondary: '#FDBE11' },
  { id: 'liv', name: 'Liverpool',            short: 'Reds',     primary: '#C8102E', secondary: '#FFFFFF' },
  { id: 'mci', name: 'Man City',             short: 'City',     primary: '#6CABDD', secondary: '#FFFFFF' },
  { id: 'mun', name: 'Man United',           short: 'United',   primary: '#DA291C', secondary: '#FBE122' },
  { id: 'new', name: 'Newcastle',            short: 'Magpies',  primary: '#241F20', secondary: '#FFFFFF' },
  { id: 'nfo', name: 'Nottingham Forest',    short: 'Forest',   primary: '#DD0000', secondary: '#FFFFFF' },
  { id: 'sou', name: 'Southampton',          short: 'Saints',   primary: '#D71920', secondary: '#FFFFFF' },
  { id: 'tot', name: 'Tottenham',            short: 'Spurs',    primary: '#132257', secondary: '#FFFFFF' },
  { id: 'whu', name: 'West Ham',             short: 'Hammers',  primary: '#7A263A', secondary: '#1BB1E7' },
  { id: 'wol', name: 'Wolves',               short: 'Wolves',   primary: '#FDB913', secondary: '#231F20' },
];

export const LEAGUES: League[] = [
  { id: 'afl', name: 'AFL',     emoji: '🏉', blurb: 'Australian Footy',     teams: AFL },
  { id: 'nba', name: 'NBA',     emoji: '🏀', blurb: 'NBA Basketball',       teams: NBA },
  { id: 'nfl', name: 'NFL',     emoji: '🏈', blurb: 'American Football',    teams: NFL },
  { id: 'mlb', name: 'MLB',     emoji: '⚾', blurb: 'Major League Baseball',teams: MLB },
  { id: 'epl', name: 'Premier', emoji: '⚽', blurb: 'English Premier League',teams: EPL },
];

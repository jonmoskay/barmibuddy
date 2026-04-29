export type AflTeam = {
  id: string;
  name: string;
  short: string;
  primary: string;
  secondary: string;
  initials: string;
};

export const AFL_TEAMS: AflTeam[] = [
  { id: 'adelaide',     name: 'Adelaide Crows',     short: 'Crows',    primary: '#002B5C', secondary: '#E21937', initials: 'AFC' },
  { id: 'brisbane',     name: 'Brisbane Lions',     short: 'Lions',    primary: '#A30046', secondary: '#FDBE57', initials: 'BL'  },
  { id: 'carlton',      name: 'Carlton',            short: 'Blues',    primary: '#031A29', secondary: '#FFFFFF', initials: 'CARL'},
  { id: 'collingwood',  name: 'Collingwood',        short: 'Pies',     primary: '#000000', secondary: '#FFFFFF', initials: 'COLL'},
  { id: 'essendon',     name: 'Essendon',           short: 'Dons',     primary: '#000000', secondary: '#CC2031', initials: 'ESS' },
  { id: 'fremantle',    name: 'Fremantle',          short: 'Freo',     primary: '#2A0D54', secondary: '#FFFFFF', initials: 'FRE' },
  { id: 'geelong',      name: 'Geelong Cats',       short: 'Cats',     primary: '#002B5C', secondary: '#FFFFFF', initials: 'GEEL'},
  { id: 'goldcoast',    name: 'Gold Coast Suns',    short: 'Suns',     primary: '#D71920', secondary: '#FDBB30', initials: 'GCS' },
  { id: 'gws',          name: 'GWS Giants',         short: 'Giants',   primary: '#F47920', secondary: '#231F20', initials: 'GWS' },
  { id: 'hawthorn',     name: 'Hawthorn',           short: 'Hawks',    primary: '#4D2004', secondary: '#FBBF15', initials: 'HAW' },
  { id: 'melbourne',    name: 'Melbourne',          short: 'Demons',   primary: '#0F1131', secondary: '#CC2031', initials: 'MELB'},
  { id: 'northmelb',    name: 'North Melbourne',    short: 'Roos',     primary: '#003F98', secondary: '#FFFFFF', initials: 'NM'  },
  { id: 'porta',        name: 'Port Adelaide',      short: 'Power',    primary: '#008AAB', secondary: '#000000', initials: 'PORT'},
  { id: 'richmond',     name: 'Richmond',           short: 'Tigers',   primary: '#000000', secondary: '#FFD200', initials: 'RICH'},
  { id: 'stkilda',      name: 'St Kilda',           short: 'Saints',   primary: '#ED1C24', secondary: '#000000', initials: 'STK' },
  { id: 'sydney',       name: 'Sydney Swans',       short: 'Swans',    primary: '#ED171F', secondary: '#FFFFFF', initials: 'SYD' },
  { id: 'westcoast',    name: 'West Coast Eagles',  short: 'Eagles',   primary: '#003087', secondary: '#F2A900', initials: 'WCE' },
  { id: 'westernb',     name: 'Western Bulldogs',   short: 'Dogs',     primary: '#014896', secondary: '#E1261C', initials: 'WB'  },
];

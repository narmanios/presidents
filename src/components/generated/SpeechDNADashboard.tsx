import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Search,
  ChevronDown,
  ChevronUp,
  X,
  Plus,
  ExternalLink,
  Activity,
  Command,
  Sparkles,
} from 'lucide-react';

// Load all speech text files
const speechFiles = import.meta.glob<string>('../../assets/data/sotu/*.txt', {
  query: '?raw',
  import: 'default',
  eager: true,
});

type ThemeId =
  | 'economy'
  | 'healthcare'
  | 'security'
  | 'education'
  | 'bipartisan'
  | 'foreign'
  | 'environment'
  | 'democracy';
type EraId = 'founding' | 'civil' | 'progressive' | 'modern' | 'contemporary';

type SpeechEntry = {
  presidentId: string;
  president: string;
  surname: string;
  year: number;
  accent: string;
  eraId: EraId;
  party: string;
  paragraphs: string[];
};

type AnalyzedParagraph = {
  text: string;
  matchedThemes: ThemeId[];
  dominant: ThemeId | 'none';
  themeColor: string;
};

type AnalyzedSegment = AnalyzedParagraph;

type RungGeom = {
  segment: AnalyzedSegment;
  originalSegment: AnalyzedSegment;
  x: number;
  y1: number;
  y2: number;
};

type AnalyzedSpeech = Omit<SpeechEntry, 'paragraphs'> & {
  paragraphs: AnalyzedParagraph[];
  segments: AnalyzedSegment[];
  tallies: {
    themeId: ThemeId;
    count: number;
  }[];
  topThemes: {
    themeId: ThemeId;
    count: number;
  }[];
  themedCount: number;
  rungs: RungGeom[];
};

const THEMES: {
  id: ThemeId;
  label: string;
  short: string;
  color: string;
  keywords: string[];
}[] = [
  {
    id: 'economy',
    label: 'Economy',
    short: 'ECON',
    color: '#00FF41', // Bright green from live site
    keywords: [
      'economy',
      'economic',
      'jobs',
      'job',
      'employment',
      'unemployment',
      'unemployed',
      'worker',
      'workers',
      'labor',
      'workforce',
      'inflation',
      'growth',
      'deficit',
      'surplus',
      'revenue',
      'revenues',
      'trade',
      'trading',
      'export',
      'exports',
      'import',
      'imports',
      'manufacturing',
      'manufacture',
      'tax',
      'taxes',
      'taxation',
      'banking',
      'bank',
      'banks',
      'debt',
      'debts',
      'currency',
      'dollar',
      'tariff',
      'tariffs',
      'fiscal',
      'commerce',
      'commercial',
      'wages',
      'wage',
      'salary',
      'income',
      'earnings',
      'budget',
      'spending',
      'spend',
      'invest',
      'investment',
      'investments',
      'investor',
      'business',
      'businesses',
      'corporation',
      'corporations',
      'enterprise',
      'enterprises',
      'industry',
      'industries',
      'industrial',
      'market',
      'markets',
      'marketplace',
      'stock',
      'financial',
      'finance',
      'cost',
      'costs',
      'price',
      'prices',
      'pricing',
      'afford',
      'affordable',
      'wealth',
      'wealthy',
      'prosperity',
      'prosperous',
      'profit',
      'profits',
      'capital',
      'recession',
      'depression',
      'recovery',
      'gdp',
      'productivity',
      'entrepreneur',
      'small business',
      'wall street',
      'main street',
      'mortgage',
      'loan',
      'credit',
      'savings',
      'retirement',
      'pension',
      'social security',
    ],
  },
  {
    id: 'healthcare',
    label: 'Healthcare',
    short: 'HLTH',
    color: '#FF0000', // Red from live site
    keywords: [
      'health',
      'healthcare',
      'healthy',
      'medicare',
      'medicaid',
      'insulin',
      'drug',
      'drugs',
      'prescription',
      'prescriptions',
      'hospital',
      'hospitals',
      'cancer',
      'disease',
      'diseases',
      'insurance',
      'medical',
      'medicine',
      'pandemic',
      'epidemic',
      'vaccine',
      'vaccines',
      'vaccination',
      'care',
      'illness',
      'sick',
      'sickness',
      'surgery',
      'surgical',
      'treatment',
      'treatments',
      'nursing',
      'nurse',
      'nurses',
      'diabetes',
      'diabetic',
      'doctor',
      'doctors',
      'physician',
      'physicians',
      'patient',
      'patients',
      'pharmacy',
      'pharmacies',
      'clinic',
      'clinics',
      'emergency room',
      'ambulance',
      'mental health',
      'addiction',
      'opioid',
      'overdose',
      'affordable care',
      'obamacare',
      'preexisting condition',
      'coverage',
      'copay',
      'deductible',
      'premium',
      'premiums',
    ],
  },
  {
    id: 'security',
    label: 'Security',
    short: 'SEC',
    color: '#FFC107', // Amber from live site
    keywords: [
      'security',
      'secure',
      'safety',
      'safe',
      'military',
      'armed forces',
      'terror',
      'terrorism',
      'terrorist',
      'terrorists',
      'war',
      'warfare',
      'troops',
      'troop',
      'defense',
      'defend',
      'iraq',
      'afghanistan',
      'attack',
      'attacks',
      'attacked',
      'border',
      'borders',
      'immigration',
      'immigrant',
      'immigrants',
      'police',
      'law enforcement',
      'army',
      'navy',
      'marines',
      'air force',
      'coast guard',
      'arms',
      'weapon',
      'weapons',
      'force',
      'forces',
      'missile',
      'missiles',
      'nuclear',
      'combat',
      'soldier',
      'soldiers',
      'veteran',
      'veterans',
      'service member',
      'homeland',
      'threat',
      'threats',
      'threaten',
      'danger',
      'dangerous',
      'protect',
      'protection',
      'protecting',
      'violence',
      'violent',
      'crime',
      'criminal',
      'criminals',
      'gun',
      'guns',
      'firearm',
      'firearms',
      'patrol',
      'guard',
      'fortress',
      'sanctuary',
      'fortress',
    ],
  },
  {
    id: 'education',
    label: 'Education',
    short: 'EDU',
    color: '#00BFFF', // Deep sky blue from live site
    keywords: [
      'education',
      'educational',
      'educate',
      'school',
      'schools',
      'college',
      'colleges',
      'student',
      'students',
      'teacher',
      'teachers',
      'graduate',
      'graduates',
      'graduation',
      'university',
      'universities',
      'literacy',
      'literate',
      'classroom',
      'classrooms',
      'preschool',
      'kindergarten',
      'elementary',
      'high school',
      'secondary',
      'higher education',
      'curriculum',
      'diploma',
      'degree',
      'degrees',
      'scholarship',
      'scholarships',
      'tuition',
      'financial aid',
      'student loan',
      'apprentice',
      'apprenticeship',
      'vocational',
      'academic',
      'academics',
      'teaching',
      'taught',
      'instructor',
      'professor',
      'faculty',
      'textbook',
      'library',
      'libraries',
    ],
  },
  {
    id: 'bipartisan',
    label: 'Bipartisan',
    short: 'BPRT',
    color: '#FF1493', // Deep pink from live site
    keywords: [
      'bipartisan',
      'together',
      'democrats',
      'democrat',
      'democratic',
      'republicans',
      'republican',
      'congress',
      'congressional',
      'senate',
      'senator',
      'senators',
      'house',
      'representative',
      'representatives',
      'unity',
      'united',
      'coalition',
      'cooperation',
      'cooperate',
      'common',
      'both parties',
      'signed',
      'passed',
      'legislation',
      'legislative',
      'bill',
      'bills',
      'law',
      'laws',
      'compromise',
      'agreement',
      'agreements',
      'support',
      'supporting',
      'vote',
      'voted',
      'votes',
      'voting',
      'partisan',
      'collaborate',
      'collaboration',
      'consensus',
      'unanimous',
      'chamber',
      'chambers',
      'aisle',
      'work together',
      'working together',
    ],
  },
  {
    id: 'foreign',
    label: 'Foreign Policy',
    short: 'FGPOL',
    color: '#FF5F1F', // Orange red from live site
    keywords: [
      'foreign',
      'international',
      'treaty',
      'treaties',
      'allies',
      'ally',
      'alliance',
      'alliances',
      'diplomacy',
      'diplomatic',
      'diplomat',
      'diplomats',
      'ukraine',
      'china',
      'chinese',
      'russia',
      'russian',
      'nations',
      'nation',
      'britain',
      'british',
      'france',
      'french',
      'mexico',
      'mexican',
      'republic',
      'nato',
      'ambassador',
      'ambassadors',
      'embassy',
      'embassies',
      'sovereignty',
      'sovereign',
      'aggression',
      'aggressive',
      'trade agreement',
      'sanction',
      'sanctions',
      'foreign aid',
      'humanitarian',
      'global',
      'world',
      'overseas',
      'abroad',
      'continent',
      'continental',
      'europe',
      'european',
      'asia',
      'asian',
      'africa',
      'african',
      'middle east',
      'latin america',
      'pacific',
    ],
  },
  {
    id: 'environment',
    label: 'Environment',
    short: 'ENV',
    color: '#00FFFF', // Cyan from live site
    keywords: [
      'climate',
      'climate change',
      'energy',
      'environment',
      'environmental',
      'clean',
      'emissions',
      'emission',
      'oil',
      'gas',
      'natural gas',
      'renewable',
      'renewables',
      'conservation',
      'conserve',
      'land',
      'lands',
      'forest',
      'forests',
      'forestry',
      'water',
      'waters',
      'pollution',
      'pollute',
      'polluted',
      'electric',
      'electricity',
      'solar',
      'wind power',
      'carbon',
      'drought',
      'droughts',
      'flood',
      'floods',
      'flooding',
      'wildfire',
      'wildfires',
      'natural resources',
      'wildlife',
      'ecosystem',
      'ecosystems',
      'green',
      'sustainable',
      'sustainability',
      'park',
      'parks',
      'national park',
      'wilderness',
      'endangered',
      'species',
      'habitat',
      'recycling',
      'recycle',
      'waste',
      'toxic',
      'contamination',
    ],
  },
  {
    id: 'democracy',
    label: 'Democracy',
    short: 'DEM',
    color: '#8A2BE2', // Blue violet from live site
    keywords: [
      'democracy',
      'democratic',
      'freedom',
      'free',
      'rights',
      'right',
      'constitution',
      'constitutional',
      'vote',
      'voting',
      'voter',
      'voters',
      'liberty',
      'liberties',
      'justice',
      'judicial',
      'equality',
      'equal',
      'suffrage',
      'republic',
      'republican',
      'citizen',
      'citizens',
      'citizenship',
      'civil',
      'civil rights',
      'january 6',
      'insurrection',
      'autocracy',
      'autocrat',
      'protest',
      'protests',
      'protester',
      'protesters',
      'law',
      'laws',
      'legal',
      'election',
      'elections',
      'ballot',
      'ballots',
      'campaign',
      'campaigns',
      'judiciary',
      'judge',
      'judges',
      'court',
      'courts',
      'supreme court',
      'amendment',
      'amendments',
      'bill of rights',
      'founding fathers',
      'declaration',
      'independence',
      'representation',
      'represent',
    ],
  },
];

// Color for "Other" category (paragraphs that don't match any theme)
const OTHER_COLOR = '#808080'; // Gray

const HELIX_WIDTH = 148,
  HELIX_HEIGHT = 306,
  HELIX_PAD = 20,
  HELIX_AMP = 46;

// Gap between rungs, in viewBox units, shared by every helix. Set by how many
// rungs it takes to fill the frame — lower this number to spread rungs further
// apart, raise it to pack them tighter.
const RUNGS_PER_FRAME = 70;
const RUNG_SPACING = (HELIX_HEIGHT - HELIX_PAD * 2) / (RUNGS_PER_FRAME - 1);

// Horizontal helix dimensions
const HORIZONTAL_HELIX_HEIGHT = 240;
const HORIZONTAL_HELIX_AMP = 70;
const HORIZONTAL_RUNG_SPACING = 8; // Uniform spacing for all speeches

const CHART_COLORS_LIGHT = ['#4CAF50', '#2196F3', '#E53935', '#673AB7']; // Dark saturated colors for light mode
const CHART_COLORS_DARK = ['#98F786', '#6D9EFC', '#EB7B77', '#937DF8']; // Pastel colors for dark mode

// Theme-based color shades for comparison chart (4 shades per theme)
// Light mode: darker, saturated shades
const THEME_SHADES_LIGHT: Record<ThemeId, string[]> = {
  economy: ['#4CAF50', '#43A047', '#388E3C', '#2E7D32', '#27632A', '#205022', '#1A3D1A', '#132B12'], // Dark green shades
  healthcare: [
    '#E53935',
    '#D32F2F',
    '#C62828',
    '#B71C1C',
    '#A51818',
    '#8F1414',
    '#7A1010',
    '#650C0C',
  ], // Dark red shades
  security: [
    '#FF9800',
    '#F57C00',
    '#EF6C00',
    '#E65100',
    '#D14400',
    '#BC3D00',
    '#A73600',
    '#922F00',
  ], // Dark orange shades
  education: [
    '#2196F3',
    '#1976D2',
    '#1565C0',
    '#0D47A1',
    '#0B3D8A',
    '#093373',
    '#07295C',
    '#051F45',
  ], // Dark blue shades
  bipartisan: [
    '#673AB7',
    '#5E35B1',
    '#512DA8',
    '#4527A0',
    '#3E2291',
    '#371D82',
    '#301873',
    '#291364',
  ], // Dark purple shades
  foreign: ['#AD1457', '#880E4F', '#6D0A3D', '#530828', '#450620', '#370518', '#290410', '#1B0308'], // Deep magenta shades
  environment: [
    '#00BCD4',
    '#00ACC1',
    '#0097A7',
    '#00838F',
    '#007078',
    '#005D61',
    '#004A4A',
    '#003733',
  ], // Dark cyan shades
  democracy: [
    '#FDD835',
    '#FBC02D',
    '#F9A825',
    '#F57F17',
    '#E37013',
    '#D1620F',
    '#BF540B',
    '#AD4607',
  ], // Bright yellow shades
};

// Dark mode: shades based on live site colors with more distinct variations
const THEME_SHADES_DARK: Record<ThemeId, string[]> = {
  economy: ['#66FF99', '#33FF77', '#00D652', '#00AD42', '#008432', '#005B22'], // Bright green shades - lighter to medium
  healthcare: ['#FF6666', '#FF3333', '#DD0000', '#BB0000', '#990000', '#770000'], // Red shades - lighter to medium
  security: ['#FFD666', '#FFC933', '#F0A800', '#D08F00', '#B07600', '#906000'], // Amber shades - lighter to medium
  education: ['#66D4FF', '#33C4FF', '#00A8E6', '#0088BB', '#006890', '#004865'], // Deep sky blue shades - lighter to medium
  bipartisan: ['#FF70C4', '#FF47B3', '#DD1280', '#BB0F6D', '#990C5A', '#770947'], // Deep pink shades - lighter to medium
  foreign: ['#FF9966', '#FF7F47', '#DD5119', '#BB4313', '#993509', '#772705'], // Orange red shades - lighter to medium
  environment: ['#66FFFF', '#33FFFF', '#00DDDD', '#00BBBB', '#009999', '#007777'], // Cyan shades - lighter to medium
  democracy: ['#B366FF', '#9E47FF', '#7624C8', '#621DAE', '#4E1794', '#3A107A'], // Blue violet shades - lighter to medium
};

const ACCENTS: Record<string, string> = {
  biden: '#5B92E5',
  arthur: '#C48A3C',
  bush: '#D96B6B',
  clinton: '#9B7BC4',
  adams: '#D4AA6F',
  jefferson: '#5FBD72',
  madison: '#96C748',
  monroe: '#E57B8F',
  jackson: '#E88A52',
  fillmore: '#8A96A8',
  buchanan: '#A894D4',
  johnson: '#8291E5',
  grant: '#B17FD4',
  hayes: '#4FB891',
  cleveland: '#E57B8F',
  harrison: '#E072A8',
  buren: '#4FB891',
  coolidge: '#E5B445',
  eisenhower: '#54A8D4',
  kennedy: '#6FA0E5',
  nixon: '#D47FD4',
  ford: '#E88542',
  obama: '#4FB891',
  roosevelt: '#E88A52',
  washington: '#D4AA6F',
  lincoln: '#B17FD4',
  truman: '#6FA0E5',
  reagan: '#D96B6B',
  carter: '#40A899',
  wilson: '#9B7BC4',
  taft: '#D4963C',
  hoover: '#8A96A8',
  mckinley: '#A894D4',
  pierce: '#8291E5',
  polk: '#96C748',
  taylor: '#E57B8F',
  tyler: '#E072A8',
  harding: '#E5B445',
  trump: '#D96B6B',
};

const eraNames: Record<EraId, string> = {
  founding: 'Founding',
  civil: 'Civil War',
  progressive: 'Progressive',
  modern: 'Modern',
  contemporary: 'Contemporary',
};

// Helper function to parse speech text into paragraphs
function parseSpeechText(text: string): string[] {
  // Split by sentence-ending punctuation to ensure complete sentences
  return text
    .split(/(?<=[.!?])\s+/)
    .map(sentence => sentence.trim())
    .filter(sentence => sentence.length > 30 && /[.!?]$/.test(sentence)); // Filter sentences that end with punctuation
}

// Helper function to determine era based on year
function determineEra(year: number): EraId {
  if (year <= 1860) return 'founding';
  if (year <= 1900) return 'civil';
  if (year <= 1945) return 'progressive';
  if (year <= 2000) return 'modern';
  return 'contemporary';
}

// Helper function to get party based on president and year
function getParty(surname: string, year: number): string {
  const partyMap: Record<string, string> = {
    Adams: 'Federalist',
    Jefferson: 'Democratic-Republican',
    Madison: 'Democratic-Republican',
    Monroe: 'Democratic-Republican',
    Jackson: 'Democratic',
    Buren: 'Democratic',
    Harrison: 'Whig',
    Tyler: 'Whig',
    Polk: 'Democratic',
    Taylor: 'Whig',
    Fillmore: 'Whig',
    Pierce: 'Democratic',
    Buchanan: 'Democratic',
    Lincoln: 'Republican',
    Johnson: year < 1900 ? 'Democratic' : 'Democratic',
    Grant: 'Republican',
    Hayes: 'Republican',
    Arthur: 'Republican',
    Cleveland: 'Democratic',
    McKinley: 'Republican',
    Roosevelt: year < 1920 ? 'Republican' : 'Democratic',
    Taft: 'Republican',
    Wilson: 'Democratic',
    Harding: 'Republican',
    Coolidge: 'Republican',
    Hoover: 'Republican',
    Truman: 'Democratic',
    Eisenhower: 'Republican',
    Kennedy: 'Democratic',
    Nixon: 'Republican',
    Ford: 'Republican',
    Carter: 'Democratic',
    Reagan: 'Republican',
    Bush: 'Republican',
    Clinton: 'Democratic',
    Obama: 'Democratic',
    Trump: 'Republican',
    Biden: 'Democratic',
    Washington: 'None',
  };
  return partyMap[surname] || 'Unknown';
}

// Generate full name from surname
function getFullName(surname: string): string {
  const nameMap: Record<string, string> = {
    Adams: 'John Adams',
    Jefferson: 'Thomas Jefferson',
    Madison: 'James Madison',
    Monroe: 'James Monroe',
    Jackson: 'Andrew Jackson',
    Buren: 'Martin Van Buren',
    Harrison: 'William Henry Harrison',
    Tyler: 'John Tyler',
    Polk: 'James K. Polk',
    Taylor: 'Zachary Taylor',
    Fillmore: 'Millard Fillmore',
    Pierce: 'Franklin Pierce',
    Buchanan: 'James Buchanan',
    Lincoln: 'Abraham Lincoln',
    Johnson: 'Andrew Johnson',
    Grant: 'Ulysses S. Grant',
    Hayes: 'Rutherford B. Hayes',
    Arthur: 'Chester A. Arthur',
    Cleveland: 'Grover Cleveland',
    McKinley: 'William McKinley',
    Roosevelt: 'Theodore Roosevelt',
    Taft: 'William Howard Taft',
    Wilson: 'Woodrow Wilson',
    Harding: 'Warren G. Harding',
    Coolidge: 'Calvin Coolidge',
    Hoover: 'Herbert Hoover',
    Truman: 'Harry S. Truman',
    Eisenhower: 'Dwight D. Eisenhower',
    Kennedy: 'John F. Kennedy',
    Nixon: 'Richard Nixon',
    Ford: 'Gerald Ford',
    Carter: 'Jimmy Carter',
    Reagan: 'Ronald Reagan',
    Bush: 'George W. Bush',
    Clinton: 'Bill Clinton',
    Obama: 'Barack Obama',
    Trump: 'Donald Trump',
    Biden: 'Joe Biden',
    Washington: 'George Washington',
  };
  return nameMap[surname] || surname;
}

// Build library metadata and speech map from actual speech files
function buildLibraryData(): {
  libraryMeta: [string, string, string, number, EraId, string, string][];
  speechesMap: Record<string, string[]>;
} {
  const meta: [string, string, string, number, EraId, string, string][] = [];
  const speechesMap: Record<string, string[]> = {};

  Object.entries(speechFiles).forEach(([path, content]) => {
    const filename = path.split('/').pop()?.replace('.txt', '') || '';
    const [surname, yearStr] = filename.split('_');
    const year = parseInt(yearStr);

    if (surname && !isNaN(year) && content) {
      const presidentId = `${surname.toLowerCase()}${year}`;
      const fullName = getFullName(surname);
      const eraId = determineEra(year);
      const party = getParty(surname, year);
      const accent = ACCENTS[surname.toLowerCase()] || '#94A3B8';

      meta.push([presidentId, fullName, surname, year, eraId, party, accent]);
      speechesMap[presidentId] = parseSpeechText(content);
    }
  });

  return {
    libraryMeta: meta.sort((a, b) => a[3] - b[3]), // Sort by year
    speechesMap,
  };
}

const { libraryMeta, speechesMap } = buildLibraryData();

function buildRungs(segments: AnalyzedSegment[]): RungGeom[] {
  return segments.map((segment, i) => {
    const angle = i * 0.143;
    return {
      segment,
      originalSegment: segment,
      x: HELIX_PAD + i * HORIZONTAL_RUNG_SPACING,
      y1: HORIZONTAL_HELIX_HEIGHT / 2 + Math.sin(angle) * HORIZONTAL_HELIX_AMP,
      y2: HORIZONTAL_HELIX_HEIGHT / 2 - Math.sin(angle) * HORIZONTAL_HELIX_AMP,
    };
  });
}

// One rung per paragraph, at a uniform spacing
function normalizeRungs(speech: AnalyzedSpeech): RungGeom[] {
  return buildRungs(speech.segments);
}

// Full width of a helix in viewBox units, using uniform spacing
function helixWidth(rungs: RungGeom[]): number {
  return HELIX_PAD * 2 + Math.max(rungs.length - 1, 0) * HORIZONTAL_RUNG_SPACING;
}

// One alternation regex per theme, compiled once at startup, e.g.
// /\b(?:economy|economic|jobs|...)\b/i. The previous version built a fresh
// RegExp for every keyword of every paragraph — 26.9M compilations across the
// 233-speech corpus, which blocked the main thread for ~10s before first
// render. Word-boundary semantics and match order are unchanged.
const THEME_MATCHERS: { id: ThemeId; color: string; regex: RegExp }[] = THEMES.map(t => ({
  id: t.id,
  color: t.color,
  regex: new RegExp(
    `\\b(?:${t.keywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`,
    'i'
  ),
}));

function analyzeSpeech(speech: SpeechEntry): AnalyzedSpeech {
  const paragraphs = speech.paragraphs.map(text => {
    const matchedThemes = THEME_MATCHERS.filter(m => m.regex.test(text)).map(m => m.id);
    const dominant = matchedThemes[0] ?? 'none';
    const theme = THEMES.find(t => t.id === dominant);
    return {
      text,
      matchedThemes,
      dominant,
      themeColor: theme?.color ?? OTHER_COLOR,
    };
  });
  const tallies = THEMES.map(t => ({
    themeId: t.id,
    count: paragraphs.filter(p => p.matchedThemes.includes(t.id)).length,
  }));
  const topThemes = [...tallies]
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
    .filter(t => t.count > 0);

  const analyzed: AnalyzedSpeech = {
    ...speech,
    paragraphs,
    segments: paragraphs,
    tallies,
    topThemes,
    themedCount: paragraphs.filter(p => p.matchedThemes.length > 0).length,
    rungs: [],
  };
  return {
    ...analyzed,
    rungs: normalizeRungs(analyzed),
  };
}

// Build ALL_SPEECHES_MAP from loaded speech files
const ALL_SPEECHES_MAP: Record<string, AnalyzedSpeech> = Object.fromEntries(
  libraryMeta.map(([id, president, surname, year, eraId, party, accent]) => [
    id,
    analyzeSpeech({
      presidentId: id,
      president,
      surname,
      year,
      eraId,
      party,
      accent,
      paragraphs: speechesMap[id] || [],
    }),
  ])
) as Record<string, AnalyzedSpeech>;

export function SpeechDNADashboard() {
  const [activeIds, setActiveIds] = useState<(string | null)[]>([
    'bush1992',
    'clinton2000',
    'bush2008',
    'obama2016',
    'trump2020',
    'biden2023',
  ]);
  const [filters, setFilters] = useState<ThemeId[]>([]);
  const [expanded, setExpanded] = useState(false);
  const libraryRef = useRef<HTMLElement>(null);
  const [query, setQuery] = useState('');
  const [era, setEra] = useState<EraId | 'all'>('all');
  const [explore, setExplore] = useState<AnalyzedSpeech | null>(null);
  const [hover, setHover] = useState<{
    r: RungGeom;
    index: number;
    speechId: string;
    x: number;
    y: number;
  } | null>(null);
  const [clicked, setClicked] = useState<{
    r: RungGeom;
    x: number;
    y: number;
  } | null>(null);
  const [dropdownSlot, setDropdownSlot] = useState<number | null>(null);
  const [hoverDialogSlot, setHoverDialogSlot] = useState<number | null>(null);
  const [minimapState, setMinimapState] = useState<
    Record<string, { scrollLeft: number; scrollWidth: number; clientWidth: number }>
  >({});
  const [minimapDragging, setMinimapDragging] = useState<string | null>(null);
  const scrollContainerRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [paragraphHover, setParagraphHover] = useState<number | null>(null);
  const [paragraphClicked, setParagraphClicked] = useState<{
    index: number;
    x: number;
    y: number;
  } | null>(null);
  const [hoveredBar, setHoveredBar] = useState<{
    themeId: string;
    speechIdx: number;
  } | null>(null);
  const [hoveredCardBar, setHoveredCardBar] = useState<{
    speechId: string;
    themeId: string;
  } | null>(null);

  // The library sits at the bottom of the page, so expanding it would otherwise
  // open below the fold. 'nearest' scrolls the minimum needed to reveal the
  // whole panel and does nothing when it is already fully visible.
  useEffect(() => {
    if (!expanded) return;
    libraryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [expanded]);

  const active = activeIds.map(id => (id ? ALL_SPEECHES_MAP[id] : null));

  // Handle global mouse events for minimap dragging
  useEffect(() => {
    const handleMouseUp = () => setMinimapDragging(null);
    const handleMouseMove = (e: MouseEvent) => {
      if (minimapDragging) {
        const container = scrollContainerRefs.current[minimapDragging];
        const state = minimapState[minimapDragging];
        if (!container || !state) return;

        // Find the minimap element
        const minimapEl = document.querySelector(`[data-minimap-id="${minimapDragging}"]`);
        if (!minimapEl) return;

        const rect = minimapEl.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const minimapWidth = rect.width;
        const scrollRatio = Math.max(0, Math.min(1, mouseX / minimapWidth));
        container.scrollLeft = scrollRatio * state.scrollWidth;
      }
    };

    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousemove', handleMouseMove);
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [minimapDragging, minimapState]);

  // Initialize minimap state on mount and when speeches change
  useEffect(() => {
    const timer = setTimeout(() => {
      const newMinimapState: Record<
        string,
        { scrollLeft: number; scrollWidth: number; clientWidth: number }
      > = {};
      active.forEach(speech => {
        if (speech) {
          const container = scrollContainerRefs.current[speech.presidentId];
          if (container) {
            newMinimapState[speech.presidentId] = {
              scrollLeft: container.scrollLeft,
              scrollWidth: container.scrollWidth,
              clientWidth: container.clientWidth,
            };
          }
        }
      });
      setMinimapState(newMinimapState);
    }, 100);
    return () => clearTimeout(timer);
  }, [activeIds, active]);

  const visibleLibrary = useMemo(
    () =>
      libraryMeta.filter(
        m =>
          (era === 'all' || m[4] === era) &&
          `${m[1]} ${m[3]}`.toLowerCase().includes(query.toLowerCase())
      ),
    [era, query]
  );
  const toggleTheme = (id: ThemeId) =>
    setFilters(f => (f.includes(id) ? f.filter(x => x !== id) : [...f, id]));

  return (
    <main className="min-h-screen bg-gray-100 dark:bg-[#0F172A] text-gray-900 dark:text-slate-100 selection:bg-[#937DF8]/30">
      <header className="mx-auto max-w-[1500px] px-5 pb-7 pt-8 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <div className="mb-3 flex items-center gap-2 text-[10px] tracking-[.28em] text-gray-500 dark:text-slate-500">
              {/* <Activity size={13} className="text-blue-400" /> */}
              {/* <span>ARCHIVE / ANALYSIS SYSTEM</span> */}
            </div>
            <h1 className="text-4xl font-normal text-gray-900 dark:text-white sm:text-6xl">
              Presidential Speech DNA
            </h1>
            <p className="mt-4 text-base text-gray-600 dark:text-slate-400 max-w-3xl">
              Explore the DNA of presidential State of the Union addresses. Hover over a president's
              name and select "yes" to discover and compare addresses from other presidents.
            </p>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-[1500px] px-5 sm:px-8 mt-8">
        <nav aria-label="Global theme filter" className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilters([])}
            className={`px-2 py-1 text-xs transition ${filters.length === 0 ? 'text-gray-900 dark:text-white font-semibold' : 'text-gray-500 dark:text-slate-600 hover:text-gray-700 dark:hover:text-slate-400'}`}
          >
            All Themes
          </button>
          {THEMES.map(t => (
            <button
              key={t.id}
              onClick={() => toggleTheme(t.id)}
              className={`px-2 py-1 text-xs transition flex items-center gap-1.5 ${filters.includes(t.id) ? 'text-gray-900 dark:text-white font-semibold' : 'text-gray-500 dark:text-slate-600 hover:text-gray-700 dark:hover:text-slate-400'}`}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: t.color }} />
              {t.label}
            </button>
          ))}
          <button
            onClick={() => toggleTheme('other' as any)}
            className={`px-2 py-1 text-xs transition flex items-center gap-1.5 ${filters.includes('other' as any) ? 'text-gray-900 dark:text-white font-semibold' : 'text-gray-500 dark:text-slate-600 hover:text-gray-700 dark:hover:text-slate-400'}`}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: OTHER_COLOR }} />
            Other
          </button>
        </nav>
      </section>

      <div className="mx-auto max-w-[1500px] px-5 sm:px-8 mt-8">
        <p className="mb-1 text-sm text-gray-600 dark:text-slate-400">
          <span>{active.filter(Boolean).length} of 6 presidents can be viewed at a time</span>
        </p>
      </div>

      {/* pb-10 matches the comparison section's, so the gap above the chart is
          the same as the gap between the chart and the library below it. */}
      <section className="mx-auto max-w-[1500px] px-5 pt-5 pb-10 sm:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[0, 1, 2, 3, 4, 5].map(slot => {
            const speech = active[slot];
            if (!speech) {
              const isDropdownOpen = dropdownSlot === slot;
              const availableSpeeches = libraryMeta.filter(
                m => !activeIds.filter(Boolean).includes(m[0])
              );

              return (
                <div
                  key={`empty-${slot}`}
                  className="relative flex min-h-[180px] items-center justify-center rounded-md border border-dashed border-gray-300 dark:border-white/15 text-xs text-gray-500 dark:text-slate-500"
                >
                  {!isDropdownOpen ? (
                    <button
                      onClick={() => setDropdownSlot(slot)}
                      className="w-full h-full flex items-center justify-center transition hover:border-[#937DF8] hover:text-[#937DF8]"
                    >
                      <span>
                        <Plus size={22} className="mx-auto mb-2" />
                        <span>ADD SPEECH</span>
                      </span>
                    </button>
                  ) : (
                    <div className="absolute inset-0 rounded-md border border-[#937DF8]/50 bg-white dark:bg-white/[.08] shadow-xl z-10 flex flex-col">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-white/10">
                        <span className="text-sm font-semibold text-gray-700 dark:text-slate-300">
                          Select Speech
                        </span>
                        <button
                          onClick={() => setDropdownSlot(null)}
                          className="rounded-lg p-1 text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white"
                        >
                          <X size={16} />
                        </button>
                      </div>
                      <div className="flex-1 overflow-y-auto p-2 max-h-[400px]">
                        <div className="space-y-1">
                          {availableSpeeches.map(m => (
                            <button
                              key={m[0]}
                              onClick={() => {
                                const newIds = [...activeIds];
                                newIds[slot] = m[0];
                                setActiveIds(newIds);
                                setDropdownSlot(null);
                              }}
                              className="w-full text-left rounded-lg border border-gray-200 dark:border-white/5 bg-white dark:bg-white/[.02] px-3 py-2 transition hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10"
                            >
                              <div className="flex items-baseline justify-between gap-2">
                                <span className="font-medium text-sm text-gray-900 dark:text-slate-200">
                                  {m[2]}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-slate-500 shrink-0">
                                  {m[3]}
                                </span>
                              </div>
                              <div className="text-xs text-gray-600 dark:text-slate-500 mt-0.5">
                                {m[5]}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            }

            const helixW = helixWidth(speech.rungs);
            const wordCount = speech.paragraphs.reduce(
              (total, p) => total + p.text.split(/\s+/).length,
              0
            );

            const isHoverDialogOpen = hoverDialogSlot === slot;
            const isDropdownOpen = dropdownSlot === slot;
            const availableSpeeches = libraryMeta.filter(
              m => !activeIds.filter(Boolean).includes(m[0]) || m[0] === speech.presidentId
            );

            return (
              <article
                key={speech.presidentId}
                className="relative overflow-visible rounded-md bg-white dark:bg-white/[.05] p-4 backdrop-blur-xl sm:p-5 border border-gray-200 dark:border-transparent"
              >
                {isDropdownOpen && (
                  <div className="absolute inset-0 rounded-md border-2 border-[#937DF8]/50 bg-white dark:bg-white/[.08] shadow-xl z-10 flex flex-col">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-white/10">
                      <span className="text-sm font-semibold text-gray-700 dark:text-slate-300">
                        Select Speech
                      </span>
                      <button
                        onClick={() => setDropdownSlot(null)}
                        className="rounded-lg p-1 text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 max-h-[400px]">
                      <div className="space-y-1">
                        {availableSpeeches.map(m => (
                          <button
                            key={m[0]}
                            onClick={() => {
                              const newIds = [...activeIds];
                              newIds[slot] = m[0];
                              setActiveIds(newIds);
                              setDropdownSlot(null);
                            }}
                            className="w-full text-left rounded-lg border border-gray-200 dark:border-white/5 bg-white dark:bg-white/[.02] px-3 py-2 transition hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10"
                          >
                            <div className="flex items-baseline justify-between gap-2">
                              <span className="font-medium text-sm text-gray-900 dark:text-slate-200">
                                {m[2]}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-slate-500 shrink-0">
                                {m[3]}
                              </span>
                            </div>
                            <div className="text-xs text-gray-600 dark:text-slate-500 mt-0.5">
                              {m[5]}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <div
                        className="relative"
                        onMouseEnter={() => setHoverDialogSlot(slot)}
                        onMouseLeave={() => setHoverDialogSlot(null)}
                      >
                        <h2 className="text-2xl font-medium text-gray-900 dark:text-white cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors underline decoration-1 underline-offset-2">
                          {speech.president}
                        </h2>
                        {isHoverDialogOpen && !isDropdownOpen && (
                          <div className="absolute top-full left-0 z-20 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-gray-200 dark:border-slate-700 p-4 whitespace-nowrap">
                            <p className="text-sm text-gray-900 dark:text-white mb-3">
                              Do you want to pick another president?
                            </p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  const newIds = [...activeIds];
                                  newIds[slot] = null;
                                  setActiveIds(newIds);
                                  setHoverDialogSlot(null);
                                  setDropdownSlot(slot);
                                }}
                                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md transition-colors"
                              >
                                Yes
                              </button>
                              <button
                                onClick={() => setHoverDialogSlot(null)}
                                className="px-4 py-1.5 bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 text-gray-900 dark:text-white text-sm rounded-md transition-colors"
                              >
                                No
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-gray-600 dark:text-slate-400">
                        {speech.year}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-gray-600 dark:text-slate-500">
                      {speech.party}, {eraNames[speech.eraId]}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-slate-500">
                      {wordCount.toLocaleString()} words · {speech.segments.length} segments
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <button
                      aria-label={`Remove ${speech.president}`}
                      onClick={() => {
                        const newIds = [...activeIds];
                        newIds[slot] = null;
                        setActiveIds(newIds);
                      }}
                      className="rounded-lg p-1 text-gray-600 dark:text-slate-500 hover:bg-gray-50 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white"
                    >
                      <X size={15} />
                    </button>
                    <button
                      onClick={() => setExplore(speech)}
                      className="text-[11px] text-gray-700 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white whitespace-nowrap"
                    >
                      Read Speech
                    </button>
                  </div>
                </div>

                <div
                  ref={el => {
                    scrollContainerRefs.current[speech.presidentId] = el;
                  }}
                  className="relative mt-2 mb-1 flex items-center justify-start h-[240px] overflow-x-auto overflow-y-visible no-scrollbar py-8"
                  onScroll={e => {
                    const target = e.currentTarget;
                    setMinimapState(prev => ({
                      ...prev,
                      [speech.presidentId]: {
                        scrollLeft: target.scrollLeft,
                        scrollWidth: target.scrollWidth,
                        clientWidth: target.clientWidth,
                      },
                    }));
                  }}
                >
                  <motion.svg
                    viewBox={`0 0 ${helixW} ${HORIZONTAL_HELIX_HEIGHT}`}
                    className="shrink-0"
                    style={{ width: `${helixW}px`, height: '200px', overflow: 'visible' }}
                    preserveAspectRatio="none"
                    aria-label={`${speech.president} speech DNA helix`}
                  >
                    <path
                      d={`M ${speech.rungs.map(r => `${r.x.toFixed(2)},${r.y1.toFixed(2)}`).join(' L ')}`}
                      fill="none"
                      className="stroke-gray-200 dark:stroke-gray-800"
                      strokeWidth="2"
                    />
                    <path
                      d={`M ${speech.rungs.map(r => `${r.x.toFixed(2)},${r.y2.toFixed(2)}`).join(' L ')}`}
                      fill="none"
                      className="stroke-gray-200 dark:stroke-gray-800"
                      strokeWidth="2"
                    />
                    {speech.rungs.map((r, i) => {
                      const hasOtherFilter = filters.includes('other' as any);
                      const otherFilters = filters.filter(f => f !== ('other' as any));
                      const isOtherRung = r.originalSegment.matchedThemes.length === 0;

                      let matches = false;
                      if (filters.length === 0) {
                        // No filters, show all
                        matches = true;
                      } else {
                        // Check if it matches any of the theme filters
                        const matchesTheme =
                          otherFilters.length > 0 &&
                          otherFilters.some(f => r.originalSegment.matchedThemes.includes(f));
                        // Check if it matches the "Other" filter
                        const matchesOther = hasOtherFilter && isOtherRung;
                        matches = matchesTheme || matchesOther;
                      }

                      const activeR = hover?.r === r || clicked?.r === r;
                      // Calculate distance from hovered rung for magnifying glass effect
                      // Only apply to the speech being hovered
                      const isHoveredSpeech = hover?.speechId === speech.presidentId;
                      const distanceFromHover =
                        hover && isHoveredSpeech ? Math.abs(i - hover.index) : Infinity;

                      // When matches, use the theme color; when doesn't match filter, use pale grey (deactivated)
                      const rungColor = matches ? r.originalSegment.themeColor : '#374151'; // Dark gray for non-matches

                      // Calculate magnification effect - expand the X position and scale
                      let xOffset = 0;
                      let scale = 1;
                      let strokeWidth = 0.9;
                      let circleRadius = 1.8;

                      if (isHoveredSpeech && hover && distanceFromHover <= 4) {
                        // Magnification strength decreases with distance
                        const strength = Math.max(0, 1 - distanceFromHover / 4);
                        const direction = i > hover.index ? 1 : -1;

                        // Push rungs away from center (reduced from 8 to 5)
                        xOffset = direction * distanceFromHover * strength * 5;

                        // Scale up nearby rungs (less aggressive)
                        if (distanceFromHover === 0) {
                          scale = 1.8;
                          strokeWidth = 2.2;
                          circleRadius = 3.0;
                        } else if (distanceFromHover === 1) {
                          scale = 1.5;
                          strokeWidth = 1.5;
                          circleRadius = 2.5;
                        } else {
                          scale = 1 + strength * 0.3;
                          strokeWidth = 0.9 + strength * 0.6;
                          circleRadius = 1.8 + strength * 0.7;
                        }
                      } else if (activeR) {
                        strokeWidth = 2.2;
                        circleRadius = 3.0;
                        scale = 1.8;
                      }

                      const adjustedX = r.x + xOffset;

                      return (
                        <g
                          key={`${speech.presidentId}-${i}`}
                          {...(matches
                            ? {
                                onMouseEnter: e =>
                                  setHover({
                                    r,
                                    index: i,
                                    speechId: speech.presidentId,
                                    x: e.clientX,
                                    y: e.clientY,
                                  }),
                                onMouseMove: e =>
                                  setHover({
                                    r,
                                    index: i,
                                    speechId: speech.presidentId,
                                    x: e.clientX,
                                    y: e.clientY,
                                  }),
                                onMouseLeave: () => setHover(null),
                                onClick: e => {
                                  e.stopPropagation();
                                  setClicked({
                                    r,
                                    x: e.clientX || window.innerWidth / 2,
                                    y: e.clientY || window.innerHeight / 2,
                                  });
                                },
                              }
                            : {})}
                          style={{
                            cursor: matches ? 'pointer' : 'default',
                            transition: 'all .2s ease-out',
                          }}
                          transform={`scale(${scale})`}
                          transform-origin={`${r.x} ${HORIZONTAL_HELIX_HEIGHT / 2}`}
                        >
                          {/* Invisible larger hit area for easier hovering */}
                          <rect
                            x={adjustedX - 3}
                            y={Math.min(r.y1, r.y2) - 3}
                            width={6}
                            height={Math.abs(r.y2 - r.y1) + 6}
                            fill="transparent"
                            pointerEvents={matches ? 'all' : 'none'}
                          />
                          <line
                            x1={adjustedX}
                            x2={adjustedX}
                            y1={r.y1}
                            y2={r.y2}
                            stroke={rungColor}
                            strokeWidth={strokeWidth / scale}
                            pointerEvents="none"
                          />
                          <circle
                            cx={adjustedX}
                            cy={r.y1}
                            r={circleRadius / scale}
                            fill={rungColor}
                            pointerEvents="none"
                          />
                          <circle
                            cx={adjustedX}
                            cy={r.y2}
                            r={circleRadius / scale}
                            fill={rungColor}
                            pointerEvents="none"
                          />
                        </g>
                      );
                    })}
                  </motion.svg>
                </div>

                {/* Minimap Overview */}
                {(() => {
                  const state = minimapState[speech.presidentId];
                  const needsMinimap = state && state.scrollWidth > state.clientWidth + 5;
                  if (!needsMinimap) return null;

                  const minimapWidth = 400;
                  const minimapHeight = 20;
                  const scaleX = minimapWidth / helixW;
                  const viewportWidth = (state.clientWidth / state.scrollWidth) * minimapWidth;
                  const viewportX = (state.scrollLeft / state.scrollWidth) * minimapWidth;

                  const handleMinimapInteraction = (e: React.MouseEvent<SVGSVGElement>) => {
                    const container = scrollContainerRefs.current[speech.presidentId];
                    if (!container) return;
                    const rect = e.currentTarget.getBoundingClientRect();
                    const clickX = e.clientX - rect.left;
                    const scrollRatio = Math.max(0, Math.min(1, clickX / minimapWidth));
                    container.scrollTo({
                      left: scrollRatio * state.scrollWidth,
                      behavior: 'smooth',
                    });
                  };

                  return (
                    <div className="flex justify-center">
                      <div
                        className="relative"
                        data-minimap-id={speech.presidentId}
                        style={{ width: `${minimapWidth}px`, height: `${minimapHeight}px` }}
                      >
                        <svg
                          viewBox={`0 0 ${minimapWidth} ${minimapHeight}`}
                          className="w-full h-full cursor-pointer rounded border border-gray-300 dark:border-white/10 bg-gray-50 dark:bg-white/[.02]"
                          onClick={handleMinimapInteraction}
                        >
                          {/* Miniature rungs */}
                          {speech.rungs.map((r, i) => {
                            const hasOtherFilter = filters.includes('other' as any);
                            const otherFilters = filters.filter(f => f !== ('other' as any));
                            const isOtherRung = r.originalSegment.matchedThemes.length === 0;
                            let matches = false;
                            if (filters.length === 0) {
                              matches = true;
                            } else {
                              const matchesTheme =
                                otherFilters.length > 0 &&
                                otherFilters.some(f => r.originalSegment.matchedThemes.includes(f));
                              const matchesOther = hasOtherFilter && isOtherRung;
                              matches = matchesTheme || matchesOther;
                            }
                            const rungColor = matches ? r.originalSegment.themeColor : '#374151'; // Dark gray for non-matches
                            const miniX = r.x * scaleX;
                            const miniY1 = (r.y1 / HORIZONTAL_HELIX_HEIGHT) * minimapHeight;
                            const miniY2 = (r.y2 / HORIZONTAL_HELIX_HEIGHT) * minimapHeight;
                            return (
                              <line
                                key={i}
                                x1={miniX}
                                x2={miniX}
                                y1={miniY1}
                                y2={miniY2}
                                stroke={rungColor}
                                strokeWidth={0.5}
                                opacity={0.7}
                              />
                            );
                          })}
                        </svg>
                        {/* Viewport indicator */}
                        <div
                          className="absolute top-0 bottom-0 border-2 border-blue-500 dark:border-blue-400 bg-blue-500/20 dark:bg-blue-400/20 cursor-grab active:cursor-grabbing rounded transition-all duration-75 select-none"
                          style={{
                            left: `${viewportX}px`,
                            width: `${viewportWidth}px`,
                          }}
                          onMouseDown={e => {
                            e.preventDefault();
                            setMinimapDragging(speech.presidentId);
                          }}
                        />
                      </div>
                    </div>
                  );
                })()}

                <div className="mt-3 flex items-end gap-4">
                  <div className="flex-1">
                    <div className="text-xs text-gray-700 dark:text-slate-400 font-medium mb-1">
                      Top themes:
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {speech.topThemes.map(t => (
                        <div
                          key={t.themeId}
                          className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-slate-400"
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{
                              backgroundColor: THEMES.find(x => x.id === t.themeId)?.color,
                            }}
                          />
                          <span>{THEMES.find(x => x.id === t.themeId)?.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="relative w-48 shrink-0">
                    <div className="flex h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-white/5">
                      {speech.tallies.map(t => {
                        const foundTheme = THEMES.find(x => x.id === t.themeId);
                        const percentage = (t.count / Math.max(speech.paragraphs.length, 1)) * 100;
                        const isHovered =
                          hoveredCardBar?.speechId === speech.presidentId &&
                          hoveredCardBar?.themeId === t.themeId;
                        const wordCount = speech.paragraphs
                          .reduce((total, p) => total + p.text.split(/\s+/).length, 0)
                          .toLocaleString();
                        return (
                          <span
                            key={t.themeId}
                            onMouseEnter={() =>
                              setHoveredCardBar({
                                speechId: speech.presidentId,
                                themeId: t.themeId,
                              })
                            }
                            onMouseLeave={() => setHoveredCardBar(null)}
                            className="cursor-pointer transition-opacity hover:opacity-80"
                            style={{
                              width: `${Math.max(2, percentage)}%`,
                              backgroundColor: foundTheme?.color,
                            }}
                          />
                        );
                      })}
                      {(() => {
                        const otherCount = speech.paragraphs.filter(
                          p => p.matchedThemes.length === 0
                        ).length;
                        const otherPercentage =
                          (otherCount / Math.max(speech.paragraphs.length, 1)) * 100;
                        return otherCount > 0 ? (
                          <span
                            onMouseEnter={() =>
                              setHoveredCardBar({ speechId: speech.presidentId, themeId: 'other' })
                            }
                            onMouseLeave={() => setHoveredCardBar(null)}
                            className="cursor-pointer transition-opacity hover:opacity-80"
                            style={{
                              width: `${otherPercentage}%`,
                              backgroundColor: OTHER_COLOR,
                            }}
                          />
                        ) : null;
                      })()}
                    </div>
                    {hoveredCardBar?.speechId === speech.presidentId &&
                      (() => {
                        const wordCount = speech.paragraphs
                          .reduce((total, p) => total + p.text.split(/\s+/).length, 0)
                          .toLocaleString();

                        if (hoveredCardBar.themeId === 'other') {
                          const otherCount = speech.paragraphs.filter(
                            p => p.matchedThemes.length === 0
                          ).length;
                          const otherPercentage =
                            (otherCount / Math.max(speech.paragraphs.length, 1)) * 100;
                          return (
                            <div
                              className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1.5 bg-gray-900 dark:bg-gray-800 text-white text-xs rounded shadow-xl whitespace-nowrap pointer-events-none"
                              style={{ zIndex: 10001 }}
                            >
                              <div className="font-medium">{speech.surname}</div>
                              <div className="text-gray-300">{wordCount} words</div>
                              <div>
                                Other: {otherCount} segments ({otherPercentage.toFixed(1)}%)
                              </div>
                            </div>
                          );
                        } else {
                          const t = speech.tallies.find(x => x.themeId === hoveredCardBar.themeId);
                          const foundTheme = THEMES.find(x => x.id === hoveredCardBar.themeId);
                          const percentage =
                            (t!.count / Math.max(speech.paragraphs.length, 1)) * 100;
                          return (
                            <div
                              className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1.5 bg-gray-900 dark:bg-gray-800 text-white text-xs rounded shadow-xl whitespace-nowrap pointer-events-none"
                              style={{ zIndex: 10001 }}
                            >
                              <div className="font-medium">{speech.surname}</div>
                              <div className="text-gray-300">{wordCount} words</div>
                              <div>
                                {foundTheme?.label}: {t!.count} segments ({percentage.toFixed(1)}%)
                              </div>
                            </div>
                          );
                        }
                      })()}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-5 pb-10 sm:px-8">
        <div className="rounded-md bg-white dark:bg-[#1E293B]/60 p-5 sm:p-7 border border-gray-200 dark:border-transparent">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs text-gray-600 dark:text-slate-500">Cross-Speech Analysis</p>
              <h2 className="mt-1 text-2xl font-normal text-gray-900 dark:text-white">
                Theme Frequency Comparison
              </h2>
            </div>
            <div className="flex flex-wrap gap-3">
              {active
                .filter((s): s is AnalyzedSpeech => s !== null)
                .map((s, idx) => (
                  <span
                    key={s.presidentId}
                    className="text-sm text-gray-600 dark:text-slate-400 flex items-center gap-1.5"
                  >
                    <span className="text-xs">{idx + 1}.</span>
                    <span>
                      {s.surname}{' '}
                      <span className="text-xs text-gray-500 dark:text-slate-600">({s.year})</span>
                    </span>
                  </span>
                ))}
            </div>
          </div>
          <div className="mt-12 grid grid-cols-9 gap-2 border-b border-gray-300 dark:border-white/10 pb-2 relative">
            {THEMES.map(t => (
              <div key={t.id} className="flex h-56 flex-col justify-end gap-1 relative">
                <div className="flex h-full items-end justify-center gap-0.5">
                  {active
                    .filter((s): s is AnalyzedSpeech => s !== null)
                    .map((s, idx) => {
                      const count = s.tallies.find(x => x.themeId === t.id)?.count ?? 0;
                      const percentage = (count / Math.max(s.paragraphs.length, 1)) * 100;
                      const themeShades = THEME_SHADES_DARK[t.id] || CHART_COLORS_DARK;
                      const barColor = themeShades[idx % themeShades.length];
                      const wordCount = s.paragraphs
                        .reduce((total, p) => total + p.text.split(/\s+/).length, 0)
                        .toLocaleString();
                      const isHovered =
                        hoveredBar?.themeId === t.id && hoveredBar?.speechIdx === idx;
                      return (
                        <div
                          key={s.presidentId}
                          onMouseEnter={() => setHoveredBar({ themeId: t.id, speechIdx: idx })}
                          onMouseLeave={() => setHoveredBar(null)}
                          className="relative w-full max-w-2 rounded-t-sm cursor-pointer transition-opacity hover:opacity-80"
                          style={{
                            height: `${Math.min(100, Math.max(2, percentage * 4))}%`,
                            backgroundColor: barColor,
                            zIndex: isHovered ? 10000 : 1,
                          }}
                        >
                          {isHovered && (
                            <div
                              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-2 py-1.5 bg-gray-900 dark:bg-gray-800 text-white text-xs rounded shadow-xl whitespace-nowrap pointer-events-none"
                              style={{ zIndex: 10001 }}
                            >
                              <div className="font-medium">
                                {idx + 1}. {s.surname}
                              </div>
                              <div className="text-gray-300">{wordCount} words</div>
                              <div>
                                {count} segments ({percentage.toFixed(1)}%)
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
                <span className="truncate text-center text-xs text-gray-600 dark:text-slate-500">
                  {t.label}
                </span>
              </div>
            ))}
            <div key="other" className="flex h-56 flex-col justify-end gap-1 relative">
              <div className="flex h-full items-end justify-center gap-0.5">
                {active
                  .filter((s): s is AnalyzedSpeech => s !== null)
                  .map((s, idx) => {
                    const otherCount = s.paragraphs.filter(
                      p => p.matchedThemes.length === 0
                    ).length;
                    const percentage = (otherCount / Math.max(s.paragraphs.length, 1)) * 100;
                    const otherShades = [
                      '#D4C4BE',
                      '#B8A8A2',
                      '#9C8C86',
                      '#80706A',
                      '#64544E',
                      '#483832',
                    ];
                    const barColor = otherShades[idx % otherShades.length];
                    const wordCount = s.paragraphs
                      .reduce((total, p) => total + p.text.split(/\s+/).length, 0)
                      .toLocaleString();
                    const isHovered =
                      hoveredBar?.themeId === 'other' && hoveredBar?.speechIdx === idx;
                    return (
                      <div
                        key={s.presidentId}
                        onMouseEnter={() => setHoveredBar({ themeId: 'other', speechIdx: idx })}
                        onMouseLeave={() => setHoveredBar(null)}
                        className="relative w-full max-w-2 rounded-t-sm cursor-pointer transition-opacity hover:opacity-80"
                        style={{
                          height: `${Math.min(100, Math.max(2, percentage * 4))}%`,
                          backgroundColor: barColor,
                          zIndex: isHovered ? 10000 : 1,
                        }}
                      >
                        {isHovered && (
                          <div
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-2 py-1.5 bg-gray-900 dark:bg-gray-800 text-white text-xs rounded shadow-xl whitespace-nowrap pointer-events-none"
                            style={{ zIndex: 10001 }}
                          >
                            <div className="font-medium">
                              {idx + 1}. {s.surname}
                            </div>
                            <div className="text-gray-300">{wordCount} words</div>
                            <div>
                              {otherCount} segments ({percentage.toFixed(1)}%)
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
              <span className="truncate text-center text-xs text-gray-600 dark:text-slate-500">
                Other
              </span>
            </div>
          </div>
        </div>
      </section>

      <section ref={libraryRef} className="mx-auto max-w-[1500px] scroll-mb-5 px-5 pb-10 sm:px-8">
        <div className="overflow-hidden rounded-md bg-white dark:bg-white/[.035] border border-gray-200 dark:border-transparent">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-white/[.04]"
          >
            <span className="flex flex-wrap items-center gap-2">
              <Command size={14} className="text-gray-600 dark:text-slate-500" />
              <strong className="mr-2 text-xs text-gray-700 dark:text-slate-400">
                Speech Library
              </strong>
            </span>
            {expanded ? (
              <ChevronUp size={16} className="text-gray-700 dark:text-slate-400" />
            ) : (
              <span className="flex items-center gap-3 text-[10px] text-gray-600 dark:text-slate-400">
                <span>BROWSE</span>
                <ChevronDown size={16} />
              </span>
            )}
          </button>
          {expanded && (
            <div className="border-t border-gray-300 dark:border-white/10 p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <label className="relative flex-1">
                  <Search
                    size={14}
                    className="absolute left-3 top-2.5 text-gray-500 dark:text-slate-500"
                  />
                  <input
                    aria-label="Search speech library"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Search president or year"
                    className="w-full rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-black/20 py-2 pl-9 pr-3 text-xs text-gray-900 dark:text-slate-100 outline-none focus:border-[#937DF8]"
                  />
                </label>
                <div className="flex flex-wrap gap-1">
                  {(
                    ['all', 'founding', 'civil', 'progressive', 'modern', 'contemporary'] as const
                  ).map(e => (
                    <button
                      key={e}
                      onClick={() => setEra(e)}
                      className={`rounded-md px-2 py-2 text-[10px] ${era === e ? 'bg-gray-900 text-white dark:bg-white dark:text-slate-900' : 'text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-white/10'}`}
                    >
                      {e === 'all' ? 'All' : eraNames[e]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-4 grid max-h-40 grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-4 lg:grid-cols-6">
                {visibleLibrary.map(m => {
                  const selected = activeIds.includes(m[0]);
                  return (
                    <button
                      key={m[0]}
                      onClick={() => {
                        setExplore(ALL_SPEECHES_MAP[m[0]]);
                      }}
                      className={`rounded-lg border p-2 text-left transition ${selected ? 'border-[#937DF8] dark:border-[#F78EF0] bg-[#937DF8]/10 dark:bg-white/10' : 'border-gray-300 dark:border-white/5 bg-white dark:bg-black/10 hover:border-gray-400 dark:hover:border-white/20'}`}
                    >
                      <span className="block text-sm text-gray-900 dark:text-slate-300">
                        {m[2]}
                      </span>
                      <span className="text-xs text-gray-600 dark:text-slate-500">
                        {m[3]}, {m[5]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      <AnimatePresence>
        {hover && !clicked && (
          <motion.div
            initial={{
              opacity: 0,
              y: 5,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
            }}
            transition={{
              duration: 0.1,
            }}
            className="pointer-events-none fixed rounded shadow-xl bg-gray-900 dark:bg-gray-800 px-2 py-1.5 text-xs text-white whitespace-nowrap"
            style={{
              zIndex: 10001,
              left: Math.min(hover.x + 14, window.innerWidth - 340),
              top: Math.min(hover.y + 14, window.innerHeight - 150),
            }}
          >
            <div className="max-w-xs whitespace-normal leading-relaxed mb-1.5">
              {hover.r.originalSegment.text}
            </div>
            <div className="flex flex-wrap gap-2">
              {hover.r.originalSegment.matchedThemes.length > 0 ? (
                hover.r.originalSegment.matchedThemes.map(id => (
                  <span key={id} className="text-gray-300 cursor-default flex items-center gap-1.5">
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{
                        backgroundColor: THEMES.find(t => t.id === id)?.color,
                      }}
                    />
                    {THEMES.find(t => t.id === id)?.label}
                  </span>
                ))
              ) : (
                <span className="text-gray-300 cursor-default flex items-center gap-1.5">
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: OTHER_COLOR }}
                  />
                  Other
                </span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {clicked && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 0.15,
              }}
              className="fixed inset-0 z-[99] bg-black/20"
              onClick={() => setClicked(null)}
            />
            <motion.div
              initial={{
                opacity: 0,
                scale: 0.95,
              }}
              animate={{
                opacity: 1,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                scale: 0.95,
              }}
              transition={{
                duration: 0.15,
              }}
              className="fixed rounded shadow-xl bg-gray-900 dark:bg-gray-800 px-3 py-2 text-xs text-white"
              style={{
                zIndex: 10001,
                left: Math.min(Math.max(clicked.x - 150, 20), window.innerWidth - 340),
                top: Math.min(Math.max(clicked.y - 80, 20), window.innerHeight - 200),
                maxWidth: '300px',
              }}
            >
              <button
                onClick={() => setClicked(null)}
                className="absolute right-1.5 top-1.5 rounded p-1 text-gray-300 hover:bg-white/10 hover:text-white"
                aria-label="Close tooltip"
              >
                <X size={14} />
              </button>
              <div className="pr-6 leading-relaxed mb-1.5">{clicked.r.originalSegment.text}</div>
              <div className="flex flex-wrap gap-2">
                {clicked.r.originalSegment.matchedThemes.length > 0 ? (
                  clicked.r.originalSegment.matchedThemes.map(id => (
                    <span
                      key={id}
                      className="text-gray-300 cursor-default flex items-center gap-1.5"
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{
                          backgroundColor: THEMES.find(t => t.id === id)?.color,
                        }}
                      />
                      {THEMES.find(t => t.id === id)?.label}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-300 cursor-default flex items-center gap-1.5">
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: OTHER_COLOR }}
                    />
                    Other
                  </span>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {explore && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <motion.section
              initial={{
                opacity: 0,
                scale: 0.97,
              }}
              animate={{
                opacity: 1,
                scale: 1,
              }}
              exit={{
                opacity: 0,
              }}
              transition={{
                duration: 0.2,
              }}
              className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-md bg-white text-gray-900"
            >
              <header className="flex flex-shrink-0 items-center justify-between border-b border-gray-200 p-5">
                <div>
                  <h2 className="text-2xl font-normal">{explore.president}</h2>
                  <p className="text-sm text-gray-600">
                    {explore.year}, {explore.party} •{' '}
                    {explore.paragraphs
                      .reduce((total, p) => total + p.text.split(/\s+/).length, 0)
                      .toLocaleString()}{' '}
                    words
                  </p>
                </div>
                <button
                  aria-label="Close speech explorer"
                  onClick={() => {
                    setExplore(null);
                    setParagraphHover(null);
                    setParagraphClicked(null);
                  }}
                  className="rounded-full p-2 hover:bg-gray-100"
                >
                  <X size={18} />
                </button>
              </header>
              <div className="flex-1 overflow-y-auto p-5">
                <div className="mb-5 flex flex-wrap gap-2">
                  {explore.topThemes.map(t => (
                    <span
                      key={t.themeId}
                      className="text-sm text-gray-700 cursor-default flex items-center gap-1.5"
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{
                          backgroundColor: THEMES.find(x => x.id === t.themeId)?.color,
                        }}
                      />
                      {THEMES.find(x => x.id === t.themeId)?.label} ({t.count})
                    </span>
                  ))}
                </div>
                <div className="space-y-4">
                  {explore.paragraphs.map((p, i) => (
                    <div
                      key={`${explore.presidentId}-para-${i}`}
                      className="relative"
                      onMouseEnter={() => setParagraphHover(i)}
                      onMouseLeave={() => setParagraphHover(null)}
                      onClick={e => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setParagraphClicked({
                          index: i,
                          x: rect.left + rect.width / 2,
                          y: rect.top + rect.height / 2,
                        });
                      }}
                    >
                      <p
                        className="border-l-2 pl-4 text-sm leading-6 text-gray-800 cursor-pointer transition-colors hover:bg-gray-50"
                        style={{
                          borderColor: p.themeColor,
                        }}
                      >
                        {p.text}
                      </p>
                      {paragraphHover === i && (
                        <div className="pointer-events-none absolute left-0 top-full z-10 mt-1 hidden rounded-md bg-gray-900 px-3 py-2 text-xs text-white shadow-lg sm:block">
                          <div className="flex flex-wrap gap-2">
                            {p.matchedThemes.length > 0 ? (
                              p.matchedThemes.map(themeId => {
                                const foundTheme = THEMES.find(t => t.id === themeId);
                                return (
                                  <span key={themeId} className="flex items-center gap-1">
                                    <span
                                      className="w-1.5 h-1.5 rounded-full"
                                      style={{
                                        backgroundColor: foundTheme?.color,
                                      }}
                                    />
                                    {foundTheme?.label}
                                  </span>
                                );
                              })
                            ) : (
                              <span className="flex items-center gap-1">
                                <span
                                  className="w-1.5 h-1.5 rounded-full"
                                  style={{
                                    backgroundColor: OTHER_COLOR,
                                  }}
                                />
                                Other
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </motion.section>
          </div>
        )}
      </AnimatePresence>

      {/* Paragraph click tooltip for mobile */}
      {paragraphClicked && explore && (
        <>
          <div
            className="fixed inset-0 z-[60] sm:hidden"
            onClick={() => setParagraphClicked(null)}
          />
          <div
            className="fixed z-[70] rounded-md bg-slate-900 px-4 py-3 text-xs text-white shadow-xl sm:hidden"
            style={{
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              maxWidth: '90vw',
            }}
          >
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="font-medium">Themes in this paragraph:</span>
              <button
                onClick={() => setParagraphClicked(null)}
                className="rounded-lg p-1 hover:bg-white/10"
              >
                <X size={14} />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {explore.paragraphs[paragraphClicked.index]?.matchedThemes.length > 0 ? (
                explore.paragraphs[paragraphClicked.index]?.matchedThemes.map(themeId => {
                  const foundTheme = THEMES.find(t => t.id === themeId);
                  return (
                    <span key={themeId} className="flex items-center gap-1.5">
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{
                          backgroundColor: foundTheme?.color,
                        }}
                      />
                      {foundTheme?.label}
                    </span>
                  );
                })
              ) : (
                <span className="flex items-center gap-1.5">
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: OTHER_COLOR }}
                  />
                  Other
                </span>
              )}
            </div>
          </div>
        </>
      )}
    </main>
  );
}

export default SpeechDNADashboard;

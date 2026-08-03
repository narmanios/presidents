import { useMemo, useState } from 'react';
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
  x1: number;
  x2: number;
  y: number;
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
    color: '#00FF41',
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
    color: '#FF0000',
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
    color: '#FFC107',
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
    color: '#00BFFF',
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
    color: '#FF1493',
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
    color: '#FF5F1F',
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
    color: '#00FFFF',
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
    color: '#8A2BE2',
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

const HELIX_WIDTH = 148,
  HELIX_HEIGHT = 306,
  HELIX_PAD = 14,
  HELIX_AMP = 46,
  TARGET_RUNGS = 100;

const CHART_COLORS = ['#D96B6B', '#6FA0E5', '#5FBD72', '#E5B445']; // Red, Blue, Green, Yellow

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
  const usable = HELIX_HEIGHT - HELIX_PAD * 2;
  const spacing = usable / Math.max(segments.length - 1, 1);
  return segments.map((segment, i) => {
    const angle = i * 0.143;
    return {
      segment,
      originalSegment: segment,
      x1: HELIX_WIDTH / 2 + Math.sin(angle) * HELIX_AMP,
      x2: HELIX_WIDTH / 2 - Math.sin(angle) * HELIX_AMP,
      y: HELIX_PAD + i * spacing,
    };
  });
}

function normalizeRungs(speech: AnalyzedSpeech): RungGeom[] {
  if (speech.segments.length === 0) return buildRungs([]);

  // Only include segments that have at least one theme match (exclude grey/unthemed segments)
  const themedSegments = speech.segments.filter(seg => seg.matchedThemes.length > 0);

  if (themedSegments.length === 0) return buildRungs([]);

  // Only use actual themed segments, don't pad or repeat
  const normalized: AnalyzedSegment[] =
    themedSegments.length >= TARGET_RUNGS ? themedSegments.slice(0, TARGET_RUNGS) : themedSegments;

  return buildRungs(normalized).map((rung, i) => ({
    ...rung,
    originalSegment: normalized[i],
  }));
}

function analyzeSpeech(speech: SpeechEntry): AnalyzedSpeech {
  const paragraphs = speech.paragraphs.map(text => {
    const lower = text.toLowerCase();
    const matchedThemes = THEMES.filter(t => t.keywords.some(k => lower.includes(k))).map(
      t => t.id
    );
    const dominant = matchedThemes[0] ?? 'none';
    return {
      text,
      matchedThemes,
      dominant,
      themeColor: THEMES.find(t => t.id === dominant)?.color ?? '#475569',
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
    'biden2023',
    'arthur1882',
    'bush2008',
    'clinton2000',
  ]);
  const [filters, setFilters] = useState<ThemeId[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState('');
  const [era, setEra] = useState<EraId | 'all'>('all');
  const [explore, setExplore] = useState<AnalyzedSpeech | null>(null);
  const [hover, setHover] = useState<{
    r: RungGeom;
    x: number;
    y: number;
  } | null>(null);
  const [clicked, setClicked] = useState<{
    r: RungGeom;
    x: number;
    y: number;
  } | null>(null);
  const [dropdownSlot, setDropdownSlot] = useState<number | null>(null);
  const [paragraphHover, setParagraphHover] = useState<number | null>(null);
  const [paragraphClicked, setParagraphClicked] = useState<{
    index: number;
    x: number;
    y: number;
  } | null>(null);

  const active = activeIds.map(id => (id ? ALL_SPEECHES_MAP[id] : null));
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
    <main className="min-h-screen bg-[#0F172A] text-slate-100 selection:bg-blue-500/30">
      <header className="mx-auto max-w-[1500px] px-5 pb-7 pt-8 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <div className="mb-3 flex items-center gap-2 text-[10px] tracking-[.28em] text-slate-500">
              {/* <Activity size={13} className="text-blue-400" /> */}
              {/* <span>ARCHIVE / ANALYSIS SYSTEM</span> */}
            </div>
            <h1 className="text-4xl font-normal text-white sm:text-6xl">Presidential Speech DNA</h1>
          </div>
          {/* <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-3 py-2 text-[10px] text-slate-400">
            <Sparkles size={13} className="text-cyan-400" />
            <span>THEME DETECTION · LIVE</span>
          </div> */}
        </div>
      </header>

      <section className="mx-auto max-w-[1500px] px-5 sm:px-8">
        <div className="overflow-hidden rounded-md bg-white/[.035]">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-white/[.04]"
          >
            <span className="flex flex-wrap items-center gap-2">
              <Command size={14} className="text-slate-500" />
              <strong className="mr-2 text-xs text-slate-400">Speech Library</strong>
            </span>
            {expanded ? (
              <ChevronUp size={16} />
            ) : (
              <span className="flex items-center gap-3 text-[10px] text-slate-400">
                <span>BROWSE</span>
                <ChevronDown size={16} />
              </span>
            )}
          </button>
          {expanded && (
            <div className="border-t border-white/10 p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <label className="relative flex-1">
                  <Search size={14} className="absolute left-3 top-2.5 text-slate-500" />
                  <input
                    aria-label="Search speech library"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Search president or year"
                    className="w-full rounded-lg border border-white/10 bg-black/20 py-2 pl-9 pr-3 text-xs outline-none focus:border-blue-400"
                  />
                </label>
                <div className="flex flex-wrap gap-1">
                  {(
                    ['all', 'founding', 'civil', 'progressive', 'modern', 'contemporary'] as const
                  ).map(e => (
                    <button
                      key={e}
                      onClick={() => setEra(e)}
                      className={`rounded-md px-2 py-2 text-[10px] ${era === e ? 'bg-white text-slate-900' : 'text-slate-400 hover:bg-white/10'}`}
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
                      className={`rounded-lg border p-2 text-left transition ${selected ? 'border-white/30 bg-white/10' : 'border-white/5 bg-black/10 hover:border-white/20'}`}
                    >
                      <span className="block text-sm text-slate-300">{m[2]}</span>
                      <span className="text-xs text-slate-500">
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

      <section className="mx-auto max-w-[1500px] px-5 sm:px-8 mt-8">
        <nav aria-label="Global theme filter" className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilters([])}
            className={`px-2 py-1 text-xs transition ${filters.length === 0 ? 'text-white' : 'text-slate-600 hover:text-slate-400'}`}
          >
            All Themes
          </button>
          {THEMES.map(t => (
            <button
              key={t.id}
              onClick={() => toggleTheme(t.id)}
              className={`px-2 py-1 text-xs transition flex items-center gap-1.5 ${filters.includes(t.id) ? 'text-white' : 'text-slate-600 hover:text-slate-400'}`}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: t.color }} />
              {t.label}
            </button>
          ))}
        </nav>
      </section>

      <div className="mx-auto max-w-[1500px] px-5 sm:px-8 mt-8">
        <p className="mb-1 text-sm text-slate-400">
          <span>{active.filter(Boolean).length} of 4 presidents can be viewed at a time</span>
        </p>
      </div>

      <section className="mx-auto grid max-w-[1500px] grid-cols-1 gap-5 px-5 py-5 sm:grid-cols-2 sm:px-8 xl:grid-cols-4">
        {[0, 1, 2, 3].map(slot => {
          const speech = active[slot];
          if (!speech) {
            const isDropdownOpen = dropdownSlot === slot;
            const availableSpeeches = libraryMeta.filter(
              m => !activeIds.filter(Boolean).includes(m[0])
            );

            return (
              <div
                key={`empty-${slot}`}
                className="relative flex min-h-[585px] items-center justify-center rounded-md border border-dashed border-white/15 text-xs text-slate-500"
              >
                {!isDropdownOpen ? (
                  <button
                    onClick={() => setDropdownSlot(slot)}
                    className="w-full h-full flex items-center justify-center transition hover:border-blue-400 hover:text-blue-300"
                  >
                    <span>
                      <Plus size={22} className="mx-auto mb-2" />
                      <span>ADD SPEECH</span>
                    </span>
                  </button>
                ) : (
                  <div className="absolute inset-0 rounded-md border border-blue-400/50 bg-white/[.08] p-4 flex flex-col">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-slate-300">Select Speech</span>
                      <button
                        onClick={() => setDropdownSlot(null)}
                        className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-1">
                      {availableSpeeches.map(m => (
                        <button
                          key={m[0]}
                          onClick={() => {
                            const newIds = [...activeIds];
                            newIds[slot] = m[0];
                            setActiveIds(newIds);
                            setDropdownSlot(null);
                          }}
                          className="w-full text-left rounded-lg border border-white/5 bg-black/10 p-2 transition hover:border-white/20 hover:bg-white/10"
                        >
                          <span className="block text-sm text-slate-300">{m[2]}</span>
                          <span className="text-xs text-slate-500">
                            {m[3]}, {m[5]}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          }

          return (
            <article
              key={speech.presidentId}
              className="overflow-visible rounded-md bg-white/[.05] p-4 backdrop-blur-xl sm:p-5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-medium">{speech.president}</h2>
                    <span className="text-sm text-slate-400">{speech.year}</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    {speech.party}, {eraNames[speech.eraId]}
                  </p>
                  <p className="text-sm text-slate-500">
                    {speech.paragraphs
                      .reduce((total, p) => total + p.text.split(/\s+/).length, 0)
                      .toLocaleString()}{' '}
                    words
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
                    className="rounded-lg p-1 text-slate-500 hover:bg-white/10 hover:text-white"
                  >
                    <X size={15} />
                  </button>
                  <button
                    onClick={() => setExplore(speech)}
                    className="text-[11px] text-slate-300 hover:text-white whitespace-nowrap"
                  >
                    Read Speech
                  </button>
                </div>
              </div>

              <div className="relative flex justify-center overflow-visible py-2">
                <motion.svg
                  viewBox={`0 0 ${HELIX_WIDTH} ${HELIX_HEIGHT}`}
                  className="h-[420px] w-[200px] sm:h-[480px] sm:w-[220px]"
                  animate={{
                    scale: [1, 1.02, 1],
                  }}
                  transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  aria-label={`${speech.president} speech DNA helix`}
                >
                  <path
                    d={`M ${speech.rungs.map(r => `${r.x1.toFixed(2)},${r.y.toFixed(2)}`).join(' L ')}`}
                    fill="none"
                    stroke="#374151"
                    strokeWidth="2"
                  />
                  <path
                    d={`M ${speech.rungs.map(r => `${r.x2.toFixed(2)},${r.y.toFixed(2)}`).join(' L ')}`}
                    fill="none"
                    stroke="#374151"
                    strokeWidth="2"
                  />
                  {speech.rungs.map((r, i) => {
                    const matches =
                      filters.length === 0 ||
                      filters.some(f => r.originalSegment.matchedThemes.includes(f));
                    const activeR = hover?.r === r || clicked?.r === r;
                    const rungColor = matches ? r.originalSegment.themeColor : '#475569';
                    return (
                      <g
                        key={`${speech.presidentId}-${i}`}
                        onMouseEnter={e =>
                          setHover({
                            r,
                            x: e.clientX,
                            y: e.clientY,
                          })
                        }
                        onMouseMove={e =>
                          setHover({
                            r,
                            x: e.clientX,
                            y: e.clientY,
                          })
                        }
                        onMouseLeave={() => setHover(null)}
                        onClick={e => {
                          e.stopPropagation();
                          setClicked({
                            r,
                            x: e.clientX || window.innerWidth / 2,
                            y: e.clientY || window.innerHeight / 2,
                          });
                        }}
                        style={{
                          cursor: 'pointer',
                          transition: 'all .2s',
                        }}
                      >
                        <line
                          x1={r.x1}
                          x2={r.x2}
                          y1={r.y}
                          y2={r.y}
                          stroke={rungColor}
                          strokeWidth={activeR ? 1.8 : 0.8}
                        />
                        <circle cx={r.x1} cy={r.y} r={activeR ? 2 : 1.2} fill={rungColor} />
                        <circle cx={r.x2} cy={r.y} r={activeR ? 2 : 1.2} fill={rungColor} />
                      </g>
                    );
                  })}
                </motion.svg>
              </div>

              <div className="mt-2">
                <div className="flex h-2 overflow-hidden rounded-full bg-white/5">
                  {speech.tallies.map(t => {
                    const theme = THEMES.find(x => x.id === t.themeId);
                    const percentage = (t.count / Math.max(speech.paragraphs.length, 1)) * 100;
                    return (
                      <span
                        key={t.themeId}
                        title={`${theme?.label}: ${t.count} segments (${percentage.toFixed(1)}%)`}
                        className="cursor-default transition-opacity hover:opacity-80"
                        style={{
                          width: `${Math.max(2, percentage)}%`,
                          backgroundColor: theme?.color,
                        }}
                      />
                    );
                  })}
                  {(() => {
                    const themedCount = speech.tallies.reduce((sum, t) => sum + t.count, 0);
                    const otherCount = speech.paragraphs.length - themedCount;
                    const otherPercentage =
                      (otherCount / Math.max(speech.paragraphs.length, 1)) * 100;
                    return otherCount > 0 ? (
                      <span
                        title={`Other: ${otherCount} segments (${otherPercentage.toFixed(1)}%)`}
                        className="cursor-default transition-opacity hover:opacity-80"
                        style={{
                          width: `${otherPercentage}%`,
                          backgroundColor: '#475569',
                        }}
                      />
                    ) : null;
                  })()}
                </div>
                <div className="mt-3 space-y-1">
                  {speech.topThemes.map(t => (
                    <div key={t.themeId} className="flex items-center gap-2 text-xs text-slate-400">
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: THEMES.find(x => x.id === t.themeId)?.color }}
                      />
                      <span>{THEMES.find(x => x.id === t.themeId)?.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </article>
          );
        })}
      </section>

      <section className="mx-auto max-w-[1500px] px-5 pb-10 sm:px-8">
        <div className="rounded-md bg-[#1E293B]/60 p-5 sm:p-7">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs text-slate-500">Cross-Speech Analysis</p>
              <h2 className="mt-1 text-2xl font-normal">Theme Frequency Comparison</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              {active
                .filter((s): s is AnalyzedSpeech => s !== null)
                .map((s, idx) => (
                  <span
                    key={s.presidentId}
                    className="text-sm text-slate-400 flex items-center gap-1.5"
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                    />
                    {s.surname}
                  </span>
                ))}
            </div>
          </div>
          <div className="mt-8 grid grid-cols-8 gap-2 border-b border-white/10 pb-2">
            {THEMES.map(t => (
              <div key={t.id} className="flex h-44 flex-col justify-end gap-1">
                <div className="flex h-full items-end justify-center gap-0.5">
                  {active
                    .filter((s): s is AnalyzedSpeech => s !== null)
                    .map((s, idx) => {
                      const count = s.tallies.find(x => x.themeId === t.id)?.count ?? 0;
                      return (
                        <div
                          key={s.presidentId}
                          title={`${s.surname}: ${count}`}
                          className="w-full max-w-3 rounded-t-sm"
                          style={{
                            height: `${Math.max(4, Math.min(100, (count / Math.max(s.paragraphs.length, 1)) * 900))}%`,
                            backgroundColor: CHART_COLORS[idx % CHART_COLORS.length],
                          }}
                        />
                      );
                    })}
                </div>
                <span className="truncate text-center text-xs text-slate-500">{t.label}</span>
              </div>
            ))}
          </div>
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
            className="pointer-events-none fixed z-[100] max-w-xs rounded-xl border border-white/15 bg-[#111827]/95 p-3 text-xs leading-relaxed text-slate-200 shadow-2xl"
            style={{
              left: Math.min(hover.x + 14, window.innerWidth - 340),
              top: Math.min(hover.y + 14, window.innerHeight - 150),
            }}
          >
            <p>{hover.r.originalSegment.text}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {hover.r.originalSegment.matchedThemes.map(id => (
                <span
                  key={id}
                  className="text-xs text-slate-400 cursor-default flex items-center gap-1.5"
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: THEMES.find(t => t.id === id)?.color }}
                  />
                  {THEMES.find(t => t.id === id)?.label}
                </span>
              ))}
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
              className="fixed z-[100] max-w-xs rounded-xl border border-white/15 bg-[#111827]/98 p-3 text-xs leading-relaxed text-slate-200 shadow-2xl"
              style={{
                left: Math.min(Math.max(clicked.x - 150, 20), window.innerWidth - 340),
                top: Math.min(Math.max(clicked.y - 80, 20), window.innerHeight - 200),
              }}
            >
              <button
                onClick={() => setClicked(null)}
                className="absolute right-2 top-2 rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white"
                aria-label="Close tooltip"
              >
                <X size={14} />
              </button>
              <p className="pr-6">{clicked.r.originalSegment.text}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {clicked.r.originalSegment.matchedThemes.map(id => (
                  <span
                    key={id}
                    className="text-xs text-slate-400 cursor-default flex items-center gap-1.5"
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: THEMES.find(t => t.id === id)?.color }}
                    />
                    {THEMES.find(t => t.id === id)?.label}
                  </span>
                ))}
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
              className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-md bg-white text-slate-900"
            >
              <header className="flex flex-shrink-0 items-center justify-between border-b border-slate-200 p-5">
                <div>
                  <h2 className="text-2xl font-normal">{explore.president}</h2>
                  <p className="text-sm text-slate-500">
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
                  className="rounded-full p-2 hover:bg-slate-100"
                >
                  <X size={18} />
                </button>
              </header>
              <div className="flex-1 overflow-y-auto p-5">
                <div className="mb-5 flex flex-wrap gap-2">
                  {explore.topThemes.map(t => (
                    <span
                      key={t.themeId}
                      className="text-sm text-slate-600 cursor-default flex items-center gap-1.5"
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: THEMES.find(x => x.id === t.themeId)?.color }}
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
                        className="border-l-2 pl-4 text-sm leading-6 text-slate-700 cursor-pointer transition-colors hover:bg-slate-50"
                        style={{
                          borderColor: p.themeColor,
                        }}
                      >
                        {p.text}
                      </p>
                      {paragraphHover === i && (
                        <div className="pointer-events-none absolute left-0 top-full z-10 mt-1 hidden rounded-md bg-slate-900 px-3 py-2 text-xs text-white shadow-lg sm:block">
                          <div className="flex flex-wrap gap-2">
                            {p.matchedThemes.length > 0 ? (
                              p.matchedThemes.map(themeId => {
                                const theme = THEMES.find(t => t.id === themeId);
                                return (
                                  <span key={themeId} className="flex items-center gap-1">
                                    <span
                                      className="w-1.5 h-1.5 rounded-full"
                                      style={{ backgroundColor: theme?.color }}
                                    />
                                    {theme?.label}
                                  </span>
                                );
                              })
                            ) : (
                              <span className="flex items-center gap-1">
                                <span
                                  className="w-1.5 h-1.5 rounded-full"
                                  style={{ backgroundColor: '#475569' }}
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
                  const theme = THEMES.find(t => t.id === themeId);
                  return (
                    <span key={themeId} className="flex items-center gap-1.5">
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: theme?.color }}
                      />
                      {theme?.label}
                    </span>
                  );
                })
              ) : (
                <span className="flex items-center gap-1.5">
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: '#475569' }}
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

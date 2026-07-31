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
    color: '#10B981',
    keywords: [
      'economy',
      'jobs',
      'unemployment',
      'inflation',
      'growth',
      'deficit',
      'revenue',
      'trade',
      'manufacturing',
      'tax',
      'banking',
      'debt',
      'currency',
      'tariff',
      'fiscal',
      'commerce',
      'wages',
      'budget',
      'spending',
    ],
  },
  {
    id: 'healthcare',
    label: 'Healthcare',
    short: 'HLTH',
    color: '#F43F5E',
    keywords: [
      'health',
      'medicare',
      'medicaid',
      'insulin',
      'drug',
      'prescription',
      'hospital',
      'cancer',
      'disease',
      'insurance',
      'medical',
      'pandemic',
      'vaccine',
      'care',
      'illness',
      'surgery',
      'treatment',
      'nursing',
      'diabetes',
    ],
  },
  {
    id: 'security',
    label: 'Security',
    short: 'SEC',
    color: '#F59E0B',
    keywords: [
      'security',
      'military',
      'terror',
      'war',
      'troops',
      'defense',
      'iraq',
      'afghanistan',
      'attack',
      'border',
      'police',
      'army',
      'navy',
      'arms',
      'weapon',
      'force',
      'missile',
      'nuclear',
      'combat',
      'soldier',
    ],
  },
  {
    id: 'education',
    label: 'Education',
    short: 'EDU',
    color: '#0EA5E9',
    keywords: [
      'education',
      'school',
      'college',
      'student',
      'teacher',
      'learning',
      'children',
      'graduate',
      'university',
      'literacy',
      'classroom',
      'training',
      'preschool',
    ],
  },
  {
    id: 'bipartisan',
    label: 'Bipartisan',
    short: 'BPRT',
    color: '#8B5CF6',
    keywords: [
      'bipartisan',
      'together',
      'democrats',
      'republicans',
      'congress',
      'unity',
      'coalition',
      'cooperation',
      'common',
      'both parties',
      'signed',
      'passed',
    ],
  },
  {
    id: 'foreign',
    label: 'Foreign Policy',
    short: 'FGPOL',
    color: '#F97316',
    keywords: [
      'foreign',
      'international',
      'treaty',
      'allies',
      'diplomacy',
      'ukraine',
      'china',
      'russia',
      'nations',
      'britain',
      'france',
      'mexico',
      'republic',
      'nato',
      'ambassador',
      'sovereignty',
      'aggression',
    ],
  },
  {
    id: 'environment',
    label: 'Environment',
    short: 'ENV',
    color: '#14B8A6',
    keywords: [
      'climate',
      'energy',
      'environment',
      'clean',
      'emissions',
      'oil',
      'renewable',
      'conservation',
      'land',
      'forest',
      'water',
      'pollution',
      'electric',
      'solar',
      'carbon',
      'drought',
      'flood',
      'wildfire',
    ],
  },
  {
    id: 'democracy',
    label: 'Democracy',
    short: 'DEM',
    color: '#6366F1',
    keywords: [
      'democracy',
      'freedom',
      'rights',
      'constitution',
      'vote',
      'liberty',
      'justice',
      'equality',
      'suffrage',
      'republic',
      'citizen',
      'civil',
      'january 6',
      'insurrection',
      'autocracy',
      'protest',
      'law',
    ],
  },
];

const HELIX_WIDTH = 148,
  HELIX_HEIGHT = 306,
  HELIX_PAD = 14,
  HELIX_AMP = 46,
  TARGET_RUNGS = 100;

const ACCENTS: Record<string, string> = {
  biden: '#3B82F6',
  arthur: '#D97706',
  bush: '#EF4444',
  clinton: '#8B5CF6',
  adams: '#E2B96A',
  jefferson: '#4ADE80',
  madison: '#A3E635',
  monroe: '#FB7185',
  jackson: '#FB923C',
  fillmore: '#94A3B8',
  buchanan: '#A78BFA',
  johnson: '#818CF8',
  grant: '#C084FC',
  hayes: '#34D399',
  cleveland: '#FB7185',
  harrison: '#F472B6',
  buren: '#34D399',
  coolidge: '#FBBF24',
  eisenhower: '#38BDF8',
  kennedy: '#60A5FA',
  nixon: '#E879F9',
  ford: '#F97316',
  obama: '#34D399',
  roosevelt: '#FB923C',
  washington: '#E2B96A',
  lincoln: '#C084FC',
  truman: '#60A5FA',
  reagan: '#EF4444',
  carter: '#14B8A6',
  wilson: '#8B5CF6',
  taft: '#F59E0B',
  hoover: '#94A3B8',
  mckinley: '#A78BFA',
  pierce: '#818CF8',
  polk: '#A3E635',
  taylor: '#FB7185',
  tyler: '#F472B6',
  harding: '#FBBF24',
  trump: '#EF4444',
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
  const [activeIds, setActiveIds] = useState([
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
  const [dropdownSlot, setDropdownSlot] = useState<number | null>(null);

  const active = activeIds.map(id => ALL_SPEECHES_MAP[id]).filter(Boolean);
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
    <main className="min-h-screen bg-[#0F172A] text-slate-100 font-mono selection:bg-blue-500/30">
      <header className="mx-auto max-w-[1500px] px-5 pb-7 pt-8 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <div className="mb-3 flex items-center gap-2 text-[10px] tracking-[.28em] text-slate-500">
              {/* <Activity size={13} className="text-blue-400" /> */}
              {/* <span>ARCHIVE / ANALYSIS SYSTEM</span> */}
            </div>
            <h1 className="font-sans text-4xl font-extrabold tracking-tight text-white sm:text-6xl">
              Presidential Speech{' '}
              <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-violet-400 bg-clip-text text-transparent">
                DNA
              </span>
            </h1>
          </div>
          {/* <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-3 py-2 text-[10px] text-slate-400">
            <Sparkles size={13} className="text-cyan-400" />
            <span>THEME DETECTION · LIVE</span>
          </div> */}
        </div>
      </header>

      <section className="mx-auto max-w-[1500px] px-5 sm:px-8">
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[.035]">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-white/[.04]"
          >
            <span className="flex flex-wrap items-center gap-2">
              <Command size={14} className="text-slate-500" />
              <strong className="mr-2 text-[10px] tracking-[.18em] text-slate-400">
                SPEECH LIBRARY
              </strong>
              {active.map(s => (
                <span
                  key={s.presidentId}
                  className="rounded-md px-2 py-1 text-[10px]"
                  style={{
                    color: s.accent,
                    backgroundColor: `${s.accent}18`,
                  }}
                >
                  {s.surname} · {s.year}
                </span>
              ))}
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
                        if (selected) setActiveIds(activeIds.filter(id => id !== m[0]));
                        else if (activeIds.length < 4) setActiveIds([...activeIds, m[0]]);
                      }}
                      className={`rounded-lg border p-2 text-left transition ${selected ? 'border-white/30 bg-white/10' : 'border-white/5 bg-black/10 hover:border-white/20'}`}
                    >
                      <span className="block text-[10px] font-bold" style={{ color: m[6] }}>
                        {m[2]}
                      </span>
                      <span className="text-[9px] text-slate-500">
                        {m[3]} · {m[5]}
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 flex justify-between text-[10px] text-slate-500">
                <span>
                  Showing {visibleLibrary.length} of {libraryMeta.length} speeches
                </span>
                <span>{activeIds.length} / 4 selected</span>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-5 sm:px-8 mt-8">
        <nav aria-label="Global theme filter" className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilters([])}
            className={`rounded-full border px-3 py-2 text-[10px] font-bold tracking-wider transition ${filters.length === 0 ? 'border-white/30 bg-white text-slate-900' : 'border-white/10 bg-white/[.04] text-slate-400 hover:bg-white/10'}`}
          >
            ALL
          </button>
          {THEMES.map(t => (
            <button
              key={t.id}
              onClick={() => toggleTheme(t.id)}
              title={t.label}
              className="rounded-full border px-3 py-2 text-[10px] font-bold tracking-wider transition hover:-translate-y-0.5"
              style={{
                borderColor: filters.includes(t.id) ? t.color : 'rgba(255,255,255,.1)',
                backgroundColor: filters.includes(t.id) ? `${t.color}22` : 'rgba(255,255,255,.04)',
                color: filters.includes(t.id) ? t.color : '#94a3b8',
              }}
            >
              {t.short}
            </button>
          ))}
        </nav>
      </section>

      <div className="mx-auto max-w-[1500px] px-5 sm:px-8 mt-8">
        <p className="mb-1 text-xs text-slate-400">
          <span>{active.length} / 4 presidents (view max of 4 at one time)</span>
        </p>
      </div>

      <section className="mx-auto grid max-w-[1500px] grid-cols-1 gap-5 px-5 py-5 sm:grid-cols-2 sm:px-8 xl:grid-cols-4">
        {[0, 1, 2, 3].map(slot => {
          const speech = active[slot];
          if (!speech) {
            const isDropdownOpen = dropdownSlot === slot;
            const availableSpeeches = libraryMeta.filter(
              m => !activeIds.includes(m[0])
            );
            
            return (
              <div
                key={`empty-${slot}`}
                className="relative flex min-h-[585px] items-center justify-center rounded-3xl border border-dashed border-white/15 text-xs text-slate-500"
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
                  <div className="absolute inset-0 rounded-3xl border border-blue-400/50 bg-white/[.08] p-4 flex flex-col">
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
                            if (activeIds.length < 4) {
                              setActiveIds([...activeIds, m[0]]);
                              setDropdownSlot(null);
                            }
                          }}
                          className="w-full text-left rounded-lg border border-white/5 bg-black/10 p-2 transition hover:border-white/20 hover:bg-white/10"
                        >
                          <span className="block text-[10px] font-bold" style={{ color: m[6] }}>
                            {m[2]}
                          </span>
                          <span className="text-[9px] text-slate-500">
                            {m[3]} · {m[5]}
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
              className="overflow-visible rounded-3xl border border-white/[.08] bg-white/[.05] p-4 backdrop-blur-xl sm:p-5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-sans text-xl font-bold tracking-tight">
                      {speech.president}
                    </h2>
                    <span className="rounded bg-white/10 px-2 py-1 text-[10px] text-slate-400">
                      {speech.year}
                    </span>
                  </div>
                  <p className="mt-1 text-[10px] uppercase tracking-widest text-slate-500">
                    {speech.party} · {eraNames[speech.eraId]}
                  </p>
                  <p className="text-[10px] uppercase tracking-widest text-slate-500">
                    {speech.paragraphs
                      .reduce((total, p) => total + p.text.split(/\s+/).length, 0)
                      .toLocaleString()}{' '}
                    words
                  </p>
                </div>
                <button
                  aria-label={`Remove ${speech.president}`}
                  onClick={() => setActiveIds(activeIds.filter(id => id !== speech.presidentId))}
                  className="rounded-lg p-1 text-slate-500 hover:bg-white/10 hover:text-white"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="mt-3 flex min-h-5 flex-wrap gap-1">
                {speech.topThemes.map(t => (
                  <span
                    key={t.themeId}
                    title={THEMES.find(x => x.id === t.themeId)?.label}
                    className="rounded px-2 py-1 text-[9px] cursor-default"
                    style={{
                      backgroundColor: `${THEMES.find(x => x.id === t.themeId)?.color}20`,
                      color: THEMES.find(x => x.id === t.themeId)?.color,
                    }}
                  >
                    {THEMES.find(x => x.id === t.themeId)?.short} {t.count}
                  </span>
                ))}
              </div>

              <div className="relative flex justify-center overflow-visible py-2">
                <motion.svg
                  viewBox={`0 0 ${HELIX_WIDTH} ${HELIX_HEIGHT}`}
                  className="h-[390px] w-[148px] sm:h-[440px]"
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
                    const activeR = hover?.r === r;
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
                        style={{
                          opacity: matches ? 1 : 0.15,
                          cursor: 'crosshair',
                          transition: 'opacity .2s',
                        }}
                      >
                        <line
                          x1={r.x1}
                          x2={r.x2}
                          y1={r.y}
                          y2={r.y}
                          stroke={r.originalSegment.themeColor}
                          strokeWidth={activeR ? 1.8 : 0.8}
                        />
                        <circle
                          cx={r.x1}
                          cy={r.y}
                          r={activeR ? 3 : 1.8}
                          fill={r.originalSegment.themeColor}
                        />
                        <circle
                          cx={r.x2}
                          cy={r.y}
                          r={activeR ? 3 : 1.8}
                          fill={r.originalSegment.themeColor}
                        />
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
                        className="cursor-default"
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
                        className="cursor-default"
                        style={{
                          width: `${otherPercentage}%`,
                          backgroundColor: '#475569',
                        }}
                      />
                    ) : null;
                  })()}
                </div>
                <div className="mt-3 flex items-end justify-between gap-3">
                  <div className="space-y-1">
                    {speech.topThemes.map(t => (
                      <div
                        key={t.themeId}
                        className="flex items-center gap-2 text-[10px] text-slate-400"
                      >
                        <i
                          className="h-1.5 w-1.5 rounded-full"
                          style={{
                            backgroundColor: THEMES.find(x => x.id === t.themeId)?.color,
                          }}
                        />
                        <span>{THEMES.find(x => x.id === t.themeId)?.label}</span>
                        <span className="text-slate-600">{t.count}</span>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => setExplore(speech)}
                    className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-[10px] text-slate-300 transition hover:border-white/30 hover:bg-white/10"
                  >
                    SPEECH <ExternalLink size={12} />
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </section>

      <section className="mx-auto max-w-[1500px] px-5 pb-10 sm:px-8">
        <div className="rounded-2xl border border-slate-700/60 bg-[#1E293B]/60 p-5 sm:p-7">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[10px] tracking-[.2em] text-slate-500">CROSS-SPEECH ANALYSIS</p>
              <h2 className="mt-1 font-sans text-2xl font-bold">Theme frequency comparison</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              {active.map(s => (
                <span
                  key={s.presidentId}
                  className="flex items-center gap-2 text-[10px] text-slate-400"
                >
                  <i
                    className="h-2 w-2 rounded-full"
                    style={{
                      backgroundColor: s.accent,
                    }}
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
                  {active.map(s => {
                    const count = s.tallies.find(x => x.themeId === t.id)?.count ?? 0;
                    return (
                      <div
                        key={s.presidentId}
                        title={`${s.surname}: ${count}`}
                        className="w-full max-w-3 rounded-t-sm transition hover:brightness-125"
                        style={{
                          height: `${Math.max(4, Math.min(100, (count / Math.max(s.paragraphs.length, 1)) * 900))}%`,
                          backgroundColor: s.accent,
                        }}
                      />
                    );
                  })}
                </div>
                <span className="truncate text-center text-[8px] text-slate-500">{t.short}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <AnimatePresence>
        {hover && (
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
                  title={THEMES.find(t => t.id === id)?.label}
                  className="rounded px-1.5 py-0.5 text-[9px] cursor-default"
                  style={{
                    color: THEMES.find(t => t.id === id)?.color,
                    backgroundColor: `${THEMES.find(t => t.id === id)?.color}20`,
                  }}
                >
                  {THEMES.find(t => t.id === id)?.short}
                </span>
              ))}
            </div>
          </motion.div>
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
              className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white text-slate-900"
            >
              <header className="flex flex-shrink-0 items-center justify-between border-b border-slate-200 p-5">
                <div>
                  <h2 className="font-sans text-2xl font-bold">{explore.president}</h2>
                  <p className="font-mono text-xs text-slate-500">
                    {explore.year} · {explore.party}
                  </p>
                </div>
                <button
                  aria-label="Close speech explorer"
                  onClick={() => setExplore(null)}
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
                      title={THEMES.find(x => x.id === t.themeId)?.label}
                      className="rounded-full px-3 py-1 text-[10px] cursor-default"
                      style={{
                        color: THEMES.find(x => x.id === t.themeId)?.color,
                        backgroundColor: `${THEMES.find(x => x.id === t.themeId)?.color}18`,
                      }}
                    >
                      {THEMES.find(x => x.id === t.themeId)?.label} · {t.count}
                    </span>
                  ))}
                </div>
                <div className="space-y-4">
                  {explore.paragraphs.map((p, i) => (
                    <p
                      key={`${explore.presidentId}-para-${i}`}
                      className="border-l-2 pl-4 font-sans text-sm leading-6 text-slate-700"
                      style={{
                        borderColor: p.themeColor,
                      }}
                    >
                      {p.text}
                    </p>
                  ))}
                </div>
              </div>
              <footer className="flex-shrink-0 border-t border-slate-200 px-5 py-3 font-mono text-[10px] text-slate-500">
                {explore.paragraphs.length} segments · {explore.themedCount} with detected themes
              </footer>
            </motion.section>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}

export default SpeechDNADashboard;

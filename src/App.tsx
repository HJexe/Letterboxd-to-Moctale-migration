import React, { useState, useCallback } from 'react';
import Papa from 'papaparse';
import { 
  Upload, 
  CheckCircle2, 
  Settings2, 
  Terminal, 
  Copy, 
  Zap, 
  ChevronRight,
  Info,
  Layers,
  Database,
  Search,
  Check,
  Star,
  Film
} from 'lucide-react';
import { cn } from './lib/utils';

/**
 * Moctale Migrator: Sophisticated Dark Edition
 */

interface Movie {
  name: string;
  year: string;
  rating: string;
  date?: string;
}

interface MigrationOptions {
  markWatched: boolean;
  importRatings: boolean;
  delay: number;
}

const RATING_BUCKETS = [
  { id: 'perfection', label: 'Perfection', color: 'bg-blue-500/20 text-blue-400', range: [5, 5], stars: '★★★★★' },
  { id: 'go_for_it', label: 'Go for it', color: 'bg-green-500/20 text-green-400', range: [3.5, 4.5], stars: '★★★★' },
  { id: 'timepass', label: 'Timepass', color: 'bg-yellow-500/20 text-yellow-400', range: [2, 3], stars: '★★★' },
  { id: 'skip', label: 'Skip', color: 'bg-red-500/20 text-red-400', range: [0.5, 1.5], stars: '★★' },
] as const;

const getMoctaleTag = (rating: string) => {
  if (!rating) return null;
  const r = parseFloat(rating);
  if (isNaN(r)) return null;
  if (r >= 5.0) return RATING_BUCKETS[0];
  if (r >= 3.5) return RATING_BUCKETS[1];
  if (r >= 2.0) return RATING_BUCKETS[2];
  return RATING_BUCKETS[3];
};

export default function App() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [activeStep, setActiveStep] = useState(1);
  const [options, setOptions] = useState<MigrationOptions>({
    markWatched: true,
    importRatings: false,
    delay: 1200,
  });
  const [generatedScript, setGeneratedScript] = useState<string>('');
  const [isCopied, setIsCopied] = useState(false);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsed = results.data.map((row: any) => {
          const name = row.Name || row.name || row.Title || row.title || '';
          const year = row.Year || row.year || '';
          const rating = row.Rating || row.rating || '';
          const date = row.Date || row.date || '';
          return { name, year, rating, date };
        }).filter(m => m.name);

        setMovies(parsed as Movie[]);
        setActiveStep(2);
      },
    });
  }, []);

    const generateScript = useCallback(() => {
        const moviesJson = JSON.stringify(movies.map(m => ({ 
            name: m.name, 
            year: m.year, 
            rating: m.rating 
        })), null, 2).replace(/\$/g, '\\$');

        const script = `(async () => {
    const DELAY = ${options.delay};
    const DO_WATCHED = ${options.markWatched};
    const DO_RATINGS = ${options.importRatings};
    const movies = ${moviesJson};

    const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
    const results = { success: 0, fail: 0, notFound: [] };

    console.clear();
    console.log("%c🎬 Moctale Migration Started", "color: #3b82f6; font-size: 20px; font-weight: bold;");
    
    for (let i = 0; i < movies.length; i++) {
        const film = movies[i];
        const progress = "[ " + (i + 1) + " / " + movies.length + " ]";
        try {
            const searchRes = await fetch("/api/search?q=" + encodeURIComponent(film.name) + "&page=1", {
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            });
            const searchData = await searchRes.json();
            const resultsList = searchData.results || searchData.data || searchData.movies || [];
            let match = resultsList.find(r => (r.title || r.name).toLowerCase() === film.name.toLowerCase()) || resultsList[0];

            if (!match) {
                results.notFound.push(film.name);
                results.fail++;
            } else {
                const slug = match.slug || match.id;
                if (DO_WATCHED) {
                    await fetch("/api/activity/content/" + slug + "/watched", {
                        method: 'POST',
                        headers: { 'X-Requested-With': 'XMLHttpRequest' }
                    });
                }
                if (DO_RATINGS && film.rating) {
                    const r = parseFloat(film.rating);
                    const tag = r <= 1.5 ? "skip" : r <= 3.0 ? "timepass" : r <= 4.5 ? "go_for_it" : "perfection";
                    await fetch("/api/activity/content/" + slug + "/review", {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                        body: JSON.stringify({ tag: tag })
                    });
                }
                results.success++;
            }
        } catch (err) { results.fail++; }
        await wait(DELAY);
    }
    console.log("%cMigration Complete!", "color: #22c55e; font-size: 18px;");
})();`;

    setGeneratedScript(script);
    setActiveStep(3);
  }, [movies, options]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedScript);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="styled-container">
      {/* HEADER */}
      <header className="flex items-center justify-between px-8 py-5 border-b border-zinc-800 bg-[#0F1113]">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 bg-gradient-to-tr from-green-500 to-blue-500 rounded-lg flex items-center justify-center font-bold text-white tracking-tighter italic shadow-lg shadow-blue-500/20">
            LB
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight uppercase text-white leading-none">
              Letterboxd <span className="text-zinc-600 mx-1">→</span> Moctale
            </h1>
            <p className="text-[10px] font-mono text-zinc-500 mt-1 uppercase tracking-widest font-semibold flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              v2.0 Standalone Migration Bridge
            </p>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900/50 rounded-full border border-zinc-800">
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-400">Local API Bridge Active</span>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 grid grid-cols-12 gap-px bg-zinc-800/50 overflow-hidden">
        
        {/* LEFT SIDEBAR: STEP 1 (col-span-3) */}
        <section className="col-span-3 bg-[#0B0C0E] p-6 flex flex-col gap-8 overflow-y-auto border-r border-zinc-800/50">
          <div>
            <label className="text-[10px] uppercase tracking-[0.2em] text-zinc-600 font-bold block mb-5 italic">Step 1: Input Data</label>
            
            <div className="relative group cursor-pointer">
              <input 
                type="file" 
                accept=".csv"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className={cn(
                "border-2 border-dashed rounded-xl p-8 text-center transition-all bg-[#0F1113] relative",
                activeStep === 1 ? "border-zinc-800 hover:border-blue-500/50" : "border-green-500/30 bg-green-500/5"
              )}>
                <div className="text-3xl mb-3 text-zinc-700 flex justify-center">
                  {movies.length > 0 ? <CheckCircle2 className="w-8 h-8 text-green-500" /> : <Database className="w-8 h-8" />}
                </div>
                <p className="text-xs text-zinc-300 font-bold mb-1 uppercase tracking-tight">
                  {movies.length > 0 ? "CSV Captured" : "Export Source"}
                </p>
                <p className="text-[10px] text-zinc-600 font-medium">
                  {fileName || "watched.csv or ratings.csv"}
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-1">
              <div className="flex justify-between text-[10px] font-mono py-3 border-b border-zinc-900">
                <span className="text-zinc-600 uppercase font-bold tracking-tighter">Films Parsed</span>
                <span className={cn("font-bold", movies.length > 0 ? "text-zinc-200" : "text-zinc-700")}>
                  {movies.length.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-[10px] font-mono py-3 border-b border-zinc-900">
                <span className="text-zinc-600 uppercase font-bold tracking-tighter">Library Scan</span>
                <span className="text-zinc-700">READY</span>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900/40 rounded-xl p-5 border border-zinc-800/50">
            <label className="text-[10px] uppercase tracking-[0.2em] text-zinc-600 font-bold block mb-4 italic">Rating Mapping</label>
            <div className="space-y-2.5">
              {RATING_BUCKETS.map(bucket => (
                <div key={bucket.id} className="flex items-center justify-between group">
                  <span className="text-[10px] text-zinc-500 font-mono tracking-widest">{bucket.stars}</span>
                  <span className={cn("px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter transition-all group-hover:scale-105", bucket.color)}>
                    {bucket.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-auto pt-6">
            <div className="p-4 bg-zinc-900/40 rounded-xl border border-zinc-800 flex flex-col gap-4">
              <div className="flex items-center justify-between text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                <div className="flex items-center gap-2"><Settings2 className="w-3.5 h-3.5" /> Delay</div>
                <span className="text-blue-400">{options.delay}ms</span>
              </div>
              <input 
                type="range" 
                min="500" 
                max="3000" 
                step="100"
                value={options.delay}
                onChange={(e) => setOptions(o => ({ ...o, delay: Number(e.target.value) }))}
                className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>
          </div>
        </section>

        {/* MIDDLE CONTENT: STEP 2 (col-span-5) */}
        <section className="col-span-5 bg-[#0F1113] p-0 flex flex-col overflow-hidden">
          <div className="p-6 border-b border-zinc-800 bg-[#121417]">
            <label className="text-[10px] uppercase tracking-[0.2em] text-zinc-600 font-bold block mb-2 italic">Step 2: Preview & Verify</label>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-zinc-300">Target matches for ingestion</h2>
              <div className="bg-zinc-800 p-1.5 rounded-md">
                <Search className="w-3 h-3 text-zinc-500" />
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto relative custom-scrollbar">
            {movies.length > 0 ? (
              <table className="w-full text-left border-collapse">
                <thead className="text-[10px] uppercase tracking-[0.2em] text-zinc-600 border-b border-zinc-800/50 sticky top-0 bg-[#0F1113] z-10">
                  <tr>
                    <th className="p-5 font-bold">Film Name</th>
                    <th className="p-5 font-bold">Year</th>
                    <th className="p-5 font-bold">LB Score</th>
                    <th className="p-5 font-bold">Moctale Tag</th>
                  </tr>
                </thead>
                <tbody className="text-[11px] font-mono text-zinc-500">
                  {movies.map((movie, i) => (
                    <tr key={i} className="border-b border-zinc-800/30 hover:bg-zinc-800/20 transition-all group">
                      <td className="p-5 text-zinc-300 font-bold group-hover:text-blue-400 transition-colors uppercase tracking-tight">{movie.name}</td>
                      <td className="p-5 opacity-60">{movie.year || '----'}</td>
                      <td className="p-5">
                        <div className="flex items-center gap-1.5">
                          <span className={movie.rating ? "text-yellow-500" : "text-zinc-800"}>★</span>
                          <span className={movie.rating ? "text-zinc-300" : "text-zinc-800"}>{movie.rating || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="p-5">
                        {(() => {
                          const bucket = getMoctaleTag(movie.rating);
                          if (!bucket) return <span className="text-zinc-800 italic uppercase">No Rating</span>;
                          return (
                            <span className={cn("px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter", bucket.color)}>
                              {bucket.label}
                            </span>
                          );
                        })()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-zinc-700 gap-4 opacity-50 grayscale">
                <Film className="w-16 h-16 stroke-1 mb-2" />
                <p className="text-[11px] uppercase tracking-[0.3em] font-black">Waiting for Data Pipeline</p>
              </div>
            )}
          </div>
        </section>

        {/* RIGHT SIDEBAR: STEP 3 (col-span-4) */}
        <section className="col-span-4 bg-[#0B0C0E] p-6 flex flex-col gap-6 border-l border-zinc-800/50 overflow-y-auto">
          <div>
            <label className="text-[10px] uppercase tracking-[0.2em] text-zinc-600 font-bold block mb-5 italic">Step 3: DevTools Injector</label>
            
            <div className="space-y-4 mb-6">
              <button 
                onClick={() => setOptions(o => ({ ...o, markWatched: !o.markWatched }))}
                className={cn(
                  "w-full flex items-center justify-between p-4 rounded-xl border transition-all text-left",
                  options.markWatched ? "bg-blue-500/5 border-blue-500/20 shadow-lg shadow-blue-500/5" : "bg-black border-zinc-900 opacity-60"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn("p-1.5 rounded-md", options.markWatched ? "bg-blue-500 text-black" : "bg-zinc-900 text-zinc-700")}>
                    <Check className="w-3 h-3" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-zinc-200">Sync Watched</p>
                    <p className="text-[9px] text-zinc-500 uppercase tracking-tighter">Mark films as seen</p>
                  </div>
                </div>
              </button>

              <button 
                onClick={() => setOptions(o => ({ ...o, importRatings: !o.importRatings }))}
                className={cn(
                  "w-full flex items-center justify-between p-4 rounded-xl border transition-all text-left",
                  options.importRatings ? "bg-blue-500/5 border-blue-500/20 shadow-lg shadow-blue-500/5" : "bg-black border-zinc-900 opacity-60"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn("p-1.5 rounded-md", options.importRatings ? "bg-blue-500 text-black" : "bg-zinc-900 text-zinc-700")}>
                    <Star className="w-3 h-3" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-zinc-200">Scale Ratings</p>
                    <p className="text-[9px] text-zinc-500 uppercase tracking-tighter">Convert Stars to Tags</p>
                  </div>
                </div>
              </button>
            </div>

            <button 
              disabled={movies.length === 0}
              onClick={generateScript}
              className={cn(
                "w-full py-4 text-xs font-black uppercase tracking-tighter rounded-xl transition-all flex items-center justify-center gap-2 mb-6 group overflow-hidden relative",
                movies.length > 0 ? "bg-zinc-100 text-black shadow-xl hover:bg-white active:scale-95" : "bg-zinc-900 text-zinc-700 pointer-events-none"
              )}
            >
              Generate Migration Payload <ChevronRight className="w-4 h-4" />
            </button>

            {generatedScript && (
              <div className="relative group mt-2">
                <pre className="bg-black rounded-xl p-5 font-mono text-[10px] text-blue-500 overflow-hidden h-56 border border-zinc-800 leading-relaxed shadow-inner no-scrollbar">
                  {generatedScript}
                </pre>
                <div className="absolute bottom-4 right-4">
                  <button 
                    onClick={copyToClipboard}
                    className="bg-zinc-100 text-black px-5 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-tighter hover:bg-white active:scale-95 transition-all shadow-2xl flex items-center gap-2"
                  >
                    {isCopied ? <CheckCircle2 className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {isCopied ? "Payload Copied" : "Copy to Clipboard"}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="mt-auto flex flex-col gap-4">
            <div className="bg-zinc-900/40 rounded-xl p-5 border border-zinc-800/80">
              <h3 className="text-[11px] font-black text-zinc-300 uppercase mb-4 flex items-center gap-3">
                <Zap className="w-4 h-4 text-blue-500" /> Operational Guide
              </h3>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-5 h-5 bg-zinc-800 rounded-full flex items-center justify-center text-[10px] font-bold text-zinc-500 shrink-0">1</div>
                  <p className="text-[10px] text-zinc-500 leading-relaxed uppercase tracking-tight font-medium">Log into <span className="text-zinc-200">Moctale.in</span> in a focused tab.</p>
                </div>
                <div className="flex gap-3">
                  <div className="w-5 h-5 bg-zinc-800 rounded-full flex items-center justify-center text-[10px] font-bold text-zinc-500 shrink-0">2</div>
                  <p className="text-[10px] text-zinc-500 leading-relaxed uppercase tracking-tight font-medium">Inject payload into <span className="text-zinc-200">Developer Console</span> (F12).</p>
                </div>
              </div>
            </div>
            
            <a 
              href="/migrator.html" 
              download="moctale-migrator.html"
              className="w-full py-3 bg-zinc-900/50 border border-zinc-800 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-all text-center flex items-center justify-center gap-2 group"
            >
              <Database className="w-3 h-3 group-hover:text-blue-400 transition-colors" /> Save Offline Version (.html)
            </a>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-[#0F1113] border-t border-zinc-800 px-8 py-4 flex justify-between items-center text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-600">
        <div className="flex gap-6 items-center">
          <span className="flex items-center gap-1.5"><Database className="w-3 h-3" /> Found 2 API Endpoints</span>
          <span className="text-zinc-800 font-black">|</span>
          <span className="flex items-center gap-1.5 text-zinc-500 uppercase">Search: GET /search</span>
          <span className="flex items-center gap-1.5 text-zinc-500 uppercase">Write: POST /watched</span>
        </div>
        <div className="flex gap-8">
          <span className="flex items-center gap-1.5 text-zinc-700">Moctale Bridge v2.0</span>
          <span className="text-zinc-500">Standalone Utility</span>
        </div>
      </footer>
    </div>
  );
}

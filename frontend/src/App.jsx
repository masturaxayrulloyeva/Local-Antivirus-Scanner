import { useEffect, useRef, useState } from "react";

const API_URL = "http://localhost:5000/api/scan";

/* ---------- Yordamchi funksiyalar ---------- */

// Backend camelCase yoki PascalCase qaytarsa ham ishlaydi
const pick = (obj, key) =>
  obj?.[key] ?? obj?.[key.charAt(0).toUpperCase() + key.slice(1)];

const mapFayl = (f) => ({
  nomi: pick(f, "nomi") ?? "Noma'lum",
  joylashuvi: pick(f, "joylashuvi") ?? "—",
  hajmi: pick(f, "hajmi"),
  yaratilganVaqti: pick(f, "yaratilganVaqti") ?? "—",
  xavfTuri: pick(f, "xavfTuri") ?? "Noma'lum",
});

const normalize = (raw) => ({
  vaqt: pick(raw, "skanerlanganVaqt") ?? new Date().toLocaleString("uz-UZ"),
  jami: Number(pick(raw, "jamiTekshirilgan") ?? 0),
  fayllar: (pick(raw, "topilganFayllar") ?? []).map(mapFayl),
  // Hajmi bo'yicha kamayish tartibida saralab, eng kattalaridan 10 tasini olamiz
  kattalar: (pick(raw, "engKattaFayllar") ?? [])
    .map(mapFayl)
    .sort((a, b) => (Number(b.hajmi) || 0) - (Number(a.hajmi) || 0))
    .slice(0, 10),
});

const formatSize = (v) => {
  if (typeof v !== "number") return v ?? "—";
  if (v < 1024) return `${v} B`;
  if (v < 1024 ** 2) return `${(v / 1024).toFixed(1)} KB`;
  if (v < 1024 ** 3) return `${(v / 1024 ** 2).toFixed(1)} MB`;
  return `${(v / 1024 ** 3).toFixed(2)} GB`;
};

const riskLevel = (type = "") => {
  const t = String(type).toLowerCase();
  if (/(yuqori|high|critical|kritik|troyan|trojan|ransom|virus|backdoor)/.test(t)) return "high";
  if (/(o'rta|orta|medium|worm|spyware|adware)/.test(t)) return "medium";
  return "low";
};

const RISK_STYLE = {
  high: "bg-red-500/10 text-red-400 ring-red-500/30",
  medium: "bg-amber-500/10 text-amber-300 ring-amber-500/30",
  low: "bg-emerald-500/10 text-emerald-300 ring-emerald-500/30",
};

const CLEAN_TIPS = [
  "Operatsion tizim va dasturlarni muntazam yangilab turing — ko'p hujumlar eski zaifliklardan foydalanadi.",
  "Muhim fayllaringizning zaxira nusxasini alohida diskda yoki bulutda saqlang.",
  "Barcha muhim hisoblaringizda ikki bosqichli autentifikatsiyani yoqing.",
  "Noma'lum jo'natuvchilardan kelgan havolalar va ilovalarni ochishdan oldin tekshiring.",
  "Har bir hisob uchun alohida, murakkab parol ishlating va parol menejeridan foydalaning.",
];

/* ---------- Kichik komponentlar ---------- */

// --- MATRIKS / VIRUSLAR FON ANIMATSIYASI (Sekinlashtirilgan) ---
const MatrixBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    const chars = "0101010101010101ABCDEF[VIRUS]SCAN_OK#$@!*";
    const fontSize = 14;
    const columns = Math.floor(width / fontSize);
    const drops = Array.from({ length: columns }, () => 1);

    let frameCount = 0;

    const draw = () => {
      animationFrameId = requestAnimationFrame(draw);

      // Animatsiya tezligini maromiga keltirish (har 3 ta kadrda 1 marta yangilanadi)
      frameCount++;
      if (frameCount % 3 !== 0) return;

      ctx.fillStyle = "rgba(5, 5, 5, 0.08)";
      ctx.fillRect(0, 0, width, height);

      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = chars.charAt(Math.floor(Math.random() * chars.length));
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        ctx.fillStyle = Math.random() > 0.85 ? "#34d399" : "#059669";
        ctx.fillText(text, x, y);

        if (y > height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    };

    draw();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 opacity-20"
    />
  );
};

const RiskBadge = ({ type }) => (
  <span
    className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${RISK_STYLE[riskLevel(type)]}`}
  >
    {type}
  </span>
);

const Panel = ({ className = "", children }) => (
  <div className={`rounded-xl border border-emerald-500/20 bg-slate-900/80 backdrop-blur-sm ${className}`}>
    {children}
  </div>
);

const StatCard = ({ label, value, hint, tone = "text-white" }) => (
  <Panel className="p-5">
    <p className="text-sm text-slate-400">{label}</p>
    <p className={`mt-2 font-mono text-3xl font-semibold tabular-nums ${tone}`}>{value}</p>
    <p className="mt-1 text-xs text-slate-500">{hint}</p>
  </Panel>
);

const ProgressRing = ({ value, scanning }) => {
  const r = 78;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative h-52 w-52">
      <svg viewBox="0 0 180 180" className="h-full w-full -rotate-90">
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
        <circle cx="90" cy="90" r={r} fill="none" strokeWidth="5" className="stroke-slate-800" />
        <circle
          cx="90"
          cy="90"
          r={r}
          fill="none"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (c * value) / 100}
          stroke="url(#ringGrad)"
          className="transition-[stroke-dashoffset] duration-100 ease-linear"
        />
      </svg>
      {scanning && (
        <div
          className="absolute inset-3 animate-[radar_2.6s_linear_infinite] rounded-full"
          style={{
            background:
              "conic-gradient(from 0deg, rgba(16,185,129,0) 0deg, rgba(16,185,129,0.14) 55deg, rgba(16,185,129,0) 56deg)",
          }}
        />
      )}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-5xl font-semibold tabular-nums text-white">
          {Math.floor(value)}
          <span className="text-2xl text-emerald-500">%</span>
        </span>
        <span className="mt-1 text-xs text-slate-500">
          {scanning ? "Skanerlanmoqda" : value >= 100 ? "Yakunlandi" : "Tayyor"}
        </span>
      </div>
    </div>
  );
};

const TabButton = ({ active, onClick, children, count }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 ${
      active
        ? "border-emerald-500 text-white"
        : "border-transparent text-slate-400 hover:text-slate-200"
    }`}
  >
    {children}
    <span
      className={`rounded-full px-2 py-0.5 font-mono text-xs ${
        active ? "bg-emerald-500/15 text-emerald-300" : "bg-slate-800 text-slate-400"
      }`}
    >
      {count}
    </span>
  </button>
);

/* ---------- Asosiy komponent ---------- */

export default function App() {
  const [phase, setPhase] = useState("idle"); // idle | scanning | done | error
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null); // { title, text }
  const [tab, setTab] = useState("tahdid"); // tahdid | katta

  const progressRef = useRef(0);
  const dataRef = useRef(null);
  const errorRef = useRef(null);
  const timerRef = useRef(null);
  const abortRef = useRef(null);

  useEffect(
    () => () => {
      clearInterval(timerRef.current);
      abortRef.current?.abort();
    },
    []
  );

  const startScan = () => {
    if (phase === "scanning") return;

    clearInterval(timerRef.current);
    abortRef.current?.abort();

    progressRef.current = 0;
    dataRef.current = null;
    errorRef.current = null;
    setProgress(0);
    setError(null);
    setPhase("scanning");

    const controller = new AbortController();
    abortRef.current = controller;
    fetch(API_URL, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json) => {
        dataRef.current = normalize(json);
      })
      .catch((err) => {
        if (err.name !== "AbortError") errorRef.current = err;
      });

    timerRef.current = setInterval(() => {
      const err = errorRef.current;
      if (err) {
        clearInterval(timerRef.current);
        const offline = err instanceof TypeError;
        setError(
          offline
            ? {
                title: "Serverga ulanib bo'lmadi",
                text: "C# backend http://localhost:5000 manzilida ishlamayapti. Serverni ishga tushiring va qayta urinib ko'ring.",
              }
            : {
                title: "Server kutilmagan javob qaytardi",
                text: `Server ishlayapti, lekin so'rov bajarilmadi (${err.message}). Backend jurnalini tekshiring.`,
              }
        );
        setPhase("error");
        return;
      }

      const p = progressRef.current;
      const next = dataRef.current
        ? Math.min(100, p + 1.8)
        : p < 90
        ? p + Math.max(0.15, (90 - p) * 0.035)
        : p;

      progressRef.current = next;
      setProgress(next);

      if (next >= 100) {
        clearInterval(timerRef.current);
        setResult(dataRef.current);
        setPhase("done");
      }
    }, 40);
  };

  const scanning = phase === "scanning";
  const hasResult = phase === "done" && result;
  const fayllar = result?.fayllar ?? [];
  const kattalar = result?.kattalar ?? [];
  const threats = fayllar.length;
  const infected = hasResult && threats > 0;
  const highCount = fayllar.filter((f) => riskLevel(f.xavfTuri) === "high").length;
  const maxHajm = Math.max(1, ...kattalar.map((f) => Number(f.hajmi) || 0));
  const tip = CLEAN_TIPS[(result?.jami ?? 0) % CLEAN_TIPS.length];

  const status = !hasResult
    ? { text: scanning ? "Tahlil qilinmoqda" : "Kutilmoqda", tone: "text-slate-300", dot: "bg-slate-500" }
    : infected
    ? { text: "Xavf ostida", tone: "text-red-400", dot: "bg-red-500" }
    : { text: "Himoyalangan", tone: "text-emerald-400", dot: "bg-emerald-500" };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 antialiased relative overflow-x-hidden" style={{ backgroundColor: "#050505", color: "#f1f5f9" }}>
      <style>{`
        :root, html, body, #root {
          background: #050505 !important;
          color: #f1f5f9;
          color-scheme: dark;
        }
        body { margin: 0; min-width: 320px; display: block; }
        #root { max-width: none !important; margin: 0 !important; padding: 0 !important; text-align: left !important; }
        @keyframes radar { to { transform: rotate(360deg); } }
      `}</style>

      {/* 🟢 MATRIX FON ANIMATSIYASI */}
      <MatrixBackground />

      {/* Fon nuri */}
      <div className="pointer-events-none fixed inset-x-0 top-0 h-72 bg-linear-to-b from-emerald-500\/\[0\.06\] to-transparent z-0" />

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {/* Sarlavha */}
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/10">
              <svg className="h-6 w-6 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 3l8 3v6c0 4.5-3.2 8.2-8 9-4.8-.8-8-4.5-8-9V6l8-3z" />
                <path d="M8.5 12.5l2.5 2.5 4.5-5" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-white sm:text-2xl">Antivirus Skaneri</h1>
              <p className="font-mono text-xs text-slate-500">
                Oxirgi skanerlash: {result?.vaqt ?? "hali bajarilmagan"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/80 px-3 py-1.5 text-sm">
            <span className={`h-2 w-2 rounded-full ${status.dot} ${scanning ? "animate-pulse" : ""}`} />
            <span className={status.tone}>{status.text}</span>
          </div>
        </header>

        {/* Statistika */}
        <section className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Jami tekshirilgan fayllar"
            value={hasResult ? result.jami.toLocaleString("uz-UZ") : "—"}
            hint="Oxirgi skanerlash natijasi"
          />
          <StatCard
            label="Topilgan tahdidlar"
            value={hasResult ? threats : "—"}
            tone={!hasResult ? "text-white" : infected ? "text-red-400" : "text-emerald-400"}
            hint={!hasResult ? "Skanerlashni boshlang" : infected ? "Diqqat talab qilinadi" : "Tahdid aniqlanmadi"}
          />
          <StatCard
            label="Tizim holati"
            value={status.text}
            tone={status.tone}
            hint={!hasResult ? "Ma'lumot yo'q" : infected ? "Zararsizlantirish tavsiya etiladi" : "Tizim xavfsiz"}
          />
        </section>

        {/* Skaner paneli */}
        <Panel className="my-8 flex flex-col items-center gap-6 px-4 py-10">
          <ProgressRing value={progress} scanning={scanning} />

          <div className="w-full max-w-lg">
            <div
              className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800"
              role="progressbar"
              aria-valuenow={Math.floor(progress)}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full rounded-full bg-linear-to-r from-emerald-500 to-cyan-400 transition-[width] duration-100 ease-linear"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-2 text-center font-mono text-xs text-slate-500">
              {scanning
                ? `Fayllar tekshirilmoqda… ${Math.floor(progress)}%`
                : phase === "done"
                ? "Skanerlash muvaffaqiyatli yakunlandi"
                : "Tizimni tekshirish uchun tugmani bosing"}
            </p>
          </div>

          <button
            onClick={startScan}
            disabled={scanning}
            className="rounded-lg bg-emerald-500 px-10 py-3.5 text-base font-semibold text-slate-950 transition hover:bg-cyan-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500"
          >
            {scanning ? "Skanerlanmoqda…" : phase === "done" ? "Qayta skanerlash" : "Skanerlashni boshlash"}
          </button>

          {phase === "error" && error && (
            <div
              role="alert"
              className="flex w-full max-w-lg items-start gap-3 rounded-lg border border-red-500/20 bg-red-500\/\[0\.06\] px-4 py-3"
            >
              <svg className="mt-0.5 h-5 w-5 shrink-0 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 8v5M12 16.5v.01" />
              </svg>
              <div>
                <p className="text-sm font-medium text-red-300">{error.title}</p>
                <p className="mt-0.5 text-sm text-slate-400">{error.text}</p>
              </div>
            </div>
          )}
        </Panel>

        {/* Natijalar: ikkita bo'lim */}
        {hasResult && (
          <section className="mb-8">
            <div className="mb-5 flex gap-1 overflow-x-auto border-b border-slate-800">
              <TabButton active={tab === "tahdid"} onClick={() => setTab("tahdid")} count={threats}>
                Shubhali fayllar
              </TabButton>
              <TabButton active={tab === "katta"} onClick={() => setTab("katta")} count={kattalar.length}>
                Eng katta fayllar
              </TabButton>
            </div>

            {/* --- Shubhali fayllar --- */}
            {tab === "tahdid" &&
              (!infected ? (
                <div className="flex items-center gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.07] px-5 py-4 text-emerald-300">
                  <svg className="h-6 w-6 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 3l8 3v6c0 4.5-3.2 8.2-8 9-4.8-.8-8-4.5-8-9V6l8-3z" />
                    <path d="M8.5 12.5l2.5 2.5 4.5-5" />
                  </svg>
                  <p className="font-medium">Kompyuter toza, xavfli fayllar topilmadi</p>
                </div>
              ) : (
                <>
                  <div className="hidden overflow-hidden rounded-xl border border-emerald-500/20 md:block">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-900 text-slate-400">
                        <tr>
                          <th className="px-4 py-3 font-medium">Nomi</th>
                          <th className="px-4 py-3 font-medium">Joylashuvi</th>
                          <th className="px-4 py-3 font-medium">Hajmi</th>
                          <th className="px-4 py-3 font-medium">Yaratilgan vaqti</th>
                          <th className="px-4 py-3 font-medium">Xavf turi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/70">
                        {fayllar.map((f, i) => (
                          <tr key={`${f.joylashuvi}-${i}`} className="hover\:bg-emerald-500\/\[0\.04\]">
                            <td className="px-4 py-3 font-medium text-white">{f.nomi}</td>
                            <td className="max-w-xs truncate px-4 py-3 font-mono text-xs text-slate-400" title={f.joylashuvi}>
                              {f.joylashuvi}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 font-mono tabular-nums">{formatSize(f.hajmi)}</td>
                            <td className="whitespace-nowrap px-4 py-3 text-slate-400">{f.yaratilganVaqti}</td>
                            <td className="px-4 py-3"><RiskBadge type={f.xavfTuri} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="grid gap-3 md:hidden">
                    {fayllar.map((f, i) => (
                      <article key={`${f.joylashuvi}-${i}`} className="rounded-xl border border-emerald-500/20 bg-slate-900/80 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="break-all font-medium text-white">{f.nomi}</h3>
                          <RiskBadge type={f.xavfTuri} />
                        </div>
                        <p className="mt-2 break-all font-mono text-xs text-slate-400">{f.joylashuvi}</p>
                        <div className="mt-3 flex justify-between font-mono text-xs text-slate-500">
                          <span>{formatSize(f.hajmi)}</span>
                          <span>{f.yaratilganVaqti}</span>
                        </div>
                      </article>
                    ))}
                  </div>
                </>
              ))}

            {/* --- Eng katta 10 ta fayl --- */}
            {tab === "katta" && (
              <div>
                <h2 className="mb-1 text-lg font-semibold text-white">
                  Diskni band qilgan eng katta 10 ta fayl
                </h2>
                <p className="mb-4 text-sm text-slate-400">
                  Joy bo'shatish kerak bo'lsa, avval shu fayllarni ko'rib chiqing.
                </p>

                {kattalar.length === 0 ? (
                  <Panel className="px-5 py-4 text-sm text-slate-400">
                    Server eng katta fayllar haqida ma'lumot qaytarmadi.
                  </Panel>
                ) : (
                  <>
                    <div className="hidden overflow-hidden rounded-xl border border-emerald-500/20 md:block">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-900 text-slate-400">
                          <tr>
                            <th className="w-10 px-4 py-3 font-medium">#</th>
                            <th className="px-4 py-3 font-medium">Nomi</th>
                            <th className="px-4 py-3 font-medium">To'liq yo'li</th>
                            <th className="px-4 py-3 font-medium">Hajmi</th>
                            <th className="px-4 py-3 font-medium">Yaratilgan vaqti</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/70">
                          {kattalar.map((f, i) => (
                            <tr key={`${f.joylashuvi}-${i}`} className="hover\:bg-emerald-500\/\[0\.04\]">
                              <td className="px-4 py-3 font-mono text-slate-500">{i + 1}</td>
                              <td className="px-4 py-3 font-medium text-white">{f.nomi}</td>
                              <td className="max-w-xs truncate px-4 py-3 font-mono text-xs text-slate-400" title={f.joylashuvi}>
                                {f.joylashuvi}
                              </td>
                              <td className="whitespace-nowrap px-4 py-3">
                                <div className="font-mono tabular-nums text-emerald-300">{formatSize(f.hajmi)}</div>
                                <div className="mt-1 h-1 w-28 overflow-hidden rounded-full bg-slate-800">
                                  <div
                                    className="h-full rounded-full bg-emerald-600/70"
                                    style={{ width: `${((Number(f.hajmi) || 0) / maxHajm) * 100}%` }}
                                  />
                                </div>
                              </td>
                              <td className="whitespace-nowrap px-4 py-3 text-slate-400">{f.yaratilganVaqti}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="grid gap-3 md:hidden">
                      {kattalar.map((f, i) => (
                        <article key={`${f.joylashuvi}-${i}`} className="rounded-xl border border-emerald-500/20 bg-slate-900/80 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <h3 className="break-all font-medium text-white">
                              <span className="mr-2 font-mono text-slate-500">{i + 1}.</span>
                              {f.nomi}
                            </h3>
                            <span className="shrink-0 font-mono text-sm text-emerald-300">{formatSize(f.hajmi)}</span>
                          </div>
                          <p className="mt-2 break-all font-mono text-xs text-slate-400">{f.joylashuvi}</p>
                          <div className="mt-3 h-1 overflow-hidden rounded-full bg-slate-800">
                            <div
                              className="h-full rounded-full bg-emerald-600/70"
                              style={{ width: `${((Number(f.hajmi) || 0) / maxHajm) * 100}%` }}
                            />
                          </div>
                          <p className="mt-2 font-mono text-xs text-slate-500">{f.yaratilganVaqti}</p>
                        </article>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </section>
        )}

        {/* Aqlli tavsiyalar */}
        <Panel className="p-6">
          <h2 className="text-lg font-semibold text-white">Aqlli Tavsiyalar va Tizim Tahlili</h2>

          {!hasResult ? (
            <p className="mt-3 text-sm text-slate-400">
              Tahlil va tavsiyalarni ko'rish uchun avval skanerlashni ishga tushiring.
            </p>
          ) : infected ? (
            <div className="mt-4 space-y-4">
              <div className="rounded-lg border border-red-500/20 bg-red-500\/\[0\.06\] px-4 py-3 text-sm text-red-300">
                <p className="font-medium">
                  {result.jami.toLocaleString("uz-UZ")} ta fayldan {threats} tasi shubhali deb topildi
                  {highCount > 0 ? `, ulardan ${highCount} tasi yuqori xavfli.` : "."}
                </p>
                <p className="mt-1 text-slate-300">
                  Shubhali fayllar aniqlandi. Ularning joylashuvini tekshiring va zararsizlantiring.
                </p>
              </div>
              <ul className="space-y-2 text-sm text-slate-300">
                {[
                  "Jadvaldagi har bir faylning joylashuvini tekshiring va nima uchun u yerda ekanini aniqlang.",
                  "Tanish bo'lmagan fayllarni karantinga oling yoki butunlay o'chiring.",
                  highCount > 0
                    ? "Yuqori xavfli fayllar topilgani uchun tarmoqdan vaqtincha uzilib, parollaringizni boshqa qurilmadan almashtiring."
                    : "Parollaringizni almashtirish va hisoblaringizdagi faoliyatni tekshirish tavsiya etiladi.",
                  "Zararsizlantirgandan so'ng tizimni qayta ishga tushiring va skanerlashni takrorlang.",
                ].map((text) => (
                  <li key={text} className="flex gap-3">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/[0.07] px-4 py-3 text-sm text-emerald-300">
                {result.jami.toLocaleString("uz-UZ")} ta fayl tekshirildi, tahdid topilmadi. Tizimingiz xavfsiz holatda.
              </div>
              <p className="text-sm text-slate-300">
                <span className="font-medium text-emerald-400">Xavfsizlik maslahati: </span>
                {tip}
              </p>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
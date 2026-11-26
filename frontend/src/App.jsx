import { useEffect, useRef, useState } from "react";
import report from "./report.json";

const formatSize = (value) => {
  if (typeof value !== "number") return value ?? "—";
  if (value < 1024) return `${value} B`;
  if (value < 1024 ** 2) return `${(value / 1024).toFixed(1)} KB`;
  if (value < 1024 ** 3) return `${(value / 1024 ** 2).toFixed(1)} MB`;
  return `${(value / 1024 ** 3).toFixed(2)} GB`;
};

const riskStyle = (type = "") => {
  const t = String(type).toLowerCase();
  if (/(yuqori|high|critical|kritik|troyan|trojan|ransom|virus)/.test(t))
    return "bg-red-500/10 text-red-300 ring-red-500/30";
  if (/(o'rta|orta|medium|worm|spyware)/.test(t))
    return "bg-amber-500/10 text-amber-300 ring-amber-500/30";
  return "bg-sky-500/10 text-sky-300 ring-sky-500/30";
};

const RiskBadge = ({ type }) => (
  <span
    className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${riskStyle(type)}`}
  >
    {type}
  </span>
);

const StatCard = ({ label, value, hint, tone = "text-slate-100" }) => (
  <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
    <p className="text-sm text-slate-400">{label}</p>
    <p className={`mt-2 text-3xl font-semibold tabular-nums ${tone}`}>{value}</p>
    {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
  </div>
);

export default function App() {
  const [hasScanned, setHasScanned] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [lastScan, setLastScan] = useState("Hali skaner qilinmadi");
  const timer = useRef(null);

  // Skanerdan keyingi real ma'lumotlar
  const realFiles = report?.TopilganFayllar ?? [];
  const realTotal = report?.JamiTekshirilgan ?? 204698;

  // Agar hali skaner qilinmagan bo'lsa, toza holatni ko'rsatamiz
  const files = hasScanned ? realFiles : [];
  const total = hasScanned ? realTotal : 204698;
  const infected = files.length > 0;

  useEffect(() => () => clearInterval(timer.current), []);

  const startScan = () => {
    if (scanning) return;
    setScanning(true);
    setProgress(0);
    timer.current = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(timer.current);
          setScanning(false);
          setHasScanned(true); // Skaner tugadi, natijalarni ochamiz
          setLastScan(new Date().toLocaleString("uz-UZ"));
          return 100;
        }
        return p + 2;
      });
    }, 60);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 antialiased">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        {/* Sarlavha */}
        <header className="mb-8">
          <h1 className="text-2xl font-semibold text-slate-50 sm:text-3xl">
            Antivirus skaneri
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Oxirgi skanerlash: {lastScan}
          </p>
        </header>

        {/* Statistik kartochkalar */}
        <section className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Jami tekshirilgan fayllar"
            value={Number(total).toLocaleString("uz-UZ")}
            hint={hasScanned ? "Oxirgi skanerlash natijasi" : "Tayyor holatda"}
          />
          <StatCard
            label="Topilgan tahdidlar"
            value={files.length}
            tone={infected ? "text-red-400" : "text-emerald-400"}
            hint={
              !hasScanned
                ? "Skanerlash kutilmoqda"
                : infected
                ? "Tekshiruv talab qilinadi"
                : "Hech narsa topilmadi"
            }
          />
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
            <p className="text-sm text-slate-400">Tizim holati</p>
            <div className="mt-3 flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                {!infected && (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                )}
                <span
                  className={`relative inline-flex h-3 w-3 rounded-full ${
                    infected ? "bg-red-500" : "bg-emerald-400"
                  }`}
                />
              </span>
              <p
                className={`text-2xl font-semibold ${
                  infected ? "text-red-400" : "text-emerald-400"
                }`}
              >
                {!hasScanned ? "Tayyor" : infected ? "Xavf ostida" : "Himoyalangan"}
              </p>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {!hasScanned
                ? "Skanerlash tugmasini bosing"
                : infected
                ? "Shubhali fayllar aniqlandi"
                : "Tahdidlar aniqlanmadi"}
            </p>
          </div>
        </section>

        {/* Skanerlash tugmasi */}
        <section className="my-10 flex flex-col items-center gap-4">
          <button
            onClick={startScan}
            disabled={scanning}
            className="rounded-full bg-cyan-500 px-10 py-3.5 text-base font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400 disabled:shadow-none cursor-pointer"
          >
            {scanning ? `Skanerlanmoqda… ${progress}%` : "Skanerlashni boshlash"}
          </button>

          <div
            className={`h-1.5 w-full max-w-md overflow-hidden rounded-full bg-slate-800 transition-opacity ${
              scanning ? "opacity-100" : "opacity-0"
            }`}
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full bg-cyan-400 transition-[width] duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
        </section>

        {/* Natijalar */}
        <section>
          <h2 className="mb-4 text-lg font-semibold text-slate-100">
            Topilgan shubhali fayllar
          </h2>

          {!hasScanned ? (
            <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/40 px-5 py-4 text-slate-400">
              <svg
                className="h-6 w-6 shrink-0 text-cyan-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p className="font-medium">
                Skanerlash hali bajarilmadi. Tahdidlarni tekshirish uchun yuqoridagi tugmani bosing.
              </p>
            </div>
          ) : !infected ? (
            <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 text-emerald-300">
              <svg
                className="h-6 w-6 shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 3l8 3v6c0 4.5-3.2 8.2-8 9-4.8-.8-8-4.5-8-9V6l8-3z" />
                <path d="M8.5 12.5l2.5 2.5 4.5-5" />
              </svg>
              <p className="font-medium">
                Kompyuter toza, xavfli fayllar topilmadi
              </p>
            </div>
          ) : (
            <>
              {/* Jadval (katta ekranlar) */}
              <div className="hidden overflow-hidden rounded-xl border border-slate-800 md:block">
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
                  <tbody className="divide-y divide-slate-800 bg-slate-900/40">
                    {files.map((f, i) => (
                      <tr key={`${f.Joylashuvi}-${i}`} className="hover:bg-slate-800/50">
                        <td className="px-4 py-3 font-medium text-slate-100">
                          {f.Nomi}
                        </td>
                        <td className="max-w-xs truncate px-4 py-3 font-mono text-xs text-slate-400" title={f.Joylashuvi}>
                          {f.Joylashuvi}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 tabular-nums">
                          {formatSize(f.Hajmi)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-slate-400">
                          {f.YaratilganVaqti}
                        </td>
                        <td className="px-4 py-3">
                          <RiskBadge type={f.XavfTuri} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Kartochkalar (mobil) */}
              <div className="grid gap-3 md:hidden">
                {files.map((f, i) => (
                  <article
                    key={`${f.Joylashuvi}-${i}`}
                    className="rounded-xl border border-slate-800 bg-slate-900/60 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="break-all font-medium text-slate-100">
                        {f.Nomi}
                      </h3>
                      <RiskBadge type={f.XavfTuri} />
                    </div>
                    <p className="mt-2 break-all font-mono text-xs text-slate-400">
                      {f.Joylashuvi}
                    </p>
                    <div className="mt-3 flex justify-between text-xs text-slate-500">
                      <span>{formatSize(f.Hajmi)}</span>
                      <span>{f.YaratilganVaqti}</span>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
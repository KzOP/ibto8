import { useState, useEffect, useRef } from "react";
import {
  GitCompare, X, Plus, Building2, Award, Globe, ExternalLink,
  CheckCircle2, AlertCircle, Search,
} from "lucide-react";
import Layout from "@/components/Layout";
import { getUniversities, getScholarshipPrograms, type University, type ScholarshipProgram } from "@/lib/firestore";
import { seedIfEmpty } from "@/lib/seed";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import FirebaseBanner from "@/components/FirebaseBanner";

type Mode = "scholarships" | "universities";

/* ─── Arabic text normalization ─────────────────────────────────────────── */
function normalizeArabic(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, "")   // remove tashkeel / diacritics
    .replace(/[أإآٱ]/g, "ا")                  // normalize hamza variants → ا
    .replace(/ة/g, "ه")                        // ة → ه
    .replace(/ى/g, "ي")                        // ى → ي
    .replace(/ؤ/g, "و")                        // ؤ → و
    .replace(/ئ/g, "ي")                        // ئ → ي
    .replace(/\s+/g, " ")
    .trim();
}

function matchesSearch(text: string, query: string): boolean {
  if (!query) return true;
  return normalizeArabic(text).includes(normalizeArabic(query));
}

/* ─── Small helpers ──────────────────────────────────────────────────────── */
function NeedsReview() {
  return (
    <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full inline-flex items-center gap-0.5">
      <AlertCircle size={9} />يحتاج مراجعة
    </span>
  );
}

function CheckOrCross({ value }: { value: boolean }) {
  return value
    ? <CheckCircle2 size={16} className="text-green-600 mx-auto" />
    : <X size={16} className="text-red-400 mx-auto" />;
}

function RowLabel({ label }: { label: string }) {
  return (
    <td className="px-3 py-2.5 text-xs font-medium text-muted-foreground bg-muted/30 border-b border-border w-36 align-middle whitespace-nowrap">
      {label}
    </td>
  );
}

/* ─── Add-item panel (empty slot with search) ────────────────────────────── */
function AddItemSlot({
  onSelect,
  items,
  selectedIds,
  label,
  icon: Icon,
}: {
  onSelect: (id: string) => void;
  items: { id: string; name: string; sub?: string }[];
  selectedIds: string[];
  label: string;
  icon: React.ElementType;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const available = items.filter(i => !selectedIds.includes(i.id));
  const filtered = available.filter(i =>
    matchesSearch(i.name, query) || (i.sub ? matchesSearch(i.sub, query) : false)
  );

  /* close on outside click */
  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  /* focus input when opened */
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  return (
    <div ref={panelRef} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        disabled={available.length === 0}
        className="w-full h-full min-h-[110px] border-2 border-dashed border-primary/30 rounded-xl flex flex-col items-center justify-center gap-2 bg-accent/20 hover:bg-accent/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed p-3"
      >
        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
          <Plus size={18} className="text-primary" />
        </div>
        <span className="text-sm font-medium text-primary">أضف {label}</span>
        {available.length === 0 && (
          <span className="text-xs text-muted-foreground">لا توجد عناصر أخرى</span>
        )}
      </button>

      {open && (
        <div className="absolute top-full mt-2 z-30 w-80 bg-white border border-border rounded-xl shadow-xl overflow-hidden" dir="rtl">
          {/* Search input */}
          <div className="p-2 border-b border-border">
            <div className="flex items-center gap-2 bg-muted/40 rounded-lg px-3 py-2">
              <Search size={14} className="text-muted-foreground flex-shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={`ابحث عن ${label}...`}
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                dir="rtl"
              />
              {query && (
                <button onClick={() => setQuery("")} className="text-muted-foreground hover:text-foreground">
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Results list */}
          <div className="max-h-60 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-4 py-6 text-center">
                <p className="text-sm text-muted-foreground">لا توجد نتائج لـ «{query}»</p>
                <p className="text-xs text-muted-foreground/60 mt-1">جرب كلمة أخرى</p>
              </div>
            ) : (
              filtered.map(item => (
                <button
                  key={item.id}
                  onClick={() => { onSelect(item.id); setOpen(false); setQuery(""); }}
                  className="w-full text-right px-4 py-2.5 text-sm hover:bg-accent transition-colors border-b border-border/40 last:border-0 flex items-start gap-2"
                >
                  <Icon size={14} className="text-primary flex-shrink-0 mt-0.5" />
                  <span className="flex-1 leading-tight">{item.name}
                    {item.sub && <span className="block text-xs text-muted-foreground">{item.sub}</span>}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Selected card ──────────────────────────────────────────────────────── */
function SelectedCard({
  name,
  sub,
  provider,
  onRemove,
  icon: Icon,
}: {
  name: string;
  sub?: string;
  provider?: string;
  onRemove: () => void;
  icon: React.ElementType;
}) {
  return (
    <div className="relative bg-accent/40 border border-primary/20 rounded-xl p-3">
      <button
        onClick={onRemove}
        className="absolute -top-2 -left-2 w-5 h-5 bg-destructive text-white rounded-full flex items-center justify-center hover:bg-destructive/80 transition-colors z-10 shadow-sm"
        title="إزالة"
      >
        <X size={10} />
      </button>
      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
        <Icon size={16} className="text-primary" />
      </div>
      <p className="text-xs font-semibold text-foreground leading-tight">{name}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      {provider && <p className="text-xs text-muted-foreground/60 mt-0.5 truncate">{provider}</p>}
    </div>
  );
}

/* ─── Scholarship comparison table ──────────────────────────────────────── */
function ScholarshipCompare({ programs }: { programs: ScholarshipProgram[] }) {
  const cell = "px-3 py-2.5 text-xs text-center border-b border-border align-middle";
  const headerCell = "px-3 py-3 text-center border-b border-border bg-accent/40 min-w-[180px]";

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full border-collapse" dir="rtl">
        <thead>
          <tr>
            <th className="px-3 py-3 bg-muted/30 border-b border-border w-36" />
            {programs.map(p => (
              <th key={p.id} className={headerCell}>
                <p className="text-sm font-bold text-foreground leading-tight">{p.nameAr}</p>
                {p.nameEn && <p className="text-xs text-muted-foreground mt-0.5" dir="ltr">{p.nameEn}</p>}
                <div className="mt-1.5 flex justify-center">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                    {p.provider.split(" — ")[0]}
                  </span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <RowLabel label="الحالة" />
            {programs.map(p => (
              <td key={p.id} className={cell}>
                {p.isActive
                  ? <span className="text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full">نشط ●</span>
                  : <span className="text-xs text-muted-foreground">غير نشط</span>}
              </td>
            ))}
          </tr>
          <tr>
            <RowLabel label="الحد الأدنى للمعدل" />
            {programs.map(p => (
              <td key={p.id} className={cell}>
                {!p.minGpa || p.minGpa.includes("مراجعة") ? <NeedsReview /> : <span className="font-medium">{p.minGpa}</span>}
              </td>
            ))}
          </tr>
          <tr>
            <RowLabel label="اشتراط اللغة" />
            {programs.map(p => (
              <td key={p.id} className={cell}>
                {p.requiresLanguageTest
                  ? <span className="text-xs text-primary font-medium">
                    {!p.languageRequirement || p.languageRequirement.includes("مراجعة") ? "نعم" : p.languageRequirement}
                  </span>
                  : <span className="text-xs text-muted-foreground">لا يشترط</span>}
              </td>
            ))}
          </tr>
          <tr>
            <RowLabel label="SAT / ACT" />
            {programs.map(p => (
              <td key={p.id} className={cell}><CheckOrCross value={p.requiresSAT} /></td>
            ))}
          </tr>
          <tr>
            <RowLabel label="قبول جامعي" />
            {programs.map(p => (
              <td key={p.id} className={cell}><CheckOrCross value={p.requiresUniversityAdmission} /></td>
            ))}
          </tr>
          <tr>
            <RowLabel label="الحد الأقصى للعمر" />
            {programs.map(p => (
              <td key={p.id} className={cell}>
                {!p.maxAge || p.maxAge.includes("مراجعة") ? <NeedsReview /> : <span>{p.maxAge}</span>}
              </td>
            ))}
          </tr>
          <tr>
            <RowLabel label="عدد المسارات" />
            {programs.map(p => (
              <td key={p.id} className={cell}>
                {p.tracks && p.tracks.length > 0
                  ? <span className="font-semibold text-primary">{p.tracks.length}</span>
                  : <span className="text-muted-foreground">—</span>}
              </td>
            ))}
          </tr>
          <tr>
            <RowLabel label="الدول المتاحة" />
            {programs.map(p => (
              <td key={p.id} className={cell}>
                {!p.allowedCountries?.length || p.allowedCountries[0]?.includes("مراجعة") ? (
                  <NeedsReview />
                ) : (
                  <div className="flex flex-wrap justify-center gap-1">
                    {p.allowedCountries.slice(0, 3).map((c, i) => (
                      <span key={i} className="text-xs bg-muted px-1.5 py-0.5 rounded">{c}</span>
                    ))}
                    {p.allowedCountries.length > 3 && (
                      <span className="text-xs text-muted-foreground">+{p.allowedCountries.length - 3}</span>
                    )}
                  </div>
                )}
              </td>
            ))}
          </tr>
          <tr>
            <RowLabel label="الموقع الرسمي" />
            {programs.map(p => (
              <td key={p.id} className={cell}>
                {p.officialUrl && p.officialUrl !== "يحتاج مراجعة" ? (
                  <a href={p.officialUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm" className="text-xs h-7 mx-auto">
                      <Globe size={11} className="ml-1" />زيارة<ExternalLink size={9} className="mr-1" />
                    </Button>
                  </a>
                ) : <NeedsReview />}
              </td>
            ))}
          </tr>
          {programs.some(p => p.notes) && (
            <tr>
              <RowLabel label="ملاحظات" />
              {programs.map(p => (
                <td key={p.id} className={`${cell} text-right`}>
                  {p.notes
                    ? <p className="text-xs text-amber-700 leading-relaxed">{p.notes}</p>
                    : <span className="text-muted-foreground">—</span>}
                </td>
              ))}
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

/* ─── University comparison table ────────────────────────────────────────── */
function UniversityCompare({ universities }: { universities: University[] }) {
  const cell = "px-3 py-2.5 text-xs text-center border-b border-border align-middle";
  const headerCell = "px-3 py-3 text-center border-b border-border bg-accent/40 min-w-[180px]";

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full border-collapse" dir="rtl">
        <thead>
          <tr>
            <th className="px-3 py-3 bg-muted/30 border-b border-border w-36" />
            {universities.map(u => (
              <th key={u.id} className={headerCell}>
                <p className="text-sm font-bold text-foreground leading-tight">{u.nameAr}</p>
                {u.nameEn && <p className="text-xs text-muted-foreground mt-0.5" dir="ltr">{u.nameEn.split(" (")[0]}</p>}
                <div className="mt-1.5 flex justify-center">
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${u.type === "international" ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-green-50 text-green-700 border-green-200"}`}>
                    {u.type === "international" ? "دولية" : "محلية"}
                  </span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <RowLabel label="الدولة / المدينة" />
            {universities.map(u => (
              <td key={u.id} className={cell}>
                <span className="font-medium">{u.country}</span>
                <span className="block text-muted-foreground">{u.city}</span>
              </td>
            ))}
          </tr>
          <tr>
            <RowLabel label="نسبة القبول" />
            {universities.map(u => (
              <td key={u.id} className={cell}>
                {u.acceptanceRate?.includes("مراجعة") ? <NeedsReview /> : <span className="font-semibold">{u.acceptanceRate ?? "—"}</span>}
              </td>
            ))}
          </tr>
          <tr>
            <RowLabel label="الحد الأدنى للثانوية" />
            {universities.map(u => (
              <td key={u.id} className={cell}>
                {u.minHighSchoolGpa ? <span className="font-semibold">{u.minHighSchoolGpa}%</span> : <NeedsReview />}
              </td>
            ))}
          </tr>
          <tr>
            <RowLabel label="IELTS" />
            {universities.map(u => (
              <td key={u.id} className={cell}>{u.languageRequirements?.ielts ?? "—"}</td>
            ))}
          </tr>
          <tr>
            <RowLabel label="TOEFL iBT" />
            {universities.map(u => (
              <td key={u.id} className={cell}>{u.languageRequirements?.toefl ?? "—"}</td>
            ))}
          </tr>
          <tr>
            <RowLabel label="SAT" />
            {universities.map(u => (
              <td key={u.id} className={cell}>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  u.satRequired === "required" ? "bg-red-50 text-red-700" :
                  u.satRequired === "optional" ? "bg-yellow-50 text-yellow-700" :
                  "bg-muted text-muted-foreground"
                }`}>
                  {u.satRequired === "required" ? "مطلوب" : u.satRequired === "optional" ? "اختياري" : "غير مطلوب"}
                </span>
              </td>
            ))}
          </tr>
          <tr>
            <RowLabel label="مناسبة للابتعاث" />
            {universities.map(u => (
              <td key={u.id} className={cell}><CheckOrCross value={u.suitableForSaudiScholarship} /></td>
            ))}
          </tr>
          <tr>
            <RowLabel label="عدد التخصصات" />
            {universities.map(u => (
              <td key={u.id} className={cell}>
                <span className="font-semibold text-primary">{u.majors?.length ?? 0}</span>
              </td>
            ))}
          </tr>
          <tr>
            <RowLabel label="التخصصات" />
            {universities.map(u => (
              <td key={u.id} className={`${cell}`}>
                <div className="flex flex-wrap justify-center gap-1">
                  {u.majors?.slice(0, 4).map((m, i) => (
                    <span key={i} className="text-xs bg-accent text-primary px-1.5 py-0.5 rounded">{m}</span>
                  ))}
                  {(u.majors?.length ?? 0) > 4 && (
                    <span className="text-xs text-muted-foreground">+{(u.majors?.length ?? 0) - 4}</span>
                  )}
                </div>
              </td>
            ))}
          </tr>
          <tr>
            <RowLabel label="الموقع الرسمي" />
            {universities.map(u => (
              <td key={u.id} className={cell}>
                {u.websiteUrl ? (
                  <a href={u.websiteUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm" className="text-xs h-7 mx-auto">
                      <Globe size={11} className="ml-1" />زيارة<ExternalLink size={9} className="mr-1" />
                    </Button>
                  </a>
                ) : <span className="text-muted-foreground">—</span>}
              </td>
            ))}
          </tr>
          {universities.some(u => u.admissionNotes) && (
            <tr>
              <RowLabel label="ملاحظات القبول" />
              {universities.map(u => (
                <td key={u.id} className={`${cell} text-right max-w-[200px]`}>
                  <p className="text-xs text-muted-foreground leading-relaxed">{u.admissionNotes ?? "—"}</p>
                </td>
              ))}
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

/* ─── Empty state prompt ─────────────────────────────────────────────────── */
function EmptyComparePrompt({ label }: { label: string }) {
  return (
    <div className="text-center py-14 border-2 border-dashed border-border rounded-xl bg-muted/10">
      <GitCompare size={36} className="text-muted-foreground/30 mx-auto mb-3" />
      <p className="text-muted-foreground text-sm font-medium">أضف {label} للبدء بالمقارنة</p>
      <p className="text-muted-foreground/60 text-xs mt-1">يمكنك مقارنة حتى 4 {label} في نفس الوقت</p>
    </div>
  );
}

/* ─── Main page ──────────────────────────────────────────────────────────── */
export default function ComparePage() {
  const [mode, setMode] = useState<Mode>("scholarships");
  const [scholarships, setScholarships] = useState<ScholarshipProgram[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [selectedSch, setSelectedSch] = useState<string[]>([]);
  const [selectedUni, setSelectedUni] = useState<string[]>([]);

  const MAX = 4;

  useEffect(() => {
    (async () => {
      try {
        await seedIfEmpty();
        const [sch, uni] = await Promise.all([getScholarshipPrograms(), getUniversities()]);
        setScholarships(sch ?? []);
        setUniversities(uni ?? []);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* reset selections on mode switch */
  useEffect(() => {
    setSelectedSch([]);
    setSelectedUni([]);
  }, [mode]);

  const selectedSchPrograms = selectedSch
    .map(id => scholarships.find(s => s.id === id))
    .filter(Boolean) as ScholarshipProgram[];

  const selectedUnis = selectedUni
    .map(id => universities.find(u => u.id === id))
    .filter(Boolean) as University[];

  const schItems = scholarships.map(s => ({
    id: s.id!,
    name: s.nameAr,
    sub: s.nameEn,
  }));

  const uniItems = universities.map(u => ({
    id: u.id!,
    name: u.nameAr,
    sub: `${u.city}، ${u.country}`,
  }));

  return (
    <Layout title="المقارنة">
      <div className="p-4 sm:p-6 max-w-6xl mx-auto" dir="rtl">
        {error && <FirebaseBanner />}

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-xl bg-accent flex items-center justify-center flex-shrink-0">
            <GitCompare size={22} className="text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">المقارنة</h2>
            <p className="text-sm text-muted-foreground">قارن برامج الابتعاث أو الجامعات جنباً إلى جنب — حتى 4 عناصر</p>
          </div>
        </div>

        {/* Mode tabs */}
        <div className="flex gap-2 mb-6">
          {([
            { key: "scholarships", label: "برامج الابتعاث", Icon: Award },
            { key: "universities", label: "الجامعات", Icon: Building2 },
          ] as const).map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => setMode(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === key
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-accent hover:text-primary"
              }`}
            >
              <Icon size={16} />{label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
            </div>
            <Skeleton className="h-64 rounded-xl" />
          </div>
        ) : (
          <>
            {/* Scholarship mode */}
            {mode === "scholarships" && (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-5">
                  {selectedSchPrograms.map(prog => (
                    <SelectedCard
                      key={prog.id}
                      icon={Award}
                      name={prog.nameAr}
                      sub={prog.nameEn}
                      provider={prog.provider.split(" — ")[0]}
                      onRemove={() => setSelectedSch(prev => prev.filter(x => x !== prog.id))}
                    />
                  ))}
                  {selectedSch.length < MAX && (
                    <AddItemSlot
                      onSelect={id => setSelectedSch(prev => [...prev, id])}
                      items={schItems}
                      selectedIds={selectedSch}
                      label="برنامج"
                      icon={Award}
                    />
                  )}
                </div>
                {selectedSchPrograms.length >= 2
                  ? <ScholarshipCompare programs={selectedSchPrograms} />
                  : <EmptyComparePrompt label="برنامجين على الأقل" />}
              </>
            )}

            {/* University mode */}
            {mode === "universities" && (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-5">
                  {selectedUnis.map(uni => (
                    <SelectedCard
                      key={uni.id}
                      icon={Building2}
                      name={uni.nameAr}
                      sub={`${uni.city}، ${uni.country}`}
                      onRemove={() => setSelectedUni(prev => prev.filter(x => x !== uni.id))}
                    />
                  ))}
                  {selectedUni.length < MAX && (
                    <AddItemSlot
                      onSelect={id => setSelectedUni(prev => [...prev, id])}
                      items={uniItems}
                      selectedIds={selectedUni}
                      label="جامعة"
                      icon={Building2}
                    />
                  )}
                </div>
                {selectedUnis.length >= 2
                  ? <UniversityCompare universities={selectedUnis} />
                  : <EmptyComparePrompt label="جامعتين على الأقل" />}
              </>
            )}
          </>
        )}

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mt-5 flex items-start gap-2">
          <AlertCircle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 leading-relaxed">
            البيانات المعروضة للإرشاد فقط وقد تتغير. يرجى دائماً مراجعة المواقع الرسمية للتأكد من المعلومات الحالية.
          </p>
        </div>
      </div>
    </Layout>
  );
}

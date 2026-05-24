import { useState, useEffect } from "react";
import { Calculator, Building2, AlertCircle, CheckCircle2, ChevronDown, ChevronUp, RefreshCw, Search, X } from "lucide-react";
import Layout from "@/components/Layout";
import { getUniversities, getStudentProfile, saveStudentProfile, type University, type InternationalTest } from "@/lib/firestore";
import { seedIfEmpty } from "@/lib/seed";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import FirebaseBanner from "@/components/FirebaseBanner";
import BetaBanner from "@/components/BetaBanner";

function normalizeAr(text: string) {
  return text.toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[أإآٱ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي")
    .replace(/ؤ/g, "و").replace(/ئ/g, "ي").trim();
}

interface Grades {
  highSchool: string;
  qudorat: string;
  tahsili: string;
  step: string;
  ielts: string;
  toefl: string;
  duolingo: string;
  pte: string;
  sat: string;
  act: string;
}

interface CalcResult {
  university: University;
  weightedScore: number | null;
  formulaNote: string | null;
  needsReview: boolean;
  progressPct: number;
  minRequired: number | null;
  langStatus: "ok" | "low" | "missing";
  langDetail: string;
}

function computeWeighted(uni: University, g: Grades): CalcResult {
  const hs = parseFloat(g.highSchool) || 0;
  const qd = parseFloat(g.qudorat) || 0;
  const th = parseFloat(g.tahsili) || 0;
  const wf = uni.weightedFormula;

  let weightedScore: number | null = null;
  let formulaNote: string | null = null;
  let needsReview = false;

  if (wf && (wf.highSchool || wf.qudorat || wf.tahsili)) {
    const total = (wf.highSchool ?? 0) + (wf.qudorat ?? 0) + (wf.tahsili ?? 0);
    if (total > 0) {
      weightedScore =
        (hs * (wf.highSchool ?? 0)) / 100 +
        (qd * (wf.qudorat ?? 0)) / 100 +
        (th * (wf.tahsili ?? 0)) / 100;
      weightedScore = Math.round(weightedScore * 100) / 100;
    }
    if (wf.note) formulaNote = wf.note;
  } else {
    needsReview = true;
  }

  if (uni.needsReview) needsReview = true;

  const minReq = uni.minHighSchoolGpa ?? null;
  let progressPct = 0;
  if (weightedScore !== null) {
    const baseline = minReq ?? 80;
    progressPct = Math.min(100, Math.round((weightedScore / baseline) * 100));
  }

  const lr = uni.languageRequirements ?? {};
  const ieltsVal = parseFloat(g.ielts) || 0;
  const toeflVal = parseFloat(g.toefl) || 0;
  const stepVal = parseFloat(g.step) || 0;
  const duolingoVal = parseFloat(g.duolingo) || 0;
  const pteVal = parseFloat(g.pte) || 0;

  let langStatus: "ok" | "low" | "missing" = "ok";
  let langDetail = "";

  const reqIelts = lr.ielts ? parseFloat(lr.ielts) : null;
  const reqToefl = lr.toefl ? parseFloat(lr.toefl) : null;
  const reqStep = lr.step ? parseFloat(lr.step) : null;
  const reqDuolingo = lr.duolingo ? parseFloat(lr.duolingo) : null;
  const reqPte = lr.pte ? parseFloat(lr.pte) : null;

  if (reqIelts || reqToefl || reqStep || reqDuolingo || reqPte) {
    const ieltsOk = reqIelts && ieltsVal > 0 ? ieltsVal >= reqIelts : false;
    const toeflOk = reqToefl && toeflVal > 0 ? toeflVal >= reqToefl : false;
    const stepOk = reqStep && stepVal > 0 ? stepVal >= reqStep : false;
    const duolingoOk = reqDuolingo && duolingoVal > 0 ? duolingoVal >= reqDuolingo : false;
    const pteOk = reqPte && pteVal > 0 ? pteVal >= reqPte : false;
    const hasAny = ieltsVal > 0 || toeflVal > 0 || stepVal > 0 || duolingoVal > 0 || pteVal > 0;

    const parts: string[] = [];
    if (reqIelts) parts.push(`IELTS ${reqIelts}`);
    if (reqToefl) parts.push(`TOEFL ${reqToefl}`);
    if (reqStep) parts.push(`STEP ${reqStep}`);
    if (reqDuolingo) parts.push(`Duolingo ${reqDuolingo}`);
    if (reqPte) parts.push(`PTE ${reqPte}`);
    langDetail = parts.join(" أو ");

    if (!hasAny) { langStatus = "missing"; }
    else if (ieltsOk || toeflOk || stepOk || duolingoOk || pteOk) { langStatus = "ok"; }
    else { langStatus = "low"; }
  }

  return { university: uni, weightedScore, formulaNote, needsReview, progressPct, minRequired: minReq, langStatus, langDetail };
}

export default function CalculatorPage() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);
  const [firebaseError, setFirebaseError] = useState(false);
  const [calculated, setCalculated] = useState(false);
  const [results, setResults] = useState<CalcResult[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "local" | "international">("all");

  const [grades, setGrades] = useState<Grades>({
    highSchool: "", qudorat: "", tahsili: "",
    step: "", ielts: "", toefl: "", duolingo: "", pte: "",
    sat: "", act: "",
  });

  useEffect(() => {
    const load = async () => {
      try {
        await seedIfEmpty();
        const unis = await getUniversities();
        setUniversities(unis ?? []);
        if (currentUser) {
          const profile = await getStudentProfile(currentUser.uid);
          if (profile?.grades) {
            setGrades((prev) => ({
              ...prev,
              highSchool: String(profile.grades?.highSchoolGpa ?? ""),
              qudorat: String(profile.grades?.qudoratScore ?? ""),
              tahsili: String(profile.grades?.tahsiliScore ?? ""),
              step: String(profile.grades?.stepScore ?? ""),
            }));
          }
          if (profile?.tests) {
            const ielts = profile.tests.find((t) => t.type === "ielts");
            const toefl = profile.tests.find((t) => t.type === "toefl");
            const step = profile.tests.find((t) => t.type === "step");
            const duolingo = profile.tests.find((t) => t.type === "duolingo");
            const pte = profile.tests.find((t) => t.type === "pte");
            setGrades((prev) => ({
              ...prev,
              ielts: ielts ? String(ielts.score) : prev.ielts,
              toefl: toefl ? String(toefl.score) : prev.toefl,
              step: step ? String(step.score) : prev.step,
              duolingo: duolingo ? String(duolingo.score) : prev.duolingo,
              pte: pte ? String(pte.score) : prev.pte,
            }));
          }
          if (profile?.internationalTests && Array.isArray(profile.internationalTests)) {
            const itArr = profile.internationalTests as InternationalTest[];
            const satTest = itArr.find((t) => t.type === "sat");
            const actTest = itArr.find((t) => t.type === "act");
            setGrades((prev) => ({
              ...prev,
              sat: satTest ? String(satTest.score) : prev.sat,
              act: actTest ? String(actTest.score) : prev.act,
            }));
          }
        }
      } catch {
        setFirebaseError(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [currentUser]);

  const set = (k: keyof Grades, v: string) => setGrades((p) => ({ ...p, [k]: v }));

  const calculate = () => {
    const local = universities.filter((u) => u.type === "local");
    const intl = universities.filter((u) => u.type === "international");
    const all = [...local, ...intl].map((u) => computeWeighted(u, grades));
    all.sort((a, b) => {
      if (a.weightedScore !== null && b.weightedScore !== null) return b.weightedScore - a.weightedScore;
      if (a.weightedScore !== null) return -1;
      if (b.weightedScore !== null) return 1;
      return 0;
    });
    setResults(all);
    setCalculated(true);
    setShowAll(false);
  };

  const saveToProfile = async () => {
    if (!currentUser) return;
    setSaving(true);
    try {
      await saveStudentProfile(currentUser.uid, {
        grades: {
          highSchoolGpa: parseFloat(grades.highSchool) || undefined,
          qudoratScore: parseFloat(grades.qudorat) || undefined,
          tahsiliScore: parseFloat(grades.tahsili) || undefined,
          stepScore: parseFloat(grades.step) || undefined,
        },
      });
      toast({ title: "تم حفظ الدرجات في ملفك الشخصي ✓" });
    } catch {
      toast({ title: "خطأ في الحفظ", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const filteredResults = results.filter((r) => {
    const q = searchQuery.trim();
    if (q) {
      const nq = normalizeAr(q);
      const nameAr = normalizeAr(r.university.nameAr);
      const nameEn = (r.university.nameEn ?? "").toLowerCase();
      const city = normalizeAr(r.university.city ?? "");
      const country = normalizeAr(r.university.country ?? "");
      if (!nameAr.includes(nq) && !nameEn.includes(q.toLowerCase()) && !city.includes(nq) && !country.includes(nq)) return false;
    }
    if (typeFilter !== "all" && r.university.type !== typeFilter) return false;
    return true;
  });
  const displayed = showAll ? filteredResults : filteredResults.slice(0, 6);

  const getScoreColor = (score: number, min: number | null) => {
    const ref = min ?? 80;
    if (score >= ref + 5) return { text: "text-green-700", bg: "bg-green-50 border-green-200" };
    if (score >= ref) return { text: "text-primary", bg: "bg-accent border-primary/20" };
    if (score >= ref - 10) return { text: "text-amber-700", bg: "bg-amber-50 border-amber-200" };
    return { text: "text-red-700", bg: "bg-red-50 border-red-200" };
  };

  const inputClass = "h-9 text-sm text-center";

  return (
    <Layout title="حاسبة الموزونة">
      <div className="p-6 max-w-3xl mx-auto" dir="rtl">
        {firebaseError && <FirebaseBanner />}
        <BetaBanner />

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center">
            <Calculator size={24} className="text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">حاسبة الموزونة الذكية</h2>
            <p className="text-sm text-muted-foreground">يحسب موزونتك بمعادلة كل جامعة من Firestore</p>
          </div>
        </div>

        <Card className="border-border mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center justify-between">
              <span>أدخل درجاتك</span>
              {currentUser && (
                <Button variant="ghost" size="sm" onClick={saveToProfile} disabled={saving} className="text-xs h-7">
                  {saving ? "جاري الحفظ..." : "حفظ في ملفي"}
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">الاختبارات السعودية</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { key: "highSchool", label: "الثانوية", placeholder: "95.5", hint: "0–100" },
                  { key: "qudorat", label: "القدرات", placeholder: "85", hint: "0–100" },
                  { key: "tahsili", label: "التحصيلي", placeholder: "88", hint: "0–100" },
                  { key: "step", label: "STEP", placeholder: "70", hint: "0–100" },
                ].map(({ key, label, placeholder, hint }) => (
                  <div key={key}>
                    <label className="text-xs font-medium mb-1 block text-center">{label}</label>
                    <Input
                      type="number" min="0" max="100" step="0.1"
                      value={grades[key as keyof Grades]}
                      onChange={(e) => set(key as keyof Grades, e.target.value)}
                      placeholder={placeholder}
                      className={inputClass}
                      data-testid={`input-${key}`}
                    />
                    <p className="text-xs text-muted-foreground text-center mt-0.5">{hint}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-border pt-4 mb-4">
              <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">اختبارات اللغة الإنجليزية (الدولية)</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
                {[
                  { key: "ielts", label: "IELTS", placeholder: "6.5", hint: "0–9" },
                  { key: "toefl", label: "TOEFL iBT", placeholder: "90", hint: "0–120" },
                  { key: "duolingo", label: "Duolingo", placeholder: "110", hint: "10–160" },
                  { key: "pte", label: "PTE", placeholder: "60", hint: "10–90" },
                ].map(({ key, label, placeholder, hint }) => (
                  <div key={key}>
                    <label className="text-xs font-medium mb-1 block text-center">{label}</label>
                    <Input
                      type="number" step="0.1"
                      value={grades[key as keyof Grades]}
                      onChange={(e) => set(key as keyof Grades, e.target.value)}
                      placeholder={placeholder}
                      className={inputClass}
                      dir="ltr"
                      data-testid={`input-${key}`}
                    />
                    <p className="text-xs text-muted-foreground text-center mt-0.5">{hint}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide border-t border-border pt-3">الاختبارات الدولية</p>
              <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
                {[
                  { key: "sat", label: "SAT", placeholder: "1200", hint: "400–1600" },
                  { key: "act", label: "ACT", placeholder: "28", hint: "1–36" },
                ].map(({ key, label, placeholder, hint }) => (
                  <div key={key}>
                    <label className="text-xs font-medium mb-1 block text-center">{label}</label>
                    <Input
                      type="number" step="0.1"
                      value={grades[key as keyof Grades]}
                      onChange={(e) => set(key as keyof Grades, e.target.value)}
                      placeholder={placeholder}
                      className={inputClass}
                      dir="ltr"
                      data-testid={`input-${key}`}
                    />
                    <p className="text-xs text-muted-foreground text-center mt-0.5">{hint}</p>
                  </div>
                ))}
              </div>
            </div>

            <Button
              onClick={calculate}
              className="w-full"
              disabled={!grades.highSchool && !grades.qudorat}
              data-testid="button-calculate"
            >
              <Calculator size={16} className="ml-2" />
              احسب الموزونة لجميع الجامعات
            </Button>
          </CardContent>
        </Card>

        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
          </div>
        )}

        {calculated && !loading && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
              <div className="flex-1 flex items-center gap-2 bg-muted/40 border border-border rounded-lg px-3 py-2">
                <Search size={14} className="text-muted-foreground flex-shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setShowAll(false); }}
                  placeholder="ابحث عن جامعة..."
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  dir="rtl"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")}><X size={12} className="text-muted-foreground" /></button>
                )}
              </div>
              <div className="flex gap-1.5">
                {(["all", "local", "international"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => { setTypeFilter(t); setShowAll(false); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${typeFilter === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"}`}
                  >
                    {t === "all" ? "الكل" : t === "local" ? "محلية" : "دولية"}
                  </button>
                ))}
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">{filteredResults.length} جامعة</span>
            </div>

            <div className="space-y-3">
              {displayed.map((r) => {
                const colors = r.weightedScore !== null
                  ? getScoreColor(r.weightedScore, r.minRequired)
                  : { text: "text-muted-foreground", bg: "bg-muted/30 border-border" };

                return (
                  <Card
                    key={r.university.id}
                    className={`border ${colors.bg}`}
                    data-testid={`card-calc-${r.university.id}`}
                  >
                    <CardContent className="py-3 px-4">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-0.5">
                            <Building2 size={13} className="text-muted-foreground flex-shrink-0" />
                            <p className="font-medium text-sm text-foreground leading-tight">{r.university.nameAr}</p>
                            <Badge variant="secondary" className="text-xs py-0">
                              {r.university.type === "local" ? "محلية" : "دولية"}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {r.university.city}، {r.university.country}
                          </p>
                        </div>

                        <div className="text-left flex-shrink-0">
                          {r.weightedScore !== null ? (
                            <div className={`text-xl font-bold ${colors.text}`}>
                              {r.weightedScore.toFixed(2)}
                            </div>
                          ) : (
                            <span className="text-xs text-amber-600 font-medium bg-amber-50 border border-amber-200 px-2 py-1 rounded-full whitespace-nowrap">
                              يحتاج مراجعة
                            </span>
                          )}
                        </div>
                      </div>

                      {r.weightedScore !== null && (
                        <>
                          <div className="flex items-center gap-2 mb-1">
                            <Progress value={Math.min(r.progressPct, 100)} className="h-2 flex-1" />
                            <span className="text-xs text-muted-foreground w-8 text-left">{Math.min(r.progressPct, 100)}%</span>
                          </div>
                          {r.minRequired && (
                            <p className="text-xs text-muted-foreground">
                              الحد الأدنى التقريبي: {r.minRequired}% |{" "}
                              {r.weightedScore >= r.minRequired ? (
                                <span className="text-green-600 font-medium">✓ مؤهل</span>
                              ) : (
                                <span className="text-red-600 font-medium">يحتاج {(r.minRequired - r.weightedScore).toFixed(1)} نقطة إضافية</span>
                              )}
                            </p>
                          )}
                        </>
                      )}

                      {r.formulaNote && (
                        <div className="flex items-center gap-1 mt-1.5">
                          <AlertCircle size={11} className="text-amber-500 flex-shrink-0" />
                          <p className="text-xs text-amber-600">{r.formulaNote}</p>
                        </div>
                      )}

                      {r.needsReview && !r.formulaNote && (
                        <div className="flex items-center gap-1 mt-1.5">
                          <AlertCircle size={11} className="text-amber-500 flex-shrink-0" />
                          <p className="text-xs text-amber-600">معادلة الموزونة تحتاج مراجعة — يرجى التحقق من الموقع الرسمي</p>
                        </div>
                      )}

                      {r.langDetail && (
                        <div className={`flex items-center gap-1 mt-1.5 ${r.langStatus === "ok" ? "text-green-600" : r.langStatus === "low" ? "text-amber-600" : "text-muted-foreground"}`}>
                          {r.langStatus === "ok" ? (
                            <CheckCircle2 size={11} className="flex-shrink-0" />
                          ) : (
                            <AlertCircle size={11} className="flex-shrink-0" />
                          )}
                          <p className="text-xs">
                            {r.langStatus === "ok" && "✓ درجة اللغة مقبولة"}
                            {r.langStatus === "low" && `درجة اللغة أقل من المطلوب (${r.langDetail})`}
                            {r.langStatus === "missing" && `يتطلب: ${r.langDetail}`}
                          </p>
                        </div>
                      )}

                      {r.university.weightedFormula && !r.needsReview && r.weightedScore !== null && (
                        <p className="text-xs text-muted-foreground/60 mt-1.5">
                          المعادلة: {r.university.weightedFormula.highSchool ?? 0}% ثانوي
                          {r.university.weightedFormula.qudorat ? ` + ${r.university.weightedFormula.qudorat}% قدرات` : ""}
                          {r.university.weightedFormula.tahsili ? ` + ${r.university.weightedFormula.tahsili}% تحصيلي` : ""}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {filteredResults.length === 0 && (
              <div className="text-center py-10 border-2 border-dashed border-border rounded-xl">
                <Search size={28} className="text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">لا توجد نتائج للبحث</p>
              </div>
            )}
            {filteredResults.length > 6 && (
              <Button
                variant="outline"
                className="w-full mt-3 text-sm"
                onClick={() => setShowAll((v) => !v)}
              >
                {showAll ? (
                  <><ChevronUp size={15} className="ml-1" />عرض أقل</>
                ) : (
                  <><ChevronDown size={15} className="ml-1" />عرض جميع الجامعات ({filteredResults.length})</>
                )}
              </Button>
            )}

            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs text-amber-700 text-center">
                ⚠️ هذه الحسابات تقريبية مبنية على البيانات المتاحة. يرجى مراجعة المواقع الرسمية للجامعات للتأكد من شروط القبول الحالية.
              </p>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-2 text-xs text-muted-foreground"
              onClick={() => { setCalculated(false); setResults([]); }}
            >
              <RefreshCw size={12} className="ml-1" />
              إعادة الحساب
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
}

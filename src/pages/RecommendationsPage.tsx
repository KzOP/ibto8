import { useState, useEffect } from "react";
import { Link } from "wouter";
import {
  Star, Globe, MapPin, Award, ChevronDown, ChevronUp,
  AlertCircle, CheckCircle2, ExternalLink, TrendingUp, BookOpen,
} from "lucide-react";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import {
  getStudentProfile, getUniversities,
  type StudentProfile, type University,
} from "@/lib/firestore";
import { seedIfEmpty } from "@/lib/seed";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import FirebaseBanner from "@/components/FirebaseBanner";
import BetaBanner from "@/components/BetaBanner";

type Tier = "excellent" | "good" | "needs_improvement" | "difficult";

interface RecommendedUniversity {
  university: University;
  tier: Tier;
  score?: number;
  reasons: string[];
  gaps: string[];
  isScholarshipEligible: boolean;
}

function meetsLanguageRequirement(profile: StudentProfile, uni: University): boolean {
  const lr = uni.languageRequirements ?? {};
  if (Object.keys(lr).length === 0) return true;
  const tests = profile.tests ?? [];
  if (tests.length === 0) return true;
  for (const t of tests) {
    const req = lr[t.type];
    if (req) {
      const reqNum = parseFloat(req as string);
      if (!isNaN(reqNum) && t.score >= reqNum) return true;
    }
  }
  return false;
}

function getLanguageGaps(profile: StudentProfile, uni: University): string[] {
  const lr = uni.languageRequirements ?? {};
  if (Object.keys(lr).length === 0) return [];
  const tests = profile.tests ?? [];
  if (tests.length === 0) return [];

  const testMap: Record<string, number> = {};
  for (const t of tests) testMap[t.type] = t.score;

  const labels: Record<string, string> = {
    ielts: "IELTS", toefl: "TOEFL", duolingo: "Duolingo", step: "STEP", pte: "PTE",
  };
  const gaps: string[] = [];
  for (const [key, reqStr] of Object.entries(lr)) {
    if (!reqStr) continue;
    const req = parseFloat(reqStr as string);
    const got = testMap[key];
    if (got === undefined) continue;
    if (got < req) gaps.push(`${labels[key] ?? key}: لديك ${got} والمطلوب ${reqStr}`);
  }
  return gaps;
}

function evaluateUniversity(profile: StudentProfile, uni: University): RecommendedUniversity {
  const grades = profile.grades ?? {};
  const hs  = grades.highSchoolGpa;
  const qud = grades.qudoratScore;
  const tah = grades.tahsiliScore;

  const reasons: string[] = [];
  const gaps: string[]    = [];

  const langOk   = meetsLanguageRequirement(profile, uni);
  const langGaps = getLanguageGaps(profile, uni);
  if (!langOk && langGaps.length > 0) gaps.push(...langGaps);

  const minGpa = uni.minHighSchoolGpa;
  if (minGpa && hs !== undefined) {
    if (hs < minGpa) gaps.push(`معدل الثانوية أقل من الحد الأدنى (${minGpa}%)`);
    else reasons.push(`معدل الثانوية مناسب (${hs}% ≥ ${minGpa}%)`);
  }

  const wf = uni.weightedFormula;
  let score: number | undefined;
  if (
    wf && (wf.highSchool || wf.qudorat || wf.tahsili) &&
    hs !== undefined && qud !== undefined && tah !== undefined
  ) {
    const hsW = wf.highSchool ?? 0;
    const qW  = wf.qudorat  ?? 0;
    const tW  = wf.tahsili  ?? 0;
    const tot = hsW + qW + tW;
    if (tot > 0) {
      score = (hs * hsW + qud * qW + tah * tW) / tot;
      reasons.push(`الموزونة المحسوبة: ${score.toFixed(1)}`);
    }
  }

  if (uni.needsReview) reasons.push("⚠️ بيانات الجامعة تحتاج مراجعة");

  const isScholarshipEligible = uni.type === "international" && !!uni.suitableForSaudiScholarship;
  if (isScholarshipEligible) reasons.push("مؤهلة للابتعاث السعودي");

  let tier: Tier;
  if (gaps.length === 0 && langOk) {
    if      (score !== undefined && score >= 90) tier = "excellent";
    else if (score !== undefined && score >= 75) tier = "good";
    else if (hs !== undefined && hs >= (minGpa ?? 80)) tier = "good";
    else tier = "needs_improvement";
  } else if (gaps.length <= 1) {
    tier = "needs_improvement";
  } else {
    tier = "difficult";
  }

  return { university: uni, tier, score, reasons, gaps, isScholarshipEligible };
}

const TIER_CONFIG: Record<Tier, { label: string; color: string; bg: string; border: string; icon: any }> = {
  excellent:         { label: "فرصة ممتازة",  color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", icon: Star },
  good:              { label: "فرصة جيدة",     color: "text-blue-700",    bg: "bg-blue-50",    border: "border-blue-200",    icon: CheckCircle2 },
  needs_improvement: { label: "تحتاج تحسين",   color: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200",   icon: TrendingUp },
  difficult:         { label: "صعبة حالياً",    color: "text-red-700",     bg: "bg-red-50",     border: "border-red-200",     icon: AlertCircle },
};

function RecommendationCard({ rec }: { rec: RecommendedUniversity }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = TIER_CONFIG[rec.tier];
  const Icon = cfg.icon;
  const uni = rec.university;

  return (
    <Card className={`border ${cfg.border} hover:shadow-md transition-shadow`}>
      <CardContent className="py-4 px-5">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-xl ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
            <Icon size={18} className={cfg.color} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div>
                <p className="font-semibold text-sm text-foreground leading-tight">{uni.nameAr}</p>
                <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
                  <MapPin size={10} />
                  <span>{uni.city}، {uni.country}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 flex-shrink-0">
                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                  {cfg.label}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                  uni.type === "local"
                    ? "bg-slate-100 text-slate-700 border-slate-200"
                    : "bg-indigo-50 text-indigo-700 border-indigo-200"
                }`}>
                  {uni.type === "local" ? "جامعة محلية" : "جامعة دولية"}
                </span>
                {rec.isScholarshipEligible && (
                  <span className="text-xs px-2 py-0.5 rounded-full border bg-teal-50 text-teal-700 border-teal-200 flex items-center gap-1">
                    <Award size={9} />مؤهلة للابتعاث
                  </span>
                )}
              </div>
            </div>

            {rec.score !== undefined && (
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">الموزونة المحسوبة</span>
                  <span className="font-bold">{rec.score.toFixed(1)}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full ${
                      rec.score >= 90 ? "bg-emerald-500" :
                      rec.score >= 75 ? "bg-blue-500" :
                      rec.score >= 60 ? "bg-amber-500" : "bg-red-500"
                    }`}
                    style={{ width: `${Math.min(rec.score, 100)}%` }}
                  />
                </div>
              </div>
            )}

            {rec.gaps.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {rec.gaps.map((g, i) => (
                  <span key={i} className="text-xs bg-red-50 text-red-600 border border-red-200 rounded-full px-2 py-0.5 flex items-center gap-1">
                    <AlertCircle size={9} />{g}
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center gap-3 mt-2">
              <button
                className="text-xs text-primary hover:underline flex items-center gap-0.5"
                onClick={() => setExpanded((v) => !v)}
              >
                {expanded ? <><ChevronUp size={12} />إخفاء</> : <><ChevronDown size={12} />تفاصيل</>}
              </button>
              {uni.admissionUrl && (
                <a href={uni.admissionUrl} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline flex items-center gap-0.5">
                  <ExternalLink size={10} />التقديم
                </a>
              )}
            </div>

            {expanded && (
              <div className="mt-3 pt-3 border-t border-border space-y-2">
                {rec.reasons.length > 0 && (
                  <div>
                    <p className="text-xs font-medium mb-1">نقاط القوة:</p>
                    {rec.reasons.map((r, i) => (
                      <p key={i} className="text-xs text-muted-foreground flex items-center gap-1">
                        <CheckCircle2 size={10} className="text-emerald-500 flex-shrink-0" />{r}
                      </p>
                    ))}
                  </div>
                )}
                {uni.admissionNotes && (
                  <p className="text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2">
                    {uni.admissionNotes}
                  </p>
                )}
                {uni.needsReview && (
                  <div className="flex items-start gap-1.5 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1.5">
                    <AlertCircle size={11} className="text-amber-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-700">بيانات هذه الجامعة تحتاج مراجعة — تحقق من الموقع الرسمي</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TierSection({ title, recs, icon: Icon, color }: {
  title: string; recs: RecommendedUniversity[]; icon: any; color: string;
}) {
  if (recs.length === 0) return null;
  return (
    <div className="mb-6">
      <div className={`flex items-center gap-2 mb-3 ${color}`}>
        <Icon size={16} />
        <h3 className="font-semibold text-sm">{title}</h3>
        <Badge variant="outline" className="text-xs">{recs.length}</Badge>
      </div>
      <div className="space-y-3">
        {recs.map((r, i) => <RecommendationCard key={i} rec={r} />)}
      </div>
    </div>
  );
}

export default function RecommendationsPage() {
  const { currentUser } = useAuth();
  const [profile, setProfile]       = useState<StudentProfile | null>(null);
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading]       = useState(true);
  const [firebaseError, setFirebaseError] = useState(false);
  const [filter, setFilter] = useState<"all" | "local" | "international" | "scholarship">("all");

  useEffect(() => {
    if (!currentUser) return;
    const load = async () => {
      try {
        await seedIfEmpty();
        const [prof, unis] = await Promise.all([
          getStudentProfile(currentUser.uid),
          getUniversities(),
        ]);
        setProfile(prof ?? null);
        setUniversities(unis ?? []);
      } catch {
        setFirebaseError(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [currentUser]);

  const hasGrades = !!(profile?.grades?.highSchoolGpa ?? profile?.grades?.qudoratScore);

  const allRecs = profile
    ? universities.map((u) => evaluateUniversity(profile, u))
    : [];

  const filtered = allRecs.filter((r) => {
    if (filter === "local")         return r.university.type === "local";
    if (filter === "international") return r.university.type === "international" && !r.isScholarshipEligible;
    if (filter === "scholarship")   return r.isScholarshipEligible;
    return true;
  });

  const excellent = filtered.filter((r) => r.tier === "excellent");
  const good      = filtered.filter((r) => r.tier === "good");
  const improve   = filtered.filter((r) => r.tier === "needs_improvement");
  const difficult = filtered.filter((r) => r.tier === "difficult");

  const counts = {
    all:           allRecs.length,
    local:         allRecs.filter((r) => r.university.type === "local").length,
    international: allRecs.filter((r) => r.university.type === "international" && !r.isScholarshipEligible).length,
    scholarship:   allRecs.filter((r) => r.isScholarshipEligible).length,
  };

  return (
    <Layout title="توصياتي">
      <div className="p-6 max-w-3xl mx-auto" dir="rtl">
        {firebaseError && <FirebaseBanner />}
        <BetaBanner />

        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center">
            <Star size={24} className="text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">التوصيات الشخصية</h2>
            <p className="text-sm text-muted-foreground">بناءً على ملفك الأكاديمي</p>
          </div>
        </div>

        {!hasGrades && !loading && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5 flex items-start gap-2">
            <AlertCircle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">أضف درجاتك لتحصل على توصيات دقيقة</p>
              <p className="text-xs text-amber-700 mt-0.5 mb-2">
                معدل الثانوية والقدرات والتحصيلي واختبارات اللغة تُحسّن دقة التوصيات
              </p>
              <Link href="/profile">
                <Button size="sm" variant="outline" className="text-xs border-amber-300 text-amber-700 hover:bg-amber-100">
                  أكمل ملفك الشخصي ←
                </Button>
              </Link>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2 mb-5">
          {[
            { key: "all",           label: `الكل (${counts.all})` },
            { key: "local",         label: `محلية (${counts.local})` },
            { key: "international", label: `دولية (${counts.international})` },
            { key: "scholarship",   label: `مؤهلة للابتعاث (${counts.scholarship})` },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key as any)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                filter === key
                  ? "bg-primary text-white border-primary"
                  : "bg-background text-muted-foreground border-border hover:bg-accent"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {filter === "scholarship" && (
          <div className="flex items-start gap-2 bg-teal-50 border border-teal-200 rounded-xl px-4 py-3 mb-5">
            <Award size={14} className="text-teal-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-teal-700 leading-relaxed">
              الجامعات المعروضة هنا <strong>دولية فقط</strong> ومؤهلة للتقديم عبر برنامج خادم الحرمين أو برامج ابتعاث أخرى.
              الجامعات المحلية السعودية لا تُصنَّف كابتعاث خارجي.
            </p>
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Globe size={40} className="text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">لا توجد جامعات في هذه الفئة</p>
          </div>
        ) : (
          <>
            <TierSection title="فرص ممتازة"   recs={excellent} icon={Star}         color="text-emerald-700" />
            <TierSection title="فرص جيدة"      recs={good}      icon={CheckCircle2} color="text-blue-700" />
            <TierSection title="تحتاج تحسيناً" recs={improve}   icon={TrendingUp}   color="text-amber-700" />
            <TierSection title="صعبة حالياً"   recs={difficult} icon={AlertCircle}  color="text-red-700" />
          </>
        )}

        <div className="mt-6 bg-muted/40 border border-border rounded-xl p-4 flex items-start gap-2">
          <BookOpen size={14} className="text-muted-foreground flex-shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            التوصيات إرشادية وتعتمد على البيانات المُدخلة فقط. تحقق من الموقع الرسمي لكل جامعة.
            <Link href="/profile">
              <span className="text-primary hover:underline cursor-pointer mr-1">أضف اختبارات اللغة في ملفك الشخصي</span>
            </Link>
            لمقارنة دقيقة مع متطلبات كل جامعة.
          </p>
        </div>
      </div>
    </Layout>
  );
}

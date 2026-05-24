import { useState, useEffect } from "react";
import { BarChart3, Building2, Award, AlertCircle, CheckCircle2, Link2, FileText, RefreshCw, Globe } from "lucide-react";
import Layout from "@/components/Layout";
import { getUniversities, getScholarshipPrograms, type University, type ScholarshipProgram } from "@/lib/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import FirebaseBanner from "@/components/FirebaseBanner";

interface QualityStat {
  label: string;
  count: number;
  total: number;
  icon: React.ElementType;
  color: string;
  description: string;
}

function StatCard({ stat }: { stat: QualityStat }) {
  const pct = stat.total > 0 ? Math.round((stat.count / stat.total) * 100) : 0;
  const isGood = stat.count === 0;
  return (
    <Card className={`border ${isGood ? "border-green-200 bg-green-50/40" : "border-border"}`}>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start justify-between mb-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isGood ? "bg-green-100" : stat.color}`}>
            {isGood
              ? <CheckCircle2 size={18} className="text-green-600" />
              : <stat.icon size={18} />}
          </div>
          <span className={`text-2xl font-bold ${isGood ? "text-green-600" : stat.count > 0 ? "text-amber-600" : "text-foreground"}`}>
            {stat.count}
          </span>
        </div>
        <p className="text-sm font-medium text-foreground leading-tight">{stat.label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{stat.description}</p>
        {stat.total > 0 && (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>{pct}%</span>
              <span>من {stat.total}</span>
            </div>
            <Progress value={pct} className={`h-1.5 ${isGood ? "[&>div]:bg-green-500" : pct > 50 ? "[&>div]:bg-amber-500" : "[&>div]:bg-red-500"}`} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function UniversityReviewList({ universities }: { universities: University[] }) {
  const needsReview = universities.filter((u) => u.needsReview);
  if (needsReview.length === 0) return (
    <div className="text-center py-8">
      <CheckCircle2 size={28} className="text-green-500 mx-auto mb-2" />
      <p className="text-sm text-muted-foreground">جميع الجامعات موثّقة</p>
    </div>
  );

  return (
    <div className="divide-y divide-border">
      {needsReview.slice(0, 10).map((u) => (
        <div key={u.id} className="py-2.5 flex items-center gap-3">
          <AlertCircle size={14} className="text-amber-500 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{u.nameAr}</p>
            <p className="text-xs text-muted-foreground">{u.city}، {u.country}</p>
          </div>
          <div className="flex flex-wrap gap-1 justify-end">
            {!u.websiteUrl && <Badge variant="outline" className="text-xs text-red-600 border-red-200">بدون موقع</Badge>}
            {!u.weightedFormula && <Badge variant="outline" className="text-xs text-amber-600 border-amber-200">بدون موزونية</Badge>}
            {!u.majors?.length && <Badge variant="outline" className="text-xs text-blue-600 border-blue-200">بدون تخصصات</Badge>}
          </div>
        </div>
      ))}
      {needsReview.length > 10 && (
        <p className="text-xs text-muted-foreground pt-2 text-center">+{needsReview.length - 10} جامعة أخرى تحتاج مراجعة</p>
      )}
    </div>
  );
}

export default function AdminDataQualityPage() {
  const [universities, setUniversities] = useState<University[]>([]);
  const [programs, setPrograms] = useState<ScholarshipProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [firebaseError, setFirebaseError] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [unis, progs] = await Promise.all([getUniversities(), getScholarshipPrograms()]);
      setUniversities(unis ?? []);
      setPrograms(progs ?? []);
    } catch {
      setFirebaseError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const totalUnis = universities.length;
  const totalProgs = programs.length;

  const stats: QualityStat[] = [
    {
      label: "تحتاج مراجعة",
      count: universities.filter((u) => u.needsReview).length,
      total: totalUnis,
      icon: AlertCircle,
      color: "bg-amber-100 text-amber-600",
      description: "جامعات بـ needsReview = true",
    },
    {
      label: "بدون موقع رسمي",
      count: universities.filter((u) => !u.websiteUrl).length,
      total: totalUnis,
      icon: Globe,
      color: "bg-red-100 text-red-600",
      description: "جامعات بدون websiteUrl",
    },
    {
      label: "بدون شروط قبول",
      count: universities.filter((u) => !u.admissionNotes && !u.minHighSchoolGpa && !u.acceptanceRate).length,
      total: totalUnis,
      icon: FileText,
      color: "bg-orange-100 text-orange-600",
      description: "بدون أي شروط قبول موثّقة",
    },
    {
      label: "بدون موزونية مؤكدة",
      count: universities.filter((u) => !u.weightedFormula || (!u.weightedFormula.highSchool && !u.weightedFormula.qudorat && !u.weightedFormula.tahsili)).length,
      total: totalUnis,
      icon: BarChart3,
      color: "bg-purple-100 text-purple-600",
      description: "بدون weightedFormula محددة",
    },
    {
      label: "بدون مصادر (sourceLinks)",
      count: universities.filter((u) => !u.sourceLinks?.length).length,
      total: totalUnis,
      icon: Link2,
      color: "bg-blue-100 text-blue-600",
      description: "بدون أي روابط مصدر",
    },
    {
      label: "برامج تحتاج مراجعة",
      count: programs.filter((p) => p.needsReview).length,
      total: totalProgs,
      icon: Award,
      color: "bg-teal-100 text-teal-600",
      description: "برامج ابتعاث بـ needsReview = true",
    },
  ];

  const overallScore = totalUnis > 0
    ? Math.round(100 - (stats.slice(0, 5).reduce((acc, s) => acc + (s.count / (s.total || 1)) * 100, 0) / 5))
    : 0;

  const scoreColor = overallScore >= 80 ? "text-green-600" : overallScore >= 60 ? "text-amber-600" : "text-red-600";

  return (
    <Layout title="جودة البيانات">
      <div className="p-6 max-w-5xl mx-auto" dir="rtl">
        {firebaseError && <FirebaseBanner />}

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-sidebar flex items-center justify-center">
              <BarChart3 size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">لوحة جودة البيانات</h2>
              <p className="text-sm text-muted-foreground">مراقبة اكتمال ودقة بيانات المنصة</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw size={14} className={`ml-1.5 ${loading ? "animate-spin" : ""}`} />تحديث
          </Button>
        </div>

        {/* Overall score */}
        <Card className="mb-6 border-border">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className={`text-5xl font-bold ${scoreColor}`}>{loading ? "—" : overallScore}</p>
                <p className="text-xs text-muted-foreground mt-1">نقاط الجودة</p>
              </div>
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium">مؤشر جودة البيانات الكلية</span>
                  <span className={`font-bold ${scoreColor}`}>{overallScore}%</span>
                </div>
                <Progress value={overallScore} className={`h-3 ${overallScore >= 80 ? "[&>div]:bg-green-500" : overallScore >= 60 ? "[&>div]:bg-amber-500" : "[&>div]:bg-red-500"}`} />
                <p className="text-xs text-muted-foreground mt-2">
                  {overallScore >= 80 ? "بيانات ممتازة ✓" : overallScore >= 60 ? "تحتاج تحسين في بعض الجامعات" : "كثير من البيانات تحتاج مراجعة"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary counts */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
          <Card className="border-border">
            <CardContent className="pt-4 pb-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
                <Building2 size={20} className="text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{loading ? "—" : totalUnis}</p>
                <p className="text-xs text-muted-foreground">إجمالي الجامعات</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="pt-4 pb-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
                <Award size={20} className="text-teal-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{loading ? "—" : totalProgs}</p>
                <p className="text-xs text-muted-foreground">برامج الابتعاث</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border col-span-2 md:col-span-1">
            <CardContent className="pt-4 pb-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                <CheckCircle2 size={20} className="text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{loading ? "—" : universities.filter((u) => !u.needsReview).length}</p>
                <p className="text-xs text-muted-foreground">جامعات موثّقة</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quality stats grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-36 rounded-xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            {stats.map((s, i) => <StatCard key={i} stat={s} />)}
          </div>
        )}

        {/* Universities needing review */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertCircle size={15} className="text-amber-500" />
              الجامعات التي تحتاج مراجعة
              <Badge variant="outline" className="text-xs ml-auto">{universities.filter((u) => u.needsReview).length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
            ) : (
              <UniversityReviewList universities={universities} />
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

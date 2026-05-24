import { useState, useEffect } from "react";
import { useRoute, Link } from "wouter";
import {
  Building2, Globe, ExternalLink, FileText, MapPin, Calendar,
  AlertTriangle, CheckCircle2, XCircle, Info, ArrowRight, Link2, ShieldAlert
} from "lucide-react";
import Layout from "@/components/Layout";
import { getUniversity, type University } from "@/lib/firestore";
import { parseMajors } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import FirebaseBanner from "@/components/FirebaseBanner";

const satLabel: Record<string, string> = {
  required: "مطلوب",
  optional: "اختياري",
  not_required: "غير مطلوب",
};

const confidenceLabel: Record<string, { label: string; color: string }> = {
  high: { label: "بيانات موثّقة", color: "bg-green-100 text-green-700 border-green-200" },
  medium: { label: "موثوقية متوسطة", color: "bg-amber-100 text-amber-700 border-amber-200" },
  low: { label: "يحتاج مراجعة", color: "bg-red-100 text-red-700 border-red-200" },
  unverified: { label: "غير موثّق", color: "bg-gray-100 text-gray-700 border-gray-200" },
};

export default function UniversityDetailPage() {
  const [, params] = useRoute("/universities/:id");
  const id = params?.id ?? "";
  const [uni, setUni] = useState<University | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const data = await getUniversity(id);
        setUni(data);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <Layout title="تفاصيل الجامعة">
        <div className="p-6 max-w-4xl mx-auto space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="تفاصيل الجامعة">
        <div className="p-6"><FirebaseBanner /></div>
      </Layout>
    );
  }

  if (!uni) {
    return (
      <Layout title="تفاصيل الجامعة">
        <div className="p-6 text-center py-16">
          <p className="text-muted-foreground">لم يتم العثور على الجامعة</p>
          <Link href="/universities">
            <Button variant="outline" className="mt-4">العودة للقائمة</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const conf = confidenceLabel[uni.dataConfidence ?? "unverified"] ?? confidenceLabel["unverified"];
  const lr = uni.languageRequirements ?? {};
  const wf = uni.weightedFormula;

  const formatDate = (ts: any) => {
    if (!ts) return "غير محدد";
    try {
      const d = ts.toDate ? ts.toDate() : new Date(ts);
      return d.toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" });
    } catch {
      return "غير محدد";
    }
  };

  return (
    <Layout title={uni.nameAr}>
      <div className="p-6 max-w-4xl mx-auto">
        <Link href="/universities">
          <Button variant="ghost" size="sm" className="mb-4 text-muted-foreground">
            <ArrowRight size={16} className="ml-1" />
            العودة للجامعات
          </Button>
        </Link>

        <Alert className="mb-5 bg-amber-50 border-amber-200">
          <ShieldAlert size={16} className="text-amber-600" />
          <AlertDescription className="text-amber-800 text-sm">
            يرجى مراجعة الموقع الرسمي للجامعة لأن شروط القبول قد تتغير في أي وقت. المعلومات هنا للإرشاد فقط.
          </AlertDescription>
        </Alert>

        <div className="flex items-start gap-4 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center flex-shrink-0">
            <Building2 size={26} className="text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between flex-wrap gap-2">
              <div>
                <h1 className="text-xl font-bold text-foreground leading-tight">{uni.nameAr}</h1>
                <p className="text-muted-foreground text-sm mt-0.5">{uni.nameEn}</p>
              </div>
              <Badge className={`text-xs px-3 py-1 border ${conf.color}`}>{conf.label}</Badge>
            </div>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin size={14} />{uni.city}، {uni.country}
              </span>
              <Badge variant="secondary" className="text-xs">
                {uni.type === "local" ? "جامعة محلية" : "جامعة دولية"}
              </Badge>
              {uni.suitableForSaudiScholarship && (
                <Badge className="text-xs bg-teal-100 text-teal-700 hover:bg-teal-100">
                  <CheckCircle2 size={11} className="ml-1" />
                  مناسبة للابتعاث السعودي
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
              <Calendar size={12} />
              <span>آخر تحديث: {formatDate(uni.lastUpdatedAt)}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          {uni.websiteUrl && (
            <a href={uni.websiteUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" data-testid="button-website">
                <Globe size={14} className="ml-1.5" />
                الموقع الرسمي
                <ExternalLink size={12} className="mr-1.5" />
              </Button>
            </a>
          )}
          {uni.admissionUrl && (
            <a href={uni.admissionUrl} target="_blank" rel="noopener noreferrer">
              <Button size="sm" data-testid="button-admission">
                <ExternalLink size={14} className="ml-1.5" />
                صفحة التقديم
              </Button>
            </a>
          )}
          {uni.requirementsUrl && (
            <a href={uni.requirementsUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" data-testid="button-requirements">
                <FileText size={14} className="ml-1.5" />
                شروط القبول
                <ExternalLink size={12} className="mr-1.5" />
              </Button>
            </a>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <Card className="border-border">
            <CardHeader className="pb-2 pt-4">
              <CardTitle className="text-sm font-semibold">متطلبات اللغة الإنجليزية</CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(lr).length === 0 ? (
                <p className="text-muted-foreground text-sm">غير محدد — راجع الموقع الرسمي</p>
              ) : (
                <div className="space-y-2">
                  {lr.ielts && (
                    <div className="flex justify-between items-center py-1.5 border-b border-border last:border-0">
                      <span className="text-sm font-medium">IELTS</span>
                      <Badge variant="secondary">{lr.ielts}</Badge>
                    </div>
                  )}
                  {lr.toefl && (
                    <div className="flex justify-between items-center py-1.5 border-b border-border last:border-0">
                      <span className="text-sm font-medium">TOEFL iBT</span>
                      <Badge variant="secondary">{lr.toefl}</Badge>
                    </div>
                  )}
                  {lr.duolingo && (
                    <div className="flex justify-between items-center py-1.5 border-b border-border last:border-0">
                      <span className="text-sm font-medium">Duolingo</span>
                      <Badge variant="secondary">{lr.duolingo}</Badge>
                    </div>
                  )}
                  {lr.pte && (
                    <div className="flex justify-between items-center py-1.5 border-b border-border last:border-0">
                      <span className="text-sm font-medium">PTE Academic</span>
                      <Badge variant="secondary">{lr.pte}</Badge>
                    </div>
                  )}
                  {lr.step && (
                    <div className="flex justify-between items-center py-1.5">
                      <span className="text-sm font-medium">STEP</span>
                      <Badge variant="secondary">{lr.step}</Badge>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-2 pt-4">
              <CardTitle className="text-sm font-semibold">اختبارات القبول الأخرى</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center py-1.5 border-b border-border">
                  <span className="text-sm font-medium">SAT</span>
                  <Badge variant={uni.satRequired === "required" ? "default" : "secondary"}>
                    {satLabel[uni.satRequired ?? "not_required"] ?? "غير محدد"}
                  </Badge>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-border">
                  <span className="text-sm font-medium">ACT</span>
                  <Badge variant="secondary">
                    {satLabel[uni.actRequired ?? "not_required"] ?? "غير محدد"}
                  </Badge>
                </div>
                {uni.minHighSchoolGpa && (
                  <div className="flex justify-between items-center py-1.5">
                    <span className="text-sm font-medium">الحد الأدنى للثانوية</span>
                    <Badge variant="secondary">{uni.minHighSchoolGpa}%</Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {wf && (wf.highSchool || wf.qudorat || wf.tahsili || wf.note) && (
          <Card className="border-border mb-4">
            <CardHeader className="pb-2 pt-4">
              <CardTitle className="text-sm font-semibold">معادلة الموزونة</CardTitle>
            </CardHeader>
            <CardContent>
              {wf.note ? (
                <p className="text-sm text-muted-foreground">{wf.note}</p>
              ) : (
                <div className="flex flex-wrap gap-4">
                  {wf.highSchool > 0 && (
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{wf.highSchool}%</div>
                      <div className="text-xs text-muted-foreground">الثانوية</div>
                    </div>
                  )}
                  {wf.qudorat > 0 && (
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{wf.qudorat}%</div>
                      <div className="text-xs text-muted-foreground">القدرات</div>
                    </div>
                  )}
                  {wf.tahsili > 0 && (
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{wf.tahsili}%</div>
                      <div className="text-xs text-muted-foreground">التحصيلي</div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {(() => {
          const majors = parseMajors(uni.majors);
          return majors.length > 0 ? (
            <Card className="border-border mb-4">
              <CardHeader className="pb-2 pt-4">
                <CardTitle className="text-sm font-semibold">التخصصات المتاحة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {majors.map((m, i) => (
                    <Badge key={i} variant="secondary" className="text-xs font-normal">{m}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : null;
        })()}

        {uni.scholarshipPrograms && uni.scholarshipPrograms.length > 0 && (
          <Card className="border-border mb-4">
            <CardHeader className="pb-2 pt-4">
              <CardTitle className="text-sm font-semibold">برامج الابتعاث المناسبة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {uni.scholarshipPrograms.map((p, i) => (
                  <Badge key={i} className="text-xs bg-teal-100 text-teal-700 hover:bg-teal-100">
                    <CheckCircle2 size={11} className="ml-1" />
                    {p}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {uni.admissionNotes && (
          <Card className="border-border mb-4">
            <CardHeader className="pb-2 pt-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Info size={14} className="text-muted-foreground" />
                ملاحظات القبول
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">{uni.admissionNotes}</p>
            </CardContent>
          </Card>
        )}

        {uni.sourceLinks && uni.sourceLinks.length > 0 && (
          <Card className="border-border">
            <CardHeader className="pb-2 pt-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Link2 size={14} className="text-muted-foreground" />
                مصادر المعلومات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {uni.sourceLinks.map((link, i) => (
                  <a key={i} href={link} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-primary hover:underline">
                    <ExternalLink size={12} />
                    {link}
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}

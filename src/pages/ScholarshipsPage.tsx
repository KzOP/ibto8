import { useState, useEffect } from "react";
import {
  Award, ExternalLink, Globe, ChevronDown, ChevronUp,
  CheckCircle2, AlertCircle, MapPin, BookOpen, Calendar, Users, GitBranch,
} from "lucide-react";
import Layout from "@/components/Layout";
import { getScholarshipPrograms, type ScholarshipProgram, type ScholarshipTrack } from "@/lib/firestore";
import { seedIfEmpty } from "@/lib/seed";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import FirebaseBanner from "@/components/FirebaseBanner";
import BetaBanner from "@/components/BetaBanner";

const PROVIDER_COLORS: Record<string, string> = {
  "وزارة التعليم": "bg-green-100 text-green-800 border-green-200",
  "هيئة الابتعاث": "bg-green-100 text-green-800 border-green-200",
  "أرامكو": "bg-blue-100 text-blue-800 border-blue-200",
  "سابك": "bg-purple-100 text-purple-800 border-purple-200",
  "نيوم": "bg-teal-100 text-teal-800 border-teal-200",
};

function getProviderColor(provider: string) {
  for (const [key, val] of Object.entries(PROVIDER_COLORS)) {
    if (provider.includes(key)) return val;
  }
  return "bg-accent text-primary border-primary/20";
}

function NeedsReviewPill() {
  return (
    <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full inline-flex items-center gap-0.5">
      <AlertCircle size={9} />يحتاج مراجعة
    </span>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value?: string }) {
  if (!value) return null;
  const needsReview = value.includes("يحتاج مراجعة");
  return (
    <div className="flex items-start gap-2">
      <Icon size={13} className="text-muted-foreground flex-shrink-0 mt-0.5" />
      <div>
        <span className="text-xs font-medium text-foreground">{label}: </span>
        {needsReview ? <NeedsReviewPill /> : <span className="text-xs text-muted-foreground">{value}</span>}
      </div>
    </div>
  );
}

function ScholarshipCard({ prog }: { prog: ScholarshipProgram }) {
  const [expanded, setExpanded] = useState(false);
  const providerColor = getProviderColor(prog.provider);

  return (
    <Card className="border-border hover:shadow-md transition-shadow" data-testid={`card-scholarship-${prog.id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-accent flex items-center justify-center flex-shrink-0">
              <Award size={22} className="text-primary" />
            </div>
            <div>
              <CardTitle className="text-base leading-tight">{prog.nameAr}</CardTitle>
              {prog.nameEn && (
                <p className="text-xs text-muted-foreground mt-0.5" dir="ltr">{prog.nameEn}</p>
              )}
              <div className="flex flex-wrap gap-1.5 mt-2">
                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${providerColor}`}>
                  {prog.provider.split(" — ")[0]}
                </span>
                {prog.isActive && (
                  <span className="text-xs px-2 py-0.5 rounded-full border bg-green-50 text-green-700 border-green-200">
                    ● نشط
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
            {prog.officialUrl && prog.officialUrl !== "يحتاج مراجعة" ? (
              <a href={prog.officialUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="text-xs h-8">
                  <Globe size={12} className="ml-1" />الموقع
                  <ExternalLink size={10} className="mr-1" />
                </Button>
              </a>
            ) : null}
            {prog.applicationUrl && prog.applicationUrl !== "يحتاج مراجعة" ? (
              <a href={prog.applicationUrl} target="_blank" rel="noopener noreferrer">
                <Button size="sm" className="text-xs h-8">
                  التقديم
                  <ExternalLink size={10} className="mr-1" />
                </Button>
              </a>
            ) : (
              <Button size="sm" variant="outline" disabled className="text-xs h-8 text-amber-600 border-amber-300 opacity-80 cursor-default">
                <AlertCircle size={10} className="ml-1" />رابط التقديم يحتاج مراجعة
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {prog.description && (
          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{prog.description}</p>
        )}

        <div className="grid grid-cols-2 gap-3 mb-4">
          <InfoRow icon={Calendar} label="الحد الأقصى للعمر" value={prog.maxAge} />
          <InfoRow icon={BookOpen} label="الحد الأدنى للمعدل" value={prog.minGpa} />
          <InfoRow icon={Globe} label="شرط اللغة" value={prog.languageRequirement} />
          <InfoRow icon={Users} label="الجهة" value={prog.provider} />
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <Badge variant={prog.requiresUniversityAdmission ? "default" : "secondary"} className="text-xs gap-1">
            {prog.requiresUniversityAdmission ? <CheckCircle2 size={10} /> : null}
            {prog.requiresUniversityAdmission ? "يتطلب قبول جامعي" : "لا يتطلب قبول جامعي"}
          </Badge>
          <Badge variant={prog.requiresLanguageTest ? "default" : "secondary"} className="text-xs gap-1">
            {prog.requiresLanguageTest ? <CheckCircle2 size={10} /> : null}
            {prog.requiresLanguageTest ? "يتطلب اختبار لغة" : "اختبار اللغة اختياري"}
          </Badge>
          <Badge variant={prog.requiresSAT ? "default" : "secondary"} className="text-xs gap-1">
            {prog.requiresSAT ? <CheckCircle2 size={10} /> : null}
            {prog.requiresSAT ? "يتطلب SAT/ACT" : "SAT/ACT اختياري"}
          </Badge>
        </div>

        <button
          className="flex items-center gap-1 text-xs text-primary hover:underline mb-3"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? <><ChevronUp size={13} />إخفاء التفاصيل</> : <><ChevronDown size={13} />عرض التفاصيل الكاملة</>}
        </button>

        {expanded && (
          <div className="space-y-4 border-t border-border pt-4">
            {prog.requirements && prog.requirements.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-foreground mb-2">الشروط الأساسية:</p>
                <ul className="space-y-1.5">
                  {prog.requirements.map((req, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 size={13} className="text-primary mt-0.5 flex-shrink-0" />
                      {req.includes("يحتاج مراجعة")
                        ? <span>{req.replace(" — يحتاج مراجعة", "")} <NeedsReviewPill /></span>
                        : req}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {prog.tracks && prog.tracks.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1">
                  <GitBranch size={12} />المسارات المتاحة ({prog.tracks.length}):
                </p>
                <div className="space-y-2">
                  {prog.tracks.map((track, i) => (
                    <div key={i} className="border border-primary/20 bg-accent/30 rounded-lg px-3 py-2.5">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="text-xs font-semibold text-primary">{track.nameAr}</p>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {track.targetLevel && !track.targetLevel.includes("مراجعة") && (
                            <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">{track.targetLevel}</span>
                          )}
                          {track.needsReview && (
                            <span className="text-xs bg-amber-50 text-amber-600 border border-amber-200 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                              <AlertCircle size={8} />يحتاج مراجعة
                            </span>
                          )}
                        </div>
                      </div>
                      {track.nameEn && <p className="text-xs text-muted-foreground mb-1" dir="ltr">{track.nameEn}</p>}
                      {track.description && <p className="text-xs text-muted-foreground leading-relaxed mb-1">{track.description}</p>}
                      {track.requirements && track.requirements.length > 0 && (
                        <div className="mt-1 space-y-0.5">
                          {track.requirements.map((req, ri) => (
                            <p key={ri} className="text-xs text-muted-foreground flex items-center gap-1">
                              <span className="w-1 h-1 rounded-full bg-primary/40 flex-shrink-0" />
                              {req.includes("يحتاج مراجعة") ? (
                                <span className="text-amber-600">{req}</span>
                              ) : req}
                            </p>
                          ))}
                        </div>
                      )}
                      {track.officialLink && (
                        <a
                          href={track.officialLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1.5"
                        >
                          <Globe size={10} />الرابط الرسمي للمسار
                          <ExternalLink size={9} />
                        </a>
                      )}
                      {track.notes && (
                        <div className="flex items-start gap-1.5 bg-amber-50 border border-amber-200 rounded px-2 py-1 mt-1.5">
                          <AlertCircle size={10} className="text-amber-500 flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-amber-700">{track.notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {prog.allowedCountries && prog.allowedCountries.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1">
                  <MapPin size={12} />الدول المسموحة:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {prog.allowedCountries.map((c, i) => (
                    c.includes("يحتاج مراجعة")
                      ? <NeedsReviewPill key={i} />
                      : <span key={i} className="text-xs bg-muted px-2 py-0.5 rounded-full">{c}</span>
                  ))}
                </div>
              </div>
            )}

            {prog.allowedMajors && prog.allowedMajors.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1">
                  <BookOpen size={12} />التخصصات المسموحة:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {prog.allowedMajors.map((m, i) => (
                    m.includes("يحتاج مراجعة")
                      ? <NeedsReviewPill key={i} />
                      : <span key={i} className="text-xs bg-accent text-primary px-2 py-0.5 rounded-full">{m}</span>
                  ))}
                </div>
              </div>
            )}

            {prog.approvedUniversities && prog.approvedUniversities.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1">
                  <Award size={12} />الجامعات المعتمدة:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {prog.approvedUniversities.map((u, i) => (
                    u.includes("يحتاج مراجعة")
                      ? <NeedsReviewPill key={i} />
                      : <span key={i} className="text-xs bg-muted px-2 py-0.5 rounded-full">{u}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {prog.notes && (
          <div className="mt-3 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            <AlertCircle size={13} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 leading-relaxed">{prog.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function ScholarshipsPage() {
  const [programs, setPrograms] = useState<ScholarshipProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        await seedIfEmpty();
        const data = await getScholarshipPrograms();
        setPrograms(data ?? []);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <Layout title="برامج الابتعاث">
      <div className="p-6 max-w-5xl mx-auto" dir="rtl">
        {error && <FirebaseBanner />}
        <BetaBanner />

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center">
            <Award size={24} className="text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">برامج الابتعاث السعودية</h2>
            <p className="text-sm text-muted-foreground">اكتشف البرامج المتاحة وشروط التقديم</p>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-5 flex items-start gap-2">
          <AlertCircle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 leading-relaxed">
            البيانات الواردة هنا للإرشاد فقط. الشروط والمواعيد تتغير بانتظام.
            يُرجى دائماً مراجعة المواقع الرسمية للبرامج للتأكد من المعلومات الحالية.
          </p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}><CardContent className="pt-5 space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent></Card>
            ))}
          </div>
        ) : programs.length === 0 ? (
          <div className="text-center py-16">
            <Award size={40} className="text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground">لا توجد برامج بعد — راجع لوحة الإدارة لإضافة البيانات</p>
          </div>
        ) : (
          <div className="space-y-4">
            {programs.map((prog) => <ScholarshipCard key={prog.id} prog={prog} />)}
          </div>
        )}
      </div>
    </Layout>
  );
}

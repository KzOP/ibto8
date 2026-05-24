import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Building2, Award, Calculator, Lightbulb, ChevronLeft, User, BookOpen } from "lucide-react";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { getUniversities, getScholarshipPrograms, getStudentProfile, type StudentProfile } from "@/lib/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import FirebaseBanner from "@/components/FirebaseBanner";
import EmailVerificationBanner from "@/components/EmailVerificationBanner";
import BetaBanner from "@/components/BetaBanner";

export default function DashboardPage() {
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [uniCount, setUniCount] = useState<number | null>(null);
  const [scholarCount, setScholarCount] = useState<number | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    const load = async () => {
      try {
        const [p, unis, scholars] = await Promise.all([
          getStudentProfile(currentUser.uid),
          getUniversities(),
          getScholarshipPrograms(),
        ]);
        setProfile(p);
        setUniCount(unis?.length ?? 0);
        setScholarCount(scholars?.length ?? 0);
      } catch {
        setError(true);
      }
    };
    load();
  }, [currentUser]);

  const profileFields = [
    profile?.name,
    profile?.country,
    profile?.city,
    profile?.graduationYear,
    profile?.grades?.highSchoolGpa,
    profile?.grades?.qudoratScore,
  ];
  const completedFields = profileFields.filter(Boolean).length;
  const profileCompletion = Math.round((completedFields / profileFields.length) * 100);

  const quickActions = [
    { href: "/universities", icon: Building2, label: "تصفح الجامعات", color: "bg-blue-50 text-blue-600" },
    { href: "/scholarships", icon: Award, label: "برامج الابتعاث", color: "bg-teal-50 text-teal-600" },
    { href: "/calculator", icon: Calculator, label: "احسب موزونتك", color: "bg-amber-50 text-amber-600" },
    { href: "/recommendations", icon: Lightbulb, label: "التوصيات", color: "bg-purple-50 text-purple-600" },
  ];

  return (
    <Layout title="الرئيسية">
      <div className="p-6 max-w-5xl mx-auto">
        {error && <FirebaseBanner />}
        <BetaBanner />
        <EmailVerificationBanner />

        <div className="mb-6">
          <h2 className="text-xl font-bold text-foreground">
            أهلاً بك{profile?.name ? `، ${profile.name}` : ""}
          </h2>
          <p className="text-muted-foreground text-sm mt-1">هذه لوحة متابعة رحلتك الأكاديمية</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "الجامعات", value: uniCount ?? "—", icon: Building2, color: "text-primary" },
            { label: "برامج الابتعاث", value: scholarCount ?? "—", icon: Award, color: "text-teal-600" },
            { label: "اكتمال الملف", value: `${profileCompletion}%`, icon: User, color: "text-amber-600" },
            { label: "توصيات", value: profile?.grades?.highSchoolGpa ? "جاهز" : "اكمل ملفك", icon: Lightbulb, color: "text-purple-600" },
          ].map((stat, i) => (
            <Card key={i} className="border-border">
              <CardContent className="pt-4 pb-4">
                <div className={`${stat.color} mb-2`}>
                  <stat.icon size={20} />
                </div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {profileCompletion < 100 && (
          <Card className="mb-6 border-primary/20 bg-accent/30">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-medium text-foreground text-sm">اكمل ملفك الشخصي</p>
                  <p className="text-xs text-muted-foreground">
                    اكتمل ملفك بنسبة {profileCompletion}% — أكمله للحصول على توصيات دقيقة
                  </p>
                </div>
                <Link href="/profile">
                  <Button size="sm" data-testid="button-complete-profile">اكمل الآن</Button>
                </Link>
              </div>
              <Progress value={profileCompletion} className="h-2" />
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div>
            <h3 className="font-semibold text-foreground mb-3 text-sm">إجراءات سريعة</h3>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((action, i) => (
                <Link key={i} href={action.href}>
                  <Card className="border-border hover:shadow-md transition-all cursor-pointer hover:border-primary/30">
                    <CardContent className="pt-4 pb-4">
                      <div className={`w-9 h-9 rounded-lg ${action.color} flex items-center justify-center mb-3`}>
                        <action.icon size={18} />
                      </div>
                      <p className="text-sm font-medium text-foreground">{action.label}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-3 text-sm">ملخص درجاتي</h3>
            <Card className="border-border h-full">
              <CardContent className="pt-4">
                {profile?.grades?.highSchoolGpa || profile?.grades?.qudoratScore || profile?.grades?.tahsiliScore ? (
                  <div className="space-y-3">
                    {profile.grades?.highSchoolGpa && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">معدل الثانوية</span>
                        <Badge variant="secondary">{profile.grades.highSchoolGpa}%</Badge>
                      </div>
                    )}
                    {profile.grades?.qudoratScore && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">القدرات</span>
                        <Badge variant="secondary">{profile.grades.qudoratScore}</Badge>
                      </div>
                    )}
                    {profile.grades?.tahsiliScore && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">التحصيلي</span>
                        <Badge variant="secondary">{profile.grades.tahsiliScore}</Badge>
                      </div>
                    )}
                    <Link href="/calculator">
                      <Button variant="outline" size="sm" className="w-full mt-2">
                        احسب الموزونة
                        <ChevronLeft size={14} className="mr-1" />
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <BookOpen size={32} className="text-muted-foreground/40 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground mb-3">لم تُدخل درجاتك بعد</p>
                    <Link href="/profile">
                      <Button variant="outline" size="sm">أضف درجاتك</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}

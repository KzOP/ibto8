import { Link } from "wouter";
import { GraduationCap, Building2, Award, Calculator, Lightbulb, MessageSquare, ChevronLeft, CheckCircle2, Globe, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const features = [
  { icon: Building2, title: "قاعدة بيانات الجامعات", desc: "مئات الجامعات المحلية والدولية مع تفاصيل شروط القبول الكاملة" },
  { icon: Award, title: "برامج الابتعاث", desc: "كل برامج الابتعاث السعودية في مكان واحد مع شروط ومواعيد التقديم" },
  { icon: Calculator, title: "حاسبة الموزونة", desc: "احسب موزونتك لكل جامعة سعودية بدقة كاملة" },
  { icon: Lightbulb, title: "توصيات مخصصة", desc: "اعرف الجامعات والبرامج المناسبة لك بناءً على درجاتك" },
  { icon: MessageSquare, title: "مساعد ذكي", desc: "اسأل عن أي جامعة أو برنامج ابتعاث واحصل على إجابة فورية" },
  { icon: Globe, title: "روابط رسمية", desc: "روابط مباشرة لصفحات القبول الرسمية لكل جامعة" },
];

const scholarships = ["برنامج خادم الحرمين للابتعاث", "مسار الرواد", "مسار إمداد", "برنامج أرامكو CPC", "برنامج أرامكو ITC"];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <nav className="border-b border-border bg-white sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <GraduationCap size={18} className="text-white" />
            </div>
            <span className="font-bold text-foreground text-lg">ابتعاثي</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm" data-testid="button-login">تسجيل الدخول</Button>
            </Link>
            <Link href="/register">
              <Button size="sm" data-testid="button-register">إنشاء حساب</Button>
            </Link>
          </div>
        </div>
      </nav>

      <section className="bg-gradient-to-br from-sidebar via-primary to-teal-400 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <Badge className="bg-white/20 text-white border-white/30 mb-6 text-sm px-4 py-1">
            منصة التوجيه الأكاديمي للطلاب السعوديين
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-5 leading-tight">
            طريقك نحو الجامعة والابتعاث
          </h1>
          <p className="text-white/80 text-lg md:text-xl max-w-2xl mx-auto mb-8 leading-relaxed">
            اكتشف الجامعات المناسبة، واحسب موزونتك، واعرف برامج الابتعاث التي تؤهل لها — كل ذلك في منصة واحدة.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/register">
              <Button size="lg" className="bg-white text-primary hover:bg-white/90 font-semibold px-8" data-testid="button-cta-register">
                ابدأ مجاناً
                <ChevronLeft size={18} className="mr-1" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10 px-8" data-testid="button-cta-login">
                تسجيل الدخول
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-3">كل ما تحتاجه في مكان واحد</h2>
            <p className="text-muted-foreground">منصة متكاملة صممت خصيصاً للطالب السعودي</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <Card key={i} className="border-border hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="w-11 h-11 rounded-xl bg-accent flex items-center justify-center mb-4">
                    <f.icon size={22} className="text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-foreground mb-3">برامج الابتعاث المدعومة</h2>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {scholarships.map((s, i) => (
              <Badge key={i} variant="secondary" className="text-sm px-4 py-2">
                <CheckCircle2 size={14} className="ml-1.5 text-primary" />
                {s}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-accent to-teal-50 rounded-2xl p-8 text-center border border-border">
            <Shield size={40} className="text-primary mx-auto mb-4" />
            <h2 className="text-xl font-bold text-foreground mb-3">بيانات دقيقة وروابط رسمية</h2>
            <p className="text-muted-foreground mb-2 text-sm leading-relaxed">
              جميع بيانات الجامعات مصدرها المواقع الرسمية وقابلة للتحديث المستمر.
              في كل صفحة جامعة ستجد رابط الموقع الرسمي ورابط التقديم المباشر.
            </p>
            <p className="text-xs text-muted-foreground bg-white/70 rounded-lg px-4 py-2 inline-block">
              تنبيه: يُنصح دائماً بمراجعة الموقع الرسمي للجامعة لأن الشروط قد تتغير.
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-8 px-4 bg-white">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <GraduationCap size={18} className="text-primary" />
            <span className="font-bold text-foreground">ابتعاثي</span>
          </div>
          <p className="text-muted-foreground text-sm">منصة توجيه أكاديمي للطلاب السعوديين</p>
        </div>
      </footer>
    </div>
  );
}

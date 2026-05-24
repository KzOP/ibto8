import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Shield, Building2, Award, Upload, AlertCircle, Plus, RefreshCw, BarChart3 } from "lucide-react";
import Layout from "@/components/Layout";
import { getUniversities, getScholarshipPrograms, getUpdateRequests } from "@/lib/firestore";
import { forceReseedAll } from "@/lib/seed";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import FirebaseBanner from "@/components/FirebaseBanner";

export default function AdminDashboard() {
  const [stats, setStats] = useState({ unis: 0, scholars: 0, pending: 0, needsReview: 0 });
  const [firebaseError, setFirebaseError] = useState(false);
  const [reseedOpen, setReseedOpen] = useState(false);
  const [reseeding, setReseeding] = useState(false);
  const { toast } = useToast();

  const load = async () => {
    try {
      const [unis, scholars, requests] = await Promise.all([
        getUniversities(), getScholarshipPrograms(), getUpdateRequests(),
      ]);
      setStats({
        unis: unis?.length ?? 0,
        scholars: scholars?.length ?? 0,
        pending: requests?.length ?? 0,
        needsReview: unis?.filter((u) => u.needsReview).length ?? 0,
      });
    } catch { setFirebaseError(true); }
  };

  useEffect(() => { load(); }, []);

  const handleReseed = async () => {
    setReseeding(true);
    try {
      await forceReseedAll();
      toast({ title: "✓ تم إعادة البذر بنجاح", description: "14 جامعة + 5 برامج ابتعاث" });
      load();
    } catch {
      toast({ title: "خطأ في إعادة البذر", variant: "destructive" });
    } finally {
      setReseeding(false);
      setReseedOpen(false);
    }
  };

  const cards = [
    { label: "الجامعات", value: stats.unis, icon: Building2, href: "/admin/universities", color: "text-primary bg-accent" },
    { label: "برامج الابتعاث", value: stats.scholars, icon: Award, href: "/admin/scholarships", color: "text-teal-600 bg-teal-50" },
    { label: "تحديثات معلّقة", value: stats.pending, icon: AlertCircle, href: "/admin/importer", color: "text-amber-600 bg-amber-50" },
    { label: "تحتاج مراجعة", value: stats.needsReview, icon: AlertCircle, href: "/admin/universities", color: "text-red-600 bg-red-50" },
  ];

  const actions = [
    { label: "إضافة جامعة", icon: Plus, href: "/admin/universities/new", variant: "default" as const },
    { label: "إدارة الجامعات", icon: Building2, href: "/admin/universities", variant: "outline" as const },
    { label: "برامج الابتعاث", icon: Award, href: "/admin/scholarships", variant: "outline" as const },
    { label: "استيراد الجامعات", icon: Upload, href: "/admin/importer", variant: "outline" as const },
    { label: "جودة البيانات", icon: BarChart3, href: "/admin/data-quality", variant: "outline" as const },
  ];

  return (
    <Layout title="لوحة الإدارة">
      <div className="p-6 max-w-5xl mx-auto" dir="rtl">
        {firebaseError && <FirebaseBanner />}

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-sidebar flex items-center justify-center">
              <Shield size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">لوحة الإدارة</h2>
              <p className="text-sm text-muted-foreground">إدارة بيانات المنصة</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setReseedOpen(true)}
            className="text-xs text-amber-600 border-amber-300 hover:bg-amber-50"
          >
            <RefreshCw size={13} className="ml-1" />إعادة بذر البيانات
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {cards.map((c, i) => (
            <Link key={i} href={c.href}>
              <Card className="border-border hover:shadow-md transition-all cursor-pointer" data-testid={`card-stat-${i}`}>
                <CardContent className="pt-4 pb-4">
                  <div className={`w-9 h-9 rounded-lg ${c.color} flex items-center justify-center mb-2`}>
                    <c.icon size={18} />
                  </div>
                  <p className="text-2xl font-bold text-foreground">{c.value}</p>
                  <p className="text-xs text-muted-foreground">{c.label}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="mb-8">
          <h3 className="font-semibold text-foreground mb-3">إجراءات سريعة</h3>
          <div className="flex flex-wrap gap-3">
            {actions.map((a, i) => (
              <Link key={i} href={a.href}>
                <Button variant={a.variant} size="sm" data-testid={`button-action-${i}`}>
                  <a.icon size={15} className="ml-1.5" />
                  {a.label}
                </Button>
              </Link>
            ))}
          </div>
        </div>

        <div className="border border-amber-200 bg-amber-50 rounded-xl p-4">
          <div className="flex items-start gap-2">
            <AlertCircle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800 mb-1">إعادة بذر البيانات</p>
              <p className="text-xs text-amber-700 mb-2">
                يُعيد تعبئة قاعدة البيانات بـ <strong>14 جامعة</strong> (7 سعودية + 7 دولية) و<strong>5 برامج ابتعاث</strong> حقيقية.
                سيؤدي ذلك إلى <strong>حذف جميع البيانات الحالية</strong> واستبدالها.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setReseedOpen(true)}
                disabled={reseeding}
                className="text-xs border-amber-300 text-amber-700 hover:bg-amber-100"
              >
                <RefreshCw size={12} className="ml-1" />
                {reseeding ? "جاري الإعادة..." : "إعادة البذر الآن"}
              </Button>
            </div>
          </div>
        </div>

        <AlertDialog open={reseedOpen} onOpenChange={setReseedOpen}>
          <AlertDialogContent dir="rtl">
            <AlertDialogHeader>
              <AlertDialogTitle>تأكيد إعادة البذر</AlertDialogTitle>
              <AlertDialogDescription>
                سيُحذف جميع بيانات الجامعات وبرامج الابتعاث الحالية ويُستبدل بـ 14 جامعة + 5 برامج.
                لا يمكن التراجع عن هذا الإجراء.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleReseed}
                disabled={reseeding}
                className="bg-amber-600 hover:bg-amber-700"
              >
                {reseeding ? "جاري الإعادة..." : "نعم، أعد البذر"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
}

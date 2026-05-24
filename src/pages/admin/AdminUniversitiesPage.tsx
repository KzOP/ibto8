import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Plus, Edit2, Trash2, Building2, AlertCircle, CheckCircle2 } from "lucide-react";
import Layout from "@/components/Layout";
import { getUniversities, deleteUniversity, type University } from "@/lib/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import FirebaseBanner from "@/components/FirebaseBanner";

export default function AdminUniversitiesPage() {
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [firebaseError, setFirebaseError] = useState(false);
  const { toast } = useToast();

  const load = async () => {
    try {
      const data = await getUniversities();
      setUniversities(data ?? []);
    } catch { setFirebaseError(true); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteUniversity(deleteId);
      toast({ title: "تم الحذف بنجاح" });
      load();
    } catch {
      toast({ title: "خطأ في الحذف", variant: "destructive" });
    } finally { setDeleteId(null); }
  };

  return (
    <Layout title="إدارة الجامعات">
      <div className="p-6 max-w-6xl mx-auto">
        {firebaseError && <FirebaseBanner />}

        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-foreground">إدارة الجامعات</h2>
            <p className="text-sm text-muted-foreground">{universities.length} جامعة في قاعدة البيانات</p>
          </div>
          <Link href="/admin/universities/new">
            <Button data-testid="button-add-university">
              <Plus size={16} className="ml-1.5" />
              إضافة جامعة
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
        ) : universities.length === 0 ? (
          <div className="text-center py-16">
            <Building2 size={40} className="text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground mb-4">لا توجد جامعات بعد</p>
            <Link href="/admin/universities/new"><Button>إضافة أول جامعة</Button></Link>
          </div>
        ) : (
          <div className="space-y-2">
            {universities.map((uni) => (
              <Card key={uni.id} className="border-border hover:shadow-sm transition-shadow" data-testid={`card-admin-university-${uni.id}`}>
                <CardContent className="py-3 px-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center flex-shrink-0">
                        <Building2 size={16} className="text-primary" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-sm text-foreground truncate">{uni.nameAr}</p>
                          <Badge variant="secondary" className="text-xs">{uni.type === "local" ? "محلية" : "دولية"}</Badge>
                          {uni.needsReview && (
                            <Badge variant="outline" className="text-xs text-amber-600 border-amber-200">
                              <AlertCircle size={10} className="ml-1" />يحتاج مراجعة
                            </Badge>
                          )}
                          {uni.suitableForSaudiScholarship && (
                            <Badge className="text-xs bg-teal-100 text-teal-700 hover:bg-teal-100">
                              <CheckCircle2 size={10} className="ml-1" />ابتعاث
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{uni.city}، {uni.country}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Link href={`/admin/universities/${uni.id}/edit`}>
                        <Button variant="outline" size="sm" data-testid={`button-edit-${uni.id}`}>
                          <Edit2 size={14} className="ml-1" />تعديل
                        </Button>
                      </Link>
                      <Button
                        variant="outline" size="sm"
                        className="text-destructive hover:text-destructive border-destructive/30"
                        onClick={() => setDeleteId(uni.id!)}
                        data-testid={`button-delete-${uni.id}`}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent dir="rtl">
            <AlertDialogHeader>
              <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
              <AlertDialogDescription>هل أنت متأكد من حذف هذه الجامعة؟ لا يمكن التراجع عن هذا الإجراء.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">حذف</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
}

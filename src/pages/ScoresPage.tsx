import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, BookOpen } from "lucide-react";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { getStudentProfile, saveStudentProfile, type LanguageTest, type InternationalTest } from "@/lib/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import FirebaseBanner from "@/components/FirebaseBanner";

const LANGUAGE_TESTS = [
  { value: "ielts", label: "IELTS", min: 0, max: 9, step: 0.5 },
  { value: "toefl", label: "TOEFL iBT", min: 0, max: 120, step: 1 },
  { value: "duolingo", label: "Duolingo English Test", min: 10, max: 160, step: 5 },
  { value: "step", label: "STEP", min: 0, max: 100, step: 1 },
  { value: "pte", label: "PTE Academic", min: 10, max: 90, step: 1 },
  { value: "cambridge", label: "Cambridge English", min: 80, max: 230, step: 1 },
];

const INTERNATIONAL_TESTS = [
  { value: "sat", label: "SAT", min: 400, max: 1600, step: 10 },
  { value: "act", label: "ACT", min: 1, max: 36, step: 1 },
  { value: "ib", label: "IB Diploma", min: 0, max: 45, step: 1 },
];

export default function ScoresPage() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [languageTests, setLanguageTests] = useState<LanguageTest[]>([]);
  const [intlTests, setIntlTests] = useState<{ type: string; score: number }[]>([]);
  const [firebaseError, setFirebaseError] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<"language" | "international">("language");
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [form, setForm] = useState({ type: "", score: "", date: "" });

  useEffect(() => {
    if (!currentUser) return;
    getStudentProfile(currentUser.uid)
      .then((profile) => {
        if (profile) {
          setLanguageTests(profile.tests ?? []);
          const itArr = (profile.internationalTests ?? []) as InternationalTest[];
          setIntlTests(itArr.map((t) => ({ type: t.type, score: parseFloat(t.score) || 0 })));
        }
      })
      .catch(() => setFirebaseError(true));
  }, [currentUser]);

  const persist = async (lt: LanguageTest[], it: { type: string; score: number }[]) => {
    if (!currentUser) return;
    try {
      const intlArr: InternationalTest[] = it.map((t) => ({ type: t.type, score: String(t.score) }));
      await saveStudentProfile(currentUser.uid, { tests: lt, internationalTests: intlArr });
      toast({ title: "تم الحفظ" });
    } catch {
      setFirebaseError(true);
      toast({ title: "خطأ في الحفظ", variant: "destructive" });
    }
  };

  const openAdd = (type: "language" | "international") => {
    setDialogType(type);
    setEditIndex(null);
    setForm({ type: "", score: "", date: "" });
    setDialogOpen(true);
  };

  const openEdit = (type: "language" | "international", index: number) => {
    const arr = type === "language" ? languageTests : intlTests;
    const t = arr[index];
    setDialogType(type);
    setEditIndex(index);
    setForm({ type: t.type, score: t.score.toString(), date: (t as any).date ?? "" });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.type || !form.score) return;
    const newTest = { type: form.type, score: parseFloat(form.score), date: form.date || undefined };
    let lt = [...languageTests];
    let it = [...intlTests];
    if (dialogType === "language") {
      if (editIndex !== null) lt[editIndex] = newTest as LanguageTest;
      else lt.push(newTest as LanguageTest);
      setLanguageTests(lt);
    } else {
      if (editIndex !== null) it[editIndex] = newTest;
      else it.push(newTest);
      setIntlTests(it);
    }
    setDialogOpen(false);
    await persist(dialogType === "language" ? lt : languageTests, dialogType === "international" ? it : intlTests);
  };

  const handleDelete = async (type: "language" | "international", index: number) => {
    let lt = [...languageTests];
    let it = [...intlTests];
    if (type === "language") { lt.splice(index, 1); setLanguageTests(lt); }
    else { it.splice(index, 1); setIntlTests(it); }
    await persist(type === "language" ? lt : languageTests, type === "international" ? it : intlTests);
  };

  const testOptions = dialogType === "language" ? LANGUAGE_TESTS : INTERNATIONAL_TESTS;
  const selectedTest = testOptions.find((t) => t.value === form.type);

  return (
    <Layout title="الاختبارات والدرجات">
      <div className="p-6 max-w-3xl mx-auto">
        {firebaseError && <FirebaseBanner />}

        <div className="mb-6">
          <h2 className="text-xl font-bold text-foreground">اختباراتي ودرجاتي</h2>
          <p className="text-sm text-muted-foreground mt-1">أضف درجات اختباراتك لتحسين دقة التوصيات</p>
        </div>

        <Card className="border-border mb-4">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm">اختبارات اللغة الإنجليزية</CardTitle>
            <Button size="sm" onClick={() => openAdd("language")} data-testid="button-add-language-test">
              <Plus size={14} className="ml-1" />إضافة
            </Button>
          </CardHeader>
          <CardContent>
            {languageTests.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-sm">
                <BookOpen size={28} className="mx-auto mb-2 opacity-40" />
                لم تُضف أي اختبارات لغة بعد
              </div>
            ) : (
              <div className="space-y-2">
                {languageTests.map((t, i) => {
                  const meta = LANGUAGE_TESTS.find((x) => x.value === t.type);
                  return (
                    <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50">
                      <div>
                        <span className="font-medium text-sm">{meta?.label ?? t.type}</span>
                        {t.date && <span className="text-xs text-muted-foreground mr-2">{t.date}</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-primary/10 text-primary hover:bg-primary/10">{t.score}</Badge>
                        <button onClick={() => openEdit("language", i)} className="p-1 hover:text-primary transition-colors"><Edit2 size={14} /></button>
                        <button onClick={() => handleDelete("language", i)} className="p-1 hover:text-destructive transition-colors"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm">الاختبارات الدولية (SAT / ACT / IB)</CardTitle>
            <Button size="sm" onClick={() => openAdd("international")} data-testid="button-add-intl-test">
              <Plus size={14} className="ml-1" />إضافة
            </Button>
          </CardHeader>
          <CardContent>
            {intlTests.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-sm">
                <BookOpen size={28} className="mx-auto mb-2 opacity-40" />
                لم تُضف أي اختبارات دولية بعد
              </div>
            ) : (
              <div className="space-y-2">
                {intlTests.map((t, i) => {
                  const meta = INTERNATIONAL_TESTS.find((x) => x.value === t.type);
                  return (
                    <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50">
                      <span className="font-medium text-sm">{meta?.label ?? t.type}</span>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-primary/10 text-primary hover:bg-primary/10">{t.score}</Badge>
                        <button onClick={() => openEdit("international", i)} className="p-1 hover:text-primary transition-colors"><Edit2 size={14} /></button>
                        <button onClick={() => handleDelete("international", i)} className="p-1 hover:text-destructive transition-colors"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent dir="rtl">
            <DialogHeader>
              <DialogTitle>{editIndex !== null ? "تعديل الاختبار" : "إضافة اختبار"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <label className="text-sm font-medium mb-1 block">نوع الاختبار</label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue placeholder="اختر الاختبار" /></SelectTrigger>
                  <SelectContent>
                    {testOptions.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">
                  الدرجة {selectedTest ? `(${selectedTest.min} – ${selectedTest.max})` : ""}
                </label>
                <Input
                  type="number"
                  min={selectedTest?.min}
                  max={selectedTest?.max}
                  step={selectedTest?.step}
                  value={form.score}
                  onChange={(e) => setForm({ ...form, score: e.target.value })}
                  placeholder="أدخل الدرجة"
                  data-testid="input-test-score"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>إلغاء</Button>
              <Button onClick={handleSave} disabled={!form.type || !form.score} data-testid="button-save-test">حفظ</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}

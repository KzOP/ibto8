import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { ArrowRight, Building2, Save } from "lucide-react";
import Layout from "@/components/Layout";
import { getUniversity, createUniversity, updateUniversity, type University } from "@/lib/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import FirebaseBanner from "@/components/FirebaseBanner";

const emptyUni: University = {
  nameAr: "", nameEn: "", country: "", city: "", type: "international",
  majors: [], languageRequirements: {}, satRequired: "not_required",
  actRequired: "not_required", suitableForSaudiScholarship: false,
  scholarshipPrograms: [], admissionNotes: "", sourceLinks: [],
  dataConfidence: "low", needsReview: true, websiteUrl: "",
  admissionUrl: "", requirementsUrl: "", majorsUrl: "",
};

interface Props { mode: "create" | "edit" }

export default function AdminUniversityFormPage({ mode }: Props) {
  const [, params] = useRoute("/admin/universities/:id/edit");
  const id = params?.id ?? "";
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [form, setForm] = useState<University>(emptyUni);
  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [firebaseError, setFirebaseError] = useState(false);
  const [majorInput, setMajorInput] = useState("");
  const [sourceInput, setSourceInput] = useState("");

  useEffect(() => {
    if (mode === "edit" && id) {
      getUniversity(id)
        .then((u) => { if (u) setForm(u); })
        .catch(() => setFirebaseError(true))
        .finally(() => setLoading(false));
    }
  }, [id, mode]);

  const set = (key: keyof University, val: any) => setForm((prev) => ({ ...prev, [key]: val }));
  const setLR = (key: string, val: string) => setForm((prev) => ({
    ...prev,
    languageRequirements: { ...(prev.languageRequirements ?? {}), [key]: val || undefined }
  }));
  const setWF = (key: string, val: string) => setForm((prev) => ({
    ...prev,
    weightedFormula: { ...(prev.weightedFormula ?? {}), [key]: val === "" ? undefined : parseFloat(val) || 0 }
  }));

  const addMajor = () => {
    if (!majorInput.trim()) return;
    set("majors", [...(form.majors ?? []), majorInput.trim()]);
    setMajorInput("");
  };
  const removeMajor = (i: number) => set("majors", (form.majors ?? []).filter((_, idx) => idx !== i));

  const addSource = () => {
    if (!sourceInput.trim()) return;
    set("sourceLinks", [...(form.sourceLinks ?? []), sourceInput.trim()]);
    setSourceInput("");
  };
  const removeSource = (i: number) => set("sourceLinks", (form.sourceLinks ?? []).filter((_, idx) => idx !== i));

  const handleSave = async () => {
    if (!form.nameAr || !form.country || !form.city) {
      toast({ title: "يرجى ملء الحقول المطلوبة (الاسم، الدولة، المدينة)", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      if (mode === "edit" && id) {
        await updateUniversity(id, form);
        toast({ title: "تم تحديث بيانات الجامعة" });
      } else {
        await createUniversity(form);
        toast({ title: "تم إضافة الجامعة بنجاح" });
      }
      setLocation("/admin/universities");
    } catch {
      setFirebaseError(true);
      toast({ title: "خطأ في الحفظ. تحقق من إعداد Firebase", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const lr = form.languageRequirements ?? {};
  const wf = form.weightedFormula ?? {};

  if (loading) return (
    <Layout title={mode === "create" ? "إضافة جامعة" : "تعديل الجامعة"}>
      <div className="p-6 max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    </Layout>
  );

  return (
    <Layout title={mode === "create" ? "إضافة جامعة جديدة" : "تعديل بيانات الجامعة"}>
      <div className="p-6 max-w-3xl mx-auto">
        {firebaseError && <FirebaseBanner />}

        <button onClick={() => setLocation("/admin/universities")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-5 transition-colors">
          <ArrowRight size={16} />العودة لقائمة الجامعات
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-2xl bg-accent flex items-center justify-center">
            <Building2 size={22} className="text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground">
            {mode === "create" ? "إضافة جامعة جديدة" : `تعديل: ${form.nameAr}`}
          </h2>
        </div>

        <div className="space-y-4">
          <Card className="border-border">
            <CardHeader className="pb-3"><CardTitle className="text-sm">المعلومات الأساسية</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">اسم الجامعة (عربي) *</label>
                  <Input value={form.nameAr} onChange={(e) => set("nameAr", e.target.value)} data-testid="input-name-ar" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">اسم الجامعة (إنجليزي)</label>
                  <Input value={form.nameEn} onChange={(e) => set("nameEn", e.target.value)} dir="ltr" data-testid="input-name-en" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">الدولة *</label>
                  <Input value={form.country} onChange={(e) => set("country", e.target.value)} data-testid="input-country" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">المدينة *</label>
                  <Input value={form.city} onChange={(e) => set("city", e.target.value)} data-testid="input-city" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">النوع</label>
                  <Select value={form.type} onValueChange={(v: "local" | "international") => set("type", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="local">محلية</SelectItem>
                      <SelectItem value="international">دولية</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-3"><CardTitle className="text-sm">الروابط الرسمية</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {[
                { key: "websiteUrl", label: "الموقع الرسمي" },
                { key: "admissionUrl", label: "رابط التقديم" },
                { key: "requirementsUrl", label: "رابط شروط القبول" },
                { key: "majorsUrl", label: "رابط التخصصات" },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="text-sm font-medium mb-1 block">{label}</label>
                  <Input
                    value={(form as any)[key] ?? ""}
                    onChange={(e) => set(key as keyof University, e.target.value)}
                    dir="ltr" placeholder="https://"
                    data-testid={`input-${key}`}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-3"><CardTitle className="text-sm">متطلبات اللغة</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {["ielts", "toefl", "duolingo", "pte", "step"].map((test) => (
                  <div key={test}>
                    <label className="text-sm font-medium mb-1 block uppercase">{test}</label>
                    <Input
                      value={lr[test] ?? ""}
                      onChange={(e) => setLR(test, e.target.value)}
                      placeholder={test === "ielts" ? "6.5" : test === "toefl" ? "90" : "100"}
                      data-testid={`input-lr-${test}`}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-3"><CardTitle className="text-sm">اختبارات القبول</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">SAT</label>
                  <Select value={form.satRequired ?? "not_required"} onValueChange={(v: any) => set("satRequired", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="required">مطلوب</SelectItem>
                      <SelectItem value="optional">اختياري</SelectItem>
                      <SelectItem value="not_required">غير مطلوب</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">ACT</label>
                  <Select value={form.actRequired ?? "not_required"} onValueChange={(v: any) => set("actRequired", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="required">مطلوب</SelectItem>
                      <SelectItem value="optional">اختياري</SelectItem>
                      <SelectItem value="not_required">غير مطلوب</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">الحد الأدنى للثانوية (%)</label>
                <Input
                  type="number" min="0" max="100"
                  value={form.minHighSchoolGpa ?? ""}
                  onChange={(e) => set("minHighSchoolGpa", e.target.value ? parseFloat(e.target.value) : undefined)}
                  placeholder="85"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">
                  معادلة الموزونة
                  {form.type === "international" && (
                    <span className="text-xs font-normal text-muted-foreground mr-2">
                      (للجامعات الدولية أضف ملاحظة توضيحية فقط)
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3 mb-3">
                  {[
                    { key: "highSchool", label: "الثانوية (%)" },
                    { key: "qudorat", label: "القدرات (%)" },
                    { key: "tahsili", label: "التحصيلي (%)" },
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <label className="text-sm font-medium mb-1 block">{label}</label>
                      <Input
                        type="number" min="0" max="100"
                        value={wf[key] ?? ""}
                        onChange={(e) => setWF(key, e.target.value)}
                        placeholder="30"
                      />
                    </div>
                  ))}
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">ملاحظة (إذا كانت المعادلة غير قياسية)</label>
                  <Input
                    value={wf.note ?? ""}
                    onChange={(e) => setForm((prev) => ({ ...prev, weightedFormula: { ...prev.weightedFormula, note: e.target.value } }))}
                    placeholder="تخضع لمعايير خاصة"
                  />
                </div>
              </CardContent>
            </Card>

          <Card className="border-border">
            <CardHeader className="pb-3"><CardTitle className="text-sm">التخصصات</CardTitle></CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-3">
                <Input
                  value={majorInput}
                  onChange={(e) => setMajorInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addMajor()}
                  placeholder="Computer Science"
                  dir="ltr"
                  data-testid="input-major"
                />
                <Button type="button" variant="outline" onClick={addMajor}>إضافة</Button>
              </div>
              {(form.majors ?? []).length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {(form.majors ?? []).map((m, i) => (
                    <Badge key={i} variant="secondary" className="text-xs cursor-pointer" onClick={() => removeMajor(i)}>
                      {m} ×
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-3"><CardTitle className="text-sm">إعدادات إضافية</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">مناسبة للابتعاث السعودي</label>
                <Switch checked={form.suitableForSaudiScholarship} onCheckedChange={(v) => set("suitableForSaudiScholarship", v)} />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">تحتاج مراجعة</label>
                <Switch checked={form.needsReview ?? true} onCheckedChange={(v) => set("needsReview", v)} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">مستوى الثقة بالبيانات</label>
                <Select value={form.dataConfidence ?? "low"} onValueChange={(v: any) => set("dataConfidence", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">عالي — بيانات موثّقة</SelectItem>
                    <SelectItem value="medium">متوسط</SelectItem>
                    <SelectItem value="low">منخفض — يحتاج مراجعة</SelectItem>
                    <SelectItem value="unverified">غير موثّق</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">ملاحظات القبول</label>
                <Textarea
                  value={form.admissionNotes ?? ""}
                  onChange={(e) => set("admissionNotes", e.target.value)}
                  rows={3}
                  placeholder="أي ملاحظات مهمة عن عملية القبول..."
                  data-testid="input-notes"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">روابط المصادر</label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={sourceInput}
                    onChange={(e) => setSourceInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addSource()}
                    placeholder="https://admissions.university.edu"
                    dir="ltr"
                    data-testid="input-source"
                  />
                  <Button type="button" variant="outline" onClick={addSource}>إضافة</Button>
                </div>
                {(form.sourceLinks ?? []).map((s, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <span className="truncate flex-1" dir="ltr">{s}</span>
                    <button onClick={() => removeSource(i)} className="text-destructive hover:text-destructive/70">×</button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Button onClick={handleSave} className="w-full" disabled={saving} size="lg" data-testid="button-save-university">
            {saving ? "جاري الحفظ..." : <><Save size={16} className="ml-2" />{mode === "create" ? "إضافة الجامعة" : "حفظ التعديلات"}</>}
          </Button>
        </div>
      </div>
    </Layout>
  );
}

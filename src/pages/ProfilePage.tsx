import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { User, Save, Phone, Globe, MapPin, Plus, Trash2, BookOpen, FlaskConical } from "lucide-react";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import {
  getStudentProfile, saveStudentProfile,
  type StudentProfile, type LanguageTest, type InternationalTest,
} from "@/lib/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import FirebaseBanner from "@/components/FirebaseBanner";
import EmailVerificationBanner from "@/components/EmailVerificationBanner";

const COUNTRIES = [
  "المملكة العربية السعودية", "الإمارات العربية المتحدة", "الكويت", "البحرين",
  "قطر", "عُمان", "الأردن", "مصر", "اليمن", "العراق", "سوريا", "لبنان", "أخرى",
];

const LANGUAGE_TESTS = [
  { value: "ielts",     label: "IELTS",              min: 0,  max: 9,   step: 0.5, hint: "0 – 9" },
  { value: "toefl",    label: "TOEFL iBT",           min: 0,  max: 120, step: 1,   hint: "0 – 120" },
  { value: "duolingo", label: "Duolingo English",    min: 10, max: 160, step: 5,   hint: "10 – 160" },
  { value: "step",     label: "STEP",                min: 0,  max: 100, step: 1,   hint: "0 – 100" },
  { value: "pte",      label: "PTE Academic",        min: 10, max: 90,  step: 1,   hint: "10 – 90" },
  { value: "cambridge",label: "Cambridge English",   min: 0,  max: 210, step: 1,   hint: "0 – 210" },
  { value: "other",    label: "أخرى",                min: 0,  max: 999, step: 1,   hint: "أدخل الدرجة" },
];

const INTERNATIONAL_TESTS = [
  { value: "sat",     label: "SAT",          scoreType: "number" as const, min: 400, max: 1600, hint: "400 – 1600" },
  { value: "act",     label: "ACT",          scoreType: "number" as const, min: 1,   max: 36,   hint: "1 – 36" },
  { value: "ap",      label: "AP Exam",      scoreType: "number" as const, min: 1,   max: 5,    hint: "1 – 5 (لكل مادة)" },
  { value: "ib",      label: "IB Diploma",   scoreType: "number" as const, min: 24,  max: 45,   hint: "24 – 45" },
  { value: "alevels", label: "A-Levels",     scoreType: "text" as const,   hint: "مثال: A*AA" },
  { value: "igcse",   label: "IGCSE / GCSE", scoreType: "text" as const,   hint: "مثال: 8A* 2A" },
  { value: "other",   label: "أخرى",         scoreType: "text" as const,   hint: "اكتب النتيجة" },
];

const schema = z.object({
  name: z.string().optional().or(z.literal("")),
  phoneNumber: z.string().optional().or(z.literal("")),
  country: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  graduationYear: z.string().optional().or(z.literal("")),
  educationLevel: z.string().optional().or(z.literal("")),
  highSchoolGpa: z.string().optional().or(z.literal("")),
  qudoratScore: z.string().optional().or(z.literal("")),
  tahsiliScore: z.string().optional().or(z.literal("")),
  stepScore: z.string().optional().or(z.literal("")),
});
type FormData = z.infer<typeof schema>;

export default function ProfilePage() {
  const { currentUser, emailVerified } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [firebaseError, setFirebaseError] = useState(false);
  const [profile, setProfile] = useState<StudentProfile | null>(null);

  const [languageTests, setLanguageTests] = useState<LanguageTest[]>([]);
  const [newTestType, setNewTestType] = useState("");
  const [newTestScore, setNewTestScore] = useState("");
  const [newTestCustomName, setNewTestCustomName] = useState("");

  const [intlTests, setIntlTests] = useState<InternationalTest[]>([]);
  const [newIntlType, setNewIntlType] = useState("");
  const [newIntlScore, setNewIntlScore] = useState("");
  const [newIntlCustomName, setNewIntlCustomName] = useState("");

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "", phoneNumber: "", country: "", city: "",
      graduationYear: "", educationLevel: "",
      highSchoolGpa: "", qudoratScore: "", tahsiliScore: "", stepScore: "",
    },
  });

  useEffect(() => {
    if (!currentUser) return;
    getStudentProfile(currentUser.uid)
      .then((p) => {
        if (p) {
          setProfile(p);
          setLanguageTests(p.tests ?? []);
          setIntlTests((p.internationalTests as InternationalTest[]) ?? []);
          form.reset({
            name: p.name ?? "",
            phoneNumber: p.phoneNumber ?? "",
            country: p.country ?? "",
            city: p.city ?? "",
            graduationYear: p.graduationYear ?? "",
            educationLevel: p.educationLevel ?? "",
            highSchoolGpa: p.grades?.highSchoolGpa?.toString() ?? "",
            qudoratScore: p.grades?.qudoratScore?.toString() ?? "",
            tahsiliScore: p.grades?.tahsiliScore?.toString() ?? "",
            stepScore: p.grades?.stepScore?.toString() ?? "",
          });
        }
      })
      .catch(() => setFirebaseError(true));
  }, [currentUser, form]);

  const selectedTestMeta = LANGUAGE_TESTS.find((t) => t.value === newTestType);
  const selectedIntlMeta = INTERNATIONAL_TESTS.find((t) => t.value === newIntlType);

  const addLanguageTest = () => {
    if (!newTestType || !newTestScore) return;
    const score = parseFloat(newTestScore);
    if (isNaN(score)) return;
    if (selectedTestMeta && newTestType !== "other") {
      if (score < selectedTestMeta.min || score > selectedTestMeta.max) {
        toast({ title: `الدرجة يجب أن تكون بين ${selectedTestMeta.min} و ${selectedTestMeta.max}`, variant: "destructive" });
        return;
      }
    }
    const entry: LanguageTest = {
      type: newTestType,
      score,
      ...(newTestType === "other" && newTestCustomName ? { customName: newTestCustomName } : {}),
    };
    const existing = languageTests.findIndex((t) => t.type === newTestType && (!t.customName || t.customName === newTestCustomName));
    if (existing >= 0) {
      const updated = [...languageTests];
      updated[existing] = entry;
      setLanguageTests(updated);
    } else {
      setLanguageTests([...languageTests, entry]);
    }
    setNewTestScore("");
    setNewTestType("");
    setNewTestCustomName("");
  };

  const removeTest = (index: number) => setLanguageTests(languageTests.filter((_, i) => i !== index));

  const addIntlTest = () => {
    if (!newIntlType || !newIntlScore) return;
    const entry: InternationalTest = {
      type: newIntlType,
      score: newIntlScore,
      ...(newIntlType === "other" && newIntlCustomName ? { customName: newIntlCustomName } : {}),
    };
    const existing = intlTests.findIndex((t) => t.type === newIntlType && (!t.customName || t.customName === newIntlCustomName));
    if (existing >= 0) {
      const updated = [...intlTests];
      updated[existing] = entry;
      setIntlTests(updated);
    } else {
      setIntlTests([...intlTests, entry]);
    }
    setNewIntlScore("");
    setNewIntlType("");
    setNewIntlCustomName("");
  };

  const removeIntlTest = (index: number) => setIntlTests(intlTests.filter((_, i) => i !== index));

  const onSubmit = async (data: FormData) => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const payload: Partial<StudentProfile> = {
        name: data.name || undefined,
        phoneNumber: data.phoneNumber || undefined,
        country: data.country || undefined,
        city: data.city || undefined,
        graduationYear: data.graduationYear || undefined,
        educationLevel: data.educationLevel || undefined,
        email: currentUser.email ?? undefined,
        emailVerified: currentUser.emailVerified,
        grades: {
          highSchoolGpa: data.highSchoolGpa ? parseFloat(data.highSchoolGpa) : undefined,
          qudoratScore: data.qudoratScore ? parseFloat(data.qudoratScore) : undefined,
          tahsiliScore: data.tahsiliScore ? parseFloat(data.tahsiliScore) : undefined,
          stepScore: data.stepScore ? parseFloat(data.stepScore) : undefined,
        },
        tests: languageTests,
        internationalTests: intlTests,
      };
      await saveStudentProfile(currentUser.uid, payload);
      toast({ title: "✓ تم الحفظ بنجاح", description: "تم تحديث ملفك الشخصي" });
    } catch {
      setFirebaseError(true);
      toast({ title: "خطأ في الحفظ", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const years = Array.from({ length: 10 }, (_, i) => (new Date().getFullYear() + 2 - i).toString());

  return (
    <Layout title="الملف الشخصي">
      <div className="p-4 sm:p-6 max-w-2xl mx-auto" dir="rtl">
        {firebaseError && <FirebaseBanner />}
        <EmailVerificationBanner />

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center flex-shrink-0">
            <User size={24} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-foreground">الملف الشخصي</h2>
              {emailVerified ? (
                <Badge className="bg-teal-100 text-teal-700 hover:bg-teal-100 text-xs">✓ بريد موثّق</Badge>
              ) : (
                <Badge variant="outline" className="text-amber-600 border-amber-300 text-xs">بريد غير موثّق</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground truncate">{currentUser?.email}</p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Card className="border-border">
              <CardHeader className="pb-3"><CardTitle className="text-sm">المعلومات الشخصية</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>الاسم الكامل</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input {...field} placeholder="محمد أحمد" className="pr-9" data-testid="input-name" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="phoneNumber" render={({ field }) => (
                  <FormItem>
                    <FormLabel>رقم الجوال</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Phone size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input {...field} type="tel" placeholder="05xxxxxxxx" className="pr-9" data-testid="input-phone" dir="ltr" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="country" render={({ field }) => (
                    <FormItem>
                      <FormLabel>الدولة</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger data-testid="select-country">
                            <Globe size={14} className="text-muted-foreground ml-1" />
                            <SelectValue placeholder="اختر الدولة" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="city" render={({ field }) => (
                    <FormItem>
                      <FormLabel>المدينة</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <MapPin size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                          <Input {...field} placeholder="الرياض" className="pr-9" data-testid="input-city" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="graduationYear" render={({ field }) => (
                    <FormItem>
                      <FormLabel>سنة التخرج</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="السنة" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {years.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="educationLevel" render={({ field }) => (
                    <FormItem>
                      <FormLabel>المرحلة الدراسية</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="المرحلة" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="high_school">الثانوية العامة</SelectItem>
                          <SelectItem value="year_1">السنة الأولى الجامعية</SelectItem>
                          <SelectItem value="year_2">السنة الثانية الجامعية</SelectItem>
                          <SelectItem value="graduate">خريج</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader className="pb-3"><CardTitle className="text-sm">الدرجات الأكاديمية</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { name: "highSchoolGpa",  label: "معدل الثانوية (%)", placeholder: "95.5", max: 100 },
                    { name: "qudoratScore",   label: "درجة القدرات",       placeholder: "85",   max: 100 },
                    { name: "tahsiliScore",   label: "درجة التحصيلي",     placeholder: "88",   max: 100 },
                    { name: "stepScore",      label: "درجة STEP",          placeholder: "70",   max: 100 },
                  ].map(({ name, label, placeholder, max }) => (
                    <FormField
                      key={name}
                      control={form.control}
                      name={name as any}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{label}</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" min="0" max={max} step="0.1" placeholder={placeholder} data-testid={`input-${name}`} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BookOpen size={15} className="text-primary" />
                  اختبارات اللغة الإنجليزية
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-medium mb-1 block">نوع الاختبار</label>
                      <Select value={newTestType} onValueChange={(v) => { setNewTestType(v); setNewTestScore(""); setNewTestCustomName(""); }}>
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue placeholder="اختر..." />
                        </SelectTrigger>
                        <SelectContent>
                          {LANGUAGE_TESTS.map((t) => (
                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs font-medium mb-1 block">
                        الدرجة {selectedTestMeta ? `(${selectedTestMeta.hint})` : ""}
                      </label>
                      <Input
                        type="number"
                        min={selectedTestMeta?.min}
                        max={selectedTestMeta?.max}
                        step={selectedTestMeta?.step ?? 0.1}
                        value={newTestScore}
                        onChange={(e) => setNewTestScore(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addLanguageTest())}
                        placeholder={selectedTestMeta ? `${selectedTestMeta.min}–${selectedTestMeta.max}` : "الدرجة"}
                        className="h-9 text-sm"
                        dir="ltr"
                        data-testid="input-lang-score"
                      />
                    </div>
                  </div>
                  {newTestType === "other" && (
                    <Input
                      value={newTestCustomName}
                      onChange={(e) => setNewTestCustomName(e.target.value)}
                      placeholder="اسم الاختبار (مثال: TOEIC)"
                      className="h-9 text-sm"
                    />
                  )}
                  <Button
                    type="button" variant="outline" size="sm" onClick={addLanguageTest}
                    disabled={!newTestType || !newTestScore}
                    className="w-full h-9"
                    data-testid="button-add-lang-test"
                  >
                    <Plus size={14} className="ml-1" />إضافة اختبار لغة
                  </Button>
                </div>

                {languageTests.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground text-sm border border-dashed rounded-lg">
                    <BookOpen size={20} className="mx-auto mb-1 opacity-30" />
                    لم تُضف أي اختبارات بعد
                  </div>
                ) : (
                  <div className="space-y-2">
                    {languageTests.map((t, i) => {
                      const meta = LANGUAGE_TESTS.find((x) => x.value === t.type);
                      const displayName = t.customName ?? meta?.label ?? t.type;
                      const pct = meta && t.type !== "other" ? Math.round(((t.score - meta.min) / (meta.max - meta.min)) * 100) : null;
                      return (
                        <div key={i} className="flex items-center gap-3 bg-muted/40 rounded-lg px-3 py-2">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium">{displayName}</span>
                              <div className="flex items-center gap-2">
                                <Badge className="bg-primary/10 text-primary hover:bg-primary/10 text-xs">{t.score}</Badge>
                                <button type="button" onClick={() => removeTest(i)} className="text-muted-foreground hover:text-destructive transition-colors">
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>
                            {pct !== null && (
                              <>
                                <div className="w-full bg-muted rounded-full h-1.5">
                                  <div className="bg-primary h-1.5 rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%` }} />
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">{meta?.hint} | {pct}% من النطاق</p>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FlaskConical size={15} className="text-primary" />
                  الاختبارات الدولية (SAT / ACT / IB / A-Levels...)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-medium mb-1 block">نوع الاختبار</label>
                      <Select value={newIntlType} onValueChange={(v) => { setNewIntlType(v); setNewIntlScore(""); setNewIntlCustomName(""); }}>
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue placeholder="اختر..." />
                        </SelectTrigger>
                        <SelectContent>
                          {INTERNATIONAL_TESTS.map((t) => (
                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs font-medium mb-1 block">
                        الدرجة / النتيجة {selectedIntlMeta ? `(${selectedIntlMeta.hint})` : ""}
                      </label>
                      <Input
                        type={selectedIntlMeta?.scoreType === "number" ? "number" : "text"}
                        min={(selectedIntlMeta as any)?.min}
                        max={(selectedIntlMeta as any)?.max}
                        value={newIntlScore}
                        onChange={(e) => setNewIntlScore(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addIntlTest())}
                        placeholder={selectedIntlMeta?.hint ?? "الدرجة"}
                        className="h-9 text-sm"
                        dir="ltr"
                      />
                    </div>
                  </div>
                  {newIntlType === "other" && (
                    <Input
                      value={newIntlCustomName}
                      onChange={(e) => setNewIntlCustomName(e.target.value)}
                      placeholder="اسم الاختبار"
                      className="h-9 text-sm"
                    />
                  )}
                  <Button
                    type="button" variant="outline" size="sm" onClick={addIntlTest}
                    disabled={!newIntlType || !newIntlScore}
                    className="w-full h-9"
                  >
                    <Plus size={14} className="ml-1" />إضافة اختبار دولي
                  </Button>
                </div>

                {intlTests.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground text-sm border border-dashed rounded-lg">
                    <FlaskConical size={20} className="mx-auto mb-1 opacity-30" />
                    لم تُضف أي اختبارات دولية بعد
                  </div>
                ) : (
                  <div className="space-y-2">
                    {intlTests.map((t, i) => {
                      const meta = INTERNATIONAL_TESTS.find((x) => x.value === t.type);
                      const displayName = t.customName ?? meta?.label ?? t.type;
                      return (
                        <div key={i} className="flex items-center justify-between bg-muted/40 rounded-lg px-3 py-2">
                          <div>
                            <span className="text-sm font-medium">{displayName}</span>
                            {t.date && <span className="text-xs text-muted-foreground mr-2">{t.date}</span>}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100 text-xs" dir="ltr">{t.score}</Badge>
                            <button type="button" onClick={() => removeIntlTest(i)} className="text-muted-foreground hover:text-destructive transition-colors">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <p className="text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 py-2">
                  💡 تُستخدم هذه الدرجات في التوصيات ومقارنة متطلبات الجامعات الدولية.
                </p>
              </CardContent>
            </Card>

            <Button type="submit" className="w-full" disabled={loading} data-testid="button-save-profile">
              {loading ? "جاري الحفظ..." : <><Save size={16} className="ml-2" />حفظ الملف الشخصي</>}
            </Button>
          </form>
        </Form>
      </div>
    </Layout>
  );
}

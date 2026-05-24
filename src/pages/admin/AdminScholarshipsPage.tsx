import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Award, Globe, ExternalLink, AlertCircle, GitBranch, RefreshCw } from "lucide-react";
import Layout from "@/components/Layout";
import {
  getScholarshipPrograms, createScholarshipProgram,
  updateScholarshipProgram, deleteScholarshipProgram,
  type ScholarshipProgram, type ScholarshipTrack,
} from "@/lib/firestore";
import { reseedScholarshipsOnly } from "@/lib/seed";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import FirebaseBanner from "@/components/FirebaseBanner";

const emptyForm: ScholarshipProgram = {
  nameAr: "", nameEn: "", provider: "", description: "", officialUrl: "", applicationUrl: "",
  requiresUniversityAdmission: true, requiresLanguageTest: true, requiresSAT: false, isActive: true,
  requirements: [], allowedCountries: [], allowedMajors: [], approvedUniversities: [],
  maxAge: "", minGpa: "", languageRequirement: "", notes: "", tracks: [], needsReview: false,
};

const emptyTrack: ScholarshipTrack = { nameAr: "", nameEn: "", description: "", notes: "" };

function TracksEditor({ tracks, onChange }: { tracks: ScholarshipTrack[]; onChange: (v: ScholarshipTrack[]) => void }) {
  const [draft, setDraft] = useState<ScholarshipTrack>(emptyTrack);
  const [editIdx, setEditIdx] = useState<number | null>(null);

  const commit = () => {
    if (!draft.nameAr.trim()) return;
    if (editIdx !== null) {
      const next = [...tracks];
      next[editIdx] = draft;
      onChange(next);
      setEditIdx(null);
    } else {
      onChange([...tracks, draft]);
    }
    setDraft(emptyTrack);
  };

  const startEdit = (i: number) => { setEditIdx(i); setDraft(tracks[i]); };
  const cancel = () => { setEditIdx(null); setDraft(emptyTrack); };
  const remove = (i: number) => onChange(tracks.filter((_, idx) => idx !== i));

  return (
    <div>
      <label className="text-sm font-medium mb-2 flex items-center gap-1.5">
        <GitBranch size={13} className="text-primary" />المسارات
      </label>

      {tracks.length > 0 && (
        <div className="space-y-2 mb-3">
          {tracks.map((t, i) => (
            <div key={i} className="border border-primary/20 bg-accent/20 rounded-lg px-3 py-2 flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-medium">{t.nameAr}</p>
                {t.nameEn && <p className="text-xs text-muted-foreground" dir="ltr">{t.nameEn}</p>}
                {t.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{t.description}</p>}
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => startEdit(i)}>
                  <Edit2 size={12} />
                </Button>
                <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => remove(i)}>
                  <Trash2 size={12} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="border border-border rounded-lg p-3 bg-muted/20 space-y-2">
        <p className="text-xs font-medium text-muted-foreground">{editIdx !== null ? "تعديل المسار" : "إضافة مسار جديد"}</p>
        <div className="grid grid-cols-2 gap-2">
          <Input value={draft.nameAr} onChange={(e) => setDraft((p) => ({ ...p, nameAr: e.target.value }))} placeholder="اسم المسار (عربي) *" className="text-sm" />
          <Input value={draft.nameEn ?? ""} onChange={(e) => setDraft((p) => ({ ...p, nameEn: e.target.value }))} placeholder="Track name (English)" className="text-sm" dir="ltr" />
        </div>
        <Input value={draft.description ?? ""} onChange={(e) => setDraft((p) => ({ ...p, description: e.target.value }))} placeholder="وصف المسار (اختياري)" className="text-sm" />
        <Input value={draft.notes ?? ""} onChange={(e) => setDraft((p) => ({ ...p, notes: e.target.value }))} placeholder="ملاحظات / تحذيرات (اختياري)" className="text-sm" />
        <div className="flex gap-2">
          <Button type="button" size="sm" onClick={commit} disabled={!draft.nameAr.trim()}>
            {editIdx !== null ? "حفظ التعديل" : <><Plus size={12} className="ml-1" />إضافة مسار</>}
          </Button>
          {editIdx !== null && (
            <Button type="button" variant="outline" size="sm" onClick={cancel}>إلغاء</Button>
          )}
        </div>
      </div>
    </div>
  );
}

function TagInput({
  label, values, onChange, placeholder,
}: {
  label: string; values: string[]; onChange: (v: string[]) => void; placeholder?: string;
}) {
  const [input, setInput] = useState("");
  const add = () => {
    const v = input.trim();
    if (v && !values.includes(v)) onChange([...values, v]);
    setInput("");
  };
  const remove = (i: number) => onChange(values.filter((_, idx) => idx !== i));
  return (
    <div>
      <label className="text-sm font-medium mb-1 block">{label}</label>
      <div className="flex gap-2 mb-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder={placeholder ?? "أضف ثم اضغط Enter"}
          className="text-sm"
        />
        <Button type="button" variant="outline" size="sm" onClick={add}>إضافة</Button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {values.map((v, i) => (
          <span key={i} className="inline-flex items-center gap-1 text-xs bg-muted px-2 py-0.5 rounded-full">
            {v}
            <button onClick={() => remove(i)} className="hover:text-destructive ml-1">×</button>
          </span>
        ))}
      </div>
    </div>
  );
}

export default function AdminScholarshipsPage() {
  const [programs, setPrograms] = useState<ScholarshipProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [reseedConfirm, setReseedConfirm] = useState(false);
  const [reseeding, setReseeding] = useState(false);
  const [form, setForm] = useState<ScholarshipProgram>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [firebaseError, setFirebaseError] = useState(false);
  const { toast } = useToast();

  const load = async () => {
    try {
      const data = await getScholarshipPrograms();
      setPrograms(data ?? []);
    } catch { setFirebaseError(true); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditId(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (prog: ScholarshipProgram) => {
    setEditId(prog.id!);
    setForm({
      ...emptyForm,
      ...prog,
      requirements: prog.requirements ?? [],
      allowedCountries: prog.allowedCountries ?? [],
      allowedMajors: prog.allowedMajors ?? [],
      approvedUniversities: prog.approvedUniversities ?? [],
      tracks: prog.tracks ?? [],
      needsReview: prog.needsReview ?? false,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editId) await updateScholarshipProgram(editId, form);
      else await createScholarshipProgram(form);
      toast({ title: editId ? "تم التحديث ✓" : "تمت الإضافة ✓" });
      setDialogOpen(false);
      load();
    } catch { toast({ title: "خطأ في الحفظ", variant: "destructive" }); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteScholarshipProgram(deleteId);
      toast({ title: "تم الحذف" });
      load();
    } catch { toast({ title: "خطأ في الحذف", variant: "destructive" }); }
    finally { setDeleteId(null); }
  };

  const handleReseed = async () => {
    setReseeding(true);
    try {
      await reseedScholarshipsOnly();
      toast({ title: "✓ تمت إعادة تهيئة برامج الابتعاث بنجاح" });
      load();
    } catch {
      toast({ title: "خطأ في إعادة التهيئة", variant: "destructive" });
    } finally {
      setReseeding(false);
      setReseedConfirm(false);
    }
  };

  const f = (key: keyof ScholarshipProgram, val: any) => setForm((prev) => ({ ...prev, [key]: val }));

  return (
    <Layout title="إدارة برامج الابتعاث">
      <div className="p-6 max-w-5xl mx-auto" dir="rtl">
        {firebaseError && <FirebaseBanner />}

        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h2 className="text-xl font-bold text-foreground">إدارة برامج الابتعاث</h2>
            <p className="text-sm text-muted-foreground">{programs.length} برنامج في قاعدة البيانات</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setReseedConfirm(true)} data-testid="button-reseed-scholarships" className="text-amber-600 border-amber-300 hover:bg-amber-50">
              <RefreshCw size={14} className="ml-1.5" />إعادة تهيئة البيانات
            </Button>
            <Button onClick={openCreate} data-testid="button-add-scholarship">
              <Plus size={16} className="ml-1.5" />إضافة برنامج
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full" />)}</div>
        ) : (
          <div className="space-y-3">
            {programs.map((prog) => (
              <Card key={prog.id} className="border-border" data-testid={`card-scholarship-admin-${prog.id}`}>
                <CardContent className="py-3 px-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Award size={16} className="text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-sm text-foreground">{prog.nameAr}</p>
                          {prog.isActive && <span className="text-xs text-green-600">● نشط</span>}
                        </div>
                        <p className="text-xs text-muted-foreground">{prog.provider}</p>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {prog.requiresLanguageTest && (
                            <Badge className="text-xs py-0 bg-blue-100 text-blue-700 hover:bg-blue-100">اختبار لغة</Badge>
                          )}
                          {prog.requiresSAT && (
                            <Badge className="text-xs py-0 bg-purple-100 text-purple-700 hover:bg-purple-100">SAT</Badge>
                          )}
                          {prog.requiresUniversityAdmission && (
                            <Badge className="text-xs py-0 bg-green-100 text-green-700 hover:bg-green-100">قبول جامعي</Badge>
                          )}
                          {prog.allowedCountries && prog.allowedCountries.length > 0 && (
                            <Badge variant="secondary" className="text-xs py-0">
                              {prog.allowedCountries.filter((c) => !c.includes("يحتاج")).length} دولة
                            </Badge>
                          )}
                        </div>
                        {prog.officialUrl && prog.officialUrl !== "يحتاج مراجعة" && (
                          <a href={prog.officialUrl} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-primary flex items-center gap-0.5 mt-1 hover:underline">
                            <Globe size={10} />{prog.officialUrl}<ExternalLink size={9} />
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button variant="outline" size="sm" onClick={() => openEdit(prog)} data-testid={`button-edit-scholar-${prog.id}`}>
                        <Edit2 size={14} className="ml-1" />تعديل
                      </Button>
                      <Button variant="outline" size="sm" className="text-destructive border-destructive/30" onClick={() => setDeleteId(prog.id!)}>
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent dir="rtl" className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editId ? "تعديل البرنامج" : "إضافة برنامج ابتعاث"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">اسم البرنامج (عربي) *</label>
                  <Input value={form.nameAr} onChange={(e) => f("nameAr", e.target.value)} data-testid="input-scholarship-name-ar" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">الاسم (إنجليزي)</label>
                  <Input value={form.nameEn ?? ""} onChange={(e) => f("nameEn", e.target.value)} dir="ltr" />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">الجهة المشرفة *</label>
                <Input value={form.provider} onChange={(e) => f("provider", e.target.value)} />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">وصف البرنامج</label>
                <Textarea value={form.description ?? ""} onChange={(e) => f("description", e.target.value)} rows={3} />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">الحد الأدنى للمعدل</label>
                  <Input value={form.minGpa ?? ""} onChange={(e) => f("minGpa", e.target.value)} placeholder="85% أو يحتاج مراجعة" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">الحد الأقصى للعمر</label>
                  <Input value={form.maxAge ?? ""} onChange={(e) => f("maxAge", e.target.value)} placeholder="30 سنة" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">شرط اللغة</label>
                  <Input value={form.languageRequirement ?? ""} onChange={(e) => f("languageRequirement", e.target.value)} placeholder="IELTS 6.0" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">الرابط الرسمي</label>
                  <Input value={form.officialUrl ?? ""} onChange={(e) => f("officialUrl", e.target.value)} dir="ltr" placeholder="https://" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">رابط التقديم</label>
                  <Input value={form.applicationUrl ?? ""} onChange={(e) => f("applicationUrl", e.target.value)} dir="ltr" placeholder="https://" />
                </div>
              </div>

              <TagInput
                label="الشروط الأساسية"
                values={form.requirements ?? []}
                onChange={(v) => f("requirements", v)}
                placeholder="أضف شرطاً ثم اضغط Enter"
              />

              <TagInput
                label="الدول المسموحة"
                values={form.allowedCountries ?? []}
                onChange={(v) => f("allowedCountries", v)}
                placeholder="مثال: الولايات المتحدة"
              />

              <TagInput
                label="التخصصات المسموحة"
                values={form.allowedMajors ?? []}
                onChange={(v) => f("allowedMajors", v)}
                placeholder="مثال: الهندسة"
              />

              <TagInput
                label="الجامعات المعتمدة"
                values={form.approvedUniversities ?? []}
                onChange={(v) => f("approvedUniversities", v)}
                placeholder="مثال: MIT"
              />

              <div>
                <label className="text-sm font-medium mb-1 block">ملاحظات / تحذيرات</label>
                <Textarea value={form.notes ?? ""} onChange={(e) => f("notes", e.target.value)} rows={2} placeholder="⚠️ معلومات تحتاج تأكيد..." />
              </div>

              <TracksEditor
                tracks={form.tracks ?? []}
                onChange={(v) => f("tracks", v)}
              />

              <div className="grid grid-cols-2 gap-3 border border-border rounded-lg p-3 bg-muted/30">
                {[
                  { label: "يتطلب قبول جامعي", key: "requiresUniversityAdmission" },
                  { label: "يتطلب اختبار لغة", key: "requiresLanguageTest" },
                  { label: "يتطلب SAT/ACT", key: "requiresSAT" },
                  { label: "البرنامج نشط", key: "isActive" },
                  { label: "⚠️ يحتاج مراجعة", key: "needsReview" },
                ].map(({ label, key }) => (
                  <div key={key} className="flex items-center justify-between">
                    <label className="text-sm">{label}</label>
                    <Switch
                      checked={!!(form as any)[key]}
                      onCheckedChange={(v) => f(key as keyof ScholarshipProgram, v)}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-2 mt-2">
              <AlertCircle size={13} className="text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700">استخدم "يحتاج مراجعة" في أي حقل لمعلومة غير مؤكدة</p>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>إلغاء</Button>
              <Button onClick={handleSave} disabled={saving || !form.nameAr || !form.provider} data-testid="button-save-scholarship">
                {saving ? "جاري الحفظ..." : "حفظ البرنامج"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent dir="rtl">
            <AlertDialogHeader>
              <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
              <AlertDialogDescription>هل أنت متأكد من حذف هذا البرنامج؟ لا يمكن التراجع.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">حذف</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={reseedConfirm} onOpenChange={setReseedConfirm}>
          <AlertDialogContent dir="rtl">
            <AlertDialogHeader>
              <AlertDialogTitle>إعادة تهيئة برامج الابتعاث</AlertDialogTitle>
              <AlertDialogDescription>
                سيتم حذف جميع برامج الابتعاث الحالية واستبدالها ببيانات المصدر الجديدة (تشمل البرامج المضافة ومسارات KASP المحدّثة). هل تريد المتابعة؟
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleReseed}
                disabled={reseeding}
                className="bg-amber-600 hover:bg-amber-700"
              >
                {reseeding ? "جاري الإعادة..." : "نعم، أعد التهيئة"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
}

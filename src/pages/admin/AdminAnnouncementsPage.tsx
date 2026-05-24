import { useState, useEffect } from "react";
import {
  collection, query, getDocs, addDoc, updateDoc, deleteDoc,
  doc, serverTimestamp, orderBy, Timestamp
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Megaphone, Plus, Pencil, Trash2, RefreshCw, Info, AlertTriangle, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Announcement } from "@/components/AnnouncementPopup";

const typeOptions = [
  { value: "info", label: "معلومة", icon: Info, color: "text-blue-600 bg-blue-50" },
  { value: "warning", label: "تنبيه", icon: AlertTriangle, color: "text-amber-600 bg-amber-50" },
  { value: "update", label: "تحديث", icon: Sparkles, color: "text-primary bg-accent" },
  { value: "announcement", label: "إعلان", icon: Megaphone, color: "text-purple-600 bg-purple-50" },
];

const emptyForm = {
  title: "",
  description: "",
  type: "info" as Announcement["type"],
  active: true,
  showOnce: true,
  buttonText: "",
  buttonUrl: "",
  expiresAt: "",
};

export default function AdminAnnouncementsPage() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "announcements"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      const data: Announcement[] = [];
      snap.forEach((d) => data.push({ id: d.id, ...d.data() } as Announcement));
      setItems(data);
    } catch {
      toast({ title: "تعذّر التحميل", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (ann: Announcement) => {
    setEditing(ann);
    setForm({
      title: ann.title,
      description: ann.description,
      type: ann.type,
      active: ann.active,
      showOnce: ann.showOnce,
      buttonText: ann.buttonText || "",
      buttonUrl: ann.buttonUrl || "",
      expiresAt: ann.expiresAt ? new Date(ann.expiresAt.toMillis()).toISOString().slice(0, 10) : "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.description) {
      toast({ title: "العنوان والوصف مطلوبان", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload: any = {
        title: form.title,
        description: form.description,
        type: form.type,
        active: form.active,
        showOnce: form.showOnce,
        buttonText: form.buttonText || null,
        buttonUrl: form.buttonUrl || null,
        expiresAt: form.expiresAt ? Timestamp.fromDate(new Date(form.expiresAt)) : null,
      };
      if (editing) {
        await updateDoc(doc(db, "announcements", editing.id), payload);
        toast({ title: "تم التحديث" });
      } else {
        payload.createdAt = serverTimestamp();
        await addDoc(collection(db, "announcements"), payload);
        toast({ title: "تم الإضافة" });
      }
      setDialogOpen(false);
      load();
    } catch {
      toast({ title: "خطأ في الحفظ", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteDoc(doc(db, "announcements", deleteId));
      toast({ title: "تم الحذف" });
      setDeleteId(null);
      load();
    } catch {
      toast({ title: "خطأ في الحذف", variant: "destructive" });
    }
  };

  const toggleActive = async (ann: Announcement) => {
    try {
      await updateDoc(doc(db, "announcements", ann.id), { active: !ann.active });
      setItems((p) => p.map((a) => a.id === ann.id ? { ...a, active: !a.active } : a));
    } catch {
      toast({ title: "خطأ في التحديث", variant: "destructive" });
    }
  };

  return (
    <Layout title="إدارة الإعلانات">
      <div className="p-6 max-w-4xl mx-auto" dir="rtl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-600 flex items-center justify-center">
              <Megaphone size={22} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">إدارة الإعلانات</h2>
              <p className="text-sm text-muted-foreground">{items.length} إعلان</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={load} disabled={loading} className="text-xs">
              <RefreshCw size={13} className={`ml-1 ${loading ? "animate-spin" : ""}`} />تحديث
            </Button>
            <Button size="sm" onClick={openNew} className="text-xs">
              <Plus size={13} className="ml-1" />إضافة إعلان
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-sm text-muted-foreground">جاري التحميل...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-12">
            <Megaphone size={40} className="text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">لا توجد إعلانات. أضف أول إعلان.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((ann) => {
              const t = typeOptions.find((o) => o.value === ann.type) || typeOptions[0];
              const Icon = t.icon;
              return (
                <Card key={ann.id} className={`border-border ${!ann.active ? "opacity-60" : ""}`}>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-lg ${t.color} flex items-center justify-center flex-shrink-0`}>
                        <Icon size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-semibold text-sm text-foreground">{ann.title}</span>
                          <Badge variant="outline" className="text-xs">{t.label}</Badge>
                          {ann.showOnce && <Badge variant="outline" className="text-xs text-muted-foreground">مرة واحدة</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">{ann.description}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Switch checked={ann.active} onCheckedChange={() => toggleActive(ann)} />
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(ann)}>
                          <Pencil size={14} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteId(ann.id)}>
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Add/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-md mx-4 rounded-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
            <DialogHeader>
              <DialogTitle className="text-right">{editing ? "تعديل الإعلان" : "إضافة إعلان جديد"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <Label className="text-xs mb-1 block">العنوان *</Label>
                <Input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} className="h-9 text-sm" placeholder="عنوان الإعلان" />
              </div>
              <div>
                <Label className="text-xs mb-1 block">الوصف *</Label>
                <Textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} className="text-sm resize-none" rows={3} placeholder="نص الإعلان..." />
              </div>
              <div>
                <Label className="text-xs mb-1 block">النوع</Label>
                <Select value={form.type} onValueChange={(v) => setForm((p) => ({ ...p, type: v as Announcement["type"] }))}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {typeOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs mb-1 block">نص الزر (اختياري)</Label>
                  <Input value={form.buttonText} onChange={(e) => setForm((p) => ({ ...p, buttonText: e.target.value }))} className="h-9 text-sm" placeholder="اعرف أكثر" />
                </div>
                <div>
                  <Label className="text-xs mb-1 block">رابط الزر (اختياري)</Label>
                  <Input value={form.buttonUrl} onChange={(e) => setForm((p) => ({ ...p, buttonUrl: e.target.value }))} className="h-9 text-sm" dir="ltr" placeholder="https://..." />
                </div>
              </div>
              <div>
                <Label className="text-xs mb-1 block">تاريخ الانتهاء (اختياري)</Label>
                <Input type="date" value={form.expiresAt} onChange={(e) => setForm((p) => ({ ...p, expiresAt: e.target.value }))} className="h-9 text-sm" />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch checked={form.active} onCheckedChange={(v) => setForm((p) => ({ ...p, active: v })) } />
                  <Label className="text-xs">مفعّل</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={form.showOnce} onCheckedChange={(v) => setForm((p) => ({ ...p, showOnce: v }))} />
                  <Label className="text-xs">يظهر مرة واحدة فقط</Label>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={saving} className="flex-1 h-9 text-sm">
                  {saving ? "جاري الحفظ..." : editing ? "حفظ التعديلات" : "إضافة"}
                </Button>
                <Button variant="outline" onClick={() => setDialogOpen(false)} className="h-9 text-sm">إلغاء</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirm */}
        <AlertDialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
          <AlertDialogContent dir="rtl">
            <AlertDialogHeader>
              <AlertDialogTitle>حذف الإعلان</AlertDialogTitle>
              <AlertDialogDescription>هل أنت متأكد؟ لا يمكن التراجع عن هذا الإجراء.</AlertDialogDescription>
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

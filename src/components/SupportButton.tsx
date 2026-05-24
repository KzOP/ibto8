import { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MessageCircle, Send, CheckCircle2, ExternalLink, Headphones } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const WHATSAPP_URL = "https://wa.me/966549720769";

type Step = "menu" | "form" | "success";

export default function SupportButton() {
  const { currentUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("menu");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: currentUser?.email || "",
    type: "",
    message: "",
  });

  const reset = () => {
    setStep("menu");
    setError("");
    setForm({ name: "", email: currentUser?.email || "", type: "", message: "" });
  };

  const handleOpen = () => { reset(); setOpen(true); };

  const handleSubmit = async () => {
    if (!form.email || !form.type || !form.message) {
      setError("يرجى ملء حقول البريد الإلكتروني ونوع الرسالة والرسالة");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await addDoc(collection(db, "support_messages"), {
        name: form.name || null,
        email: form.email,
        type: form.type,
        message: form.message,
        status: "new",
        userId: currentUser?.uid || null,
        createdAt: serverTimestamp(),
      });
      setStep("success");
    } catch {
      setError("حدث خطأ أثناء الإرسال، يرجى المحاولة مرة أخرى");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className="fixed bottom-6 left-4 z-50 flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-full shadow-lg hover:bg-primary/90 transition-all hover:scale-105 active:scale-95"
        title="الدعم والاقتراحات"
      >
        <Headphones size={18} />
        <span className="text-sm font-medium">الدعم</span>
      </button>

      <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); setOpen(v); }}>
        <DialogContent className="max-w-sm mx-4 rounded-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right text-base font-bold">الدعم والاقتراحات</DialogTitle>
          </DialogHeader>

          {step === "menu" && (
            <div className="space-y-3 mt-2">
              <p className="text-sm text-muted-foreground">كيف يمكننا مساعدتك؟</p>
              <Button
                className="w-full justify-start gap-3 h-12"
                variant="outline"
                onClick={() => setStep("form")}
              >
                <Send size={16} className="text-primary" />
                <span>إرسال اقتراح أو مشكلة</span>
              </Button>
              <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="block">
                <Button
                  className="w-full justify-start gap-3 h-12 border-green-200 text-green-700 hover:bg-green-50"
                  variant="outline"
                >
                  <MessageCircle size={16} className="text-green-600" />
                  <span>التواصل عبر واتساب</span>
                  <ExternalLink size={12} className="mr-auto text-muted-foreground" />
                </Button>
              </a>
            </div>
          )}

          {step === "form" && (
            <div className="space-y-3 mt-2">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription className="text-xs">{error}</AlertDescription>
                </Alert>
              )}

              <div>
                <Label className="text-xs mb-1 block">الاسم (اختياري)</Label>
                <Input
                  placeholder="اسمك"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  className="h-9 text-sm"
                />
              </div>

              <div>
                <Label className="text-xs mb-1 block">البريد الإلكتروني *</Label>
                <Input
                  type="email"
                  placeholder="email@example.com"
                  dir="ltr"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  className="h-9 text-sm"
                />
              </div>

              <div>
                <Label className="text-xs mb-1 block">نوع الرسالة *</Label>
                <Select value={form.type} onValueChange={(v) => setForm((p) => ({ ...p, type: v }))}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="اختر النوع" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="suggestion">اقتراح</SelectItem>
                    <SelectItem value="problem">مشكلة</SelectItem>
                    <SelectItem value="report">بلاغ</SelectItem>
                    <SelectItem value="other">أخرى</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs mb-1 block">الرسالة *</Label>
                <Textarea
                  placeholder="اكتب رسالتك هنا..."
                  value={form.message}
                  onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                  className="text-sm resize-none"
                  rows={4}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSubmit} disabled={loading} className="flex-1 h-9 text-sm">
                  {loading ? "جاري الإرسال..." : "إرسال"}
                </Button>
                <Button variant="outline" onClick={() => setStep("menu")} className="h-9 text-sm">
                  رجوع
                </Button>
              </div>
            </div>
          )}

          {step === "success" && (
            <div className="text-center py-6 space-y-3">
              <div className="w-14 h-14 rounded-full bg-green-50 border border-green-200 flex items-center justify-center mx-auto">
                <CheckCircle2 size={28} className="text-green-600" />
              </div>
              <h3 className="font-semibold text-foreground">تم الإرسال بنجاح!</h3>
              <p className="text-sm text-muted-foreground">شكراً لتواصلك معنا، سنرد عليك في أقرب وقت.</p>
              <Button variant="outline" onClick={() => { reset(); setOpen(false); }} className="w-full h-9 text-sm">
                إغلاق
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

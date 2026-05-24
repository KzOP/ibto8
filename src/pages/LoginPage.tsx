import { useState } from "react";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { GraduationCap, Mail, Lock, AlertCircle, CheckCircle2 } from "lucide-react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const schema = z.object({
  email: z.string().email("بريد إلكتروني غير صحيح"),
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
});
type FormData = z.infer<typeof schema>;

const errorMessages: Record<string, string> = {
  "auth/user-not-found": "لا يوجد حساب بهذا البريد الإلكتروني",
  "auth/wrong-password": "كلمة المرور غير صحيحة",
  "auth/invalid-credential": "البريد الإلكتروني أو كلمة المرور غير صحيحة",
  "auth/too-many-requests": "تم تجاوز عدد المحاولات المسموح بها، يرجى المحاولة لاحقاً",
};

function ForgotPasswordDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSend = async () => {
    if (!email) { setError("يرجى إدخال بريدك الإلكتروني"); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError("بريد إلكتروني غير صحيح"); return; }
    setLoading(true);
    setError("");
    try {
      await sendPasswordResetEmail(auth, email);
      setSent(true);
    } catch (err: any) {
      if (err.code === "auth/user-not-found") {
        setError("لا يوجد حساب مرتبط بهذا البريد الإلكتروني");
      } else {
        setError("حدث خطأ، يرجى المحاولة مرة أخرى");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail("");
    setSent(false);
    setError("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-sm mx-4 rounded-2xl" dir="rtl">
        <DialogHeader className="text-right">
          <DialogTitle className="text-base font-bold">استعادة كلمة المرور</DialogTitle>
          <DialogDescription className="text-right text-sm text-muted-foreground">
            {sent
              ? "تم إرسال رابط إعادة التعيين"
              : "أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة تعيين كلمة المرور"}
          </DialogDescription>
        </DialogHeader>

        {sent ? (
          <div className="text-center py-4 space-y-3">
            <div className="w-14 h-14 rounded-full bg-green-50 border border-green-200 flex items-center justify-center mx-auto">
              <CheckCircle2 size={28} className="text-green-600" />
            </div>
            <p className="text-sm text-foreground font-medium">
              تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني.
            </p>
            <p className="text-xs text-muted-foreground">
              تحقق من صندوق الوارد وربما مجلد البريد العشوائي.
            </p>
            <Button onClick={handleClose} className="w-full h-9 text-sm">حسناً</Button>
          </div>
        ) : (
          <div className="space-y-3 mt-1">
            {error && (
              <Alert variant="destructive" className="py-2">
                <AlertCircle size={14} />
                <AlertDescription className="text-xs">{error}</AlertDescription>
              </Alert>
            )}
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">البريد الإلكتروني</label>
              <div className="relative">
                <Mail size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="email"
                  dir="ltr"
                  placeholder="example@email.com"
                  className="pr-9 h-9 text-sm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSend} disabled={loading} className="flex-1 h-9 text-sm">
                {loading ? "جاري الإرسال..." : "إرسال الرابط"}
              </Button>
              <Button variant="outline" onClick={handleClose} className="h-9 text-sm">إلغاء</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function LoginPage() {
  const { signIn } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: FormData) => {
    setError("");
    setLoading(true);
    try {
      await signIn(data.email, data.password);
    } catch (err: any) {
      const msg = errorMessages[err.code] || err.message || "حدث خطأ، يرجى المحاولة مرة أخرى";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/20 flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/">
            <div className="inline-flex items-center gap-2 cursor-pointer">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <GraduationCap size={22} className="text-white" />
              </div>
              <span className="font-bold text-foreground text-2xl">ابتعاثي</span>
            </div>
          </Link>
        </div>

        <Card className="shadow-lg border-border">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl">أهلاً بعودتك</CardTitle>
            <CardDescription>سجّل دخولك للوصول إلى حسابك</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle size={16} />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>البريد الإلكتروني</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                          <Input {...field} type="email" placeholder="example@email.com" className="pr-9" data-testid="input-email" dir="ltr" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel>كلمة المرور</FormLabel>
                        <button
                          type="button"
                          onClick={() => setForgotOpen(true)}
                          className="text-xs text-primary hover:underline cursor-pointer"
                        >
                          نسيت كلمة المرور؟
                        </button>
                      </div>
                      <FormControl>
                        <div className="relative">
                          <Lock size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                          <Input {...field} type="password" placeholder="••••••••" className="pr-9" data-testid="input-password" dir="ltr" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={loading} data-testid="button-submit-login">
                  {loading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
                </Button>
              </form>
            </Form>

            <div className="mt-4 text-center">
              <p className="text-sm text-muted-foreground">
                ليس لديك حساب؟{" "}
                <Link href="/register">
                  <span className="text-primary font-medium cursor-pointer hover:underline">أنشئ حساباً جديداً</span>
                </Link>
              </p>
            </div>

            <div className="mt-4 p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground text-center">
              للإدارة: admin@ibtiaathi.sa أو admin@test.com
            </div>
          </CardContent>
        </Card>
      </div>

      <ForgotPasswordDialog open={forgotOpen} onClose={() => setForgotOpen(false)} />
    </div>
  );
}

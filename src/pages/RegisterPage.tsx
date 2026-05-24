import { useState } from "react";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { GraduationCap, Mail, Lock, User, Phone, Globe, AlertCircle, MailCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const COUNTRIES = [
  "المملكة العربية السعودية", "الإمارات العربية المتحدة", "الكويت", "البحرين",
  "قطر", "عُمان", "الأردن", "مصر", "اليمن", "العراق", "سوريا", "لبنان", "أخرى",
];

const schema = z.object({
  name: z.string().min(2, "الاسم الكامل مطلوب"),
  email: z.string().email("بريد إلكتروني غير صحيح"),
  phoneNumber: z.string().optional(),
  country: z.string().optional(),
  password: z.string().min(6, "كلمة المرور 6 أحرف على الأقل"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "كلمتا المرور غير متطابقتين",
  path: ["confirmPassword"],
});
type FormData = z.infer<typeof schema>;

const errorMessages: Record<string, string> = {
  "auth/email-already-in-use": "هذا البريد الإلكتروني مستخدم بالفعل",
  "auth/invalid-email": "بريد إلكتروني غير صحيح",
  "auth/weak-password": "كلمة المرور ضعيفة جداً (6 أحرف على الأقل)",
};

export default function RegisterPage() {
  const { signUp } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "", email: "", phoneNumber: "+966", country: "المملكة العربية السعودية", password: "", confirmPassword: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    setError("");
    setLoading(true);
    try {
      await signUp({
        email: data.email,
        password: data.password,
        name: data.name,
        phoneNumber: data.phoneNumber,
        country: data.country,
      });
      setSuccess(true);
    } catch (err: any) {
      const msg = errorMessages[err.code] || err.message || "حدث خطأ، يرجى المحاولة مرة أخرى";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-accent/20 flex items-center justify-center p-4" dir="rtl">
        <div className="w-full max-w-md">
          <Card className="shadow-lg border-border text-center">
            <CardContent className="py-10">
              <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center mx-auto mb-4">
                <MailCheck size={32} className="text-teal-600" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">تم إنشاء حسابك!</h2>
              <p className="text-muted-foreground text-sm mb-1">
                أرسلنا رسالة تحقق إلى بريدك الإلكتروني.
              </p>
              <p className="text-muted-foreground text-sm mb-6">
                يرجى فتح الرسالة والضغط على رابط التفعيل قبل تسجيل الدخول.
              </p>
              <Link href="/login">
                <Button className="w-full" data-testid="button-go-login">تسجيل الدخول</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
            <CardTitle className="text-xl">إنشاء حساب جديد</CardTitle>
            <CardDescription>انضم لمئات الطلاب السعوديين على ابتعاثي</CardDescription>
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
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الاسم الكامل</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                          <Input {...field} placeholder="محمد أحمد" className="pr-9" data-testid="input-name" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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

                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>رقم الجوال</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Phone size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <Input {...field} type="tel" placeholder="+966 5xxxxxxxx" className="pr-9" data-testid="input-phone" dir="ltr" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الدولة</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger data-testid="select-country">
                              <Globe size={14} className="text-muted-foreground ml-1" />
                              <SelectValue placeholder="اختر" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {COUNTRIES.map((c) => (
                              <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>كلمة المرور</FormLabel>
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

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>تأكيد كلمة المرور</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                          <Input {...field} type="password" placeholder="••••••••" className="pr-9" data-testid="input-confirm-password" dir="ltr" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={loading} data-testid="button-submit-register">
                  {loading ? "جاري إنشاء الحساب..." : "إنشاء حساب"}
                </Button>
              </form>
            </Form>

            <div className="mt-4 text-center">
              <p className="text-sm text-muted-foreground">
                لديك حساب بالفعل؟{" "}
                <Link href="/login">
                  <span className="text-primary font-medium cursor-pointer hover:underline">سجّل دخولك</span>
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

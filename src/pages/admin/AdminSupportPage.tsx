import { useState, useEffect } from "react";
import { collection, query, getDocs, doc, updateDoc, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Headphones, RefreshCw, Mail, MessageCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SupportMessage {
  id: string;
  name?: string;
  email: string;
  type: string;
  message: string;
  status: "new" | "reviewed" | "closed";
  userId?: string;
  createdAt?: any;
}

const typeLabels: Record<string, string> = {
  suggestion: "اقتراح",
  problem: "مشكلة",
  report: "بلاغ",
  other: "أخرى",
};

const statusConfig = {
  new: { label: "جديد", className: "bg-blue-100 text-blue-700 border-0" },
  reviewed: { label: "تمت المراجعة", className: "bg-amber-100 text-amber-700 border-0" },
  closed: { label: "مغلق", className: "bg-muted text-muted-foreground border-0" },
};

export default function AdminSupportPage() {
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "support_messages"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      const data: SupportMessage[] = [];
      snap.forEach((d) => data.push({ id: d.id, ...d.data() } as SupportMessage));
      setMessages(data);
    } catch {
      toast({ title: "تعذّر تحميل الرسائل", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id: string, status: SupportMessage["status"]) => {
    try {
      await updateDoc(doc(db, "support_messages", id), { status });
      setMessages((p) => p.map((m) => m.id === id ? { ...m, status } : m));
      toast({ title: "تم تحديث الحالة" });
    } catch {
      toast({ title: "خطأ في التحديث", variant: "destructive" });
    }
  };

  const filtered = filter === "all" ? messages : messages.filter((m) => m.status === filter);
  const counts = { all: messages.length, new: messages.filter((m) => m.status === "new").length };

  return (
    <Layout title="رسائل الدعم">
      <div className="p-6 max-w-4xl mx-auto" dir="rtl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center">
              <Headphones size={22} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">رسائل الدعم والاقتراحات</h2>
              <p className="text-sm text-muted-foreground">{counts.all} رسالة إجمالاً • {counts.new} جديدة</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={load} disabled={loading} className="text-xs">
            <RefreshCw size={13} className={`ml-1 ${loading ? "animate-spin" : ""}`} />
            تحديث
          </Button>
        </div>

        <div className="flex gap-2 mb-4">
          {[
            { value: "all", label: "الكل" },
            { value: "new", label: "جديد" },
            { value: "reviewed", label: "تمت المراجعة" },
            { value: "closed", label: "مغلق" },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === f.value ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground text-sm">جاري التحميل...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle size={40} className="text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">لا توجد رسائل</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((msg) => {
              const sc = statusConfig[msg.status] || statusConfig.new;
              return (
                <Card key={msg.id} className="border-border">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <Badge className={sc.className}>{sc.label}</Badge>
                          <Badge variant="outline" className="text-xs">
                            {typeLabels[msg.type] || msg.type}
                          </Badge>
                          {msg.name && <span className="text-xs text-muted-foreground">{msg.name}</span>}
                        </div>
                        <div className="flex items-center gap-1.5 mb-2">
                          <Mail size={12} className="text-muted-foreground flex-shrink-0" />
                          <span className="text-xs text-muted-foreground" dir="ltr">{msg.email}</span>
                        </div>
                        <p className="text-sm text-foreground leading-relaxed">{msg.message}</p>
                        {msg.createdAt?.toDate && (
                          <p className="text-[11px] text-muted-foreground mt-2">
                            {msg.createdAt.toDate().toLocaleDateString("ar-SA")}
                          </p>
                        )}
                      </div>
                      <div className="flex-shrink-0">
                        <Select value={msg.status} onValueChange={(v) => updateStatus(msg.id, v as SupportMessage["status"])}>
                          <SelectTrigger className="h-8 text-xs w-36">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">جديد</SelectItem>
                            <SelectItem value="reviewed">تمت المراجعة</SelectItem>
                            <SelectItem value="closed">مغلق</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}

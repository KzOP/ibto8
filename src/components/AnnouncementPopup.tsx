import { useState, useEffect } from "react";
import { collection, query, where, getDocs, orderBy, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Info, AlertTriangle, Sparkles, Megaphone, X } from "lucide-react";

export interface Announcement {
  id: string;
  title: string;
  description: string;
  type: "info" | "warning" | "update" | "announcement";
  active: boolean;
  showOnce: boolean;
  buttonText?: string;
  buttonUrl?: string;
  expiresAt?: Timestamp | null;
}

const typeConfig = {
  info: { icon: Info, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", badge: "bg-blue-100 text-blue-700", label: "معلومة" },
  warning: { icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", badge: "bg-amber-100 text-amber-700", label: "تنبيه" },
  update: { icon: Sparkles, color: "text-primary", bg: "bg-accent/50", border: "border-primary/20", badge: "bg-accent text-primary", label: "تحديث" },
  announcement: { icon: Megaphone, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-200", badge: "bg-purple-100 text-purple-700", label: "إعلان" },
};

const DISMISSED_KEY = "ibtiaathi_dismissed_announcements";

function getDismissed(): string[] {
  try { return JSON.parse(localStorage.getItem(DISMISSED_KEY) || "[]"); }
  catch { return []; }
}

function addDismissed(id: string) {
  const list = getDismissed();
  if (!list.includes(id)) {
    localStorage.setItem(DISMISSED_KEY, JSON.stringify([...list, id]));
  }
}

export default function AnnouncementPopup() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [current, setCurrent] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const now = Timestamp.now();
        const q = query(
          collection(db, "announcements"),
          where("active", "==", true),
          orderBy("createdAt", "desc")
        );
        const snap = await getDocs(q);
        const dismissed = getDismissed();

        const visible: Announcement[] = [];
        snap.forEach((doc) => {
          const d = { id: doc.id, ...doc.data() } as Announcement;
          if (d.expiresAt && d.expiresAt.toMillis() < now.toMillis()) return;
          if (d.showOnce && dismissed.includes(d.id)) return;
          visible.push(d);
        });

        if (visible.length > 0) {
          setAnnouncements(visible);
          setCurrent(0);
          setOpen(true);
        }
      } catch {
        // Firestore not available, show default announcement
        const defaultAnn: Announcement = {
          id: "__default__",
          title: "منصة ابتعاثي في مرحلة التطوير",
          description: "منصة ابتعاثي ما زالت في مرحلة التطوير التجريبي، وقد تحتوي بعض البيانات على معلومات غير مكتملة أو تحتاج مراجعة من المصادر الرسمية.",
          type: "warning",
          active: true,
          showOnce: true,
        };
        const dismissed = getDismissed();
        if (!dismissed.includes(defaultAnn.id)) {
          setAnnouncements([defaultAnn]);
          setCurrent(0);
          setOpen(true);
        }
      }
    };
    load();
  }, []);

  const handleClose = () => {
    const ann = announcements[current];
    if (ann?.showOnce) addDismissed(ann.id);

    if (current < announcements.length - 1) {
      setCurrent((p) => p + 1);
    } else {
      setOpen(false);
    }
  };

  if (!open || announcements.length === 0) return null;

  const ann = announcements[current];
  const cfg = typeConfig[ann.type] || typeConfig.info;
  const Icon = cfg.icon;

  return (
    <Dialog open={open} onOpenChange={() => handleClose()}>
      <DialogContent className="max-w-sm mx-4 rounded-2xl" dir="rtl">
        <button
          onClick={handleClose}
          className="absolute left-4 top-4 rounded-full p-1 hover:bg-muted transition-colors"
        >
          <X size={16} className="text-muted-foreground" />
        </button>

        <DialogHeader className="text-right">
          <div className={`w-12 h-12 rounded-2xl ${cfg.bg} ${cfg.border} border flex items-center justify-center mb-3`}>
            <Icon size={22} className={cfg.color} />
          </div>
          <div className="flex items-center gap-2 mb-1">
            <DialogTitle className="text-base font-bold">{ann.title}</DialogTitle>
            <Badge className={`text-xs ${cfg.badge} border-0`}>{cfg.label}</Badge>
          </div>
          <DialogDescription className="text-sm text-muted-foreground leading-relaxed text-right">
            {ann.description}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2 mt-2">
          {ann.buttonText && ann.buttonUrl && (
            <a href={ann.buttonUrl} target="_blank" rel="noreferrer">
              <Button size="sm" className="w-full">{ann.buttonText}</Button>
            </a>
          )}
          <Button variant="outline" size="sm" onClick={handleClose} className="w-full">
            {current < announcements.length - 1 ? "التالي" : "فهمت"}
          </Button>
        </div>

        {announcements.length > 1 && (
          <div className="flex justify-center gap-1 mt-1">
            {announcements.map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${i === current ? "bg-primary" : "bg-muted-foreground/30"}`}
              />
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

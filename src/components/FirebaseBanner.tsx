import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function FirebaseBanner() {
  return (
    <Alert className="bg-amber-50 border-amber-200 mb-4">
      <AlertTriangle size={16} className="text-amber-600" />
      <AlertDescription className="text-amber-800 text-sm">
        لإعداد قاعدة البيانات، يرجى إضافة Firebase Config في ملف{" "}
        <code className="bg-amber-100 px-1 rounded text-xs font-mono">src/lib/firebase.ts</code>
        {" "}ثم إعادة تشغيل التطبيق.
      </AlertDescription>
    </Alert>
  );
}

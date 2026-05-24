import { AlertCircle } from "lucide-react";

export default function BetaBanner() {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-5 flex items-start gap-2">
      <AlertCircle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
      <p className="text-xs text-amber-700 leading-relaxed">
        هذه المنصة حالياً في مرحلة تجريبية، وقد تحتوي بعض البيانات على أخطاء أو معلومات غير مكتملة.
        جميع النتائج للإرشاد فقط، ويجب مراجعة الموقع الرسمي للجامعة أو برنامج الابتعاث قبل اتخاذ أي قرار أو التقديم.
      </p>
    </div>
  );
}

import { useState } from "react";
import { MailCheck, RefreshCw, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export default function EmailVerificationBanner() {
  const { currentUser, emailVerified, resendVerification, refreshUser } = useAuth();
  const [sent, setSent] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!currentUser || emailVerified || dismissed) return null;

  const handleResend = async () => {
    setLoading(true);
    try {
      await resendVerification();
      setSent(true);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await refreshUser();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Alert className="bg-amber-50 border-amber-200 mb-4 flex items-center gap-3">
      <MailCheck size={16} className="text-amber-600 flex-shrink-0" />
      <AlertDescription className="flex-1 text-amber-800 text-sm">
        {sent
          ? "تم إرسال رسالة التحقق — تحقق من بريدك الإلكتروني."
          : "لم يتم تفعيل بريدك الإلكتروني بعد. يرجى فتح رسالة التحقق."}
      </AlertDescription>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Button
          variant="outline"
          size="sm"
          className="border-amber-300 text-amber-700 hover:bg-amber-100 h-7 text-xs"
          onClick={handleRefresh}
          disabled={loading}
          data-testid="button-refresh-verification"
        >
          <RefreshCw size={12} className="ml-1" />
          تحقق
        </Button>
        {!sent && (
          <Button
            variant="outline"
            size="sm"
            className="border-amber-300 text-amber-700 hover:bg-amber-100 h-7 text-xs"
            onClick={handleResend}
            disabled={loading}
            data-testid="button-resend-verification"
          >
            إعادة إرسال
          </Button>
        )}
        <button
          onClick={() => setDismissed(true)}
          className="text-amber-500 hover:text-amber-700 transition-colors"
        >
          <X size={14} />
        </button>
      </div>
    </Alert>
  );
}

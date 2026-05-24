import { useState, useRef } from "react";
import { Upload, FileText, CheckCircle2, XCircle, AlertCircle, Database, Eye, Save, Trash2, RefreshCw } from "lucide-react";
import Layout from "@/components/Layout";
import { bulkSaveUniversities, type University } from "@/lib/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

type ParsedRow = Partial<Omit<University, "id">> & { _errors?: string[]; _rowIndex?: number };

const REQUIRED_FIELDS = ["nameAr", "country", "city", "type"] as const;
const ALL_FIELDS: Array<{ key: keyof Omit<University, "id">; label: string }> = [
  { key: "nameAr", label: "الاسم بالعربي *" },
  { key: "nameEn", label: "الاسم بالإنجليزي" },
  { key: "country", label: "الدولة *" },
  { key: "city", label: "المدينة *" },
  { key: "type", label: "النوع (local/international) *" },
  { key: "majors", label: "التخصصات (مفصولة بفاصلة)" },
  { key: "websiteUrl", label: "الموقع الرسمي" },
  { key: "admissionUrl", label: "رابط القبول" },
  { key: "needsReview", label: "يحتاج مراجعة (true/false)" },
  { key: "dataConfidence", label: "مستوى الثقة" },
  { key: "suitableForSaudiScholarship", label: "مناسبة للابتعاث (true/false)" },
  { key: "admissionNotes", label: "ملاحظات القبول" },
];

function str(v?: string): string { return v?.trim() ?? ""; }

function validateRow(row: Record<string, string>, index: number): ParsedRow {
  const errors: string[] = [];

  for (const field of REQUIRED_FIELDS) {
    if (!row[field]?.trim()) errors.push(`${field} مطلوب`);
  }

  const type = row.type?.trim();
  if (type && type !== "local" && type !== "international") {
    errors.push(`النوع يجب أن يكون "local" أو "international"`);
  }

  const websiteUrl = str(row.websiteUrl) || str(row.officialWebsite) || str(row.website) || "";
  const admissionUrl = str(row.admissionUrl) || str(row.admissionPage) || str(row.admissionsUrl) || "";

  const parsed: ParsedRow = {
    nameAr: str(row.nameAr),
    nameEn: str(row.nameEn),
    country: str(row.country),
    city: str(row.city),
    type: (type === "local" || type === "international") ? type : "international",
    majors: row.majors ? row.majors.split(",").map((m) => m.trim()).filter(Boolean) : [],
    needsReview: str(row.needsReview).toLowerCase() !== "false",
    dataConfidence: (str(row.dataConfidence) as any) || "needs_review",
    suitableForSaudiScholarship: str(row.suitableForSaudiScholarship).toLowerCase() === "true",
    _errors: errors,
    _rowIndex: index,
  };

  if (websiteUrl) parsed.websiteUrl = websiteUrl;
  if (admissionUrl) parsed.admissionUrl = admissionUrl;
  const notes = str(row.admissionNotes) || str(row.notes);
  if (notes) parsed.admissionNotes = notes;
  const acceptance = str(row.acceptanceRate);
  if (acceptance) parsed.acceptanceRate = acceptance;

  return parsed;
}

function parseCSV(text: string): ParsedRow[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  return lines.slice(1).map((line, i) => {
    const values = line.match(/(?:"[^"]*"|[^,])*(?:,|$)/g)?.map((v) => v.replace(/,$/, "").replace(/^"|"$/g, "").trim()) ?? [];
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => { row[h] = values[idx] ?? ""; });
    return validateRow(row, i + 2);
  }).filter((r) => r.nameAr || Object.values(r).some((v) => v));
}

function parseJSON(text: string): ParsedRow[] {
  try {
    const data = JSON.parse(text);
    const arr = Array.isArray(data) ? data : [data];
    return arr.map((row: Record<string, any>, i) => {
      const str: Record<string, string> = {};
      for (const [k, v] of Object.entries(row)) {
        str[k] = Array.isArray(v) ? v.join(",") : String(v ?? "");
      }
      return validateRow(str, i + 1);
    });
  } catch {
    return [];
  }
}

const CSV_TEMPLATE = `nameAr,nameEn,country,city,type,majors,websiteUrl,admissionUrl,needsReview,dataConfidence,suitableForSaudiScholarship,admissionNotes
جامعة مثال,Example University,المملكة العربية السعودية,الرياض,local,"هندسة,طب",https://example.edu,https://example.edu/admissions,true,needs_review,true,
`;

export default function AdminImporterPage() {
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<{ count: number; failed: number } | null>(null);
  const [tab, setTab] = useState<"import" | "template">("import");
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFile = (file: File) => {
    setFileName(file.name);
    setSaved(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      let parsed: ParsedRow[] = [];
      if (file.name.endsWith(".json")) {
        parsed = parseJSON(text);
      } else {
        parsed = parseCSV(text);
      }
      setRows(parsed);
      if (parsed.length === 0) {
        toast({ title: "لم يتم العثور على بيانات", description: "تأكد من تنسيق الملف", variant: "destructive" });
      } else {
        toast({ title: `تم قراءة ${parsed.length} صف`, description: "راجع البيانات قبل الحفظ" });
      }
    };
    reader.readAsText(file, "UTF-8");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleSave = async () => {
    const validRows = rows.filter((r) => !r._errors?.length);
    if (validRows.length === 0) {
      toast({ title: "لا توجد صفوف صالحة للحفظ", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const toSave = validRows.map(({ _errors: _e, _rowIndex: _r, ...rest }) => rest as Omit<University, "id">);
      const result = await bulkSaveUniversities(toSave);
      setSaved({ count: result?.saved ?? validRows.length, failed: result?.failed ?? 0 });
      toast({ title: `✓ تم حفظ ${result?.saved ?? validRows.length} جامعة في Firestore` });
      setRows([]);
      setFileName("");
    } catch {
      toast({ title: "خطأ في الحفظ", description: "تأكد من اتصال Firebase", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const validCount = rows.filter((r) => !r._errors?.length).length;
  const errorCount = rows.filter((r) => r._errors?.length).length;

  return (
    <Layout title="استيراد الجامعات">
      <div className="p-6 max-w-5xl mx-auto" dir="rtl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-sidebar flex items-center justify-center">
            <Upload size={24} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">استيراد الجامعات إلى Firestore</h2>
            <p className="text-sm text-muted-foreground">رفع ملف CSV أو JSON → معاينة → حفظ في قاعدة البيانات</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { key: "import", label: "استيراد ملف" },
            { key: "template", label: "نموذج CSV" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key as "import" | "template")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"}`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "template" && (
          <Card className="mb-6 border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText size={15} className="text-primary" />
                نموذج CSV جاهز للتعبئة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-3">انسخ هذا النموذج في ملف CSV وعبّئ بيانات الجامعات:</p>
              <pre className="bg-muted rounded-lg p-3 text-xs font-mono overflow-x-auto whitespace-pre" dir="ltr">
                {CSV_TEMPLATE}
              </pre>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {ALL_FIELDS.map((f) => (
                  <div key={f.key} className="flex items-center gap-2 text-xs">
                    <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-primary">{f.key}</span>
                    <span className="text-muted-foreground">{f.label}</span>
                  </div>
                ))}
              </div>
              <Alert className="mt-4 bg-amber-50 border-amber-200">
                <AlertCircle size={14} className="text-amber-500" />
                <AlertDescription className="text-xs text-amber-700">
                  حقول مطلوبة: <strong>nameAr, country, city, type</strong>. باقي الحقول اختيارية.
                  أي جامعة بدون معلومات كاملة ستُضاف بـ <code>needsReview = true</code>.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}

        {tab === "import" && (
          <>
            {/* Drop zone */}
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-primary/30 rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer hover:bg-accent/20 transition-colors mb-6"
            >
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <Upload size={24} className="text-primary" />
              </div>
              <p className="font-medium text-foreground mb-1">اسحب ملف CSV أو JSON هنا</p>
              <p className="text-sm text-muted-foreground">أو انقر للاختيار من جهازك</p>
              {fileName && (
                <div className="mt-3 flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-1.5">
                  <FileText size={14} className="text-green-600" />
                  <span className="text-sm text-green-700 font-medium">{fileName}</span>
                </div>
              )}
              <input
                ref={fileRef}
                type="file"
                accept=".csv,.json"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
              />
            </div>

            {/* Success message */}
            {saved && (
              <Alert className="mb-6 bg-green-50 border-green-200">
                <CheckCircle2 size={15} className="text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>تم الحفظ في Firestore:</strong> {saved.count} جامعة بنجاح
                  {saved.failed > 0 && ` — ${saved.failed} فشل`}
                </AlertDescription>
              </Alert>
            )}

            {/* Preview */}
            {rows.length > 0 && (
              <Card className="border-border">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Eye size={15} className="text-primary" />
                      معاينة البيانات — {rows.length} صف
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-100 text-green-700 border-green-200">{validCount} صالح</Badge>
                      {errorCount > 0 && <Badge className="bg-red-100 text-red-700 border-red-200">{errorCount} به أخطاء</Badge>}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto rounded-lg border border-border mb-4">
                    <table className="w-full border-collapse text-xs" dir="rtl">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="px-3 py-2 text-right font-medium border-b">#</th>
                          <th className="px-3 py-2 text-right font-medium border-b">الاسم العربي</th>
                          <th className="px-3 py-2 text-right font-medium border-b">الدولة</th>
                          <th className="px-3 py-2 text-right font-medium border-b">النوع</th>
                          <th className="px-3 py-2 text-right font-medium border-b">التخصصات</th>
                          <th className="px-3 py-2 text-right font-medium border-b">الحالة</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row, i) => {
                          const hasErrors = (row._errors?.length ?? 0) > 0;
                          return (
                            <tr key={i} className={`border-b last:border-0 ${hasErrors ? "bg-red-50" : "hover:bg-muted/20"}`}>
                              <td className="px-3 py-2 text-muted-foreground">{row._rowIndex ?? i + 1}</td>
                              <td className="px-3 py-2 font-medium">{row.nameAr || <span className="text-red-500">—</span>}</td>
                              <td className="px-3 py-2">{row.country || "—"}</td>
                              <td className="px-3 py-2">
                                <span className={`px-1.5 py-0.5 rounded text-xs ${row.type === "local" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
                                  {row.type === "local" ? "محلية" : "دولية"}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-muted-foreground">
                                {Array.isArray(row.majors) ? row.majors.slice(0, 2).join("، ") + (row.majors.length > 2 ? "..." : "") : "—"}
                              </td>
                              <td className="px-3 py-2">
                                {hasErrors ? (
                                  <div>
                                    <XCircle size={13} className="text-red-500 inline ml-1" />
                                    <span className="text-red-600">{row._errors!.join(" | ")}</span>
                                  </div>
                                ) : (
                                  <CheckCircle2 size={13} className="text-green-500" />
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={handleSave}
                      disabled={saving || validCount === 0}
                      className="flex-1"
                    >
                      {saving ? (
                        <><RefreshCw size={15} className="ml-2 animate-spin" />جاري الحفظ...</>
                      ) : (
                        <><Database size={15} className="ml-2" />حفظ {validCount} جامعة في Firestore</>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => { setRows([]); setFileName(""); setSaved(null); }}
                    >
                      <Trash2 size={15} className="ml-1" />مسح
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}

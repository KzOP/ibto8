import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Building2, Search, MapPin, CheckCircle2, ChevronLeft, SlidersHorizontal, X } from "lucide-react";
import Layout from "@/components/Layout";
import { getUniversities, type University } from "@/lib/firestore";
import { seedIfEmpty } from "@/lib/seed";
import { parseMajors } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import FirebaseBanner from "@/components/FirebaseBanner";
import BetaBanner from "@/components/BetaBanner";

const confidenceLabel: Record<string, { label: string; color: string }> = {
  high: { label: "موثّق", color: "bg-green-100 text-green-700" },
  medium: { label: "متوسط", color: "bg-amber-100 text-amber-700" },
  low: { label: "يحتاج مراجعة", color: "bg-red-100 text-red-700" },
  unverified: { label: "غير موثّق", color: "bg-gray-100 text-gray-700" },
};

export default function UniversitiesPage() {
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [scholarFilter, setScholarFilter] = useState("all");
  const [countryFilter, setCountryFilter] = useState("all");
  const [majorFilter, setMajorFilter] = useState("all");

  useEffect(() => {
    const load = async () => {
      try {
        await seedIfEmpty();
        const data = await getUniversities();
        setUniversities(data ?? []);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const countries = ["all", ...Array.from(new Set(universities.map((u) => u.country).filter(Boolean)))];
  const allMajors = Array.from(
    new Set(universities.flatMap((u) => parseMajors(u.majors)).filter(Boolean))
  ).sort();

  const filtered = universities.filter((u) => {
    const uMajors = parseMajors(u.majors);
    const matchSearch = !search ||
      u.nameAr.toLowerCase().includes(search.toLowerCase()) ||
      (u.nameEn ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (u.country ?? "").includes(search) ||
      (u.city ?? "").includes(search);
    const matchType = typeFilter === "all" || u.type === typeFilter;
    const matchScholar = scholarFilter === "all" ||
      (scholarFilter === "yes" && u.suitableForSaudiScholarship) ||
      (scholarFilter === "no" && !u.suitableForSaudiScholarship);
    const matchCountry = countryFilter === "all" || u.country === countryFilter;
    const matchMajor = majorFilter === "all" || uMajors.some((m) => m.toLowerCase().includes(majorFilter.toLowerCase()));
    return matchSearch && matchType && matchScholar && matchCountry && matchMajor;
  });

  const hasFilters = typeFilter !== "all" || scholarFilter !== "all" || countryFilter !== "all" || majorFilter !== "all" || search;

  const clearFilters = () => {
    setSearch("");
    setTypeFilter("all");
    setScholarFilter("all");
    setCountryFilter("all");
    setMajorFilter("all");
  };

  return (
    <Layout title="الجامعات">
      <div className="p-6 max-w-6xl mx-auto">
        {error && <FirebaseBanner />}
        <BetaBanner />

        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-foreground">استكشاف الجامعات</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {loading ? "جاري التحميل..." : `${universities.length} جامعة — يظهر ${filtered.length}`}
            </p>
          </div>
          {hasFilters && (
            <Button variant="outline" size="sm" onClick={clearFilters} className="flex items-center gap-1.5 text-xs">
              <X size={13} />
              مسح الفلاتر
            </Button>
          )}
        </div>

        <div className="bg-muted/40 border border-border rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-3 text-sm font-medium text-foreground">
            <SlidersHorizontal size={15} className="text-primary" />
            بحث وتصفية
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="relative sm:col-span-2 lg:col-span-2">
              <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="ابحث بالاسم، الدولة أو المدينة..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-9 h-9 text-sm"
                data-testid="input-search-universities"
              />
            </div>

            <Select value={countryFilter} onValueChange={setCountryFilter}>
              <SelectTrigger className="h-9 text-sm" data-testid="select-country-filter">
                <SelectValue placeholder="الدولة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الدول</SelectItem>
                {countries.filter((c) => c !== "all").map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-9 text-sm" data-testid="select-type-filter">
                <SelectValue placeholder="النوع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">محلية ودولية</SelectItem>
                <SelectItem value="local">محلية فقط</SelectItem>
                <SelectItem value="international">دولية فقط</SelectItem>
              </SelectContent>
            </Select>

            <Select value={scholarFilter} onValueChange={setScholarFilter}>
              <SelectTrigger className="h-9 text-sm" data-testid="select-scholarship-filter">
                <SelectValue placeholder="الابتعاث" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                <SelectItem value="yes">مناسبة للابتعاث السعودي</SelectItem>
                <SelectItem value="no">غير مدرجة للابتعاث</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {allMajors.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-muted-foreground mb-2">تصفية بالتخصص:</p>
              <div className="flex gap-2 overflow-x-auto pb-1.5" style={{ scrollbarWidth: "thin" }}>
                {["all", ...allMajors].map((m) => (
                  <button
                    key={m}
                    onClick={() => setMajorFilter(m)}
                    data-testid={m === "all" ? "pill-major-all" : undefined}
                    className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full border transition-colors whitespace-nowrap ${
                      majorFilter === m
                        ? "bg-primary text-white border-primary"
                        : "bg-background text-muted-foreground border-border hover:bg-accent"
                    }`}
                  >
                    {m === "all" ? "كل التخصصات" : m}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="border-border">
                <CardContent className="pt-5">
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2 mb-4" />
                  <Skeleton className="h-3 w-full mb-2" />
                  <Skeleton className="h-3 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Building2 size={40} className="text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">لا توجد جامعات تطابق البحث</p>
            <p className="text-sm text-muted-foreground/70 mt-1">جرّب تغيير كلمة البحث أو الفلاتر</p>
            {hasFilters && (
              <Button variant="outline" size="sm" onClick={clearFilters} className="mt-4 text-xs">
                مسح جميع الفلاتر
              </Button>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((uni) => {
              const conf = confidenceLabel[uni.dataConfidence ?? "unverified"] ?? confidenceLabel["unverified"];
              return (
                <Link key={uni.id} href={`/universities/${uni.id}`}>
                  <Card className="border-border hover:shadow-md hover:border-primary/30 transition-all cursor-pointer h-full" data-testid={`card-university-${uni.id}`}>
                    <CardContent className="pt-5 pb-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center flex-shrink-0">
                          <Building2 size={18} className="text-primary" />
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${conf.color}`}>{conf.label}</span>
                      </div>
                      <h3 className="font-semibold text-foreground text-sm leading-snug mb-1">{uni.nameAr}</h3>
                      <p className="text-xs text-muted-foreground mb-3 dir-ltr">{uni.nameEn}</p>

                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                        <MapPin size={12} />
                        <span>{uni.city}، {uni.country}</span>
                      </div>

                      <div className="flex flex-wrap gap-1.5 mb-3">
                        <Badge variant="secondary" className="text-xs">
                          {uni.type === "local" ? "محلية" : "دولية"}
                        </Badge>
                        {uni.suitableForSaudiScholarship && (
                          <Badge className="text-xs bg-teal-100 text-teal-700 hover:bg-teal-100">
                            <CheckCircle2 size={10} className="ml-1" />
                            ابتعاث
                          </Badge>
                        )}
                        {uni.needsReview && (
                          <Badge variant="outline" className="text-xs text-amber-600 border-amber-200">
                            يحتاج مراجعة
                          </Badge>
                        )}
                      </div>

                      {(() => {
                        const majors = parseMajors(uni.majors);
                        return majors.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {majors.slice(0, 4).map((m, i) => (
                              <Badge key={i} variant="outline" className="text-xs font-normal px-2 py-0.5 h-auto border-border text-muted-foreground">
                                {m}
                              </Badge>
                            ))}
                            {majors.length > 4 && (
                              <Badge variant="outline" className="text-xs font-normal px-2 py-0.5 h-auto border-border text-muted-foreground">
                                +{majors.length - 4}
                              </Badge>
                            )}
                          </div>
                        ) : null;
                      })()}

                      <div className="flex items-center justify-end mt-3">
                        <span className="text-xs text-primary font-medium flex items-center gap-0.5">
                          عرض التفاصيل <ChevronLeft size={12} />
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}

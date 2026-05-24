import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc,
  deleteDoc, query, where, addDoc, serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";

export interface University {
  id?: string;
  nameAr: string;
  nameEn: string;
  country: string;
  city: string;
  type: "local" | "international";
  logoUrl?: string;
  imageUrl?: string;
  websiteUrl?: string;
  admissionUrl?: string;
  requirementsUrl?: string;
  majorsUrl?: string;
  majors: string[];
  languageRequirements?: Record<string, any>;
  satRequired?: "required" | "optional" | "not_required";
  actRequired?: "required" | "optional" | "not_required";
  minHighSchoolGpa?: number;
  acceptanceRate?: string;
  suitableForSaudiScholarship: boolean;
  scholarshipPrograms?: string[];
  weightedFormula?: Record<string, any>;
  admissionNotes?: string;
  lastUpdatedAt?: any;
  lastVerifiedAt?: any;
  sourceLinks?: string[];
  dataConfidence?: "confirmed" | "high" | "medium" | "low" | "unverified";
  needsReview?: boolean;
}

export interface ScholarshipTrack {
  nameAr: string;
  nameEn?: string;
  description?: string;
  requirements?: string[];
  notes?: string;
  officialLink?: string;
  targetLevel?: string;
  needsReview?: boolean;
}

export interface ScholarshipProgram {
  id?: string;
  nameAr: string;
  nameEn?: string;
  provider: string;
  description?: string;
  requirements?: string[];
  tracks?: ScholarshipTrack[];
  allowedCountries?: string[];
  allowedMajors?: string[];
  maxAge?: string;
  minGpa?: string;
  languageRequirement?: string;
  approvedUniversities?: string[];
  officialUrl?: string;
  applicationUrl?: string;
  applicationDeadline?: any;
  requiresUniversityAdmission: boolean;
  requiresLanguageTest: boolean;
  requiresSAT: boolean;
  isActive?: boolean;
  notes?: string;
  needsReview?: boolean;
  lastVerifiedAt?: string;
}

export interface LanguageTest {
  type: string;
  customName?: string;
  score: number;
  date?: string;
}

export interface InternationalTest {
  type: string;
  customName?: string;
  score: string;
  date?: string;
}

export interface StudentGrades {
  highSchoolGpa?: number;
  qudoratScore?: number;
  tahsiliScore?: number;
  stepScore?: number;
}

export interface StudentProfile {
  uid: string;
  name?: string;
  email?: string;
  phoneNumber?: string;
  country?: string;
  city?: string;
  graduationYear?: string;
  educationLevel?: string;
  grades?: StudentGrades;
  tests?: LanguageTest[];
  internationalTests?: InternationalTest[];
  emailVerified?: boolean;
  createdAt?: any;
  updatedAt?: any;
}

export interface UpdateRequest {
  id?: string;
  universityId: string;
  universityName: string;
  status: "pending" | "approved" | "rejected";
  suggestedData: any;
  sourceUrls: string[];
  createdAt: any;
  reviewedAt?: any;
  confidence: number;
}

function isPlainObject(val: unknown): val is Record<string, unknown> {
  return val !== null && typeof val === "object" && !Array.isArray(val) &&
    (val as any).constructor === Object;
}

function removeUndefined(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      result[key] = value.filter((v) => v !== undefined);
    } else if (isPlainObject(value)) {
      result[key] = removeUndefined(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

const safeCall = async <T>(fn: () => Promise<T>): Promise<T | null> => {
  try {
    return await fn();
  } catch (err) {
    console.error("Firestore error:", err);
    throw new Error("لإعداد قاعدة البيانات، يرجى إضافة Firebase Config في ملف src/lib/firebase.ts");
  }
};

export const getUniversities = async (_filters?: any) =>
  safeCall(async () => {
    const snapshot = await getDocs(query(collection(db, "universities")));
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as University));
  });

export const getUniversity = async (id: string) =>
  safeCall(async () => {
    const snap = await getDoc(doc(db, "universities", id));
    return snap.exists() ? ({ id: snap.id, ...snap.data() } as University) : null;
  });

export const createUniversity = async (data: University) =>
  safeCall(async () => {
    const ref = await addDoc(collection(db, "universities"), {
      ...data,
      lastUpdatedAt: serverTimestamp(),
    });
    return ref.id;
  });

export const updateUniversity = async (id: string, data: Partial<University>) =>
  safeCall(async () => {
    await updateDoc(doc(db, "universities", id), {
      ...data,
      lastUpdatedAt: serverTimestamp(),
    });
    return true;
  });

export const deleteUniversity = async (id: string) =>
  safeCall(async () => {
    await deleteDoc(doc(db, "universities", id));
    return true;
  });

export const getScholarshipPrograms = async () =>
  safeCall(async () => {
    const snapshot = await getDocs(collection(db, "scholarship_programs"));
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as ScholarshipProgram));
  });

export const createScholarshipProgram = async (data: ScholarshipProgram) =>
  safeCall(async () => {
    const ref = await addDoc(collection(db, "scholarship_programs"), data);
    return ref.id;
  });

export const updateScholarshipProgram = async (id: string, data: Partial<ScholarshipProgram>) =>
  safeCall(async () => {
    await updateDoc(doc(db, "scholarship_programs", id), data);
    return true;
  });

export const deleteScholarshipProgram = async (id: string) =>
  safeCall(async () => {
    await deleteDoc(doc(db, "scholarship_programs", id));
    return true;
  });

export const getStudentProfile = async (uid: string) =>
  safeCall(async () => {
    const snap = await getDoc(doc(db, "student_profiles", uid));
    return snap.exists() ? (snap.data() as StudentProfile) : null;
  });

export const createStudentProfile = async (uid: string, data: Partial<StudentProfile>) =>
  safeCall(async () => {
    await setDoc(doc(db, "student_profiles", uid), {
      uid,
      grades: {},
      tests: [],
      internationalTests: {},
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return true;
  });

export const saveStudentProfile = async (uid: string, data: Partial<StudentProfile>) =>
  safeCall(async () => {
    await setDoc(
      doc(db, "student_profiles", uid),
      { uid, ...data, updatedAt: serverTimestamp() },
      { merge: true }
    );
    return true;
  });

export const getUpdateRequests = async () =>
  safeCall(async () => {
    const snapshot = await getDocs(
      query(collection(db, "university_update_requests"), where("status", "==", "pending"))
    );
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as UpdateRequest));
  });

export const approveUpdateRequest = async (requestId: string) =>
  safeCall(async () => {
    const snap = await getDoc(doc(db, "university_update_requests", requestId));
    if (snap.exists()) {
      const data = snap.data() as UpdateRequest;
      await updateUniversity(data.universityId, data.suggestedData);
      await updateDoc(doc(db, "university_update_requests", requestId), {
        status: "approved",
        reviewedAt: serverTimestamp(),
      });
    }
    return true;
  });

export const rejectUpdateRequest = async (requestId: string) =>
  safeCall(async () => {
    await updateDoc(doc(db, "university_update_requests", requestId), {
      status: "rejected",
      reviewedAt: serverTimestamp(),
    });
    return true;
  });

export const bulkSaveUniversities = async (universities: Omit<University, "id">[]) =>
  safeCall(async () => {
    const results = await Promise.allSettled(
      universities.map((u) => {
        const clean = removeUndefined({
          ...u,
          needsReview: u.needsReview ?? true,
          dataConfidence: u.dataConfidence ?? "needs_review",
          majors: u.majors ?? [],
          suitableForSaudiScholarship: u.suitableForSaudiScholarship ?? false,
          lastUpdatedAt: serverTimestamp(),
        });
        return addDoc(collection(db, "universities"), clean);
      })
    );
    const saved = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;
    return { saved, failed };
  });

export const clearAndReseedAll = async (
  universities: University[],
  scholarships: ScholarshipProgram[]
) =>
  safeCall(async () => {
    const uniSnap = await getDocs(collection(db, "universities"));
    const schSnap = await getDocs(collection(db, "scholarship_programs"));
    const delUni = uniSnap.docs.map((d) => deleteDoc(d.ref));
    const delSch = schSnap.docs.map((d) => deleteDoc(d.ref));
    await Promise.all([...delUni, ...delSch]);
    const addUni = universities.map((u) => addDoc(collection(db, "universities"), { ...u, lastUpdatedAt: serverTimestamp() }));
    const addSch = scholarships.map((s) => addDoc(collection(db, "scholarship_programs"), s));
    await Promise.all([...addUni, ...addSch]);
    return true;
  });

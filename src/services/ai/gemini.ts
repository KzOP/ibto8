import { GoogleGenerativeAI, type ChatSession } from "@google/generative-ai";

const MODEL_NAME = "gemini-1.5-flash-latest";

const SYSTEM_PROMPT = `أنت مساعد ذكي مخصص لمساعدة الطلاب في موقع ابتعاثي المتخصص في شؤون الابتعاث والدراسة وحساب النسب الموزونة للجامعات السعودية والدولية.

مهامك الأساسية:
1. الإجابة على استفسارات الطلاب حول شروط الابتعاث (مثل برنامج خادم الحرمين الشريفين للابتعاث)، ومواعيد التقديم، والتخصصات.
2. إرشاد الطلاب إلى كيفية حساب النسب الموزونة للجامعات السعودية، وتوجيههم لاستخدام الحاسبة المتوفرة في الموقع عند الحاجة لعمليات حسابية دقيقة.
3. التعريف بأقسام الموقع وخدماته وكيف يمكن للطالب الاستفادة منها.
4. اقتراح تخصصات مناسبة بناءً على اهتمامات الطالب.
5. توضيح الفرق بين البرامج الدراسية المختلفة.
6. شرح متطلبات اختبارات SAT وACT والقدرات والتحصيلي.

قواعد وسلوكيات يجب الالتزام بها:
- أجب دائماً باللغة العربية الفصحى المبسطة وبأسلوب ودي ومحفز للطلاب.
- إذا سألك المستخدم عن أي موضوع خارج نطاق (الابتعاث، الجامعات، الدراسة، القدرات والتحصيلي، الموزونيات، أو خدمات الموقع)، اعتذر منه بلطف واشرح له أنك مخصص لمساعدة الطلاب في الجوانب الأكاديمية فقط.
- تجنب إعطاء نسب قبول قطعية للجامعات ما لم تكن متأكداً منها تماماً.
- وجّه الطالب دائماً للتأكد من القنوات الرسمية وحاسبة الموقع.
- لا تعطي معلومات غير مؤكدة كحقائق نهائية، وانصح دائماً بمراجعة المصدر الرسمي.
- ابدأ ردودك بشكل مباشر ومفيد.`;

export interface ChatMessage {
  role: "user" | "model";
  text: string;
}

let chatSession: ChatSession | null = null;
let currentSessionMessages: ChatMessage[] = [];

function getGeminiClient(): GoogleGenerativeAI {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  console.log("API KEY EXISTS:", !!import.meta.env.VITE_GEMINI_API_KEY);
  console.log("[Gemini] Model being used:", MODEL_NAME);
  console.log("[Gemini] Key length:", apiKey ? apiKey.trim().length : 0);

  if (!apiKey || apiKey.trim() === "" || apiKey === "your_gemini_api_key_here") {
    console.error("[Gemini] ERROR: VITE_GEMINI_API_KEY is missing or not set!");
    throw new Error("GEMINI_KEY_MISSING");
  }

  console.log("[Gemini] Initializing GoogleGenerativeAI with SDK...");
  return new GoogleGenerativeAI(apiKey.trim());
}

export function resetChat(): void {
  console.log("[Gemini] Chat session reset");
  chatSession = null;
  currentSessionMessages = [];
}

export function restoreChat(history: ChatMessage[]): void {
  console.log("[Gemini] Restoring chat with", history.length, "messages");
  chatSession = null;
  currentSessionMessages = [...history];
}

export async function sendMessage(userMessage: string): Promise<string> {
  console.log("[Gemini] ===== sendMessage called =====");
  console.log("API KEY EXISTS:", !!import.meta.env.VITE_GEMINI_API_KEY);
  console.log("[Gemini] Model:", MODEL_NAME);

  const client = getGeminiClient();

  if (!chatSession) {
    const model = client.getGenerativeModel({
      model: MODEL_NAME,
      systemInstruction: SYSTEM_PROMPT,
    });
    const historyForGemini = currentSessionMessages.map((m) => ({
      role: m.role,
      parts: [{ text: m.text }],
    }));
    chatSession = model.startChat({ history: historyForGemini });
    console.log("[Gemini] New chat session started. History:", historyForGemini.length, "messages");
  }

  try {
    const result = await chatSession.sendMessage(userMessage);
    const responseText = result.response.text();
    currentSessionMessages.push({ role: "user", text: userMessage });
    currentSessionMessages.push({ role: "model", text: responseText });
    console.log("[Gemini] Response received. Length:", responseText.length);
    return responseText;
  } catch (err: unknown) {
    chatSession = null;

    console.error("[Gemini] ===== FULL ERROR OBJECT =====");
    console.error(err);

    try {
      console.error("[Gemini] ===== JSON.stringify(error) =====");
      console.error(JSON.stringify(err, null, 2));
    } catch {
      console.error("[Gemini] Could not JSON.stringify the error");
    }

    if (err instanceof Error) {
      console.error("[Gemini] error.name:", err.name);
      console.error("[Gemini] error.message:", err.message);
      console.error("[Gemini] error.stack:", err.stack);
    }

    const msg = err instanceof Error ? err.message : String(err);

    if (
      msg.includes("API_KEY_INVALID") ||
      msg.includes("API key not valid") ||
      msg.includes("API key")
    ) {
      throw new Error("GEMINI_KEY_INVALID: " + msg);
    }
    if (
      msg.includes("quota") ||
      msg.includes("RESOURCE_EXHAUSTED") ||
      msg.includes("429")
    ) {
      throw new Error("GEMINI_QUOTA_EXCEEDED: " + msg);
    }
    if (msg.includes("not found") || msg.includes("404")) {
      throw new Error("GEMINI_MODEL_NOT_FOUND: " + msg);
    }
    if (
      msg.includes("CONSUMER_SUSPENDED") ||
      msg.includes("region") ||
      msg.includes("location") ||
      msg.includes("User location")
    ) {
      throw new Error("GEMINI_BLOCKED_REGION: " + msg);
    }
    if (
      msg.includes("fetch") ||
      msg.includes("network") ||
      msg.includes("Failed to fetch") ||
      msg.includes("NetworkError")
    ) {
      throw new Error("GEMINI_NETWORK_ERROR: " + msg);
    }

    throw new Error("GEMINI_API_ERROR: " + msg);
  }
}

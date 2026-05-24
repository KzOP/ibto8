import { useState, useRef, useEffect, useCallback } from "react";
import {
  MessageSquare, Bot, Send, RefreshCw, AlertTriangle,
  User, Sparkles, Plus, Trash2, Menu, X, ChevronRight,
} from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { sendMessage, resetChat, restoreChat, type ChatMessage } from "@/services/ai/gemini";
import {
  getUserChats, createChat, appendMessages, deleteChat,
  type AIChat, type AIMessage,
} from "@/services/ai/chatHistory";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const MAX_LENGTH = 500;
const MIN_DELAY_MS = 2000;

const QUICK_SUGGESTIONS = [
  "اقترح لي جامعات مناسبة",
  "ما الفرق بين SAT و ACT؟",
  "كيف أحسب الموزونية؟",
  "ما أفضل تخصصات الهندسة؟",
  "ما شروط الابتعاث؟",
  "كيف أتقدم لبرنامج خادم الحرمين؟",
];

const NO_KEY =
  import.meta.env.VITE_GEMINI_API_KEY === undefined ||
  import.meta.env.VITE_GEMINI_API_KEY === "";

function toUIMessages(msgs: AIMessage[]): ChatMessage[] {
  return msgs.map((m) => ({ role: m.role, text: m.content }));
}

export default function AIChatPage() {
  const { currentUser } = useAuth();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastSentAt, setLastSentAt] = useState(0);

  const [chats, setChats] = useState<AIChat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [activeChatMessages, setActiveChatMessages] = useState<AIMessage[]>([]);
  const [chatsLoading, setChatsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const loadChats = useCallback(async () => {
    if (!currentUser) return;
    setChatsLoading(true);
    try {
      const data = await getUserChats(currentUser.uid);
      setChats(data);
    } finally {
      setChatsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    loadChats();
  }, [loadChats]);

  const startNewChat = () => {
    resetChat();
    setMessages([]);
    setActiveChatId(null);
    setActiveChatMessages([]);
    setError("");
    setInput("");
    setSidebarOpen(false);
  };

  const openChat = (chat: AIChat) => {
    const uiMsgs = toUIMessages(chat.messages);
    restoreChat(uiMsgs);
    setMessages(uiMsgs);
    setActiveChatId(chat.id);
    setActiveChatMessages(chat.messages);
    setError("");
    setInput("");
    setSidebarOpen(false);
  };

  const handleDeleteChat = async (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    try {
      await deleteChat(chatId);
      setChats((prev) => prev.filter((c) => c.id !== chatId));
      if (activeChatId === chatId) startNewChat();
    } catch {
      console.error("[AIChatPage] Failed to delete chat");
    }
  };

  const handleSend = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    if (msg.length > MAX_LENGTH) {
      setError(`الرسالة طويلة جداً (الحد الأقصى ${MAX_LENGTH} حرف)`);
      return;
    }
    const now = Date.now();
    if (now - lastSentAt < MIN_DELAY_MS) {
      setError("يرجى الانتظار لحظة قبل إرسال رسالة أخرى");
      return;
    }

    setError("");
    setInput("");
    setLastSentAt(now);
    setMessages((p) => [...p, { role: "user", text: msg }]);
    setLoading(true);

    try {
      const reply = await sendMessage(msg);
      setMessages((p) => [...p, { role: "model", text: reply }]);

      if (currentUser) {
        if (!activeChatId) {
          const newId = await createChat(currentUser.uid, msg, reply);
          setActiveChatId(newId);
          const newMessages: AIMessage[] = [
            { role: "user", content: msg, timestamp: now },
            { role: "model", content: reply, timestamp: now + 1 },
          ];
          setActiveChatMessages(newMessages);
          setChats((prev) => [
            {
              id: newId,
              userId: currentUser.uid,
              title: msg.length > 40 ? msg.slice(0, 40) + "..." : msg,
              messages: newMessages,
              createdAt: null,
              updatedAt: null,
            },
            ...prev,
          ]);
        } else {
          const updated: AIMessage[] = [
            ...activeChatMessages,
            { role: "user", content: msg, timestamp: now },
            { role: "model", content: reply, timestamp: now + 1 },
          ];
          await appendMessages(activeChatId, msg, reply, activeChatMessages);
          setActiveChatMessages(updated);
          setChats((prev) =>
            prev.map((c) =>
              c.id === activeChatId ? { ...c, messages: updated } : c
            )
          );
        }
      }
    } catch (e: unknown) {
      const msg2 = e instanceof Error ? e.message : "";
      let errText = "حدث خطأ أثناء الاتصال بالمساعد. يرجى المحاولة مرة أخرى.";
      if (msg2 === "GEMINI_KEY_MISSING") {
        errText = "مفتاح Gemini API غير مضبوط. يرجى إضافة VITE_GEMINI_API_KEY في إعدادات البيئة.";
      } else if (msg2 === "GEMINI_KEY_INVALID") {
        errText = "مفتاح Gemini API غير صحيح. تأكد من نسخ المفتاح بشكل صحيح من Google AI Studio.";
      } else if (msg2 === "GEMINI_QUOTA_EXCEEDED") {
        errText = "تجاوزت الحصة المجانية لـ Gemini API. انتظر قليلاً أو استخدم مفتاحاً جديداً من aistudio.google.com";
      } else if (msg2 === "GEMINI_MODEL_NOT_FOUND") {
        errText = "موديل Gemini غير متوفر حالياً. يرجى المحاولة لاحقاً.";
      } else if (msg2 === "GEMINI_BLOCKED_REGION") {
        errText = "خدمة Gemini غير متاحة في منطقتك حالياً. جرّب استخدام VPN أو تواصل مع الدعم.";
      } else if (msg2 === "GEMINI_NETWORK_ERROR") {
        errText = "خطأ في الاتصال بالشبكة. تأكد من اتصالك بالإنترنت وأعد المحاولة.";
      } else if (msg2.startsWith("GEMINI_API_ERROR:")) {
        errText = "خطأ من Gemini: " + msg2.replace("GEMINI_API_ERROR: ", "");
      }
      setError(errText);
      setMessages((p) => p.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Layout title="مساعد AI">
      <div className="flex h-full overflow-hidden" dir="rtl">

        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/30 z-20 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <aside
          className={cn(
            "fixed md:relative top-0 right-0 h-full z-30 md:z-auto",
            "w-64 flex flex-col bg-gray-50 border-l border-border",
            "transition-transform duration-200",
            sidebarOpen ? "translate-x-0" : "translate-x-full md:translate-x-0"
          )}
        >
          <div className="flex items-center justify-between px-3 py-3 border-b border-border bg-white">
            <span className="text-sm font-semibold text-foreground">المحادثات</span>
            <button
              className="md:hidden text-muted-foreground"
              onClick={() => setSidebarOpen(false)}
            >
              <X size={16} />
            </button>
          </div>

          <div className="px-2 py-2 border-b border-border">
            <Button
              onClick={startNewChat}
              size="sm"
              className="w-full text-xs gap-1.5 h-8"
            >
              <Plus size={13} />
              محادثة جديدة
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto py-1">
            {chatsLoading && (
              <div className="flex justify-center py-6">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {!chatsLoading && chats.length === 0 && (
              <p className="text-[11px] text-muted-foreground text-center py-6 px-3">
                لا توجد محادثات سابقة
              </p>
            )}
            {chats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => openChat(chat)}
                className={cn(
                  "group flex items-center gap-1.5 px-2 py-2 mx-1 rounded-lg cursor-pointer text-right",
                  "hover:bg-accent transition-colors",
                  activeChatId === chat.id && "bg-accent border border-primary/20"
                )}
              >
                <MessageSquare
                  size={13}
                  className={cn(
                    "flex-shrink-0 text-muted-foreground",
                    activeChatId === chat.id && "text-primary"
                  )}
                />
                <span className="flex-1 text-[11px] text-foreground truncate leading-relaxed">
                  {chat.title}
                </span>
                <button
                  onClick={(e) => handleDeleteChat(e, chat.id)}
                  className="flex-shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        </aside>

        <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-white flex-shrink-0">
            <div className="flex items-center gap-2">
              <button
                className="md:hidden text-muted-foreground ml-1"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu size={18} />
              </button>
              <div className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center">
                <Bot size={18} className="text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-foreground">مساعد ابتعاثي الذكي</h2>
                  <Badge className="text-[10px] bg-green-100 text-green-700 border-0 hidden sm:flex">
                    <Sparkles size={9} className="ml-0.5" />
                    Gemini
                  </Badge>
                </div>
                <p className="text-[10px] text-muted-foreground hidden sm:block">مساعد الابتعاث والجامعات</p>
              </div>
            </div>

            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={startNewChat}
                className="text-xs text-muted-foreground h-8 gap-1"
              >
                <RefreshCw size={12} />
                <span className="hidden sm:inline">محادثة جديدة</span>
              </Button>
            )}
          </div>

          {NO_KEY && (
            <div className="px-4 pt-3 flex-shrink-0">
              <Alert variant="destructive" className="text-xs">
                <AlertTriangle size={14} />
                <AlertDescription>
                  مفتاح Gemini API غير مضبوط. أضف{" "}
                  <code className="font-mono bg-destructive/20 px-1 rounded">
                    VITE_GEMINI_API_KEY
                  </code>{" "}
                  في إعدادات البيئة.
                </AlertDescription>
              </Alert>
            </div>
          )}

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <div className="w-14 h-14 rounded-full bg-accent mx-auto mb-3 flex items-center justify-center">
                  <Bot size={28} className="text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-1 text-sm">مرحباً! أنا مساعدك الذكي</h3>
                <p className="text-xs text-muted-foreground mb-5 max-w-xs mx-auto leading-relaxed">
                  اسألني عن الجامعات، الابتعاث، الموزونيات، أو التخصصات
                </p>
                <div className="flex flex-wrap gap-2 justify-center max-w-sm mx-auto">
                  {QUICK_SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleSend(s)}
                      disabled={loading}
                      className="text-xs px-3 py-1.5 rounded-full border border-primary/30 text-primary bg-accent/50 hover:bg-accent transition-colors disabled:opacity-50"
                    >
                      {s}
                    </button>
                  ))}
                </div>
                {chats.length > 0 && (
                  <div className="mt-6">
                    <p className="text-xs text-muted-foreground mb-2">محادثاتك الأخيرة</p>
                    <div className="flex flex-col gap-1 max-w-xs mx-auto">
                      {chats.slice(0, 3).map((chat) => (
                        <button
                          key={chat.id}
                          onClick={() => openChat(chat)}
                          className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg border border-border hover:bg-accent transition-colors text-right"
                        >
                          <ChevronRight size={12} className="flex-shrink-0 text-muted-foreground" />
                          <span className="truncate text-foreground">{chat.title}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  "flex gap-2.5",
                  msg.role === "user" ? "justify-start flex-row-reverse" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                    msg.role === "user"
                      ? "bg-primary"
                      : "bg-accent border border-border"
                  )}
                >
                  {msg.role === "user" ? (
                    <User size={13} className="text-white" />
                  ) : (
                    <Bot size={13} className="text-primary" />
                  )}
                </div>
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-sm"
                      : "bg-muted text-foreground rounded-tl-sm"
                  )}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-2.5 justify-start">
                <div className="w-7 h-7 rounded-full bg-accent border border-border flex items-center justify-center flex-shrink-0">
                  <Bot size={13} className="text-primary" />
                </div>
                <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1 items-center">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce"
                      style={{ animationDelay: `${i * 150}ms` }}
                    />
                  ))}
                </div>
              </div>
            )}

            {error && (
              <Alert variant="destructive" className="text-xs">
                <AlertTriangle size={13} />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div ref={bottomRef} />
          </div>

          <div className="border-t border-border bg-white px-4 py-3 flex-shrink-0">
            {messages.length > 0 && (
              <div className="flex gap-1.5 flex-wrap mb-2">
                {QUICK_SUGGESTIONS.slice(0, 3).map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSend(s)}
                    disabled={loading}
                    className="text-[11px] px-2.5 py-1 rounded-full border border-border text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors disabled:opacity-50"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
            <div className="flex gap-2 items-end">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="اكتب سؤالك هنا... (Enter للإرسال)"
                className="resize-none text-sm min-h-[44px] max-h-32 flex-1"
                rows={1}
                maxLength={MAX_LENGTH}
                disabled={loading}
              />
              <Button
                onClick={() => handleSend()}
                disabled={loading || !input.trim()}
                size="icon"
                className="h-11 w-11 flex-shrink-0 rounded-xl"
              >
                <Send size={15} />
              </Button>
            </div>
            {input.length > MAX_LENGTH * 0.8 && (
              <p className="text-[10px] text-muted-foreground mt-1 text-left">
                {input.length}/{MAX_LENGTH}
              </p>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

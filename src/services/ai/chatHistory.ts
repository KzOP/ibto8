import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  doc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface AIMessage {
  role: "user" | "model";
  content: string;
  timestamp: number;
}

export interface AIChat {
  id: string;
  userId: string;
  title: string;
  messages: AIMessage[];
  createdAt: any;
  updatedAt: any;
}

function generateTitle(firstMessage: string): string {
  const trimmed = firstMessage.trim();
  return trimmed.length > 40 ? trimmed.slice(0, 40) + "..." : trimmed;
}

export async function getUserChats(userId: string): Promise<AIChat[]> {
  try {
    const q = query(
      collection(db, "ai_chats"),
      where("userId", "==", userId),
      orderBy("updatedAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as AIChat));
  } catch (err) {
    console.error("[ChatHistory] Error fetching chats:", err);
    return [];
  }
}

export async function createChat(
  userId: string,
  firstMessage: string,
  firstReply: string
): Promise<string> {
  const messages: AIMessage[] = [
    { role: "user", content: firstMessage, timestamp: Date.now() },
    { role: "model", content: firstReply, timestamp: Date.now() + 1 },
  ];
  const docRef = await addDoc(collection(db, "ai_chats"), {
    userId,
    title: generateTitle(firstMessage),
    messages,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  console.log("[ChatHistory] Created chat:", docRef.id);
  return docRef.id;
}

export async function appendMessages(
  chatId: string,
  userMessage: string,
  modelReply: string,
  currentMessages: AIMessage[]
): Promise<void> {
  const updated: AIMessage[] = [
    ...currentMessages,
    { role: "user", content: userMessage, timestamp: Date.now() },
    { role: "model", content: modelReply, timestamp: Date.now() + 1 },
  ];
  await updateDoc(doc(db, "ai_chats", chatId), {
    messages: updated,
    updatedAt: serverTimestamp(),
  });
  console.log("[ChatHistory] Updated chat:", chatId, "messages:", updated.length);
}

export async function deleteChat(chatId: string): Promise<void> {
  await deleteDoc(doc(db, "ai_chats", chatId));
  console.log("[ChatHistory] Deleted chat:", chatId);
}

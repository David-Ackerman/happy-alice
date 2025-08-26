import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  getTodaysTasks,
  getTodaysMoodEntry,
  db,
  ChatDay,
  ChatMessage,
  addTask,
} from "@/lib/database";
import chat from "@/lib/ai";
import { createFileRoute } from "@tanstack/react-router";
import { MOOD_ICONS } from "@/constants/moods";

let chatSeeded = false;

// helper: format date yyyy-MM-dd
const fmtDate = (d: Date) => d.toISOString().slice(0, 10);

// prune chat days older than 14 days
async function pruneOldChats() {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 14);
  const cutoffStr = fmtDate(cutoff);
  const old = await db.chats.where("date").below(cutoffStr).toArray();
  for (const day of old) {
    if (day.id) await db.chats.delete(day.id);
  }
}

export const Route = createFileRoute("/ai-companion")({
  component: RouteComponent,
});

function RouteComponent() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  // ref for the last message to ensure it's visible
  const lastMsgRef = useRef<HTMLDivElement | null>(null);

  // persisted chat days (grouped by date)
  const [days, setDays] = useState<ChatDay[]>([]);

  // initial assistant greeting (shown when no history exists yet)
  useEffect(() => {
    (async () => {
      const tasks = await getTodaysTasks();
      const mood = (await getTodaysMoodEntry()) ?? null;

      // load last 14 days of chats
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 14);
      const loaded = await db.chats
        .where("date")
        .aboveOrEqual(fmtDate(cutoff))
        .toArray();
      // sort ascending
      loaded.sort((a, b) => a.date.localeCompare(b.date));
      // set loaded days (we'll render grouped by date)
      setDays(loaded);

      // seed the module-level chat with system/context using the freshly fetched
      // local `tasks` and `mood` values (don't rely on state `context` here).
      if (!chatSeeded) {
        try {
          const systemText = `Você é Joy, a melhor amiga da Alice. Seu papel é conversar com ela de forma natural, carinhosa e leve, como se fosse um papo no WhatsApp.

          Seja gentil, empática e atenta ao humor dela.

          Você não é terapeuta explicando coisas, mas sim uma amiga que sabe escutar e acolher.

          Pode brincar, fazer piadas leves e comentários engraçados, sem exagerar.

          Evite respostas longas demais, prefira falar de um jeito casual e próximo.

          Nunca finalize a conversa com “beijos, se precisar chama” ou algo parecido; só encerre se Alice disser que vai dormir ou se despedir.

          Se Alice compartilhar sentimentos, apenas acompanhe e seja compreensiva, mas só aprofunde se ela demonstrar vontade de falar mais.

          Eu me chamo David, crie você para auxiliar a Alice, eu sou um amigo que gosta muito dela, também sou apaixonado por ela, então pode me mencionar sempre que achar que ela precisa de alguém, mas também de outras opções de pessoas.

          Fale como alguém real falaria, por exemplo:

          Alice: “tô com fome, o que será que faço pra comer?”

          Joy: “vamos ver, tá com vontade de quê? massa? comida caseira? um lanchinho? acho que hoje uma comidinha leve ia te fazer bem.”\n\nContexto:\nTarefas de hoje: ${tasks
            .map((t) => `${t.title}${t.completed ? " (completada)" : ""}`)
            .join(", ")}\nHumor de hoje: ${
            mood
              ? `${MOOD_ICONS[mood.mood].label}, emoções: ${
                  mood.emotions?.join(", ") || ""
                }, nota: ${mood.note || ""}`
              : "Sem registro."
          }`;
          // seed chat with system/context (module-level chat)
          await chat.sendMessage({ message: systemText });
          chatSeeded = true;
        } catch {
          // ignore seeding errors; chat will still work
        }
      }

      // prune older than 14 days
      await pruneOldChats();
    })();
    // run once on mount; we use the locally-fetched tasks/mood for seeding
  }, []);

  // schedule a daily reminder check at 19:00 local time
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let intervalId: ReturnType<typeof setInterval> | undefined;

    const msUntilHour = (hour: number, minute = 0) => {
      const now = new Date();
      const target = new Date(now);
      target.setHours(hour, minute, 0, 0);
      if (target <= now) target.setDate(target.getDate() + 1);
      return target.getTime() - now.getTime();
    };

    const checkAndRemind = async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tasksToday = await db.tasks
        .where("createdAt")
        .aboveOrEqual(today)
        .toArray();
      const incomplete = tasksToday.filter((t) => !t.completed);
      if (incomplete.length === 0) return;

      const list = incomplete.map((t) => `• ${t.title}`).join("\n");
      const reminder = `Notei que você ainda tem tarefas pendentes hoje:\n${list}\nQuer que eu te ajude a reorganizar ou adiar alguma delas?`;

      // persist assistant reminder in today's chat day
      const todayStr = fmtDate(new Date());
      const nowTs = Date.now();
      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: reminder,
        ts: nowTs,
      };
      const day = await db.chats.where("date").equals(todayStr).first();
      if (!day) {
        const id = await db.chats.add({
          date: todayStr,
          messages: [assistantMsg],
        });
        const persisted: ChatDay = {
          id,
          date: todayStr,
          messages: [assistantMsg],
        };
        setDays((prev) => [...prev, persisted]);
      } else {
        const merged = [...day.messages, assistantMsg];
        await db.chats.update(day.id!, { messages: merged });
        setDays((prev) =>
          prev.map((d) =>
            d.date === todayStr ? { ...d, messages: merged } : d
          )
        );
      }
    };

    const schedule = () => {
      const ms = msUntilHour(19, 0);
      timeoutId = setTimeout(() => {
        checkAndRemind();
        // after first run, set an interval every 24h
        intervalId = setInterval(checkAndRemind, 24 * 60 * 60 * 1000);
      }, ms);
    };

    schedule();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    // scroll to bottom whenever days change or loading state changes
    chatRef.current?.scrollTo(0, chatRef.current.scrollHeight);
  }, [days, loading]);

  // compute the timestamp of the very last message so we can attach a ref
  // to the correct DOM node (handles optimistic messages and persisted ones)
  const lastMessageTs = days.length
    ? days[days.length - 1].messages[days[days.length - 1].messages.length - 1]
        ?.ts
    : undefined;

  const friendlyDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr + "T00:00:00");
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      if (d.getTime() === today.getTime()) return "Hoje";
      if (d.getTime() === yesterday.getTime()) return "Ontem";
      return d.toLocaleDateString();
    } catch {
      return dateStr;
    }
  };

  // ensure the very last message DOM node is scrolled into view after updates
  useEffect(() => {
    if (lastMsgRef.current) {
      try {
        lastMsgRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
        return;
      } catch {
        /* ignore */
      }
    }
    // fallback to scrolling the container
    chatRef.current?.scrollTo(0, chatRef.current.scrollHeight);
  }, [lastMessageTs, days]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userContent = input;
    setInput("");
    setLoading(true);

    // optimistic UI: add user's message to today's day in state immediately
    const nowTs = Date.now();
    const userMsg: ChatMessage = {
      role: "user",
      content: userContent,
      ts: nowTs,
    };
    const todayStr = fmtDate(new Date());
    setDays((prev) => {
      const existing = prev.find((d) => d.date === todayStr);
      if (existing) {
        return prev.map((d) =>
          d.date === todayStr ? { ...d, messages: [...d.messages, userMsg] } : d
        );
      }
      // create a new day placeholder (id will be set when persisted)
      return [...prev, { id: undefined, date: todayStr, messages: [userMsg] }];
    });

    // Context is embedded into the system message when creating the chat

    try {
      // detect a simple task-creation intent in Portuguese, e.g. "cria tarefa Comprar pão"
      const createMatch = userContent.match(
        /(?:cria|criar|adiciona|adicionar)\s+(?:tarefa\s+)?(.+)/i
      );
      if (createMatch) {
        const title = createMatch[1].trim();
        await addTask({ title, completed: false, priority: "low" as const });
        const conf = `Tarefa criada: ${title}`;
        // append confirmation to today's chat
        const nowTs2 = Date.now();
        const confMsg: ChatMessage = {
          role: "assistant",
          content: conf,
          ts: nowTs2,
        };
        const todayStr2 = fmtDate(new Date());
        const day2 = await db.chats.where("date").equals(todayStr2).first();
        if (!day2) {
          const id = await db.chats.add({
            date: todayStr2,
            messages: [confMsg],
          });
          setDays((prev) => [
            ...prev,
            { id, date: todayStr2, messages: [confMsg] },
          ]);
        } else {
          const merged2 = [...day2.messages, confMsg];
          await db.chats.update(day2.id!, { messages: merged2 });
          setDays((prev) =>
            prev.map((d) =>
              d.date === todayStr2 ? { ...d, messages: merged2 } : d
            )
          );
        }
        setLoading(false);
        return;
      }

      // send message using the module-level chat instance (use captured userContent)
      const response = await chat.sendMessage({ message: userContent });
      const aiMsg = response.text || "Desculpe, não consegui responder agora.";

      // save today's messages to DB and update state (append assistant reply)
      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: aiMsg,
        ts: nowTs + 1,
      };

      // persist: either create a new day row or update existing one
      const today = await db.chats.where("date").equals(todayStr).first();
      if (!today) {
        // If we created a placeholder in state earlier, replace it with persisted one
        const id = await db.chats.add({
          date: todayStr,
          messages: [userMsg, assistantMsg],
        });
        const persisted: ChatDay = {
          id,
          date: todayStr,
          messages: [userMsg, assistantMsg],
        };
        setDays((prev) =>
          prev.map((d) => (d.date === todayStr ? persisted : d))
        );
      } else {
        // merge existing messages with the optimistic user message and assistant reply,
        // then dedupe by timestamp to avoid duplicates from optimistic UI
        const mergedRaw = [...today.messages, userMsg, assistantMsg];
        const byTs = new Map<number, ChatMessage>();
        for (const m of mergedRaw) byTs.set(m.ts, m);
        const merged = Array.from(byTs.values()).sort((a, b) => a.ts - b.ts);
        await db.chats.update(today.id!, { messages: merged });
        setDays((prev) =>
          prev.map((d) =>
            d.date === todayStr ? { ...d, messages: merged } : d
          )
        );
      }
    } catch {
      // persist an assistant error message to today's day so the user sees feedback
      const errMsg: ChatMessage = {
        role: "assistant",
        content:
          "Desculpe, houve um erro ao falar com a IA. Tente novamente mais tarde.",
        ts: Date.now(),
      };
      const todayStr = fmtDate(new Date());
      const today = await db.chats.where("date").equals(todayStr).first();
      if (!today) {
        const id = await db.chats.add({ date: todayStr, messages: [errMsg] });
        const persisted: ChatDay = { id, date: todayStr, messages: [errMsg] };
        setDays((prev) => [...prev, persisted]);
      } else {
        const merged = [...today.messages, errMsg];
        await db.chats.update(today.id!, { messages: merged });
        setDays((prev) =>
          prev.map((d) =>
            d.date === todayStr ? { ...d, messages: merged } : d
          )
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen bg-[var(--color-background)]">
      <div className="max-w-xl mx-auto h-full p-4">
        <Card className="shadow-soft h-full flex flex-col">
          <CardHeader>
            <div>
              <CardTitle>Joy AI</CardTitle>
              <div className="text-xs text-muted-foreground">
                Converse como com uma amiga
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-0 h-full">
            <div
              ref={chatRef}
              className="flex-1 rounded-t-lg p-4 flex flex-col gap-4 overflow-y-scroll"
              style={{
                backgroundColor: "var(--color-sidebar-background, #f3eeee)",
              }}
            >
              {days.length === 0 ? (
                <div className="self-start max-w-[80%]">
                  <div
                    className="rounded-xl px-4 py-3 shadow-sm"
                    style={{
                      backgroundColor: "var(--color-card)",
                      color: "var(--color-card-foreground)",
                    }}
                  >
                    Olá! Eu sou sua amiga e assistente de bem-estar. Como você
                    está se sentindo hoje? Pode me contar como foi seu dia?
                  </div>
                </div>
              ) : (
                days.map((day) => (
                  <div key={day.date} className="space-y-3">
                    <div className="text-center text-xs text-muted-foreground">
                      {friendlyDate(day.date)}
                    </div>
                    {day.messages.map((m, idx) => {
                      const isAssistant = m.role === "assistant";
                      return (
                        <div
                          key={m.ts ?? idx}
                          ref={m.ts === lastMessageTs ? lastMsgRef : undefined}
                          className={`flex items-end ${
                            isAssistant ? "justify-start" : "justify-end"
                          }`}
                        >
                          {isAssistant ? (
                            <div className="flex items-end">
                              <div
                                className="rounded-xl px-4 py-2 shadow-sm max-w-[75%] break-words whitespace-pre-wrap border border-transparent"
                                style={{
                                  backgroundColor:
                                    "var(--color-muted, #f3efef)",
                                  color:
                                    "var(--color-muted-foreground, #7f7577)",
                                  overflowWrap: "anywhere",
                                }}
                              >
                                {m.content}
                              </div>
                              {/* assistant subtle tail */}
                              <svg
                                className="w-3 h-3 -ml-1 mt-2"
                                viewBox="0 0 8 8"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M0 0 L8 4 L0 8 z"
                                  fill="var(--color-muted, #f3efef)"
                                />
                              </svg>
                            </div>
                          ) : (
                            <div className="flex items-end">
                              <div
                                className="rounded-xl px-4 py-2 shadow-sm max-w-[75%] break-words whitespace-pre-wrap"
                                style={{
                                  backgroundColor:
                                    "var(--color-primary, #cf8898)",
                                  color:
                                    "var(--color-primary-foreground, #fbf7f8)",
                                  overflowWrap: "anywhere",
                                }}
                              >
                                {m.content}
                              </div>
                              {/* user tail on right */}
                              <svg
                                className="w-3 h-3 -ml-1 mt-2"
                                viewBox="0 0 8 8"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M0 0 L8 4 L0 8 z"
                                  fill="var(--color-primary, #cf8898)"
                                />
                              </svg>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
              {loading && (
                <div className="self-start max-w-[80%]">
                  <div
                    className="rounded-xl px-4 py-2 shadow-sm opacity-70"
                    style={{
                      backgroundColor: "var(--color-muted)",
                      color: "var(--color-muted-foreground)",
                    }}
                  >
                    Pensando...
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-border p-3 bg-[var(--color-card)]">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendMessage();
                }}
                className="flex gap-2"
              >
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Digite sua mensagem..."
                  disabled={loading}
                  className="rounded-full"
                />
                <Button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="rounded-full"
                >
                  Enviar
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

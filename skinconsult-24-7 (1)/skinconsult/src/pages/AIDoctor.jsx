import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Send,
  Copy,
  FileText,
  CheckCircle2,
  ImagePlus,
  X,
  RefreshCw,
} from "lucide-react";
import Layout from "../components/ui/Layout";
import GradientButton from "../components/ui/GradientButton";
import AIOrb from "../components/skin/AIOrb";
import SkinCellBackground from "../components/skin/SkinCellBackground";
import { sendChatMessage, QUICK_PROMPTS } from "../services/chatService";
import { generateChatReport } from "../services/api/consultationApi";
import { useToast } from "../context/ToastContext";
import { useReports } from "../context/ReportsContext";
import { useAuth } from "../context/AuthContext";

// Converts a File/Blob to a bare base64 string (no "data:...;base64," prefix).
const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const blobToBase64 = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

export default function AIDoctor() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [pendingImage, setPendingImage] = useState(null);
  const [generatingReport, setGeneratingReport] = useState(false);
  const bottomRef = useRef(null);
  const imageInputRef = useRef(null);
  const objectUrls = useRef(new Set());
  const { push } = useToast();
  const { addReport } = useReports();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  useEffect(
    () => () => {
      objectUrls.current.forEach((url) => URL.revokeObjectURL(url));
    },
    []
  );

  const discardImage = (image) => {
    if (!image?.url) return;
    URL.revokeObjectURL(image.url);
    objectUrls.current.delete(image.url);
  };

  const attachImage = (file) => {
    if (!file) return;
    if (!file.type?.startsWith("image/")) {
      push("Please choose an image file to attach", "error");
      return;
    }

    const url = URL.createObjectURL(file);
    objectUrls.current.add(url);
    discardImage(pendingImage);
    setPendingImage({ name: file.name || "Pasted skin image", url, file });
  };

  const handlePaste = (event) => {
    const { clipboardData } = event;
    const imageItem = Array.from(clipboardData?.items || []).find((item) => item.type.startsWith("image/"));
    const imageFile = imageItem?.getAsFile() || clipboardData?.files?.[0];

    if (!imageFile?.type?.startsWith("image/")) return;
    event.preventDefault();
    attachImage(imageFile);
  };

  // Sends the given conversation history (as role/content pairs) to the real,
  // stateless /api/consultations endpoint and appends the reply — or, on
  // failure, an in-chat error bubble with a retry option. Only the current
  // (most recent) message carries image_base64 — Ollama only needs the
  // latest image, not every image ever attached in the conversation.
  const sendToBackend = async (history) => {
    setTyping(true);
    try {
      const chatHistory = history.filter((m) => m.role === "user" || m.role === "assistant");
      const currentImageFile = chatHistory[chatHistory.length - 1]?.image?.file || null;
      const imageBase64 = currentImageFile ? await fileToBase64(currentImageFile) : null;

      const payload = chatHistory.map((m, idx) => {
        const isCurrent = idx === chatHistory.length - 1;
        return isCurrent
          ? { role: m.role, content: m.content, image_base64: imageBase64 }
          : { role: m.role, content: m.content };
      });
      const reply = await sendChatMessage(payload);
      setMessages((m) => [
        ...m,
        {
          id: `a_${Date.now()}`,
          role: "assistant",
          content: reply.content,
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        {
          id: `err_${Date.now()}`,
          role: "error",
          content: "AI Doctor is having trouble responding right now. Make sure Ollama is running.",
          detail: err.message,
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setTyping(false);
    }
  };

  const handleSend = (text, image = pendingImage) => {
    const content = (text ?? input).trim();
    if (!content && !image) return;

    const userMsg = {
      id: `u_${Date.now()}`,
      role: "user",
      content: content || "Image attached for review.",
      image,
      timestamp: new Date().toISOString(),
    };

    const history = [...messages, userMsg];
    setMessages(history);
    setInput("");
    setPendingImage(null);
    sendToBackend(history);
  };

  const retryMessage = (errorMessage) => {
    const history = messages.filter((msg) => msg.id !== errorMessage.id);
    setMessages(history);
    sendToBackend(history);
  };

  const handleGenerateReport = async () => {
    if (messages.length === 0) return;
    setGeneratingReport(true);
    try {
      const chatHistory = messages.filter((m) => m.role === "user" || m.role === "assistant");

      // find the most recently attached image in the conversation, if any
      const lastWithImage = [...chatHistory].reverse().find((m) => m.image?.file);
      const imageBase64 = lastWithImage ? await fileToBase64(lastWithImage.image.file) : null;

      const pdfBlob = await generateChatReport({
        patientName: user?.full_name || null,
        messages: chatHistory.map((m) => ({ role: m.role, content: m.content })),
        imageBase64,
      });

      const base64Pdf = await blobToBase64(pdfBlob);

      // short conversation summary shown inline on the report page
      const conversationSummary = chatHistory.map(
        (m) => `${m.role === "user" ? "You" : "AI Doctor"}: ${m.content}`
      );

      const newReport = addReport({
        type: "conversation",
        patient: { name: user?.full_name || null },
        conversationSummary,
        pdfBase64: base64Pdf,
      });

      push("Your consultation report has been saved to Reports.", "success");
      navigate(`/reports/${newReport.id}`);
    } catch (err) {
      push(err.message || "We couldn't generate your report right now. Please try again.", "error");
    } finally {
      setGeneratingReport(false);
    }
  };

  return (
    <Layout>
      <section className="relative mx-auto flex h-[calc(100vh-72px)] max-w-5xl flex-col overflow-hidden px-4 sm:px-6">
        <SkinCellBackground variant="neural" />
        <div className="relative flex items-center gap-3 border-b border-[var(--border)] py-4">
          <AIOrb size={44} />
          <div className="flex-1">
            <h1 className="font-semibold text-[var(--text)]">SkinConsult AI</h1>
            <p className="text-xs text-[var(--text-muted)]">Your AI skin-health companion</p>
          </div>
          {messages.length > 0 && (
            <button
              type="button"
              onClick={handleGenerateReport}
              disabled={generatingReport}
              className="flex items-center gap-1.5 rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-semibold text-[var(--text-muted)] transition hover:border-[var(--accent-1)] hover:text-[var(--accent-1)] disabled:opacity-50"
            >
              <FileText className="h-3.5 w-3.5" />
              {generatingReport ? "Generating…" : "Generate Report"}
            </button>
          )}
        </div>

        <div className="relative flex-1 space-y-4 overflow-y-auto py-6">
          {messages.length === 0 && (
            <p className="pt-6 text-center text-xs text-[var(--text-faint)]">
              Ask a question below to start your consultation.
            </p>
          )}
          {messages.map((m) => (
            <ChatBubble key={m.id} message={m} onRetry={retryMessage} />
          ))}
          {typing && <TypingBubble />}
          <div ref={bottomRef} />
        </div>

        <div className="relative flex flex-wrap gap-2 pb-3">
          {QUICK_PROMPTS.map((p) => (
            <button
              key={p}
              onClick={() => handleSend(p)}
              className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs text-[var(--text-muted)] transition hover:border-[var(--accent-1)] hover:text-[var(--accent-1)]"
            >
              {p}
            </button>
          ))}
        </div>

        <div className="relative mb-6">
          {pendingImage && (
            <div className="absolute bottom-[calc(100%+0.5rem)] left-3 z-10 flex max-w-[calc(100%-1.5rem)] items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-1.5 pr-2 shadow-[var(--shadow-soft)]">
              <img src={pendingImage.url} alt="Image ready to send" className="h-10 w-10 rounded-xl object-cover" />
              <span className="max-w-40 truncate text-xs text-[var(--text-muted)]">{pendingImage.name}</span>
              <button
                type="button"
                onClick={() => {
                  discardImage(pendingImage);
                  setPendingImage(null);
                }}
                className="rounded-full p-1 text-[var(--text-faint)] transition hover:bg-[var(--accent-soft)] hover:text-[var(--text)]"
                aria-label="Remove attached image"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            onPaste={handlePaste}
            className="relative flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] p-2 shadow-[var(--shadow-soft)]"
          >
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-[var(--text-faint)] hover:text-[var(--accent-1)]"
              aria-label="Upload image"
              title="Attach an image from your computer"
            >
              <ImagePlus className="h-4 w-4" />
            </button>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                attachImage(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your skin health..."
              className="flex-1 bg-transparent text-sm text-[var(--text)] outline-none placeholder:text-[var(--text-faint)]"
            />
            <GradientButton type="submit" size="sm" icon={Send} iconRight={false} className="!px-4">
              Send
            </GradientButton>
          </form>
        </div>
      </section>
    </Layout>
  );
}

// Minimal, dependency-free markdown-lite renderer for assistant replies.
// No markdown package is installed in this project (checked package.json —
// see chat summary), so this hand-rolled renderer covers just what modern
// chat UIs need: **bold**, paragraph/line-break spacing, and bullet/numbered
// lists as real <ul>/<ol> elements. It intentionally does not handle
// headings, links, code blocks, or nested lists.
function renderInlineMarkdown(text, keyPrefix) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter((p) => p !== "");
  return parts.map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={`${keyPrefix}-${i}`}>{part.slice(2, -2)}</strong>
    ) : (
      <span key={`${keyPrefix}-${i}`}>{part}</span>
    )
  );
}

function AssistantContent({ content }) {
  const blocks = content.split(/\n{2,}/);
  return (
    <div className="space-y-3">
      {blocks.map((block, bIdx) => {
        const lines = block.split("\n").filter((l) => l.trim() !== "");
        if (lines.length === 0) return null;

        const isBulletList = lines.every((l) => /^[-*•]\s+/.test(l.trim()));
        const isNumberedList = !isBulletList && lines.every((l) => /^\d+[.)]\s+/.test(l.trim()));

        if (isBulletList) {
          return (
            <ul key={bIdx} className="list-disc space-y-1 pl-5">
              {lines.map((line, lIdx) => (
                <li key={lIdx}>
                  {renderInlineMarkdown(line.trim().replace(/^[-*•]\s+/, ""), `${bIdx}-${lIdx}`)}
                </li>
              ))}
            </ul>
          );
        }

        if (isNumberedList) {
          return (
            <ol key={bIdx} className="list-decimal space-y-1 pl-5">
              {lines.map((line, lIdx) => (
                <li key={lIdx}>
                  {renderInlineMarkdown(line.trim().replace(/^\d+[.)]\s+/, ""), `${bIdx}-${lIdx}`)}
                </li>
              ))}
            </ol>
          );
        }

        return (
          <p key={bIdx}>
            {lines.map((line, lIdx) => (
              <span key={lIdx}>
                {renderInlineMarkdown(line, `${bIdx}-${lIdx}`)}
                {lIdx < lines.length - 1 && <br />}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}

function ChatBubble({ message, onRetry }) {
  const isUser = message.role === "user";
  const isError = message.role === "error";
  const [copied, setCopied] = useState(false);

  if (isError) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="flex items-end gap-2 justify-start"
      >
        <div className="mb-1 flex-shrink-0">
          <AIOrb size={28} pulsing={false} />
        </div>
        <div className="max-w-[75%]">
          <div className="rounded-3xl border border-amber-200 bg-amber-50 px-5 py-3.5 text-sm leading-[1.6] text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300">
            {message.content}
          </div>
          <button
            onClick={() => onRetry(message)}
            className="mt-1 flex items-center gap-1 px-1 text-[10px] font-semibold text-[var(--accent-1)] hover:text-[var(--accent-2)]"
          >
            <RefreshCw className="h-3 w-3" /> Retry
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`flex items-end gap-2 ${isUser ? "justify-end" : "justify-start"}`}
    >
      {!isUser && (
        <div className="mb-1 flex-shrink-0">
          <AIOrb size={28} pulsing={false} />
        </div>
      )}
      <div className={`group max-w-[75%] ${isUser ? "order-1" : ""}`}>
        <div
          className={`rounded-3xl px-5 py-3.5 text-sm leading-[1.6] ${
            isUser
              ? "text-white bg-[linear-gradient(120deg,var(--accent-1),var(--accent-2))]"
              : "glass text-[var(--text)]"
          }`}
        >
          {message.image && (
            <img
              src={message.image.url}
              alt="Skin image shared in chat"
              className="mb-3 max-h-56 w-full rounded-2xl object-cover"
            />
          )}
          {isUser ? message.content : <AssistantContent content={message.content} />}
        </div>
        <div className="mt-1 flex items-center gap-2 px-1 opacity-0 transition-opacity group-hover:opacity-100">
          <span className="text-[10px] text-[var(--text-faint)]">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
          {!isUser && (
            <button
              onClick={() => {
                navigator.clipboard?.writeText(message.content);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
              className="text-[var(--text-faint)] hover:text-[var(--accent-1)]"
            >
              {copied ? <CheckCircle2 className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function TypingBubble() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-end gap-2">
      <AIOrb size={28} pulsing={false} />
      <div className="glass flex items-center gap-1 rounded-3xl px-4 py-3">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-[var(--text-faint)]"
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>
    </motion.div>
  );
}
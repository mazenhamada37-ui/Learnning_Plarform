import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Initialize Google GenAI
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// API Routes
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// 1. AI Course Generator Route
app.post("/api/gemini/generate-course", async (req, res) => {
  try {
    const { topic, level = "متوسط", category = "برمجة وتكنولوجيا", language = "ar" } = req.body;

    if (!topic || typeof topic !== "string") {
      res.status(400).json({ error: "يرجى كتابة عنوان أو موضوع الدورة التدريبية" });
      return;
    }

    const systemPrompt = `أنت خبير إعداد المناهج التعليمية وتصميم المقررات الإلكترونية.
قم بإنشاء دورة تدريبية احترافية وشاملة باللغة العربية بأسلوب مشوق ومفهوم ومكتمل للتطبيق العملي.
الموضوع: ${topic}
المستوى: ${level}
المجال: ${category}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: `أنشئ خطة دورة تعليمية كاملة حول الموضوع المذكور أعلاه مع 3 فصول، وفي كل فصل درسان تفصيليان ملخصان، واختبار نهائي مكون من 3 أسئلة اختيارات.`,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "عنوان جذاب ومباشر للدورة" },
            subtitle: { type: Type.STRING, description: "وصف مختصر ومشوق للدورة في سطرين" },
            category: { type: Type.STRING, description: "تصنيف الدورة" },
            level: { type: Type.STRING, description: "مستوى الدورة (مبتدئ / متوسط / متقدم)" },
            estimatedHours: { type: Type.NUMBER, description: "عدد الساعات التقديرية" },
            prerequisites: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "المتطلبات السابقة"
            },
            learningObjectives: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "أهداف التعلم الرئيسية"
            },
            modules: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING, description: "عنوان الفصل أو الوحدة" },
                  lessons: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING },
                        title: { type: Type.STRING, description: "عنوان الدرس" },
                        durationMinutes: { type: Type.NUMBER, description: "مدة الدرس بالدقائق" },
                        contentType: { type: Type.STRING, description: "video or text" },
                        contentMarkdown: { type: Type.STRING, description: "محتوى ونصوص الدرس والشرح التفصيلي بأسلوب منظم ومع أمثلة" },
                        keyTakeaways: {
                          type: Type.ARRAY,
                          items: { type: Type.STRING },
                          description: "نقاط رئيسية مستفادة"
                        }
                      },
                      required: ["id", "title", "durationMinutes", "contentType", "contentMarkdown", "keyTakeaways"]
                    }
                  }
                },
                required: ["id", "title", "lessons"]
              }
            },
            quiz: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING, description: "عنوان الاختبار النهائي" },
                questions: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      question: { type: Type.STRING },
                      options: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                      },
                      correctAnswerIndex: { type: Type.INTEGER },
                      explanation: { type: Type.STRING }
                    },
                    required: ["id", "question", "options", "correctAnswerIndex", "explanation"]
                  }
                }
              },
              required: ["title", "questions"]
            }
          },
          required: ["title", "subtitle", "category", "level", "estimatedHours", "learningObjectives", "modules", "quiz"]
        }
      }
    });

    const jsonText = response.text || "{}";
    const courseData = JSON.parse(jsonText);
    res.json({ success: true, course: courseData });
  } catch (error: any) {
    console.error("Error generating course:", error);
    res.status(500).json({ error: error?.message || "فشل إنشاء الدورة التعليمية بالذكاء الاصطناعي" });
  }
});

// 2. AI Tutor Chat Route
app.post("/api/gemini/tutor-chat", async (req, res) => {
  try {
    const { messages, courseContext } = req.body;

    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ error: "المحادثة غير صالحة" });
      return;
    }

    const systemInstruction = `أنت "معلمك الذكي" (EduBot)، معلم واستشاري تعليمي افتراضي صبور ومشجع ومتخصص في مساعدة الطلاب على فهم المناهج والدورات التدريبية في منصة التعلم الإلكتروني.
اجابتك يجب أن تكون واضحة، سهلة الفهم، باللغة العربية الفصحى المبسطة، وتدعم القوائم والأمثلة العملية.
${courseContext ? `سياق الدورة الحالية التي يدرسها الطالب: ${JSON.stringify(courseContext)}` : ""}`;

    const formattedContents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }]
    }));

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: formattedContents,
      config: {
        systemInstruction,
        temperature: 0.7
      }
    });

    res.json({ success: true, reply: response.text || "عذراً، لم أستطع الإجابة حالياً." });
  } catch (error: any) {
    console.error("Error in AI Tutor chat:", error);
    res.status(500).json({ error: error?.message || "حدث خطأ في محادثة المعلم الذكي" });
  }
});

// 3. AI Instant Quiz Generator Route
app.post("/api/gemini/generate-quiz", async (req, res) => {
  try {
    const { topic, questionCount = 5 } = req.body;

    if (!topic) {
      res.status(400).json({ error: "يرجى تحديد موضوع الاختبار" });
      return;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: `قم بإعداد اختبار تقييمي سريع مكون من ${questionCount} أسئلة اختيارات متعددة في موضوع: ${topic}. لكل سؤال 4 خيارات وإجابة صحيحة واحدة مع شرح توضيحي للإجابة.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  question: { type: Type.STRING },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  },
                  correctAnswerIndex: { type: Type.INTEGER },
                  explanation: { type: Type.STRING }
                },
                required: ["id", "question", "options", "correctAnswerIndex", "explanation"]
              }
            }
          },
          required: ["title", "questions"]
        }
      }
    });

    const quiz = JSON.parse(response.text || "{}");
    res.json({ success: true, quiz });
  } catch (error: any) {
    console.error("Error generating quiz:", error);
    res.status(500).json({ error: error?.message || "فشل إنشاء الاختبار" });
  }
});

// 4. AI Lesson Explanation Route
app.post("/api/gemini/explain-lesson", async (req, res) => {
  try {
    const { lessonTitle, lessonContent, userQuestion } = req.body;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: `عنوان الدرس: ${lessonTitle}\nمحتوى الدرس: ${lessonContent}\nسؤال الطالب أو طلب التوضيح: ${userQuestion}`,
      config: {
        systemInstruction: "أنت معلم ذكي تشرح مفاهيم الدرس للطلاب بأبسط طريقة ممكنة مع تقديم تشبيهات واقعية وأمثلة توضيحية ممتازة.",
        temperature: 0.6
      }
    });

    res.json({ success: true, explanation: response.text });
  } catch (error: any) {
    console.error("Error explaining lesson:", error);
    res.status(500).json({ error: error?.message || "فشل شرح الدرس" });
  }
});

// Integrate Vite Server / Static Build Output
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`EduPlatform Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

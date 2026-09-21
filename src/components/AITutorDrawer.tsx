import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, X, Loader2, BookOpen } from 'lucide-react';
import { StudentProfile, Course } from '../types';

interface AiTutorModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentProfile?: StudentProfile | null;
  courses?: Course[];
  currentCourseTitle?: string;
  onSelectCourse?: (courseId: string) => void;
}

interface CourseRecommendation {
  title: string;
  description: string;
  topics: string[];
}

interface Message {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  time: string;
  matchedCourses?: Course[];
  generatedRecommendation?: CourseRecommendation;
}

export const AiTutorModal: React.FC<AiTutorModalProps> = ({
  isOpen,
  onClose,
  studentProfile,
  courses = [],
  onSelectCourse,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'bot',
      text: `أهلاً بك${studentProfile?.fullName ? ' يا ' + studentProfile.fullName : ''}! أنا معلمك الذكي 🤖\nاطلب مني أي كورس أو مجال تحب تتستفسر عنه أو تتعلمه، وسأشرح لك محتواه فوراً وأوفر لك مسار التعلم المناسب.`,
      time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (!isOpen) return null;

  const generateSmartCourseReply = (query: string): { text: string; recommendation?: CourseRecommendation } => {
    const cleanQuery = query.toLowerCase().trim();

    return {
      text: `بالتأكيد! كورس "${query}" من أهم المسارات المطلوبة حالياً. إليك نظرة شاملة على ما ستتعلمه في هذا المسار:`,
      recommendation: {
        title: `دورة ${query} الشاملة`,
        description: `مسار تعليمي يتضمن التطبيق العملي والمشاريع الحقيقية في مجال ${query}.`,
        topics: [
          `أساسيات ومفاهيم ${query}`,
          `الأدوات والتقنيات الحديثة المستعملة`,
          `بناء مشاريع علمية وتطبيقية`,
          `إعدادك لسوق العمل والمقابلات الشخصية`
        ]
      }
    };
  };

  const handleSendMessage = (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: query,
      time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText('');
    setIsLoading(true);

    setTimeout(() => {
      const cleanQuery = query.toLowerCase().replace(/[أإآ]/g, 'ا');

      const foundCourses = courses.filter((c) => {
        const title = (c.title || '').toLowerCase().replace(/[أإآ]/g, 'ا');
        const desc = (c.description || '').toLowerCase().replace(/[أإآ]/g, 'ا');
        const cat = (c.category || '').toLowerCase().replace(/[أإآ]/g, 'ا');
        return title.includes(cleanQuery) || desc.includes(cleanQuery) || cat.includes(cleanQuery);
      });

      let botMsg: Message;

      if (foundCourses.length > 0) {
        botMsg = {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: `ممتاز! وجدنا لك الكورسات التالية المسجلة بالمنصة والمخصصة لـ "${query}":`,
          time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
          matchedCourses: foundCourses,
        };
      } else {
        const smartResult = generateSmartCourseReply(query);
        botMsg = {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: smartResult.text,
          time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
          generatedRecommendation: smartResult.recommendation,
        };
      }

      setMessages((prev) => [...prev, botMsg]);
      setIsLoading(false);
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 font-arabic" dir="rtl">
      <div className="bg-[#0b132b] border border-slate-700 rounded-2xl w-full max-w-lg h-[80vh] flex flex-col shadow-2xl overflow-hidden">
        
        <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">المعلم الذكي (EduBot)</h3>
              <p className="text-[11px] text-slate-400">مساعدك التعليمي التفاعلي لكل المجالات</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                msg.sender === 'user' ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-800 text-emerald-400 border border-slate-700'
              }`}>
                {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                msg.sender === 'user' 
                  ? 'bg-emerald-600 text-white rounded-tr-none' 
                  : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-none'
              }`}>
                <p className="whitespace-pre-line font-medium">{msg.text}</p>

                {msg.matchedCourses && msg.matchedCourses.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {msg.matchedCourses.map((course) => (
                      <div 
                        key={course.id}
                        onClick={() => {
                          if (onSelectCourse) onSelectCourse(course.id);
                          onClose();
                        }}
                        className="p-2.5 bg-slate-900 hover:bg-slate-950 border border-emerald-500/30 rounded-xl cursor-pointer transition-all flex justify-between items-center"
                      >
                        <div>
                          <p className="font-bold text-emerald-400 text-xs">{course.title}</p>
                          <p className="text-[10px] text-slate-400 line-clamp-1">{course.description}</p>
                        </div>
                        <span className="text-[10px] bg-emerald-500 text-slate-950 px-2.5 py-1 rounded-md font-bold shrink-0 mr-2">
                          عرض
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {msg.generatedRecommendation && (
                  <div className="mt-3 p-3 bg-slate-900/90 border border-emerald-500/30 rounded-xl space-y-2">
                    <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs">
                      <BookOpen className="w-4 h-4" />
                      <span>{msg.generatedRecommendation.title}</span>
                    </div>
                    <p className="text-[11px] text-slate-300">{msg.generatedRecommendation.description}</p>
                    <div className="space-y-1 pt-1 border-t border-slate-800">
                      <p className="text-[10px] font-bold text-slate-400">أبرز المحاور:</p>
                      <ul className="list-disc list-inside text-[11px] text-slate-300 space-y-0.5">
                        {msg.generatedRecommendation.topics.map((topic, i) => (
                          <li key={i}>{topic}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                <span className="block text-[10px] opacity-50 mt-1 text-left">{msg.time}</span>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-slate-400 text-xs p-2">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
              <span>جاري إعداد الإجابة والمحتوى...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="p-3 bg-slate-900 border-t border-slate-800 flex gap-2">
          <input
            type="text"
            placeholder="اكتب اسم أي كورس تريد الاستفسار عنه..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
          />
          <button
            type="submit"
            disabled={isLoading || !inputText.trim()}
            className="p-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 rounded-xl font-bold cursor-pointer transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

      </div>
    </div>
  );
};

export const AITutorDrawer = AiTutorModal;
export default AiTutorModal;
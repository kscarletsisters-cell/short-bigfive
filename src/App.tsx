/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import Markdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ClipboardCheck, 
  BrainCircuit, 
  Briefcase, 
  Heart, 
  ChevronRight, 
  ChevronLeft, 
  RotateCcw,
  Loader2,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer 
} from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { QUESTIONS, TRAIT_NAMES, TRIVIA } from './constants';
import { Scores, AnalysisResult } from './types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || '' });

export default function App() {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [triviaIndex, setTriviaIndex] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isAnalyzing) {
      interval = setInterval(() => {
        setTriviaIndex((prev) => (prev + 1) % TRIVIA.length);
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [isAnalyzing]);

  const scores = useMemo(() => {
    if (Object.keys(answers).length < 10) return null;

    const calculateTrait = (trait: 'E' | 'A' | 'C' | 'N' | 'O') => {
      const posQ = QUESTIONS.find(q => q.trait === trait && q.isPositive)!;
      const negQ = QUESTIONS.find(q => q.trait === trait && !q.isPositive)!;
      
      const posVal = answers[posQ.id];
      const negVal = answers[negQ.id];
      
      return (posVal + (4 - negVal)) / 2;
    };

    return {
      E: calculateTrait('E'),
      A: calculateTrait('A'),
      C: calculateTrait('C'),
      N: calculateTrait('N'),
      O: calculateTrait('O'),
    } as Scores;
  }, [answers]);

  const handleAnswer = (questionId: number, value: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const allAnswered = Object.keys(answers).length === QUESTIONS.length;

  const nextTrivia = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setTriviaIndex((prev) => (prev + 1) % TRIVIA.length);
  };

  const runAnalysis = async () => {
    if (!scores) return;
    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `
          以下のビッグファイブ性格診断のスコア（0〜4の範囲）に基づいて、詳細な分析を行ってください。
          
          スコア:
          - 外向性: ${scores.E.toFixed(1)}
          - 協調性: ${scores.A.toFixed(1)}
          - 誠実性: ${scores.C.toFixed(1)}
          - 神経症的傾向: ${scores.N.toFixed(1)}
          - 開放性: ${scores.O.toFixed(1)}
          
          以下の4つのセクションで回答してください。
          1. 性格特性に合わせた「二つ名」（例：『静かなる情熱の探求者』『社交界の太陽』など、キャッチーでかっこいいもの）
          2. 性格特性の詳細な特徴（あなたと似た性格特性を持つ著名人の例も挙げてください）
          3. 仕事に対する適性（向いている職種や環境）
          4. パートナー選びの適性（相性の良いタイプや注意点、また相性の良い著名人の例も挙げてください）
          
          **重要事項:**
          - 回答は日本語で、親しみやすくも専門的な洞察を含んだトーンでお願いします。
          - **重要なキーワードや文章は、Markdownの太字（**テキスト**）を使用して強調してください。**
          - 箇条書きや改行を適切に使い、読みやすいレイアウトにしてください。
        `,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              nickname: { type: Type.STRING, description: "性格特性に合わせた二つ名" },
              traits: { type: Type.STRING, description: "性格特性の分析" },
              jobs: { type: Type.STRING, description: "仕事の適性分析" },
              partner: { type: Type.STRING, description: "パートナー選びの分析" },
            },
            required: ["nickname", "traits", "jobs", "partner"],
          },
        },
      });

      const result = JSON.parse(response.text || '{}');
      setAnalysis(result);
      setShowResults(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error(err);
      setError("分析中にエラーが発生しました。もう一度お試しください。");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const reset = () => {
    setAnswers({});
    setAnalysis(null);
    setShowResults(false);
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-[#1a1a1a] font-sans selection:bg-emerald-100 pb-20">
      <div className="max-w-3xl mx-auto px-6 pt-12 md:pt-20">
        
        {/* Header */}
        <header className="mb-16 text-center">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold uppercase tracking-wider mb-4"
          >
            <BrainCircuit size={14} />
            AI Personality Analysis
          </motion.div>
          <h1 className="text-4xl md:text-6xl font-serif font-medium tracking-tight mb-6">
            AIビッグファイブ性格診断
          </h1>
          <p className="text-gray-500 max-w-lg mx-auto text-lg">
            10の質問に答えるだけで、あなたの性格、適職、パートナー選びの傾向をAIが詳細に分析します。
          </p>
        </header>

        <AnimatePresence mode="wait">
          {!showResults ? (
            <motion.div
              key="questions-list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {QUESTIONS.map((q, idx) => (
                <motion.div
                  key={q.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-black/5"
                >
                  <div className="flex items-start gap-4 mb-6">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-mono text-sm font-bold">
                      {idx + 1}
                    </span>
                    <h2 className="text-lg md:text-xl font-medium leading-snug pt-0.5">
                      {q.text}
                    </h2>
                  </div>

                  <div className="flex flex-wrap gap-2 md:gap-3">
                    {[
                      { val: 0, label: '0' },
                      { val: 1, label: '1' },
                      { val: 2, label: '2' },
                      { val: 3, label: '3' },
                      { val: 4, label: '4' },
                    ].map((option) => (
                      <button
                        key={option.val}
                        onClick={() => handleAnswer(q.id, option.val)}
                        className={cn(
                          "flex-1 min-w-[60px] py-3 rounded-xl border transition-all duration-200 text-center font-medium",
                          answers[q.id] === option.val
                            ? "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-200"
                            : "bg-white border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/50 text-gray-500"
                        )}
                      >
                        {option.val}
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-between mt-3 px-1 text-[10px] text-gray-400 uppercase tracking-tighter font-bold">
                    <span>まったくあてはまらない</span>
                    <span>完全にあてはまる</span>
                  </div>
                </motion.div>
              ))}

              {/* Analysis Trigger */}
              <div className="pt-10">
                {isAnalyzing ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full py-10 px-6 rounded-[32px] bg-[#1a1a1a] text-white shadow-2xl border border-white/10 flex flex-col items-center gap-8"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className="relative">
                        <Loader2 className="animate-spin text-emerald-400" size={32} />
                        <Sparkles className="absolute -top-1 -right-1 text-amber-400 animate-pulse" size={14} />
                      </div>
                      <div className="text-center">
                        <span className="text-xl font-bold block mb-1">AIが分析中...</span>
                        <span className="text-sm font-normal opacity-60">（約30秒～1分かかります）</span>
                      </div>
                    </div>
                    
                    <div 
                      onClick={nextTrivia}
                      className="w-full max-w-md bg-white/5 hover:bg-white/10 rounded-3xl p-8 backdrop-blur-md border border-white/10 cursor-pointer transition-all active:scale-[0.98] group relative overflow-hidden"
                    >
                      <div className="absolute top-4 right-6 text-[10px] font-bold text-emerald-400/50 uppercase tracking-widest group-hover:text-emerald-400 transition-colors">
                        Tap to skip →
                      </div>
                      
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={triviaIndex}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.4, ease: "easeOut" }}
                          className="text-center"
                        >
                          <div className="text-xs font-bold text-emerald-400 uppercase tracking-[0.2em] mb-4 opacity-70">
                            Personality Trivia
                          </div>
                          <div className="text-xl font-bold mb-4 text-white leading-tight">
                            {TRIVIA[triviaIndex].title}
                          </div>
                          <div className="text-base leading-relaxed text-gray-300 font-medium">
                            {TRIVIA[triviaIndex].text}
                          </div>
                        </motion.div>
                      </AnimatePresence>
                      
                      <div className="mt-6 flex justify-center gap-1">
                        {TRIVIA.slice(0, 8).map((_, i) => (
                          <div 
                            key={i} 
                            className={cn(
                              "h-1 rounded-full transition-all duration-500",
                              i === triviaIndex % 8 ? "w-6 bg-emerald-400" : "w-1 bg-white/20"
                            )}
                          />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <button
                    onClick={runAnalysis}
                    disabled={!allAnswered}
                    className={cn(
                      "w-full py-6 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all duration-300",
                      allAnswered
                        ? "bg-[#1a1a1a] text-white hover:bg-black shadow-xl hover:-translate-y-1"
                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    )}
                  >
                    {allAnswered ? "分析結果を表示する" : "すべての質問に答えてください"}
                    <ChevronRight size={20} />
                  </button>
                )}
                {error && <p className="mt-4 text-red-500 text-center text-sm font-medium">{error}</p>}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="results-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {/* Nickname Banner */}
              {analysis && (
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-[40px] p-8 md:p-12 text-center text-white shadow-xl shadow-emerald-200/50 relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                    <Sparkles className="absolute top-4 left-4 animate-pulse" size={40} />
                    <Sparkles className="absolute bottom-4 right-4 animate-pulse" size={60} />
                  </div>
                  <span className="text-emerald-100 text-xs font-bold uppercase tracking-[0.3em] mb-4 block">
                    Your AI Nickname
                  </span>
                  <h2 className="text-3xl md:text-5xl font-serif font-bold mb-2 leading-tight">
                    {analysis.nickname}
                  </h2>
                </motion.div>
              )}

              {/* Radar Chart Section */}
              <section className="bg-white rounded-[40px] p-8 md:p-12 shadow-sm border border-black/5">
                <div className="flex items-center gap-3 mb-10">
                  <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                    <ClipboardCheck size={20} />
                  </div>
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                    診断スコア分布
                  </h3>
                </div>
                
                <div className="h-[300px] md:h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={[
                      { subject: '外向性', A: scores?.E || 0, fullMark: 4 },
                      { subject: '協調性', A: scores?.A || 0, fullMark: 4 },
                      { subject: '誠実性', A: scores?.C || 0, fullMark: 4 },
                      { subject: '神経症', A: scores?.N || 0, fullMark: 4 },
                      { subject: '開放性', A: scores?.O || 0, fullMark: 4 },
                    ]}>
                      <PolarGrid stroke="#e5e7eb" />
                      <PolarAngleAxis 
                        dataKey="subject" 
                        tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 600 }}
                      />
                      <PolarRadiusAxis 
                        angle={30} 
                        domain={[0, 4]} 
                        tick={false}
                        axisLine={false}
                      />
                      <Radar
                        name="Personality"
                        dataKey="A"
                        stroke="#10b981"
                        fill="#10b981"
                        fillOpacity={0.5}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-8">
                  {scores && Object.entries(scores).map(([key, val]) => (
                    <div key={key} className="text-center">
                      <div className="text-[10px] font-bold text-gray-400 uppercase mb-1 truncate">
                        {TRAIT_NAMES[key as keyof Scores].split(' ')[0]}
                      </div>
                      <div className="text-xl font-mono font-bold text-emerald-600">
                        {(val as number).toFixed(1)}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* AI Analysis Sections */}
              {analysis && (
                <div className="space-y-8">
                  <ResultCard 
                    icon={<BrainCircuit className="text-blue-500" />}
                    title="性格特性の分析"
                    content={analysis.traits}
                  />
                  <ResultCard 
                    icon={<Briefcase className="text-amber-500" />}
                    title="仕事の適性"
                    content={analysis.jobs}
                  />
                  <ResultCard 
                    icon={<Heart className="text-rose-500" />}
                    title="パートナー選び"
                    content={analysis.partner}
                  />
                </div>
              )}

              {/* Contact Section */}
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-emerald-50 rounded-[32px] p-8 text-center border border-emerald-100"
              >
                <p className="text-emerald-800 font-bold mb-2">
                  より詳しい診断を希望の方は産業医まで相談ください！
                </p>
                <p className="text-emerald-700 text-sm mb-4">
                  日本健康倶楽部　産業医　岡野聖都
                </p>
                <div className="flex items-center justify-center gap-2 text-emerald-600">
                  <span className="text-sm font-medium">連絡先：</span>
                  <a 
                    href="mailto:e144108@icloud.com" 
                    className="font-bold hover:underline"
                  >
                    e144108@icloud.com
                  </a>
                </div>
              </motion.section>

              <button
                onClick={reset}
                className="w-full py-6 bg-white border border-gray-200 text-gray-600 rounded-2xl font-bold flex items-center justify-center gap-3 hover:border-gray-400 transition-all shadow-sm"
              >
                <RotateCcw size={20} />
                もう一度診断する
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <footer className="mt-24 text-center text-gray-400 text-xs border-t border-gray-200 pt-8">
          <p>© 2024 AI Big Five Personality Analysis. Powered by Gemini.</p>
          <p className="mt-2">この診断は科学的なビッグファイブ理論に基づいたAIによる推測であり、医学的な診断ではありません。</p>
        </footer>
      </div>
    </div>
  );
}

function ResultCard({ icon, title, content }: { icon: React.ReactNode, title: string, content: string }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-white rounded-[40px] p-8 md:p-12 shadow-sm border border-black/5"
    >
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 rounded-2xl bg-gray-50">
          {icon}
        </div>
        <h3 className="text-2xl font-serif font-medium">{title}</h3>
      </div>
      <div className="prose prose-emerald max-w-none text-gray-600 leading-relaxed text-lg prose-strong:text-emerald-700 prose-strong:bg-emerald-50 prose-strong:px-1 prose-strong:rounded">
        <Markdown>{content}</Markdown>
      </div>
    </motion.section>
  );
}

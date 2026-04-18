import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Send, X, Bot, Sparkles, User, RefreshCcw, Check, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { Character } from '../constants';
import ReactMarkdown from 'react-markdown';

interface AIAssistantProps {
  characters: Character[];
  onUpdateCharacter: (charId: string, data: Partial<Character>) => Promise<void>;
  userProfile?: any;
}

interface Message {
  role: 'user' | 'model' | 'system';
  content: string;
  isProposedUpdate?: boolean;
  proposedUpdateData?: {
    characterId: string;
    updates: Partial<Character>;
    reason: string;
  };
}

const MODEL_NAME = "gemini-3-flash-preview";

export function AIAssistant({ characters, onUpdateCharacter, userProfile }: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'system', content: '您好，我是庄园秘典智能助手。我可以帮您查找角色信息，或者根据您的指示修改角色的属性、技能及背景故事。' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const aiRef = useRef<GoogleGenAI | null>(null);

  useEffect(() => {
    if (!aiRef.current) {
      aiRef.current = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const getCharacterList = () => {
    return characters.map(c => ({ id: c.id, name: c.name, title: c.title }));
  };

  const getCharacterDetails = (id: string) => {
    return characters.find(c => c.id === id);
  };

  const tools = [
    {
      functionDeclarations: [
        {
          name: "get_character_list",
          description: "获取所有角色的简要列表，包含 ID、姓名和称号。",
          parameters: { type: Type.OBJECT, properties: {} }
        } as FunctionDeclaration,
        {
          name: "get_character_details",
          description: "根据角色 ID 获取角色的详细信息。",
          parameters: {
            type: Type.OBJECT,
            properties: {
              characterId: { type: Type.STRING, description: "角色的唯一 ID" }
            },
            required: ["characterId"]
          }
        } as FunctionDeclaration,
        {
          name: "propose_character_update",
          description: "向用户提议修改某个角色的数据。这不会直接修改数据库，而是向用户展示修改建议并请求确认。",
          parameters: {
            type: Type.OBJECT,
            properties: {
              characterId: { type: Type.STRING, description: "要修改的角色 ID" },
              updates: {
                type: Type.OBJECT,
                description: "包含要修改字段的对象。",
                properties: {
                  name: { type: Type.STRING },
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  role: { type: Type.STRING },
                  type: { type: Type.STRING },
                  difficulty: { type: Type.NUMBER },
                  story: { type: Type.STRING },
                  skills: { 
                    type: Type.ARRAY, 
                    items: { 
                      type: Type.OBJECT, 
                      properties: { 
                        name: { type: Type.STRING }, 
                        description: { type: Type.STRING },
                        cooldown: { type: Type.STRING }
                      } 
                    } 
                  },
                  externalTraits: { 
                    type: Type.ARRAY, 
                    items: { 
                      type: Type.OBJECT, 
                      properties: { 
                        name: { type: Type.STRING }, 
                        description: { type: Type.STRING } 
                      } 
                    } 
                  }
                }
              },
              reason: { type: Type.STRING, description: "修改的原因或解释" }
            },
            required: ["characterId", "updates", "reason"]
          }
        } as FunctionDeclaration
      ]
    }
  ];

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const ai = aiRef.current!;
      
      const chat = ai.chats.create({
        model: MODEL_NAME,
        config: {
          systemInstruction: `你是“庄园秘典”的智能助手，专门负责维护第五人格角色的档案数据。
你的目标是协助用户查询和修改角色详细信息。
当你获得用户的明确指令要修改数据时，必须使用 propose_character_update 工具。
用户确认后，前端会执行具体的更新逻辑。
你可以调用 get_character_list 获取角色 ID，或者 get_character_details 获取具体细节。
请保持专业、友好且富有神秘感的语调，符合庄园的主题。`,
          tools,
        },
        history: messages
          .filter(m => !m.isProposedUpdate && m.role !== 'system')
          .map(m => ({
            role: m.role as any,
            parts: [{ text: m.content }]
          }))
      });

      let response = await chat.sendMessage({ message: userMessage });
      let finalContent = response.text || '';
      let functionCalls = response.functionCalls;

      // Handle function calls iteratively
      while (functionCalls) {
        const functionResponses = [];
        let hasProposedUpdate = false;

        for (const call of functionCalls) {
          if (call.name === 'get_character_list') {
            const list = getCharacterList();
            functionResponses.push({ name: 'get_character_list', response: { characters: list } });
          } else if (call.name === 'get_character_details') {
            const details = getCharacterDetails((call.args as any).characterId);
            functionResponses.push({ name: 'get_character_details', response: { details } });
          } else if (call.name === 'propose_character_update') {
            const args = call.args as any;
            setMessages(prev => [...prev, { 
              role: 'model', 
              content: args.reason, 
              isProposedUpdate: true,
              proposedUpdateData: args
            }]);
            hasProposedUpdate = true;
            break;
          }
        }

        if (hasProposedUpdate) {
          setIsLoading(false);
          return;
        }

        if (functionResponses.length > 0) {
          response = await chat.sendMessage({ message: functionResponses.map(r => ({ functionResponse: r })) });
          finalContent = response.text || '';
          functionCalls = response.functionCalls;
        } else {
          break;
        }
      }

      if (finalContent) {
        setMessages(prev => [...prev, { role: 'model', content: finalContent }]);
      }
    } catch (error) {
      console.error("AI Assistant Error:", error);
      setMessages(prev => [...prev, { role: 'model', content: '抱歉，系统连接出现异常，请稍后再试。' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyUpdate = async (updateData: { characterId: string, updates: Partial<Character>, reason: string }) => {
    try {
      await onUpdateCharacter(updateData.characterId, updateData.updates);
      setMessages(prev => [...prev, { role: 'system', content: `成功更新角色 [${updateData.characterId}] 的数据。` }]);
    } catch (error) {
      console.error("Apply update failed:", error);
      setMessages(prev => [...prev, { role: 'system', content: `更新失败：${error instanceof Error ? error.message : '未知错误'}` }]);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="absolute bottom-16 right-0 w-96 h-[500px] bg-card border border-border shadow-[0_0_30px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden rounded-lg"
          >
            {/* Header */}
            <div className="p-4 border-b border-border bg-accent/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h3 className="text-sm font-serif font-bold text-accent">庄园智能助手</h3>
                  <div className="text-[10px] font-mono text-muted uppercase tracking-widest">ACTIVE SESSION_</div>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-muted hover:text-accent transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-bg/20"
            >
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      {msg.role === 'user' ? (
                        <>
                          <span className="text-[9px] font-mono text-muted uppercase">调查员</span>
                          <User className="w-3 h-3 text-muted" />
                        </>
                      ) : (
                        <>
                          <Bot className="w-3 h-3 text-accent" />
                          <span className="text-[9px] font-mono text-accent uppercase">秘典核心</span>
                        </>
                      )}
                    </div>
                    <div className={`p-3 rounded-sm text-xs leading-relaxed ${
                      msg.role === 'user' 
                        ? 'bg-accent text-bg font-bold' 
                        : msg.role === 'system'
                        ? 'bg-bg border border-border text-muted italic'
                        : 'bg-card border border-border text-text'
                    }`}>
                      <div className="markdown-body text-current tabular-nums">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                      {msg.isProposedUpdate && msg.proposedUpdateData && (
                        <div className="mt-3 p-3 bg-bg/50 border border-accent/30 rounded-sm space-y-3">
                          <div className="flex items-center gap-2 text-accent">
                            <Sparkles className="w-4 h-4" />
                            <span className="font-bold">修改建议</span>
                          </div>
                          <div className="space-y-1">
                            <div className="text-[10px] text-muted uppercase">角色 ID: {msg.proposedUpdateData.characterId}</div>
                            <div className="text-[10px] text-muted uppercase">修改项目:</div>
                            <div className="pl-2 border-l border-border space-y-1">
                              {Object.entries(msg.proposedUpdateData.updates).map(([key, val]) => (
                                <div key={key} className="text-[10px]">
                                  <span className="text-secondary">{key}:</span> {typeof val === 'object' ? '数据块' : String(val)}
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="flex gap-2 pt-2">
                            <button
                              onClick={() => handleApplyUpdate(msg.proposedUpdateData!)}
                              className="flex-1 py-1.5 bg-accent text-bg text-[10px] font-bold uppercase tracking-widest hover:bg-accent/80 transition-all flex items-center justify-center gap-2"
                            >
                              <Check className="w-3 h-3" /> 确认修改
                            </button>
                            <button
                              onClick={() => setMessages(prev => [...prev, { role: 'system', content: '已取消修改。' }])}
                              className="flex-1 py-1.5 border border-border text-muted text-[10px] font-mono uppercase tracking-widest hover:text-text transition-all"
                            >
                              取消
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2 text-accent animate-pulse">
                    <RefreshCcw className="w-4 h-4 animate-spin" />
                    <span className="text-[10px] font-mono uppercase">正在分析档案... ANALYZING_</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-border bg-card">
              <div className="relative">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="指令：修改先知的背景故事..."
                  className="w-full bg-bg border border-border p-3 pr-12 text-xs font-mono focus:border-accent outline-none min-h-[60px] max-h-[120px] resize-none"
                />
                <button
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                  className="absolute bottom-3 right-3 p-2 bg-accent text-bg hover:bg-accent/80 transition-all disabled:opacity-50 disabled:grayscale"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <div className="mt-2 text-[9px] text-muted flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                <span>助手建议后需经过您的手动确认方可生效。</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all ${
          isOpen ? 'bg-primary text-white rotate-90' : 'bg-accent text-bg'
        }`}
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
        {!isOpen && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center animate-bounce">
            <Sparkles className="w-2.5 h-2.5 text-white" />
          </div>
        )}
      </motion.button>
    </div>
  );
}

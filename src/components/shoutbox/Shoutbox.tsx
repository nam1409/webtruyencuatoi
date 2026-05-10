"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, Trash2, Shield, Lock, Loader2, Reply } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { sendShoutboxMessage, deleteShoutboxMessage } from '@/actions/shoutbox';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { toast } from 'sonner';

interface ShoutboxProps {
  initialMessages: any[];
  currentUser: any;
  isAdmin: boolean;
}

export function Shoutbox({ initialMessages, currentUser, isAdmin }: ShoutboxProps) {
  const [messages, setMessages] = useState<any[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel('public:shoutbox')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'shoutbox' 
      }, async (payload) => {
        // Fetch profile data for the new message
        const { data: newMessage } = await supabase
          .from('shoutbox')
          .select(`
            *,
            profiles:user_id (
              username,
              display_name,
              avatar_url,
              role
            )
          `)
          .eq('id', payload.new.id)
          .single();

        if (newMessage) {
          setMessages(prev => [...prev, newMessage]);
        }
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'shoutbox'
      }, (payload) => {
        setMessages(prev => prev.filter(m => m.id !== payload.old.id));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!input.trim() || isSending) return;

    setIsSending(true);
    try {
      await sendShoutboxMessage(input);
      setInput('');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSending(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteShoutboxMessage(id);
      toast.success("Đã xóa tin nhắn");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="flex flex-col h-[500px] w-full bg-card/50 backdrop-blur-xl border border-border/50 rounded-[2.5rem] overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="px-8 py-6 border-b border-border/50 flex items-center justify-between bg-muted/20">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 rounded-2xl text-primary">
            <MessageSquare className="w-5 h-5 fill-primary/10" />
          </div>
          <div>
            <h3 className="text-lg font-black tracking-tighter uppercase">Trò chuyện</h3>
            <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">Cộng đồng ZenStory</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Trực tuyến</span>
        </div>
      </div>

      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-primary/10 hover:scrollbar-thumb-primary/20"
      >
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`flex gap-4 group ${msg.user_id === currentUser?.id ? 'flex-row-reverse' : ''}`}
            >
              {/* Avatar */}
              <div className="relative shrink-0">
                <div className="w-10 h-10 rounded-2xl overflow-hidden bg-muted border-2 border-background shadow-sm">
                  <img 
                    src={msg.profiles?.avatar_url || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${msg.profiles?.username}`} 
                    className="w-full h-full object-cover"
                    alt="Avatar"
                  />
                </div>
                {msg.profiles?.role === 'admin' && (
                  <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground p-0.5 rounded-lg shadow-lg">
                    <Shield className="w-3 h-3" />
                  </div>
                )}
              </div>

              {/* Message Content */}
              <div className={`max-w-[80%] flex flex-col ${msg.user_id === currentUser?.id ? 'items-end' : 'items-start'}`}>
                <div className="flex items-center gap-2 mb-1 px-1">
                  <span className={`text-[11px] font-black uppercase tracking-wider ${msg.profiles?.role === 'admin' ? 'text-primary' : 'text-muted-foreground'}`}>
                    {msg.profiles?.display_name || msg.profiles?.username}
                  </span>
                  <span className="text-[9px] font-bold text-muted-foreground/40 italic">
                    {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true, locale: vi })}
                  </span>
                </div>
                
                <div className={`relative px-4 py-3 rounded-3xl text-sm font-medium leading-relaxed transition-all shadow-sm
                  ${msg.user_id === currentUser?.id 
                    ? 'bg-primary text-primary-foreground rounded-tr-none' 
                    : 'bg-muted/50 hover:bg-muted border border-border/50 rounded-tl-none'}
                `}>
                  {msg.content}
                </div>

                {/* Actions */}
                <div className={`flex items-center gap-3 mt-1 opacity-0 group-hover:opacity-100 transition-opacity ${msg.user_id === currentUser?.id ? 'flex-row-reverse' : ''}`}>
                  <button 
                    onClick={() => setInput(`@${msg.profiles?.username} `)}
                    className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 hover:text-primary transition-colors flex items-center gap-1"
                  >
                    <Reply className="w-3 h-3" /> Phản hồi
                  </button>
                  {isAdmin && (
                    <button 
                      onClick={() => handleDelete(msg.id)}
                      className="text-[9px] font-black uppercase tracking-widest text-red-500/60 hover:text-red-500 transition-colors flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" /> Xóa
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Input Area */}
      <div className="p-6 bg-muted/10 border-t border-border/50">
        {!currentUser ? (
          <div className="flex flex-col items-center justify-center py-2 gap-3 opacity-60">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest italic">
              <Lock className="w-4 h-4" /> Đăng nhập để tham gia trò chuyện
            </div>
          </div>
        ) : (
          <form onSubmit={handleSend} className="relative flex items-center gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Nhập tin nhắn của bạn..."
              maxLength={500}
              className="flex-1 bg-background/50 border border-border/50 rounded-2xl px-6 py-3.5 text-sm font-medium outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all pr-14"
            />
            <button
              disabled={isSending || !input.trim()}
              type="submit"
              className="absolute right-2 p-2.5 bg-primary text-primary-foreground rounded-xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all"
            >
              {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

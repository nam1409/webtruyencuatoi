"use client";

import { useState, useEffect } from "react";
import { MessageSquare, Send, X, User, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getCommentsByChapter, createComment } from "@/actions/comments";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

import { useReader } from "../context/ReaderContext";

interface CommentSidebarProps {
  chapterId: string;
  paragraphId: string | null;
  initialComments?: any[];
  onCommentAdded?: () => void;
  onClose: () => void;
}

export function CommentSidebar({ 
  chapterId, 
  paragraphId, 
  initialComments = [], 
  onCommentAdded,
  onClose 
}: CommentSidebarProps) {
  const { refreshComments } = useReader();
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState<any>(null);
  const [threadStack, setThreadStack] = useState<string[]>([]);

  // Organize comments into parent-child structure
  const rootComments = initialComments.filter(c => {
    const isRoot = !c.parent_id;
    if (paragraphId === "general") return isRoot && c.paragraph_id === null;
    return isRoot && c.paragraph_id === paragraphId;
  });

  const getReplies = (parentId: string) => {
    return initialComments.filter(c => c.parent_id === parentId);
  };

  const activeThreadId = threadStack[threadStack.length - 1] || null;
  const activeThread = activeThreadId ? initialComments.find(c => c.id === activeThreadId) : null;

  const handlePushThread = (id: string) => {
    setThreadStack(prev => [...prev, id]);
    setReplyTo(null);
  };

  const handlePopThread = () => {
    setThreadStack(prev => prev.slice(0, -1));
    setReplyTo(null);
  };

  const handleSubmit = async () => {
    if (!newComment.trim()) return;
    setIsSubmitting(true);
    try {
      await createComment({
        chapter_id: chapterId,
        paragraph_id: paragraphId === "general" ? undefined : (paragraphId || undefined),
        content: newComment,
        parent_id: replyTo?.id || activeThreadId || undefined
      });
      setNewComment("");
      setReplyTo(null);
      toast.success("Đã gửi bình luận");
      refreshComments();
      if (onCommentAdded) onCommentAdded();
    } catch (error: any) {
      toast.error(error.message || "Lỗi khi gửi bình luận");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!paragraphId) return null;

  return (
    <div className="flex flex-col h-full bg-background relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-border/50 bg-muted/20">
        <div className="flex items-center gap-3">
          {threadStack.length > 0 ? (
            <button 
              onClick={handlePopThread}
              className="p-2 bg-primary/10 text-primary rounded-xl hover:bg-primary hover:text-primary-foreground transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          ) : (
            <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-primary" />
            </div>
          )}
          <div>
            <h3 className="font-black text-[10px] uppercase tracking-[0.2em] text-foreground/80">
              {activeThreadId ? "Đang xem phản hồi" : (paragraphId === "general" ? "Bình luận chương" : `Bình luận đoạn`)}
            </h3>
            <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">
              {activeThreadId ? `Phản hồi của ${activeThread?.profiles?.display_name}` : (paragraphId === "general" ? "Thảo luận tổng quát" : "Thảo luận nội dung")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
           {threadStack.length > 0 && (
            <span className="px-2 py-1 bg-primary/10 text-primary text-[8px] font-black rounded-md">
              CẤP {threadStack.length}
            </span>
          )}
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-xl transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
        {activeThreadId && activeThread ? (
          <div key={activeThreadId} className="animate-in slide-in-from-right duration-500">
            <CommentItem 
              comment={activeThread} 
              replies={getReplies(activeThread.id)}
              onReply={(c) => setReplyTo(c)}
              onViewConversation={handlePushThread}
              isFocused={true}
              getReplies={getReplies}
            />
          </div>
        ) : rootComments.length === 0 ? (
          <div className="text-center py-32 px-10">
            <div className="w-16 h-16 bg-muted/30 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
              <MessageSquare className="w-8 h-8 text-muted-foreground/20" />
            </div>
            <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 mb-2">Chưa có bình luận</h4>
            <p className="text-[10px] text-muted-foreground/40 leading-relaxed italic">Hãy là người đầu tiên chia sẻ cảm nghĩ về đoạn văn này!</p>
          </div>
        ) : (
          <div className="animate-in fade-in duration-500">
            {rootComments.map((comment) => (
              <CommentItem 
                key={comment.id} 
                comment={comment} 
                replies={getReplies(comment.id)}
                onReply={(c) => setReplyTo(c)}
                onViewConversation={handlePushThread}
                getReplies={getReplies}
              />
            ))}
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-6 border-t border-border/50 bg-background/80 backdrop-blur-md sticky bottom-0 z-10">
        {replyTo && (
          <div className="flex items-center justify-between bg-primary/5 px-4 py-2 rounded-t-[1rem] border-x border-t border-primary/10 text-[10px] font-bold animate-in slide-in-from-bottom-2 duration-300">
            <span className="text-primary truncate">Đang trả lời @{replyTo.profiles?.display_name}</span>
            <button onClick={() => setReplyTo(null)} className="p-1 hover:bg-primary/10 rounded-full">
              <X className="w-3 h-3 text-primary" />
            </button>
          </div>
        )}
        <div className="relative">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={replyTo ? `Phản hồi bình luận...` : (activeThreadId ? `Trả lời vào phản hồi...` : "Viết bình luận của bạn...")}
            className={`w-full bg-muted/30 border border-border/50 rounded-[1.5rem] p-5 pr-14 text-xs font-medium focus:ring-4 focus:ring-primary/5 min-h-[100px] max-h-[200px] resize-none transition-all placeholder:text-muted-foreground/40 leading-relaxed ${replyTo ? 'rounded-t-none' : ''}`}
          />
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !newComment.trim()}
            className="absolute right-4 bottom-4 w-10 h-10 bg-primary text-primary-foreground rounded-xl shadow-xl shadow-primary/20 hover:scale-110 active:scale-95 transition-all disabled:opacity-20 flex items-center justify-center"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function CommentItem({ 
  comment, 
  replies = [], 
  onReply, 
  onViewConversation,
  getReplies,
  depth = 0,
  isFocused = false
}: { 
  comment: any, 
  replies?: any[], 
  onReply: (c: any) => void, 
  onViewConversation: (id: string) => void,
  getReplies: (id: string) => any[],
  depth?: number,
  isFocused?: boolean
}) {
  const hasMoreDepth = depth >= 2 && replies.length > 0;

  return (
    <div className={`space-y-4 mb-8 ${depth > 0 && !isFocused ? 'ml-6 mt-4 border-l-2 border-primary/10 pl-4' : ''}`}>
      <div className="group animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-muted overflow-hidden shrink-0 shadow-sm border border-border/50">
              {comment.profiles?.avatar_url ? (
                <img src={comment.profiles.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary/5">
                  <User className="w-4 h-4 text-primary/30" />
                </div>
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-foreground/80 uppercase tracking-tight">{comment.profiles?.display_name || "Ẩn danh"}</span>
              <span className="text-[8px] text-muted-foreground/60 font-bold uppercase tracking-widest">
                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: vi })}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {replies.length > 0 && !(isFocused && depth === 0) && (
              <button 
                onClick={() => onViewConversation(comment.id)}
                className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 hover:text-primary transition-all flex items-center gap-1"
              >
                Phản hồi ({replies.length})
                <ChevronRight className="w-3 h-3" />
              </button>
            )}
            <button 
              onClick={() => {
                onReply(comment);
                // Only drill down if we're replying to a child (not the current topic head)
                if (depth > 0) {
                  onViewConversation(comment.id);
                }
              }}
              className="text-[9px] font-black uppercase tracking-widest text-primary opacity-0 group-hover:opacity-100 transition-all hover:scale-105"
            >
              Trả lời
            </button>
          </div>
        </div>
        <div className={`p-4 rounded-[1.5rem] rounded-tl-none border transition-all shadow-sm ${isFocused ? 'bg-primary/5 border-primary/20 ring-4 ring-primary/5' : 'bg-muted/30 border-border/30 group-hover:border-primary/20'}`}>
          <p className="text-xs leading-relaxed text-foreground/90 font-medium">{comment.content}</p>
        </div>
      </div>

      {/* Render children replies only for the focused parent */}
      {isFocused && depth === 0 && replies.length > 0 && (
        <div className="space-y-2 mt-6">
          <div className="flex items-center gap-2 mb-4 px-2">
            <div className="h-px flex-1 bg-border/50" />
            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">Phản hồi ({replies.length})</span>
            <div className="h-px flex-1 bg-border/50" />
          </div>
          {replies.map(reply => (
            <CommentItem 
              key={reply.id} 
              comment={reply} 
              replies={getReplies(reply.id)}
              onReply={onReply} 
              onViewConversation={onViewConversation}
              getReplies={getReplies}
              depth={depth + 1} 
            />
          ))}
        </div>
      )}
    </div>
  );
}

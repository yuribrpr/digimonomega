import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Newspaper, Calendar, User, X, Pin, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from 'react-router-dom';
import api from '../services/api';
export default function NewsList({ className, limit = 10, showHeader = true, compact = false }) {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNews, setSelectedNews] = useState(null);
  const user = JSON.parse(localStorage.getItem('user'));
  const token = localStorage.getItem('token');
  const isLoggedIn = !!user && !!token;
  useEffect(() => {
    fetchNews();
  }, []);
  const fetchNews = async () => {
    try {
      const res = await api.get('/api/news');
      setNews(res.data.slice(0, limit));
    } catch (error) {
      console.error('Erro ao buscar notícias:', error);
    } finally {
      setLoading(false);
    }
  };
  const handleLike = async (e, newsId, isLike) => {
    e.stopPropagation();
    if (!isLoggedIn) {
        // Optional: Use a proper toast if available, or just nothing/alert
        // alert("Faça login para curtir"); 
        return;
    }
    try {
        // Toggle like no backend
        await api.post(`/api/news/${newsId}/like`, { is_like: isLike }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        // Fetch fresh data
        const res = await api.get('/api/news');
        const newNews = res.data.slice(0, limit);
        setNews(newNews);
        // If modal is open with this news item, update it immediately
        if (selectedNews && selectedNews.id === newsId) {
            const updatedItem = newNews.find(n => n.id === newsId);
            if (updatedItem) {
                setSelectedNews(updatedItem);
            }
        }
    } catch (error) {
        console.error("Error liking:", error);
    }
  };
  const RenderLikeSection = ({ item, className = "mt-3" }) => {
    const likes = item.interactions?.filter(i => i.is_like === 1) || [];
    const dislikes = item.interactions?.filter(i => i.is_like === 0) || [];
    const userInteraction = item.interactions?.find(i => i.user_id === user?.id);
    const userLiked = userInteraction?.is_like === 1;
    const userDisliked = userInteraction?.is_like === 0;
    const LikeList = ({ list, title }) => (
        <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title} ({list.length})</h4>
            {list.length === 0 ? (
                <p className="text-xs text-muted-foreground/50 italic">Ninguém ainda.</p>
            ) : (
                <ScrollArea className="h-32 pr-2">
                    <div className="space-y-2">
                        {list.map((u, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <Avatar className="h-5 w-5">
                                    <AvatarImage src={`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/${u.profile_image}`} alt={u.username} />
                                    <AvatarFallback className="text-[9px] bg-muted text-muted-foreground">{u.username.substring(0,2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                {isLoggedIn ? (
                                    <Link to={`/profile/${u.user_id}`} className="text-xs font-medium hover:underline hover:text-primary truncate">
                                        {u.username}
                                    </Link>
                                ) : (
                                    <span className="text-xs font-medium truncate">{u.username}</span>
                                )}
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            )}
        </div>
    );
    return (
        <div className={`flex items-center gap-1 ${className}`} onClick={(e) => e.stopPropagation()}>
           <HoverCard>
             <HoverCardTrigger asChild>
                <Button 
                    variant="ghost" 
                    size="sm" 
                    className={`gap-1.5 h-7 px-2.5 rounded-full text-xs hover:bg-green-500/10 hover:text-green-600 transition-colors ${userLiked ? 'text-green-600 bg-green-500/10 font-medium' : 'text-muted-foreground'}`}
                    onClick={(e) => handleLike(e, item.id, true)}
                    disabled={!isLoggedIn}
                >
                    <ThumbsUp className={`w-3.5 h-3.5 ${userLiked ? 'fill-current' : ''}`} />
                    <span>{item.likes_count || 0}</span>
                </Button>
             </HoverCardTrigger>
             <HoverCardContent className="w-56 p-3" align="start">
                <LikeList list={likes} title="Curtiram" />
             </HoverCardContent>
           </HoverCard>
           <HoverCard>
             <HoverCardTrigger asChild>
                <Button 
                    variant="ghost" 
                    size="sm" 
                    className={`gap-1.5 h-7 px-2.5 rounded-full text-xs hover:bg-red-500/10 hover:text-red-600 transition-colors ${userDisliked ? 'text-red-600 bg-red-500/10 font-medium' : 'text-muted-foreground'}`}
                    onClick={(e) => handleLike(e, item.id, false)}
                    disabled={!isLoggedIn}
                >
                    <ThumbsDown className={`w-3.5 h-3.5 ${userDisliked ? 'fill-current' : ''}`} />
                    <span>{item.dislikes_count || 0}</span>
                </Button>
             </HoverCardTrigger>
             <HoverCardContent className="w-56 p-3" align="start">
                 <LikeList list={dislikes} title="Não curtiram" />
             </HoverCardContent>
           </HoverCard>
        </div>
    );
  };
  if (loading) {
    return (
        <div className="p-8 text-center space-y-3 animate-pulse">
            <div className="h-4 bg-muted/50 rounded w-3/4 mx-auto"></div>
            <div className="h-4 bg-muted/30 rounded w-1/2 mx-auto"></div>
        </div>
    );
  }
  if (news.length === 0) return null;
  return (
    <>
      <Card className={`border-none shadow-none bg-transparent ${className}`}>
        {showHeader && (
          <CardHeader className="px-0 py-2 pb-6">
            <CardTitle className="text-base font-semibold flex items-center gap-2 text-foreground tracking-tight">
              <Newspaper className="w-5 h-5 text-primary" />
              Notícias & Eventos
            </CardTitle>
          </CardHeader>
        )}
        <CardContent className="p-0">
          <ScrollArea className="h-[350px] pr-4 -mr-4">
            <div className="space-y-4 pb-2">
              {news.map((item) => (
                <div 
                  key={item.id} 
                  onClick={() => setSelectedNews(item)}
                  className={`
                    group relative overflow-hidden rounded-xl border bg-card hover:bg-accent/50 hover:border-accent transition-all duration-300 cursor-pointer
                    ${compact ? 'p-4' : 'p-5'}
                  `}
                >
                  <div className="flex justify-between items-start gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      {(item.is_pinned === 1 || item.is_pinned === true) && (
                        <Badge variant="secondary" className="h-5 px-1.5 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20">
                           <Pin className="w-3 h-3 mr-1" />
                           Fixado
                        </Badge>
                      )}
                      <Badge 
                        variant="outline"
                        className={`
                            text-[10px] h-5 px-2 font-medium border-0
                            ${item.type === 'event' 
                                ? "bg-red-500/10 text-red-500 group-hover:bg-red-500/20" 
                                : "bg-blue-500/10 text-blue-500 group-hover:bg-blue-500/20"}
                        `}
                      >
                        {item.type === 'event' ? 'EVENTO' : 'NEWS'}
                      </Badge>
                      <span className="text-[11px] text-muted-foreground/80 flex items-center gap-1.5 font-medium">
                        <Calendar className="w-3 h-3" />
                        {new Date(item.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                  <h3 className="font-semibold text-base leading-snug mb-2 group-hover:text-primary transition-colors line-clamp-2">
                    {item.title}
                  </h3>
                  <div className="relative">
                    <div 
                      className="text-xs text-muted-foreground/80 prose prose-sm dark:prose-invert max-w-none line-clamp-2 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: item.content.replace(/<img[^>]*>/g, '') }}
                    />
                  </div>
                  <RenderLikeSection item={item} />
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
      <Dialog open={!!selectedNews} onOpenChange={(open) => !open && setSelectedNews(null)}>
        <DialogContent 
            className="max-w-4xl w-[95vw] h-[85vh] p-0 gap-0 flex flex-col overflow-hidden bg-background border-none shadow-2xl sm:rounded-2xl"
            aria-describedby="news-dialog-description"
        >
          {selectedNews && (
            <>
              <DialogDescription id="news-dialog-description" className="sr-only">
                Detalhes da notícia: {selectedNews.title}
              </DialogDescription>
              {/* Header Fixo */}
              <div className="shrink-0 p-6 pb-4 border-b bg-background/80 backdrop-blur-sm z-10 flex items-start justify-between gap-4">
                 <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                        <Badge 
                            variant="secondary" 
                            className={`
                                rounded-md px-2.5 py-0.5 text-xs font-semibold
                                ${selectedNews.type === 'event' 
                                    ? "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400" 
                                    : "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400"}
                            `}
                        >
                            {selectedNews.type === 'event' ? 'EVENTO' : 'NOTÍCIA'}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(selectedNews.created_at).toLocaleDateString('pt-BR', { 
                                day: '2-digit', 
                                month: 'long', 
                                year: 'numeric' 
                            })}
                        </span>
                    </div>
                    <DialogTitle className="text-xl md:text-2xl font-bold leading-tight tracking-tight break-words pr-2">
                        {selectedNews.title}
                    </DialogTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground pt-1">
                        <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-full">
                            <User className="w-3.5 h-3.5" />
                            <span className="text-xs font-medium">{selectedNews.publisher || 'Admin'}</span>
                        </div>
                        <RenderLikeSection item={selectedNews} className="ml-2 mt-0" />
                    </div>
                 </div>
                 <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 rounded-full -mr-2 text-muted-foreground hover:bg-muted shrink-0"
                    onClick={() => setSelectedNews(null)}
                 >
                    <X className="w-4 h-4" />
                 </Button>
              </div>
              {/* Conteúdo Scrollável */}
              <ScrollArea className="flex-1 w-full">
                  <div className="p-6 md:p-8 max-w-3xl mx-auto w-full">
                      <style>{`
                        .news-content {
                            overflow-wrap: anywhere;
                            word-break: break-word;
                            width: 100%;
                        }
                        .news-content * {
                            max-width: 100%;
                        }
                        .news-content img {
                            max-width: 100% !important;
                            height: auto !important;
                            border-radius: 0.75rem;
                            margin: 2rem auto;
                            display: block;
                            box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
                        }
                        .news-content p {
                            min-height: 1.75em;
                            margin-bottom: 1.25em;
                            line-height: 1.8;
                            color: hsl(var(--foreground) / 0.9);
                            overflow-wrap: anywhere;
                        }
                        .news-content h1, .news-content h2, .news-content h3, .news-content h4, .news-content h5, .news-content h6 {
                            margin-top: 2rem;
                            margin-bottom: 1rem;
                            font-weight: 700;
                            letter-spacing: -0.025em;
                            overflow-wrap: anywhere;
                            line-height: 1.3;
                        }
                        .news-content ul, .news-content ol {
                            padding-left: 1.5rem;
                            margin-bottom: 1.25em;
                        }
                        .news-content li {
                            margin-bottom: 0.5em;
                            overflow-wrap: anywhere;
                        }
                        .news-content a {
                            color: hsl(var(--primary));
                            text-decoration: underline;
                            text-underline-offset: 4px;
                            overflow-wrap: anywhere;
                            word-break: break-all;
                        }
                        .news-content blockquote {
                            border-left: 4px solid hsl(var(--primary));
                            padding-left: 1rem;
                            font-style: italic;
                            color: hsl(var(--muted-foreground));
                            overflow-wrap: anywhere;
                        }
                        .news-content pre, .news-content code {
                            white-space: pre-wrap;
                            word-break: break-all;
                            overflow-wrap: anywhere;
                            max-width: 100%;
                        }
                        .news-content table {
                            display: block;
                            width: 100%;
                            overflow-x: auto;
                            margin-bottom: 1.5rem;
                        }
                      `}</style>
                      <div 
                        className="prose prose-neutral dark:prose-invert max-w-none news-content text-sm md:text-base"
                        dangerouslySetInnerHTML={{ __html: selectedNews.content }}
                      />
                  </div>
              </ScrollArea>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

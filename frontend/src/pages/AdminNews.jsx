import React, { useState, useEffect } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, Newspaper, Calendar, User, Plus, Search, ChevronLeft, ChevronRight, X, Pin } from 'lucide-react';
import api from '../services/api';
export default function AdminNews() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(false);
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  // Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState('news');
  const [publisher, setPublisher] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  // Filter & Pagination State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  useEffect(() => {
    fetchNews();
  }, []);
  const fetchNews = async () => {
    try {
      const res = await api.get('/api/news');
      setNews(res.data);
    } catch (error) {
      console.error('Erro ao buscar notícias:', error);
    }
  };
  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingId(item.id);
      setTitle(item.title);
      setContent(item.content);
      setType(item.type);
      setPublisher(item.publisher);
      setIsPinned(item.is_pinned === 1 || item.is_pinned === true);
    } else {
      setEditingId(null);
      setTitle('');
      setContent('');
      setType('news');
      setPublisher('Admin');
      setIsPinned(false);
    }
    setIsModalOpen(true);
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        title,
        content,
        type,
        publisher,
        is_pinned: isPinned
      };
      if (editingId) {
        await api.put(`/api/news/${editingId}`, payload);
      } else {
        await api.post('/api/news', payload);
      }
      fetchNews();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Erro ao salvar notícia:', error);
    } finally {
      setLoading(false);
    }
  };
  const handleDelete = async (id) => {
    if (confirm('Tem certeza que deseja excluir esta notícia?')) {
      try {
        await api.delete(`/api/news/${id}`);
        fetchNews();
      } catch (error) {
        console.error('Erro ao deletar notícia:', error);
      }
    }
  };
  const stripImages = (html) => {
    if (!html) return '';
    return html.replace(/<img[^>]*>/g, '');
  };
  const filteredNews = news.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          stripImages(item.content).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || item.type === filterType;
    return matchesSearch && matchesType;
  });
  const totalPages = Math.ceil(filteredNews.length / itemsPerPage);
  const paginatedNews = filteredNews.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };
  return (
    <div className="container mx-auto p-6 space-y-8 max-w-5xl">
      <style>{`
        .ql-toolbar.ql-snow {
            border: none !important;
            border-bottom: 1px solid hsl(var(--border)) !important;
            background-color: transparent !important;
            padding: 16px !important;
        }
        .ql-container.ql-snow {
            border: none !important;
            background-color: transparent !important;
            color: hsl(var(--foreground)) !important;
            font-family: inherit !important;
            font-size: 1rem !important;
        }
        .ql-editor {
            padding: 24px !important;
            min-height: 300px;
            line-height: 1.75;
        }
        .ql-editor img {
            max-width: 100% !important;
            height: auto !important;
            border-radius: 0.5rem;
            margin: 1rem 0;
            display: block;
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
        }
        .ql-snow .ql-stroke {
            stroke: hsl(var(--muted-foreground)) !important;
        }
        .ql-snow .ql-fill {
            fill: hsl(var(--muted-foreground)) !important;
        }
        .ql-snow .ql-picker {
            color: hsl(var(--muted-foreground)) !important;
        }
      `}</style>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-lg">
                <Newspaper className="h-6 w-6 text-primary" />
            </div>
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Gerenciar Notícias</h1>
                <p className="text-sm text-muted-foreground">Publique e gerencie atualizações do jogo.</p>
            </div>
        </div>
        <Button onClick={() => handleOpenModal()} size="lg" className="gap-2 shadow-sm">
            <Plus className="h-4 w-4" />
            Nova Notícia
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-6">
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card p-1 rounded-xl border shadow-sm">
            <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Buscar notícias..." 
                    className="pl-9 border-0 bg-transparent focus-visible:ring-0" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto p-1">
                <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-[150px] border-0 bg-muted/50 hover:bg-muted focus:ring-0">
                        <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="news">Notícias</SelectItem>
                        <SelectItem value="event">Eventos</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
        {/* List */}
        <div className="space-y-4">
          {paginatedNews.length === 0 ? (
             <div className="text-center p-16 text-muted-foreground border border-dashed rounded-xl bg-muted/5">
                <Newspaper className="h-10 w-10 mx-auto mb-4 opacity-20" />
                <p>Nenhuma notícia encontrada</p>
             </div>
          ) : (
             paginatedNews.map((item) => (
              <Card key={item.id} className="overflow-hidden hover:shadow-md transition-all duration-300 group border-muted/60">
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        {(item.is_pinned === 1 || item.is_pinned === true) && (
                            <Pin className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                        )}
                        <Badge 
                            variant="secondary" 
                            className={`
                                text-[10px] h-5 px-2 font-medium
                                ${item.type === 'event' 
                                    ? "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400" 
                                    : "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"}
                            `}
                        >
                          {item.type === 'event' ? 'EVENTO' : 'NEWS'}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(item.created_at).toLocaleDateString('pt-BR')}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1 border-l pl-2 ml-1">
                            <User className="h-3 w-3" />
                            {item.publisher}
                        </span>
                      </div>
                      <h3 className="font-semibold text-lg tracking-tight group-hover:text-primary transition-colors">{item.title}</h3>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(item.id)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                  </div>
                  <div 
                    className="text-sm text-muted-foreground line-clamp-2 prose prose-sm dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: stripImages(item.content) }}
                  />
                  <div className="mt-4 flex justify-end">
                      <Button variant="link" size="sm" onClick={() => handleOpenModal(item)} className="text-primary p-0 h-auto font-medium">
                          Editar / Detalhes
                      </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
        {/* Pagination */}
        {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
                <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground font-medium px-2">
                    {currentPage} / {totalPages}
                </span>
                <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        )}
      </div>
      {/* Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl w-[95vw] h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-background border-none shadow-2xl sm:rounded-2xl">
            <DialogHeader className="p-6 pb-4 border-b bg-background/95 backdrop-blur z-10 shrink-0 flex flex-row items-center justify-between space-y-0">
                <div className="space-y-1">
                    <DialogTitle className="text-xl font-semibold">
                        {editingId ? 'Editar Publicação' : 'Nova Publicação'}
                    </DialogTitle>
                    <DialogDescription className="text-xs">
                        {editingId ? 'Faça alterações no conteúdo existente.' : 'Crie um novo evento ou notícia para a comunidade.'}
                    </DialogDescription>
                </div>
                {/* Close button is handled by DialogPrimitive usually, but adding a custom one if needed or relying on default X */}
            </DialogHeader>
            <ScrollArea className="flex-1 w-full">
                <div className="p-6 md:p-8 max-w-4xl mx-auto w-full">
                    <form id="news-form" onSubmit={handleSubmit} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="title" className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Título da Publicação</Label>
                                <Input
                                    id="title"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Ex: Manutenção Semanal"
                                    required
                                    className="font-medium text-lg h-12"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="publisher" className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Publicador</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="publisher"
                                        value={publisher}
                                        onChange={(e) => setPublisher(e.target.value)}
                                        placeholder="Admin"
                                        className="pl-9 h-12"
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Tipo</Label>
                            <div className="flex items-center gap-4">
                              <Select value={type} onValueChange={setType}>
                                  <SelectTrigger className="h-12 flex-1">
                                      <SelectValue placeholder="Selecione o tipo" />
                                  </SelectTrigger>
                                  <SelectContent>
                                      <SelectItem value="news">Notícia (Geral)</SelectItem>
                                      <SelectItem value="event">Evento (Destaque)</SelectItem>
                                  </SelectContent>
                              </Select>
                              <div className="flex items-center space-x-2 border rounded-md px-4 h-12 bg-card">
                                <Checkbox 
                                  id="isPinned" 
                                  checked={isPinned} 
                                  onCheckedChange={setIsPinned} 
                                />
                                <Label 
                                  htmlFor="isPinned" 
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                >
                                  Fixar no topo
                                </Label>
                              </div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Conteúdo</Label>
                                <span className="text-[10px] text-muted-foreground">*Arraste ou cole imagens diretamente</span>
                            </div>
                            <div className="rounded-lg border bg-card shadow-sm overflow-hidden focus-within:ring-1 focus-within:ring-ring transition-all">
                                <ReactQuill 
                                    theme="snow" 
                                    value={content} 
                                    onChange={setContent}
                                    className="min-h-[400px]"
                                    modules={{
                                        toolbar: [
                                            [{ 'header': [1, 2, 3, false] }],
                                            ['bold', 'italic', 'underline', 'strike'],
                                            [{ 'color': [] }, { 'background': [] }],
                                            [{'list': 'ordered'}, {'list': 'bullet'}],
                                            [{ 'align': [] }],
                                            ['link', 'image', 'video'],
                                            ['clean']
                                        ],
                                    }}
                                />
                            </div>
                        </div>
                    </form>
                </div>
            </ScrollArea>
            <DialogFooter className="p-6 pt-4 border-t bg-muted/5 shrink-0 gap-2">
                <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                <Button type="submit" form="news-form" disabled={loading} className="min-w-[120px]">
                    {loading ? 'Salvando...' : (editingId ? 'Salvar Alterações' : 'Publicar Agora')}
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

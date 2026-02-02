import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { ScrollArea } from '../components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Search, ShoppingBag, DollarSign, RefreshCw, XCircle, History, Tag, Bell, Info, ShieldCheck, AlertTriangle } from 'lucide-react';
import { Label } from '../components/ui/label';

const BlackTrade = () => {
    const [view, setView] = useState('market'); // market, sell, history
    const [listings, setListings] = useState([]);
    const [history, setHistory] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('all'); // all, item, digimon
    const [sort, setSort] = useState('newest');
    const [loading, setLoading] = useState(false);
    const [GekomonImage, setGekomonImage] = useState(null);

    // Sell Dialog State
    const [isSellOpen, setIsSellOpen] = useState(false);
    const [inventory, setInventory] = useState([]);
    const [myDigimons, setMyDigimons] = useState([]);
    const [sellType, setSellType] = useState('item');
    const [selectedItemToSell, setSelectedItemToSell] = useState(null);
    const [sellQuantity, setSellQuantity] = useState(1);
    const [sellPrice, setSellPrice] = useState(0);

    // Detail/Action Modal State
    const [selectedListing, setSelectedListing] = useState(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [actionType, setActionType] = useState(null); // 'buy', 'cancel'
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [buyQuantity, setBuyQuantity] = useState(1);

    const [userBits, setUserBits] = useState(0);
    const user = JSON.parse(localStorage.getItem('user'));

    useEffect(() => {
        fetchGekomon();
        fetchUserBits();
        fetchListings();
        fetchNotifications();
    }, []);

    useEffect(() => {
        if (view === 'history') {
            fetchHistory();
        } else {
            fetchListings();
        }
    }, [view, typeFilter, sort]);

    const getImageUrl = (path) => {
        if (!path) return '/placeholder.png';
        if (path.startsWith('http')) return path;
        return `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/${path}`;
    };

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/api/market/notifications');
            setNotifications(res.data);
        } catch (error) {
            console.error("Error fetching notifications", error);
        }
    };

    const markAsRead = async (id) => {
        try {
            await api.put(`/api/market/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
        } catch (error) {
            console.error("Error marking notification read", error);
        }
    };

    const fetchUserBits = async () => {
        try {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                const res = await api.get('/api/auth/me');
                setUserBits(res.data.bits);
                const user = JSON.parse(userStr);
                if (user.bits !== res.data.bits) {
                    user.bits = res.data.bits;
                    localStorage.setItem('user', JSON.stringify(user));
                }
            }
        } catch (error) {
            console.error("Error fetching bits", error);
        }
    };

    const fetchGekomon = async () => {
        try {
            const res = await api.get('/api/digimons');
            const Gekomon = res.data.find(d => d.name.toLowerCase() === 'gekomon');
            if (Gekomon) {
                setGekomonImage(getImageUrl(Gekomon.sprite_path));
            }
        } catch (error) {
            console.error("Error fetching Gekomon", error);
        }
    };

    const fetchListings = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/market/listings', {
                params: {
                    type: typeFilter !== 'all' ? typeFilter : undefined,
                    sort,
                    search
                }
            });
            setListings(res.data);
        } catch (error) {
            console.error("Error fetching listings", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/market/history');
            setHistory(res.data);
        } catch (error) {
            console.error("Error fetching history", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchInventoryData = async () => {
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            if (!user) return;
            
            const [itemsRes, digisRes] = await Promise.all([
                api.get(`/api/items/user/${user.id}`),
                api.get(`/api/users/${user.id}/digimons`)
            ]);
            
            const formattedItems = itemsRes.data.map(item => ({
                ...item,
                image: getImageUrl(item.icon)
            }));

            const formattedDigimons = digisRes.data
                .filter(d => !d.is_main && !d.is_in_market)
                .map(digi => ({
                    ...digi,
                    image: getImageUrl(digi.sprite_path),
                    id: digi.user_digimon_id 
                }));

            setInventory(formattedItems);
            setMyDigimons(formattedDigimons);
        } catch (error) {
            console.error("Error fetching inventory", error);
        }
    };

    const handleSell = async () => {
        if (!selectedItemToSell || sellPrice <= 0) return;
        
        try {
            if (sellType === 'item') {
                await api.post('/api/market/sell/item', {
                    itemId: selectedItemToSell.item_id,
                    quantity: sellQuantity,
                    price: sellPrice
                });
            } else {
                await api.post('/api/market/sell/digimon', {
                    digimonId: selectedItemToSell.id,
                    price: sellPrice
                });
            }
            setIsSellOpen(false);
            fetchListings();
            fetchUserBits();
        } catch (error) {
            console.error("Error selling", error);
        }
    };

    const openConfirmModal = (listing, type) => {
        setSelectedListing(listing);
        setActionType(type);
        setIsConfirmOpen(true);
    };

    const executeAction = async () => {
        if (!selectedListing || !actionType) return;
        
        try {
            if (actionType === 'buy') {
                await api.post(`/api/market/buy/${selectedListing.id}`, {
                    quantity: buyQuantity
                });
                fetchUserBits();
            } else if (actionType === 'cancel') {
                await api.post(`/api/market/cancel/${selectedListing.id}`);
            }
            fetchListings();
            setIsConfirmOpen(false);
            setIsDetailOpen(false);
            setBuyQuantity(1);
        } catch (error) {
            console.error(`Error ${actionType}ing`, error);
        }
    };

    const openDetailModal = (listing) => {
        setSelectedListing(listing);
        setBuyQuantity(1);
        setIsDetailOpen(true);
    };

    return (
        <div className="container mx-auto p-4 space-y-8 max-w-7xl">
            {/* Header Section */}
            <div className="relative overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                <div className="absolute inset-0 bg-gradient-to-r from-slate-900/50 to-slate-800/50 z-0" />
                <div className="relative z-10 p-6 flex flex-col md:flex-row items-center gap-8">
                    <div className="relative shrink-0">
                        <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-background bg-secondary flex items-center justify-center overflow-hidden shadow-xl">
                            {GekomonImage ? (
                                <img src={GekomonImage} alt="Gekomon" className="w-full h-full object-cover scale-110" />
                            ) : (
                                <ShoppingBag className="w-12 h-12 text-muted-foreground" />
                            )}
                        </div>
                        <div className="absolute -bottom-2 -right-2 bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded-full shadow-lg border-2 border-background">
                            NPC
                        </div>
                    </div>
                    <div className="flex-1 text-center md:text-left space-y-2">
                        <div className="flex items-center justify-center md:justify-start gap-3">
                            <h1 className="text-3xl font-bold tracking-tight">Black Trade</h1>
                            <Badge variant="outline" className="border-yellow-500/50 text-yellow-500">
                                <ShieldCheck className="w-3 h-3 mr-1" /> Verified
                            </Badge>
                        </div>
                        <p className="text-muted-foreground max-w-2xl">
                            Bem-vindo ao mercado negro digital. Todas as transações são seguras e gerenciadas pela equipe Gekomon.
                            Negocie itens raros e Digimons poderosos com outros Tamers.
                        </p>
                    </div>
                    <div className="flex flex-col items-end gap-3">
                        <div className="flex items-center gap-2 bg-background/50 backdrop-blur-sm px-4 py-2 rounded-lg border shadow-sm">
                            <DollarSign className="w-5 h-5 text-yellow-500" />
                            <span className="font-mono text-xl font-bold">{userBits.toLocaleString()}</span>
                            <span className="text-xs text-muted-foreground uppercase">Bits</span>
                        </div>
                        <Dialog open={isNotificationsOpen} onOpenChange={setIsNotificationsOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm" className="gap-2 relative" onClick={fetchNotifications}>
                                    <Bell className="w-4 h-4" />
                                    Notificações
                                    {notifications.some(n => !n.is_read) && (
                                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse ring-2 ring-background" />
                                    )}
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Notificações de Mercado</DialogTitle>
                                </DialogHeader>
                                <ScrollArea className="h-[300px] w-full pr-4">
                                    <div className="space-y-3">
                                        {notifications.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                                                <Bell className="w-8 h-8 mb-2 opacity-20" />
                                                <p>Nenhuma notificação.</p>
                                            </div>
                                        ) : (
                                            notifications.map(n => (
                                                <div 
                                                    key={n.id} 
                                                    className={`p-3 rounded-lg border transition-colors cursor-pointer ${n.is_read ? 'bg-secondary/20 border-border' : 'bg-secondary/50 border-primary/20 hover:bg-secondary'}`}
                                                    onClick={() => !n.is_read && markAsRead(n.id)}
                                                >
                                                    <p className="text-sm">{n.message}</p>
                                                    <p className="text-xs text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString()}</p>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </ScrollArea>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </div>

            {/* Main Content Tabs */}
            <Tabs defaultValue="market" value={view} onValueChange={setView} className="space-y-6">
                <div className="flex items-center justify-between">
                    <TabsList className="grid w-full max-w-md grid-cols-3">
                        <TabsTrigger value="market" className="gap-2">
                            <ShoppingBag className="w-4 h-4" /> Mercado
                        </TabsTrigger>
                        <TabsTrigger value="sell" className="gap-2">
                            <Tag className="w-4 h-4" /> Meus Anúncios
                        </TabsTrigger>
                        <TabsTrigger value="history" className="gap-2">
                            <History className="w-4 h-4" /> Histórico
                        </TabsTrigger>
                    </TabsList>

                    {view === 'market' && (
                        <div className="flex gap-2">
                            <Button onClick={fetchListings} variant="outline" size="icon" title="Atualizar">
                                <RefreshCw className="w-4 h-4" />
                            </Button>
                        </div>
                    )}
                </div>

                {/* Market Tab */}
                <TabsContent value="market" className="space-y-6">
                    <div className="flex flex-col md:flex-row gap-4 bg-card p-4 rounded-lg border shadow-sm">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Buscar itens ou digimons..." 
                                className="pl-9"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && fetchListings()}
                            />
                        </div>
                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Tipo" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos</SelectItem>
                                <SelectItem value="item">Itens</SelectItem>
                                <SelectItem value="digimon">Digimons</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={sort} onValueChange={setSort}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Ordenar" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="newest">Mais Recentes</SelectItem>
                                <SelectItem value="price_asc">Preço (Menor)</SelectItem>
                                <SelectItem value="price_desc">Preço (Maior)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {[1, 2, 3, 4].map(i => (
                                <Card key={i} className="h-64 animate-pulse bg-muted/50" />
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {listings.length === 0 ? (
                                <div className="col-span-full flex flex-col items-center justify-center py-20 text-muted-foreground">
                                    <ShoppingBag className="w-16 h-16 mb-4 opacity-20" />
                                    <h3 className="text-lg font-medium">Mercado Vazio</h3>
                                    <p>Nenhum item encontrado com os filtros atuais.</p>
                                </div>
                            ) : (
                                listings.map(listing => (
                                    <Card 
                                        key={listing.id} 
                                        className="group hover:border-primary/50 transition-all hover:shadow-lg cursor-pointer overflow-hidden"
                                        onClick={() => openDetailModal(listing)}
                                    >
                                        <CardHeader className="p-4 pb-2 space-y-2">
                                            <div className="flex justify-between items-start">
                                                <Badge variant={listing.listing_type === 'digimon' ? 'default' : 'secondary'} className="uppercase text-[10px] tracking-wider">
                                                    {listing.listing_type}
                                                </Badge>
                                                {listing.seller_id === user?.id && (
                                                    <Badge variant="outline" className="text-[10px] border-green-500/50 text-green-500">
                                                        Seu Anúncio
                                                    </Badge>
                                                )}
                                            </div>
                                            <CardTitle className="text-base truncate">
                                                {listing.listing_type === 'item' ? listing.item_name : (listing.digimon_nickname || listing.digimon_name)}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-4 pt-2">
                                            <div className="aspect-square bg-secondary/30 rounded-lg flex items-center justify-center p-4 mb-4 group-hover:scale-105 transition-transform duration-500">
                                                <img 
                                                    src={getImageUrl(listing.listing_type === 'item' ? listing.item_image : listing.digimon_image)} 
                                                    alt="Icon" 
                                                    className="w-full h-full object-contain drop-shadow-md"
                                                    onError={(e) => e.target.src = '/placeholder.png'}
                                                />
                                            </div>
                                            <div className="flex justify-between items-end">
                                                <div className="text-xs text-muted-foreground">
                                                    <p>Vendedor: {listing.seller_name}</p>
                                                    {listing.listing_type === 'item' ? (
                                                        <p>Qtd: <span className="text-foreground font-medium">{listing.quantity}</span></p>
                                                    ) : (
                                                        <p>Lvl: <span className="text-foreground font-medium">{listing.digimon_level}</span></p>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1 font-bold text-yellow-500">
                                                    <DollarSign className="w-4 h-4" />
                                                    {listing.price.toLocaleString()}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </div>
                    )}
                </TabsContent>

                {/* Sell Tab */}
                <TabsContent value="sell" className="space-y-6">
                    <div className="flex justify-between items-center bg-card p-6 rounded-lg border shadow-sm">
                        <div>
                            <h2 className="text-xl font-bold">Gerenciar Vendas</h2>
                            <p className="text-sm text-muted-foreground">Coloque itens à venda ou gerencie seus anúncios ativos.</p>
                        </div>
                        <Dialog open={isSellOpen} onOpenChange={setIsSellOpen}>
                            <DialogTrigger asChild>
                                <Button onClick={fetchInventoryData} size="lg" className="gap-2 shadow-lg hover:shadow-primary/20">
                                    <Tag className="w-4 h-4" /> Novo Anúncio
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[500px]">
                                <DialogHeader>
                                    <DialogTitle>Criar Anúncio</DialogTitle>
                                    <DialogDescription>Selecione um item ou Digimon para vender no mercado.</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-6 py-4">
                                    <div className="flex p-1 bg-secondary rounded-lg">
                                        <Button 
                                            variant={sellType === 'item' ? 'default' : 'ghost'} 
                                            onClick={() => { setSellType('item'); setSelectedItemToSell(null); }}
                                            className="flex-1 rounded-md"
                                        >
                                            Item
                                        </Button>
                                        <Button 
                                            variant={sellType === 'digimon' ? 'default' : 'ghost'} 
                                            onClick={() => { setSellType('digimon'); setSelectedItemToSell(null); }}
                                            className="flex-1 rounded-md"
                                        >
                                            Digimon
                                        </Button>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Selecione o {sellType === 'item' ? 'Item' : 'Digimon'}</Label>
                                        <Select onValueChange={(val) => {
                                            const list = sellType === 'item' ? inventory : myDigimons;
                                            const item = list.find(i => (sellType === 'item' ? i.id.toString() : i.id.toString()) === val);
                                            setSelectedItemToSell(item);
                                        }}>
                                            <SelectTrigger>
                                                <SelectValue placeholder={`Escolha um ${sellType === 'item' ? 'item' : 'Digimon'}...`} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {sellType === 'item' ? (
                                                    inventory.map(item => (
                                                        <SelectItem key={item.id} value={item.id.toString()}>
                                                            {item.name} (x{item.quantity})
                                                        </SelectItem>
                                                    ))
                                                ) : (
                                                    myDigimons.map(digi => (
                                                        <SelectItem key={digi.id} value={digi.id.toString()}>
                                                            {digi.nickname || digi.name} (Lvl {digi.level})
                                                        </SelectItem>
                                                    ))
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {selectedItemToSell && (
                                        <div className="flex items-center gap-4 bg-secondary/30 p-4 rounded-lg border">
                                            <img 
                                                src={selectedItemToSell.image} 
                                                alt="Selected" 
                                                className="w-16 h-16 object-contain"
                                            />
                                            <div>
                                                <p className="font-bold">{selectedItemToSell.name || selectedItemToSell.nickname}</p>
                                                {sellType === 'item' && <p className="text-sm text-muted-foreground">{selectedItemToSell.description}</p>}
                                                {sellType === 'digimon' && <p className="text-sm text-muted-foreground">Level {selectedItemToSell.level} • {selectedItemToSell.type}</p>}
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-4">
                                        {sellType === 'item' && (
                                            <div className="space-y-2">
                                                <Label>Quantidade</Label>
                                                <Input 
                                                    type="number" 
                                                    min="1" 
                                                    max={selectedItemToSell?.quantity || 1}
                                                    value={sellQuantity}
                                                    onChange={(e) => setSellQuantity(parseInt(e.target.value))}
                                                />
                                            </div>
                                        )}
                                        <div className="space-y-2 col-span-full">
                                            <Label>Preço por Unidade (Bits)</Label>
                                            <div className="relative">
                                                <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                <Input 
                                                    type="number" 
                                                    min="1" 
                                                    className="pl-9"
                                                    value={sellPrice}
                                                    onChange={(e) => setSellPrice(parseInt(e.target.value))}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsSellOpen(false)}>Cancelar</Button>
                                    <Button onClick={handleSell} disabled={!selectedItemToSell || sellPrice <= 0}>
                                        Confirmar Venda
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {listings.filter(l => l.seller_id === user?.id).map(listing => (
                            <Card key={listing.id} className="relative overflow-hidden border-l-4 border-l-primary">
                                <CardHeader className="p-4 pb-2">
                                    <CardTitle className="text-base truncate">
                                        {listing.listing_type === 'item' ? listing.item_name : (listing.digimon_nickname || listing.digimon_name)}
                                    </CardTitle>
                                    <CardDescription>
                                        {new Date(listing.created_at).toLocaleDateString()}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="p-4 pt-2">
                                    <div className="flex gap-4">
                                        <img 
                                            src={getImageUrl(listing.listing_type === 'item' ? listing.item_image : listing.digimon_image)} 
                                            className="w-12 h-12 object-contain bg-secondary rounded-md p-1"
                                        />
                                        <div>
                                            <div className="text-yellow-500 font-bold flex items-center">
                                                <DollarSign className="w-3 h-3" /> {listing.price.toLocaleString()}
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {listing.listing_type === 'item' ? `Qtd: ${listing.quantity}` : `Lvl: ${listing.digimon_level}`}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="p-4 pt-0">
                                    <Button 
                                        variant="destructive" 
                                        size="sm" 
                                        className="w-full"
                                        onClick={() => openConfirmModal(listing, 'cancel')}
                                    >
                                        Cancelar Anúncio
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                {/* History Tab */}
                <TabsContent value="history">
                    <Card>
                        <CardHeader>
                            <CardTitle>Histórico de Transações</CardTitle>
                            <CardDescription>Veja seus itens vendidos e ganhos passados.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-[500px]">
                                <div className="space-y-4">
                                    {history.map(h => {
                                        const isBuyer = h.buyer_id === user?.id;
                                        // const isSeller = h.seller_id === user?.id;
                                        const isSold = h.status === 'sold';
                                        const isCancelled = h.status === 'cancelled';

                                        let statusColor = 'bg-gray-500/10 text-gray-500';
                                        let StatusIcon = Info;
                                        let statusText = '';

                                        if (isCancelled) {
                                            statusColor = 'bg-red-500/10 text-red-500';
                                            StatusIcon = XCircle;
                                            statusText = 'Cancelado/Removido';
                                        } else if (isSold) {
                                            if (isBuyer) {
                                                statusColor = 'bg-blue-500/10 text-blue-500';
                                                StatusIcon = ShoppingBag;
                                                statusText = `Comprado de ${h.seller_name || 'Desconhecido'}`;
                                            } else {
                                                statusColor = 'bg-green-500/10 text-green-500';
                                                StatusIcon = DollarSign;
                                                statusText = `Vendido para ${h.buyer_name || 'Desconhecido'}`;
                                            }
                                        }

                                        return (
                                            <div key={h.id} className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-secondary/20 transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <div className={`p-2 rounded-full ${statusColor}`}>
                                                        <StatusIcon className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">
                                                            {h.listing_type === 'item' ? h.item_name : h.digimon_name}
                                                        </p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {statusText}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className={`font-bold ${isBuyer ? 'text-red-500' : 'text-green-500'}`}>
                                                        {isBuyer ? '-' : '+'}{h.price.toLocaleString()} Bits
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">{new Date(h.created_at).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {history.length === 0 && (
                                        <p className="text-center py-10 text-muted-foreground">Nenhum histórico disponível.</p>
                                    )}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Detailed View Modal */}
            <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    {selectedListing && (
                        <>
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    {selectedListing.listing_type === 'item' ? selectedListing.item_name : (selectedListing.digimon_nickname || selectedListing.digimon_name)}
                                    <Badge variant="outline">{selectedListing.listing_type.toUpperCase()}</Badge>
                                </DialogTitle>
                            </DialogHeader>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                                <div className="aspect-square bg-secondary/30 rounded-xl flex items-center justify-center p-8 border">
                                    <img 
                                        src={getImageUrl(selectedListing.listing_type === 'item' ? selectedListing.item_image : selectedListing.digimon_image)} 
                                        className="w-full h-full object-contain drop-shadow-2xl"
                                        onError={(e) => e.target.src = '/placeholder.png'}
                                    />
                                </div>
                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <h4 className="text-sm font-medium text-muted-foreground">Vendedor</h4>
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                <span className="font-bold text-primary">{selectedListing.seller_name[0].toUpperCase()}</span>
                                            </div>
                                            <span className="font-medium">{selectedListing.seller_name}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-1">
                                        <h4 className="text-sm font-medium text-muted-foreground">Preço por Unidade</h4>
                                        <div className="text-2xl font-bold text-yellow-500 flex items-center gap-1">
                                            <DollarSign className="w-6 h-6" />
                                            {selectedListing.price.toLocaleString()}
                                        </div>
                                    </div>

                                    {selectedListing.listing_type === 'item' ? (
                                        <div className="space-y-1">
                                            <h4 className="text-sm font-medium text-muted-foreground">Detalhes</h4>
                                            <p className="text-sm">{selectedListing.item_description || 'Sem descrição disponível.'}</p>
                                            <p className="text-sm mt-2">Disponível: <b>{selectedListing.quantity}</b></p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <h4 className="text-sm font-medium text-muted-foreground">Estatísticas</h4>
                                            <div className="grid grid-cols-2 gap-3 text-sm">
                                                <div className="flex flex-col bg-secondary/50 p-2 rounded border border-border/50">
                                                    <span className="text-xs text-muted-foreground uppercase tracking-wider">Level</span>
                                                    <span className="font-bold text-lg">{selectedListing.digimon_level}</span>
                                                </div>
                                                <div className="flex flex-col bg-secondary/50 p-2 rounded border border-border/50">
                                                    <span className="text-xs text-muted-foreground uppercase tracking-wider">HP</span>
                                                    <div className="flex items-center gap-1">
                                                        <span className="font-bold text-lg">{selectedListing.digimon_hp}</span>
                                                        {selectedListing.digimon_extra_hp > 0 && (
                                                            <span className="text-xs text-green-500 font-bold">+{selectedListing.digimon_extra_hp}</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex flex-col bg-secondary/50 p-2 rounded border border-border/50">
                                                    <span className="text-xs text-muted-foreground uppercase tracking-wider">ATK</span>
                                                    <div className="flex items-center gap-1">
                                                        <span className="font-bold text-lg">{selectedListing.digimon_attack}</span>
                                                        {selectedListing.digimon_extra_attack > 0 && (
                                                            <span className="text-xs text-green-500 font-bold">+{selectedListing.digimon_extra_attack}</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex flex-col bg-secondary/50 p-2 rounded border border-border/50">
                                                    <span className="text-xs text-muted-foreground uppercase tracking-wider">DEF</span>
                                                    <div className="flex items-center gap-1">
                                                        <span className="font-bold text-lg">{selectedListing.digimon_defense}</span>
                                                        {selectedListing.digimon_extra_defense > 0 && (
                                                            <span className="text-xs text-green-500 font-bold">+{selectedListing.digimon_extra_defense}</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex flex-col bg-secondary/50 p-2 rounded border border-border/50">
                                                    <span className="text-xs text-muted-foreground uppercase tracking-wider">SPD</span>
                                                    <span className="font-bold text-lg">{selectedListing.digimon_speed}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <DialogFooter className="flex gap-2 sm:justify-between items-center">
                                <Button variant="ghost" onClick={() => setIsDetailOpen(false)}>Fechar</Button>
                                {selectedListing.seller_id !== user?.id ? (
                                    <div className="flex items-center gap-2 w-full sm:w-auto">
                                        {selectedListing.listing_type === 'item' && (
                                            <div className="flex items-center gap-2 mr-2">
                                                <Label className="whitespace-nowrap">Qtd:</Label>
                                                <Input 
                                                    type="number" 
                                                    min="1" 
                                                    max={selectedListing.quantity}
                                                    value={buyQuantity}
                                                    onChange={(e) => setBuyQuantity(Math.min(selectedListing.quantity, Math.max(1, parseInt(e.target.value) || 1)))}
                                                    className="w-20"
                                                />
                                            </div>
                                        )}
                                        <Button 
                                            className="w-full sm:w-auto bg-yellow-600 hover:bg-yellow-700 text-white"
                                            onClick={() => openConfirmModal(selectedListing, 'buy')}
                                        >
                                            Comprar {selectedListing.listing_type === 'item' && buyQuantity > 1 ? `(${buyQuantity})` : ''}
                                        </Button>
                                    </div>
                                ) : (
                                    <Button 
                                        variant="destructive"
                                        className="w-full sm:w-auto"
                                        onClick={() => openConfirmModal(selectedListing, 'cancel')}
                                    >
                                        Cancelar Anúncio
                                    </Button>
                                )}
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* Confirmation Modal */}
            <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-yellow-500" />
                            Confirmar Ação
                        </DialogTitle>
                        <DialogDescription>
                                {actionType === 'buy' 
                                    ? `Você está prestes a gastar ${(selectedListing?.price * buyQuantity).toLocaleString()} bits para comprar ${buyQuantity}x ${selectedListing.listing_type === 'item' ? selectedListing.item_name : (selectedListing.digimon_nickname || selectedListing.digimon_name)}. Esta ação não pode ser desfeita.` 
                                    : 'Tem certeza que deseja remover este anúncio do mercado?'}
                            </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsConfirmOpen(false)}>Cancelar</Button>
                        <Button 
                            variant={actionType === 'buy' ? 'default' : 'destructive'}
                            onClick={executeAction}
                        >
                            Confirmar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default BlackTrade;
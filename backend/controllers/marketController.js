const db = require('../config/knex');

exports.getListings = async (req, res) => {
    try {
        const { type, sort, search } = req.query;

        let query = db('market_listings')
            .join('users as seller', 'market_listings.seller_id', 'seller.id')
            .leftJoin('items', 'market_listings.item_id', 'items.id')
            .leftJoin('user_digimons', 'market_listings.digimon_id', 'user_digimons.id')
            .leftJoin('digidex', 'user_digimons.digidex_id', 'digidex.id')
            .select(
                'market_listings.*',
                'seller.username as seller_name',
                'items.name as item_name',
                'items.icon as item_image',
                'items.description as item_description',
                'digidex.name as digimon_name',
                'digidex.sprite_path as digimon_image',
                'user_digimons.level as digimon_level',
                'user_digimons.nickname as digimon_nickname',
                'user_digimons.attack as digimon_attack',
                'user_digimons.defense as digimon_defense',
                'user_digimons.attack_speed as digimon_speed',
                'user_digimons.max_hp as digimon_hp',
                'user_digimons.extra_attack as digimon_extra_attack',
                'user_digimons.extra_defense as digimon_extra_defense',
                'user_digimons.extra_hp as digimon_extra_hp'
            )
            .where('market_listings.status', 'active');

        if (type) {
            query = query.where('market_listings.listing_type', type);
        }

        if (search) {
            query = query.where(builder => {
                builder.where('items.name', 'like', `%${search}%`)
                       .orWhere('digidex.name', 'like', `%${search}%`)
                       .orWhere('user_digimons.nickname', 'like', `%${search}%`);
            });
        }

        if (sort === 'price_asc') {
            query = query.orderBy('market_listings.price', 'asc');
        } else if (sort === 'price_desc') {
            query = query.orderBy('market_listings.price', 'desc');
        } else {
            query = query.orderBy('market_listings.created_at', 'desc');
        }

        const listings = await query;
        res.json(listings);
    } catch (error) {
        console.error('Error fetching listings:', error);
        res.status(500).json({ message: 'Erro ao buscar anúncios' });
    }
};

exports.getUserHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        const history = await db('market_listings')
            .leftJoin('items', 'market_listings.item_id', 'items.id')
            .leftJoin('user_digimons', 'market_listings.digimon_id', 'user_digimons.id')
            .leftJoin('digidex', 'user_digimons.digidex_id', 'digidex.id')
            .leftJoin('users as buyer', 'market_listings.buyer_id', 'buyer.id')
            .leftJoin('users as seller', 'market_listings.seller_id', 'seller.id')
            .select(
                'market_listings.*',
                'items.name as item_name',
                'digidex.name as digimon_name',
                'buyer.username as buyer_name',
                'seller.username as seller_name'
            )
            .where(builder => {
                builder.where('market_listings.seller_id', userId)
                       .orWhere('market_listings.buyer_id', userId);
            })
            .orderBy('market_listings.created_at', 'desc');
            
        res.json(history);
    } catch (error) {
        console.error('Error fetching history:', error);
        res.status(500).json({ message: 'Erro ao buscar histórico' });
    }
};

exports.sellItem = async (req, res) => {
    const { itemId, quantity, price } = req.body;
    const userId = req.user.id;

    if (!itemId || !quantity || !price || quantity <= 0 || price <= 0) {
        return res.status(400).json({ message: 'Dados inválidos' });
    }

    const trx = await db.transaction();

    try {
        // Check inventory
        const inventoryItem = await trx('inventory')
            .where({ user_id: userId, item_id: itemId })
            .first();

        if (!inventoryItem || inventoryItem.quantity < quantity) {
            await trx.rollback();
            return res.status(400).json({ message: 'Quantidade insuficiente' });
        }

        // Deduct from inventory
        if (inventoryItem.quantity === quantity) {
            await trx('inventory').where({ id: inventoryItem.id }).del();
        } else {
            await trx('inventory')
                .where({ id: inventoryItem.id })
                .decrement('quantity', quantity);
        }

        // Create listing
        await trx('market_listings').insert({
            seller_id: userId,
            listing_type: 'item',
            item_id: itemId,
            quantity,
            price
        });

        await trx.commit();
        res.status(201).json({ message: 'Item anunciado com sucesso' });
    } catch (error) {
        await trx.rollback();
        console.error('Error listing item:', error);
        res.status(500).json({ message: 'Erro ao anunciar item' });
    }
};

exports.sellDigimon = async (req, res) => {
    const { digimonId, price } = req.body;
    const userId = req.user.id;

    if (!digimonId || !price || price <= 0) {
        return res.status(400).json({ message: 'Dados inválidos' });
    }

    const trx = await db.transaction();

    try {
        const digimon = await trx('user_digimons')
            .where({ id: digimonId, user_id: userId })
            .first();

        if (!digimon) {
            await trx.rollback();
            return res.status(404).json({ message: 'Digimon não encontrado' });
        }

        if (digimon.is_main) {
            await trx.rollback();
            return res.status(400).json({ message: 'Não é possível vender o Digimon principal' });
        }

        if (digimon.is_in_market) {
            await trx.rollback();
            return res.status(400).json({ message: 'Digimon já está no mercado' });
        }

        // Mark as in market
        await trx('user_digimons')
            .where({ id: digimonId })
            .update({ is_in_market: true });

        // Create listing
        await trx('market_listings').insert({
            seller_id: userId,
            listing_type: 'digimon',
            digimon_id: digimonId,
            price
        });

        await trx.commit();
        res.status(201).json({ message: 'Digimon anunciado com sucesso' });
    } catch (error) {
        await trx.rollback();
        console.error('Error listing digimon:', error);
        res.status(500).json({ message: 'Erro ao anunciar Digimon' });
    }
};

exports.buyListing = async (req, res) => {
    const { listingId } = req.params;
    const { quantity } = req.body;
    const userId = req.user.id;

    const trx = await db.transaction();

    try {
        const listing = await trx('market_listings')
            .where({ id: listingId, status: 'active' })
            .first();

        if (!listing) {
            await trx.rollback();
            return res.status(404).json({ message: 'Anúncio não encontrado ou já vendido' });
        }

        if (listing.seller_id === userId) {
            await trx.rollback();
            return res.status(400).json({ message: 'Não é possível comprar seu próprio anúncio' });
        }

        const buyQuantity = listing.listing_type === 'item' ? (quantity || 1) : 1;

        if (listing.listing_type === 'item' && (buyQuantity <= 0 || buyQuantity > listing.quantity)) {
            await trx.rollback();
            return res.status(400).json({ message: 'Quantidade inválida' });
        }

        const totalPrice = listing.price * buyQuantity;

        const buyer = await trx('users').where({ id: userId }).first();
        if (buyer.bits < totalPrice) {
            await trx.rollback();
            return res.status(400).json({ message: 'Bits insuficientes' });
        }

        // Transfer bits
        await trx('users').where({ id: userId }).decrement('bits', totalPrice);
        await trx('users').where({ id: listing.seller_id }).increment('bits', totalPrice);

        // Update listing
        if (listing.listing_type === 'item') {
            // Decrement quantity from original listing
            await trx('market_listings')
                .where({ id: listingId })
                .decrement('quantity', buyQuantity);
            
            // Check if fully sold
            const updatedListing = await trx('market_listings').where({ id: listingId }).first();
            if (updatedListing.quantity === 0) {
                await trx('market_listings').where({ id: listingId }).update({ status: 'sold_out' });
            }

            // Create a record for the sold portion (for history)
            await trx('market_listings').insert({
                seller_id: listing.seller_id,
                buyer_id: userId,
                listing_type: 'item',
                item_id: listing.item_id,
                quantity: buyQuantity,
                price: totalPrice, // History stores total price of transaction
                status: 'sold',
                sold_at: db.fn.now(),
                created_at: listing.created_at // Keep original creation date or use now? Using now for transaction time
            });

            // Transfer item to buyer inventory
            const existingItem = await trx('inventory')
                .where({ user_id: userId, item_id: listing.item_id })
                .first();

            if (existingItem) {
                await trx('inventory')
                    .where({ id: existingItem.id })
                    .increment('quantity', buyQuantity);
            } else {
                await trx('inventory').insert({
                    user_id: userId,
                    item_id: listing.item_id,
                    quantity: buyQuantity
                });
            }
        } else if (listing.listing_type === 'digimon') {
            await trx('market_listings')
                .where({ id: listingId })
                .update({
                    status: 'sold',
                    buyer_id: userId,
                    sold_at: db.fn.now()
                });

            await trx('user_digimons')
                .where({ id: listing.digimon_id })
                .update({
                    user_id: userId,
                    is_in_market: false,
                    is_main: false
                });
        }

        // Notification
        await trx('market_notifications').insert([
            {
                user_id: listing.seller_id,
                message: `Você vendeu ${buyQuantity}x unidade(s) por ${totalPrice} bits!`
            },
            {
                user_id: userId,
                message: `Você comprou ${buyQuantity}x unidade(s) por ${totalPrice} bits!`
            }
        ]);

        await trx.commit();
        res.json({ message: 'Compra realizada com sucesso' });
    } catch (error) {
        await trx.rollback();
        console.error('Error buying listing:', error);
        res.status(500).json({ message: 'Erro ao processar compra' });
    }
};

exports.cancelListing = async (req, res) => {
    const { listingId } = req.params;
    const userId = req.user.id;

    const trx = await db.transaction();

    try {
        const listing = await trx('market_listings')
            .where({ id: listingId, seller_id: userId, status: 'active' })
            .first();

        if (!listing) {
            await trx.rollback();
            return res.status(404).json({ message: 'Anúncio não encontrado ou não pode ser cancelado' });
        }

        await trx('market_listings')
            .where({ id: listingId })
            .update({ status: 'cancelled' });

        if (listing.listing_type === 'item') {
            const existingItem = await trx('inventory')
                .where({ user_id: userId, item_id: listing.item_id })
                .first();

            if (existingItem) {
                await trx('inventory')
                    .where({ id: existingItem.id })
                    .increment('quantity', listing.quantity);
            } else {
                await trx('inventory').insert({
                    user_id: userId,
                    item_id: listing.item_id,
                    quantity: listing.quantity
                });
            }
        } else if (listing.listing_type === 'digimon') {
            await trx('user_digimons')
                .where({ id: listing.digimon_id })
                .update({ is_in_market: false });
        }

        await trx.commit();
        res.json({ message: 'Anúncio cancelado' });
    } catch (error) {
        await trx.rollback();
        console.error('Error cancelling listing:', error);
        res.status(500).json({ message: 'Erro ao cancelar anúncio' });
    }
};

exports.getNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        const notifications = await db('market_notifications')
            .where({ user_id: userId })
            .orderBy('created_at', 'desc')
            .limit(20);
            
        res.json(notifications);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ message: 'Erro ao buscar notificações' });
    }
};

exports.markNotificationRead = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        
        await db('market_notifications')
            .where({ id, user_id: userId })
            .update({ is_read: true });
            
        res.json({ message: 'Marcada como lida' });
    } catch (error) {
        res.status(500).json({ message: 'Erro' });
    }
};

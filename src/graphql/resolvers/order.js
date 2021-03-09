const Order = require('../../models/order');
const User = require('../../models/user');
const {transformOrder} = require('./merge');

module.exports = {
    adminOrders: async (args, { req }) => {
        if (!req.isAuth)
            throw new Error('Unauthenticated');
        const creator = await User.findOne({_id: req.userId});
        if (creator.type !== 'admin')
            throw new Error('Unauthorized');
        try {
            let user = {};
            const q = [
                {code: {$regex: '.*' + args.keyword + '.*', $options: '-i'}},
                // {reject: {$regex: '.*' + args.keyword + '.*', $options: '-i'}},
            ];
            let totalCount = await Order.find()
                .and([{$or: q}])
                .skip(args.skip)
                .countDocuments();
            const orders = await Order.find()
                .and([{$or: q}])
                .skip(args.skip)
                .limit(args.limit);

            const orderArr = await orders.map(async order => {
                user = await User.findOne(order.creator);              
                if(!user){
                  user = {
                    name: "admin"
                  }
                }
                const arrObject = {
                    _id: order._id,
                    code: order.code,
                    status: order.status,
                    cost: order.cost,
                    transferImage: order.transferImage,
                    transferName: order.transferName,
                    resi: order.resi,
                    courier: order.courier,
                    amount: order.amount,
                    creator: user.name
                }
                return arrObject;
            })
            return {
                totalCount,
                orders: orderArr.map(order => {
                    return order
                })
            }
        } catch (error) {
            console.log(error);
        }
    },

    // Orders
    orders: async (args, { req }) => {
        if (!req.isAuth)
            throw new Error('Unauthenticated');
        const creator = await User.findOne({_id: req.userId});
        try {
            const q = [
                {code: {$regex: '.*' + args.keyword + '.*', $options: '-i'}},
            ];
            let totalCount = await Order.find({creator: creator._id})
                .and([{$or: q}])
                .skip(args.skip)
                .countDocuments();
            const orders = await Order.find({creator: creator._id})
                .and([{$or: q}])
                .skip(args.skip)
                .limit(args.limit);
            console.log(creator);
            return {
                totalCount,
                orders: orders.map(order => {
                    return transformOrder(order)
                })
            }
        } catch (error) {
            console.log(error);
        }
    },
    // Order
    order: async (_id, { req }) => {
        if (!req.isAuth)
            throw new Error('Unauthenticated');
        try {
            const order = await Order.findOne({_id});
            if(!order)
                throw new Error('Order not found');
            return transformOrder(order)
        } catch (error) {
            console.log(error);
        }
    },
    deniedOrder: async (_id, { req }) => {
        if (!req.isAuth)
            throw new Error('Unauthenticated');
        const creator = await User.findOne({_id: req.userId});
        if (creator.type !== 'admin')
            throw new Error('Unauthorized');
        let updatedOrder;
        try {
            const order = await Order.findOneAndUpdate({_id : _id},{
                status: "Ditolak"
            });
            updatedOrder = transformOrder(order);
            return updatedOrder;
        } catch (error) {
            console.log(error);
        }
    },
    finishOrder: async (_id, { req }) => {
        if (!req.isAuth)
            throw new Error('Unauthenticated');
        const creator = await User.findOne({_id: req.userId});
        let updatedOrder;
        try {
            const order = await Order.findOneAndUpdate({_id : _id},{
                status: "Selesai"
            });
            updatedOrder = transformOrder(order);
            return updatedOrder;
        } catch (error) {
            console.log(error);
        }
    },
    resi: async (args, { req }) => {
        if (!req.isAuth)
            throw new Error('Unauthenticated');
        const creator = await User.findOne({_id: req.userId});
        if (creator.type !== 'admin')
            throw new Error('Unauthorized');
        let updatedOrder;
        try {
            const order = await Order.findOneAndUpdate({_id : args._id},{
                status: "Dikirim",
                resi: args.resi
            });
            updatedOrder = transformOrder(order);
            return updatedOrder;
        } catch (error) {
            console.log(error);
        }
    },
    // Create
    createOrder: async (args, { req }) => {
        if (!req.isAuth)
            throw new Error('Unauthenticated');
        
        // Create Order Code
        const today = new Date();
        let text = "";
        const char = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        for(let i=0; i<4; i++)
            text+=char.charAt(Math.floor(Math.random() * char.length));
        const year  = `${today.getFullYear()}`;
        const code = year.slice(-2)+(today.getMonth()+1)+today.getDate()+text;

        // Create new Order
        let order = new Order({
            code: code,
            name: args.orderInput.name,
            amount: args.orderInput.amount,
            address: args.orderInput.address,
            courier: args.orderInput.courier,
            cost: args.orderInput.cost,
            status: "Menunggu Pembayaran",
            resi: null,
            transferImage: null,
            transferName: null,
            creator: req.userId,
        });
        let createdOrder;
        try {
            const res = await order.save();
            createdOrder = transformOrder(res);
            const creator = await User.findById(req.userId);
            if(!creator)
                throw new Error('user not found');
            creator.createdOrder.push(order);
            await creator.save();
            return createdOrder;
        } catch (error) {
            throw error;
        }
    },
    
    // Update
    updateOrder: async (args, req) => {
        if (!req.isAuth)
            throw new Error('Unauthenticated');
        let updatedOrder;
        try {
            const order = await Order.findOneAndUpdate({_id : args._id},{
              name: args.updateOrderInput.name,
              amount: args.updateOrderInput.amount,
              address: args.updateOrderInput.address,
              courier: args.updateOrderInput.courier,
              cost: args.updateOrderInput.cost,
              status: args.updateOrderInput.status,
              resi: args.updateOrderInput.resi,
              transferImage: args.updateOrderInput.transferImage,
              transferName: args.updateOrderInput.transferName
            });
            updatedOrder = transformOrder(order);
            return updatedOrder;
        } catch (error) {
            throw error;
        }
    },
    // Delete
    deleteOrder: async (args, { req }) => {
        if (!req.isAuth)
            throw new Error('Unauthenticated');
        let deleted;
        try {
            const res = await Order.findOne(args);
            console.log(res);
            await res.delete();
            deleted = {deleted : true};
            return deleted;
        } catch (error) {
            throw error;
        }
    }
};
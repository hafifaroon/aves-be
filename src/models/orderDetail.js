const mongoose = require('mongoose');
const mongoseDelete = require('mongoose-delete');
const Schema = mongoose.Schema;

const orderDetailSchema = new Schema({
    orderId: {
        type: Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    deviceTypeId: {
        type: Schema.Types.ObjectId,
        ref: 'DeviceType',
        required: true
    },
    quantity: {
        type: Number
    },
    price: {
        type: Number
    }
}, {timestamps:true});

orderDetailSchema.plugin(mongoseDelete, {deletedAt: true, overrideMethods: 'all'});

module.exports = mongoose.model('OrderDetail', orderDetailSchema);


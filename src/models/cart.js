const mongoose = require('mongoose');
const mongoseDelete = require('mongoose-delete');
const Schema = mongoose.Schema;

const cartSchema = new Schema({
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
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
}, {timestamps:true});

cartSchema.plugin(mongoseDelete, {deletedAt: true, overrideMethods: 'all'});

module.exports = mongoose.model('Cart', cartSchema);


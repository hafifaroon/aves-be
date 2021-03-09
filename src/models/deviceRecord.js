const mongoose = require('mongoose');
const mongoseDelete = require('mongoose-delete');
const Schema = mongoose.Schema;

const deviceRecordSchema = new Schema({
    value: {
        type: Number,
        required: true
    },
    sensorType: {
        type: String,
        required: true
    },
    device: {
        type: Schema.Types.ObjectId,
        ref: 'Device',
        required: true
    },
    date: {
        type: Date,
        required: true
    },
}, {timestamps: true});

deviceRecordSchema.plugin(mongoseDelete, {deletedAt: true, overrideMethods: 'all'});

module.exports = mongoose.model('DeviceRecord', deviceRecordSchema);


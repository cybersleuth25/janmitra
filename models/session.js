const mongoose = require('mongoose');

const SessionSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    session_token: { type: String, required: true },
    expires_at: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now }
});

// Duplicate the ID field.
SessionSchema.virtual('id').get(function(){
    return this._id.toHexString();
});

// Ensure virtual fields are serialized.
SessionSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret) { delete ret._id; }
});

module.exports = mongoose.model('Session', SessionSchema);
const mongoose = require('mongoose');

const IssueSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    location: { type: String, required: true },
    latitude: { type: Number },
    longitude: { type: Number },
    reporter_name: { type: String, required: true },
    reporter_email: { type: String, required: true },
    reporter_phone: { type: String },
    photo_path: { type: String },
    status: { 
        type: String, 
        enum: ['Open', 'in_progress', 'resolved'], 
        default: 'Open' 
    },
    priority: { type: String, default: 'medium' },
    assigned_volunteer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Volunteer' },
    admin_notes: { type: String },
    updates: [{
        update_type: String,
        message: String,
        user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        created_at: { type: Date, default: Date.now }
    }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    resolved_at: { type: Date }
});

// Duplicate the ID field.
IssueSchema.virtual('id').get(function(){
    return this._id.toHexString();
});

// Ensure virtual fields are serialized.
IssueSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret) {   delete ret._id;  }
});

module.exports = mongoose.model('Issue', IssueSchema);
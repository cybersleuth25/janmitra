const mongoose = require('mongoose');

const VolunteerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    skills: { type: String },
    location_preference: { type: String },
    experience_level: { type: String },
    availability: { type: String },
    status: { type: String, default: 'active' }, // active, inactive
    joined_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

// Duplicate the ID field.
VolunteerSchema.virtual('id').get(function(){
    return this._id.toHexString();
});

// Ensure virtual fields are serialized.
VolunteerSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret) { delete ret._id; }
});

module.exports = mongoose.model('Volunteer', VolunteerSchema);
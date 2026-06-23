import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide your name.'],
  },
  email: {
    type: String,
    required: [true, 'Please provide your email.'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Please provide a password.'],
  },
  geminiApiKey: {
    type: String,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Avoid compiling model multiple times during Next.js hot reloads
export default mongoose.models.User || mongoose.model('User', UserSchema);

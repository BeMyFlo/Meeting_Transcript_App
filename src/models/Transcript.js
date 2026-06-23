import mongoose from 'mongoose';

const TranscriptSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  fileName: {
    type: String,
    required: true,
  },
  fileSize: {
    type: Number,
    required: true,
  },
  fileType: {
    type: String,
    required: true,
  },
  transcriptText: {
    type: String,
    default: '',
  },
  summaryText: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['processing', 'completed', 'failed'],
    default: 'processing',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Transcript || mongoose.model('Transcript', TranscriptSchema);

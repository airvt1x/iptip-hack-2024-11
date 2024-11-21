import mongoose from 'mongoose'

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  passwordHash: {
    type: String,
  },
  photoUrl: {
    type: String,
  },
  role: {
    type: String,
    enum: ['manager', 'corporation'],
    default: 'corporation',
  },
  organization: {
    type: String,
    validate: {
      validator: (value) => {
        return this.role === 'corporation';
      },
      message: props => `${props.value} is not allowed for ${props.path}. Role must be 'corporation'.`
    }
  },
}, {
  timestamps: true,
})

export default mongoose.model('User', UserSchema)

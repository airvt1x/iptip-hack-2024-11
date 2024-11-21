import mongoose, { Schema } from 'mongoose'

const StageSchema = new mongoose.Schema({
  title:{
    type: String,
    required: true,
  },
  content:{
    type: String,
    required: true,
  },
  dateEnd:{
    type: Date,
    required: true,
  },
  date:{
    type: Date,
    required: true,
    default: Date.now,
  },
  price:{
    type: Number,
    required: true,
  },
  organization:{
    type: String,
    required: true,
  },
  stages:{
    type: [{type: Schema.Types.ObjectId}],
    required: true,
    default: [],
  },
  risks:{
    type: Array,
    default: [],
  }

},)

export default mongoose.model('Stage', StageSchema)

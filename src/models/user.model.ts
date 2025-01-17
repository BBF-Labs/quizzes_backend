import { timeStamp } from 'console'
import {Schema, model} from  'mongoose'

const UserSchema = new Schema({
    username:{
        type: String,
        unique: true,
        required: true,
    },
    email:{
        type: String,
        unique: true,
        required: true,
        lowercase: true,

    },
    hashed_password:{
        type: String,
    },
    authKey:{
        type: String,
        required: true
    },
    course:{
        type: Schema.Types.ObjectId,
        ref: 'Course'
    },
    role:{
        type: String,
        enum:['student','admin','moderator'],
        default: 'student'
    },
    isBanned:{
        type: Boolean,
        default: false
    },
    isSubscribed:{ 
        type: Boolean,
        default: false},
    paymenId:{ 
        type: Schema.Types.ObjectId,
        ref: 'Payment',
        default: null},
    lastLogin:{
        type: Date,
        default: null},
    
},{
    timestamps: true, 
  })

  const User = model('User', UserSchema);
  export default User;
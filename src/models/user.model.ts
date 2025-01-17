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
    authKey:{},
    course:{},
    role:{},
    isBanned:{
        type: Boolean,
        default: false
    },
    isSubscribed:{},
    paymenId:{},
    lastLogin:{},
    
},{
    timestamps: true, 
  })

  const User = model('User', UserSchema);
  export default User;
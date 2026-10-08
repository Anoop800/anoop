const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({

    fullName:{
        type:String,
        required:true
    },

    // usn:{
    //     type:String,
    //     required:true,
    //     unique:true
    // },

    email:{
        type:String,
        required:true,
        unique:true
    },

    phone:{
        type:String,
        required:true
    },

    // department:{
    //     type:String,
    //     required:true
    // },

    // semester:{
    //     type:Number,
    //     required:true
    // },

    password:{
        type:String,
        required:true
    },

    role:{
        type:String,
        enum:["customer", "admin"],
        default:"customer"
    },

    status:{
        type:String,
        enum:["active", "inactive"],
        default:"active"
    }
   

});

module.exports = mongoose.model("User",UserSchema);
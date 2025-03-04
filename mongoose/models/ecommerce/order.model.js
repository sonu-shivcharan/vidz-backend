import mongoose from "mongoose";
const orderItemSchema = new mongoose.Schema({
    productId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Product"
    },
    quantity:{
        type:Number,
        default:1,
        max:[5, "Max 5 items allowed"]
    }
})
const orderSchema = new mongoose.Schema({
    price:{
        type:Number,
        required:true
    },
    customer:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    orderItems:{
        type:[orderItemSchema]
    },
    address:{
        type:String,
        required:true,
    },
    status:{
        type:String,
        enum:["pending", "cancelled", "delivered"],
        default:"pending",
    }
}, {timestamps:true})

export const Order = mongoose.model("Order", orderSchema);
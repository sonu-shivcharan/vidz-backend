import { model, Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const likeSchema = new Schema({
    likedBy:{
        type:Schema.Types.ObjectId,
        ref:"User"
    },
    comment:{
        type:Schema.Types.ObjectId,
        ref:"Comment"
    },
    video:{
        type:Schema.Types.ObjectId,
        ref:"Video"
    },
    tweet:{
        type:Schema.Types.ObjectId,
        ref:"Tweet"
    },
},{
    timestamps:true,
})
likeSchema.plugin(mongooseAggregatePaginate);
export const Like = new model("Like", likeSchema);

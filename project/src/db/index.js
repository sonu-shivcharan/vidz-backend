import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

async function connectDB(){
    try {
        const connectionResponse = await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`);
        console.log(`MongoDB Connected, HOST: ${connectionResponse.connection.host}`)
    } catch (error) {
        console.log("MongoDB connection ERROR :: ", error);
        process.exit(1);
    }
}

export default connectDB;
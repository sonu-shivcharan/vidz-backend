import dotenv from "dotenv"
import connectDB from "./db/index.js";
import app from "./app.js";
dotenv.config({
    path:"./.env"
})

const PORT = process.env.PORT || 8000;

connectDB()
.then(()=>{
    app.listen(PORT, ()=>{
        console.log(`Server running on PORT ${PORT}`)
    })
})
.catch((error)=>{
    console.log("DB connection failed Error::", error)
})














// const app = express();
// (async ()=>{
//    try {
//     await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
//     app.on("error", (error)=>{
//         console.error("Error", error)
//     })
//     app.listen(process.env.PORT, ()=>{
//         console.log(`Server running on ${process.env.PORT}`)
//     })
//    } catch (error) {
//         console.error("Error while connecting to DB :: ", error)
//         throw error
//    }
// })();
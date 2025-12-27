import dotenv from "dotenv";
import connectDB from "./db/index.js";


dotenv.config({
    path: "./.env"  
});


connectDB()





















// Express App Setup (1st method Example)

/*
import express from "express";
const app = express();

(async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("ERROR", (error) =>{
            console.log("Error:", error);
            throw error;
        })

        app.listen(process.env.PORT, () => {
            console.log(`App is listening on port ${process.env.PORT}`);
        });

    } catch (error) {
        console.error("Error:", error);
    }
})();
*/
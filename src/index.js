import dotenv from "dotenv";
import connectDB from "./db/index.js";
import app from "./app.js";


dotenv.config({
    path: "./.env"  
});


connectDB()
.then(() => {
     app.on("ERROR", (error) =>{
            console.log("Error:", error);
            throw error;
        })
    app.listen(process.env.PORT || 5000, () => {
        console.log(`Server is running at port ${process.env.PORT || 5000}`);
    });
})
.catch((error) => {
    console.log("MongoDB connection failed !!!", error);
});





















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
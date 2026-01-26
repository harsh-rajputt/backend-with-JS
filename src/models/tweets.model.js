import mongoose from "mongoose";

const tweetsSchema = new mongoose.Schema(
    {
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        content: {
            type: String,
            required: true,
            trim: true,
            maxlength: 280,
        },
    },
    {
        timestamps: true,
    }
);

const Tweet = mongoose.model("Tweet", tweetsSchema);
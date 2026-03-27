import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const movieInsightSchema = new Schema(
  {
    imdbId: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },
    movieTitle: {
      type: String,
      default: "",
      trim: true,
    },
    summary: {
      type: String,
      required: true,
      trim: true,
    },
    sentiment: {
      type: String,
      enum: ["Positive", "Mixed", "Negative", "NoReviews"],
      default: "NoReviews",
    },
    confidencePercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    reviewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

const MovieInsight = models.MovieInsight || model("MovieInsight", movieInsightSchema);

export default MovieInsight;

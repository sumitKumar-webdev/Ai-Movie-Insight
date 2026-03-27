import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const replySchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    replyToType: {
      type: String,
      enum: ["review", "reply"],
      default: "review",
    },
    replyToReplyId: {
      type: Schema.Types.ObjectId,
      default: null,
    },
    replyToUsername: {
      type: String,
      default: "",
      trim: true,
    },
    likes: {
      type: Number,
      default: 0,
      min: 0,
    },
    likedBy: {
      type: [
        {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
    _id: true,
  },
);

const reviewSchema = new Schema(
  {
    movieImdbId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    movieTitle: {
      type: String,
      default: "",
      trim: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    likes: {
      type: Number,
      default: 0,
      min: 0,
    },
    likedBy: {
      type: [
        {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
      ],
      default: [],
    },
    replies: {
      type: [replySchema],
      default: [],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

reviewSchema.index({ createdAt: -1 });
reviewSchema.index({ user: 1 });
reviewSchema.index({ movieImdbId: 1, createdAt: -1 });
reviewSchema.index({ movieImdbId: 1, user: 1 }, { unique: true });

const Review = models.Review || model("Review", reviewSchema);

export default Review;

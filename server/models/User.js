import bcrypt from "bcryptjs";
import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const UserPreferenceSchema = new Schema(
  {
    cinemas: {
      type: [String],
      default: [],
    },
    genres: {
      type: [String],
      default: [],
    },
    languages: {
      type: [String],
      default: [],
    },
    moods: {
      type: [String],
      default: [],
    },
    formats: {
      type: [String],
      default: [],
    },
    onboardingCompleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    _id: false,
  },
);

const UserPersonalSelectionItemSchema = new Schema(
  {
    imdbId: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    year: {
      type: String,
      default: "N/A",
      trim: true,
    },
    poster: {
      type: String,
      default: null,
      trim: true,
    },
    type: {
      type: String,
      default: "movie",
      trim: true,
    },
  },
  {
    _id: false,
  },
);

const UserPersonalSelectionSchema = new Schema(
  {
    items: {
      type: [UserPersonalSelectionItemSchema],
      default: [],
    },
    updatedAt: {
      type: Date,
      default: null,
    },
    refreshAfter: {
      type: Date,
      default: null,
    },
  },
  {
    _id: false,
  },
);

const UserSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    avatar: {
      type: String,
      default: null
    },
    username: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      default: undefined,
    },
    is_verified: {
      type: Boolean,
      default: false,
    },
    isactive: {
      type: Boolean,
      default: false,
    },
    authProvider: {
      type: [String],
      enum: ["local", "google"],
      default: ["local"],
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
      default: undefined,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationTokenHash: {
      type: String,
      default: null,
    },
    emailVerificationExpiresAt: {
      type: Date,
      default: null,
    },
    passwordResetTokenHash: {
      type: String,
      default: null,
    },
    passwordResetExpiresAt: {
      type: Date,
      default: null,
    },
    passwordHash: {
      type: String,
      required() {
        const providers = Array.isArray(this.authProvider)
          ? this.authProvider
          : this.authProvider
            ? [this.authProvider]
            : [];

        return providers.includes("local");
      },
      default: null,
    },
    preferences: {
      type: UserPreferenceSchema,
      default: () => ({
        cinemas: [],
        genres: [],
        languages: [],
        moods: [],
        formats: [],
        onboardingCompleted: false,
      }),
    },
    personalSelection: {
      type: UserPersonalSelectionSchema,
      default: () => ({
        items: [],
        updatedAt: null,
        refreshAfter: null,
      }),
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

UserSchema.pre("save", function () {
  if (this.email) this.email = this.email.trim();
  if (this.username) this.username = this.username.trim();
});

UserSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.passwordHash);
};

export default models.User || model("User", UserSchema);

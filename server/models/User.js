import bcrypt from "bcryptjs";
import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

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
      lowercase: true,
      trim: true,
      default: null,
    },
    isactive: {
      type: Boolean,
      default: false,
    },
    authProvider: {
      type: [String],
      enum: ["local", "google"],
      default: "local",
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
      default: null,
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
        return this.authProvider === "local";
      },
      default: null,
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

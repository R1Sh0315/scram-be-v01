const mg = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mg.Schema({
  email: {
    type: String,
    require: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  userId: {
    type: String,
    unique: true,
    required: true,
    default: () => mg.Types.ObjectId().toString(), // Create a unique userId
  },
});

userSchema.pre("save", async function (next) {
  this.password = await bcrypt.hash(this.password, 9);
});

userSchema.method.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
}


const User = mg.model("User", userSchema);

module.exports = User;
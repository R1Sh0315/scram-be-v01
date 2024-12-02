const mg = require('mongoose');
const bcrypt = require('bcryptjs');

// User Schema
const userSchema = new mg.Schema({
  email: {
    type: String,
    required: true,
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
    default: function () {
      return new mg.Types.ObjectId().toString();
    }
  }
});

// Pre-save hook to hash password
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 10);
});

// Method to compare password
userSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.password);
};

module.exports = mg.model('User', userSchema);

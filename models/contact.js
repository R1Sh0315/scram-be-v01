const mg = require("mongoose");

const contactSchema = new mg.Schema({
  name: { type: String, require: true, unique: true, },
  number: { type: String, required: true, unique: true, },
  contactType: { type: [String], require: true },
  link: {
    emailID: { type: String, default: "" },
    instaID: { type: String, default: "" },
    facebookID: { type: String, default: "" },
    portfolio: { type: String, default: "" },
    telegramID: { type: String, default: "" },
  },
});

const Contact = mg.model("Contact", contactSchema);
module.exports = Contact;

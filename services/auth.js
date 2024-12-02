const jwt = require("jsonwebtoken");

const setUser = (id, user) => {
  const payload={
    id,
    ...user
  }
  return jwt.sign(payload, process.env[JWT_SECRET])
};
const getUser = (id) => {
  return sessionIDToUseMap.get(id);
};

module.exports = {
  setUser,
  getUser,
};

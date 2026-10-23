const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: process.env.PORT || 5000,
  MONGODB_URL:
    process.env.MONGODB_URL ||
    "mongodb+srv://prathammahalwar962_db_user:Pratham060905.2994@cluster0.gj1ar2r.mongodb.net/avashyakta-hai?retryWrites=true&w=majority",
  JWT_SECRET:
    process.env.JWT_SECRET || "avashyakta_hai_super_secret_jwt_key_2026_production",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:5173",
};

module.exports = env;

const User = require("../models/User");
const Employer = require("../models/Employer");

/**
 * Ensures that the platform manager account (manager@gmail.com) exists with role: 'admin'
 */
const ensureAdminUser = async () => {
  const adminEmail = "manager@gmail.com";
  const adminPassword = "manager123";

  try {
    // 1. Check in User collection
    let userAdmin = await User.findOne({ email: adminEmail });
    if (!userAdmin) {
      userAdmin = new User({
        full_name: "Platform Manager",
        email: adminEmail,
        password: adminPassword,
        role: "admin",
        phone: "9999999999",
        location: "Headquarters",
        company_name: "Aavashyakta Hai Management",
        company_type: "Platform Admin",
        is_verified: true,
        verification_status: "verified",
        verification_badge: "verified_worker",
      });
      await userAdmin.save();
      console.log(`[Admin] Manager account created in User model: ${adminEmail}`);
    } else {
      userAdmin.role = "admin";
      userAdmin.password = adminPassword;
      userAdmin.is_verified = true;
      await userAdmin.save();
    }

    // 2. Also ensure in Employer collection for full compatibility with employer-based queries
    let employerAdmin = await Employer.findOne({ email: adminEmail });
    if (!employerAdmin) {
      employerAdmin = new Employer({
        full_name: "Platform Manager",
        email: adminEmail,
        password: adminPassword,
        role: "admin",
        phone: "9999999999",
        location: "Headquarters",
        company_name: "Aavashyakta Hai Management",
        company_type: "Platform Admin",
        is_verified: true,
        verification_status: "verified",
      });
      await employerAdmin.save();
      console.log(`[Admin] Manager account created in Employer model: ${adminEmail}`);
    } else {
      employerAdmin.role = "admin";
      employerAdmin.password = adminPassword;
      employerAdmin.is_verified = true;
      await employerAdmin.save();
    }
  } catch (error) {
    console.warn("[Admin] ensureAdminUser notice:", error.message);
  }
};

module.exports = ensureAdminUser;

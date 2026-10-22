const signUpController = require("./signUpController");
const signInController = require("./signInController");
const profileController = require("./profileController");
const jobsPageController = require("./jobsPageController");
const jobDetailController = require("./jobDetailController");
const postJobController = require("./postJobController");
const myJobsController = require("./myJobsController");
const myApplicationsController = require("./myApplicationsController");

// Also keep legacy controller references
const authController = require("./authController");
const jobController = require("./jobController");
const applicationController = require("./applicationController");
const userController = require("./userController");

module.exports = {
  // Page Controllers
  signUpController,
  signInController,
  profileController,
  jobsPageController,
  jobDetailController,
  postJobController,
  myJobsController,
  myApplicationsController,

  // Legacy Controllers
  authController,
  jobController,
  applicationController,
  userController,
};

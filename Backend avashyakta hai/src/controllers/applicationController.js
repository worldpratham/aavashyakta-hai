const { applyForJob: createApplication } = require("./jobDetailController");
const {
  getWorkerApplications,
  withdrawApplication: deleteApplication,
} = require("./myApplicationsController");
const {
  getJobApplications,
  updateApplicationStatus: updateApplication,
} = require("./myJobsController");

module.exports = {
  createApplication,
  getWorkerApplications,
  getJobApplications,
  updateApplication,
  deleteApplication,
};

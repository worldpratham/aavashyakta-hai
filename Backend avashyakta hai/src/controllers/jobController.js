const { getAllJobs: getJobs, getJobStats } = require("./jobsPageController");
const { getJobDetails: getJobById } = require("./jobDetailController");
const { createJob } = require("./postJobController");
const {
  getEmployerJobs,
  updateJob,
  deleteJob,
} = require("./myJobsController");

module.exports = {
  getJobs,
  getJobStats,
  getJobById,
  createJob,
  updateJob,
  deleteJob,
  getEmployerJobs,
};


const githubService = require("../services/githubService");
const lineCountService = require("../services/lineCountService");

// Store for active jobs
const jobStore = {};

/**
 * Starts a new job to count lines of code
 */
exports.startJob = async (req, res) => {
  const { username, token } = req.body;

  if (!username) {
    return res.status(400).json({ error: "Username is required" });
  }

  const jobId = `${username}-${Date.now()}`;

  // Initialize job state
  jobStore[jobId] = {
    status: "running",
    username,
    repos: [],
    totalLines: 0,
    userTotalLines: 0,
    completed: 0,
    total: 0,
    errors: [],
  };

  // Start processing in the background
  processUserRepos(username, jobId, token).catch((error) => {
    console.error(`Error in processUserRepos: ${error}`);
    if (jobStore[jobId]) {
      jobStore[jobId].status = "error";
      jobStore[jobId].errors.push(`Failed to process repos: ${error.message}`);
    }
  });

  res.json({ jobId });
};

/**
 * Gets the status of a job
 */
exports.getJobStatus = (req, res) => {
  const { jobId } = req.params;

  if (!jobStore[jobId]) {
    return res.status(404).json({ error: "Job not found" });
  }

  res.json(jobStore[jobId]);
};

/**
 * Cancels a running job
 */
exports.cancelJob = (req, res) => {
  const { jobId } = req.params;

  if (!jobStore[jobId]) {
    return res.status(404).json({ error: "Job not found" });
  }

  jobStore[jobId].status = "canceled";
  res.json({ status: "canceled" });
};

/**
 * Process all repositories for a user
 */
async function processUserRepos(username, jobId, token) {
  try {
    // Get list of all user's repositories (both original and forked)
    const repos = await githubService.getUserRepos(username, true, token);

    jobStore[jobId].total = repos.length;

    console.log(`Processing ${repos.length} repositories for ${username}`);

    // Process each repo
    for (const repo of repos) {
      // Check if job was canceled
      if (jobStore[jobId].status === "canceled") {
        console.log(`Job ${jobId} was canceled, stopping`);
        return;
      }

      try {
        console.log(`Processing repo: ${repo.full_name}`);

        // Use the API approach first for all repositories
        const result = await lineCountService.countLinesWithAPI(
          repo.owner.login,
          repo.name,
          username,
          repo.fork,
          token,
        );

        jobStore[jobId].repos.push({
          name: repo.full_name,
          fork: repo.fork,
          totalLines: result.totalLines,
          userLines: result.userLines,
          context: result.context, // Add the contributor context
          error: null,
        });

        jobStore[jobId].totalLines += result.totalLines;
        jobStore[jobId].userTotalLines += result.userLines;
      } catch (error) {
        console.error(
          `Error processing repo ${repo.full_name}: ${error.message}`,
        );

        // Try to get at least some data using statistics API
        try {
          // Use a fallback estimation method
          const stats = await lineCountService.estimateRepoStats(
            repo.owner.login,
            repo.name,
            username,
            repo.fork,
            token,
          );

          jobStore[jobId].repos.push({
            name: repo.full_name,
            fork: repo.fork,
            totalLines: stats.totalLines,
            userLines: stats.userLines,
            error: `Warning: Used estimation - ${error.message}`,
          });

          jobStore[jobId].totalLines += stats.totalLines;
          jobStore[jobId].userTotalLines += stats.userLines;
        } catch (fallbackError) {
          // If even the fallback fails, record the error
          jobStore[jobId].repos.push({
            name: repo.full_name,
            fork: repo.fork,
            totalLines: 0,
            userLines: 0,
            error: error.message,
          });

          jobStore[jobId].errors.push(
            `Error processing ${repo.full_name}: ${error.message}`,
          );
        }

        // Handle GitHub API rate limiting
        if (error.message.includes("rate limit")) {
          console.log("Hit rate limit, waiting before continuing...");
          await new Promise((resolve) => setTimeout(resolve, 60000));
        }
      }

      jobStore[jobId].completed++;
    }

    jobStore[jobId].status = "completed";
    console.log(`Job ${jobId} completed successfully`);
  } catch (error) {
    console.error(`Error in processUserRepos: ${error.message}`);
    jobStore[jobId].status = "error";
    jobStore[jobId].errors.push(`Failed to process: ${error.message}`);
  }
}

// Export jobStore for testing
exports.jobStore = jobStore;

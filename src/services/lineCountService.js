const githubService = require("./githubService");

/**
 * Count lines using only the GitHub API with better attribution
 */
exports.countLinesWithAPI = async (
  owner,
  repo,
  username,
  isFork,
  token = null,
) => {
  try {
    // Start by getting language statistics
    const languages = await githubService.getRepoLanguages(owner, repo, token);

    // Calculate total lines from language stats
    const totalBytes = Object.values(languages).reduce(
      (sum, bytes) => sum + bytes,
      0,
    );
    // Estimate lines based on bytes
    const estimatedTotalLines = Math.round(totalBytes / 40);

    let userLines = 0;

    // For both original repos and forks, check actual contribution percentage
    try {
      // Get all contributors
      const contributors = await githubService.getRepoContributors(
        owner,
        repo,
        token,
      );
      const totalContributions = contributors.reduce(
        (sum, c) => sum + c.contributions,
        0,
      );

      // Find the user in contributors
      const userContribution = contributors.find(
        (c) => c.login.toLowerCase() === username.toLowerCase(),
      );

      if (userContribution) {
        // Calculate user's percentage of contributions
        const userPercentage =
          userContribution.contributions / totalContributions;
        userLines = Math.floor(estimatedTotalLines * userPercentage);
      } else {
        // If user not found in contributors, use different logic for fork vs original
        if (isFork) {
          // For forks without detected contributions, assume minimal
          userLines = Math.floor(estimatedTotalLines * 0.05);
        } else {
          // For original repos where user isn't a contributor (weird case)
          // This might happen with organization repos or repos with many contributors
          // The owner might be administrative rather than a contributor

          // Check if user is the actual owner
          if (owner.toLowerCase() === username.toLowerCase()) {
            // If they're the owner but not in top contributors,
            // they might have done early work or administrative tasks
            userLines = Math.floor(estimatedTotalLines * 0.15); // Assume modest contribution
          } else {
            userLines = 0; // Not owner and not contributor
          }
        }
      }

      // Add additional context about this repository
      const context = {
        totalContributors: contributors.length,
        userRank: userContribution
          ? contributors.findIndex(
              (c) => c.login.toLowerCase() === username.toLowerCase(),
            ) + 1
          : null,
        totalContributions: totalContributions,
        userContributions: userContribution
          ? userContribution.contributions
          : 0,
        contributionPercentage: userContribution
          ? (
              (userContribution.contributions / totalContributions) *
              100
            ).toFixed(2) + "%"
          : "0%",
      };

      return {
        totalLines: estimatedTotalLines,
        userLines: userLines,
        context: context,
      };
    } catch (error) {
      console.log(
        `Error getting contributor data, using basic estimate: ${error.message}`,
      );

      // Fallback to simpler logic if contributor analysis fails
      if (isFork) {
        // For forks, use commit-based estimation
        const commits = await githubService.getUserCommits(
          owner,
          repo,
          username,
          token,
        );
        userLines = commits.length * 50; // rough estimate
      } else {
        // For original repos, assume a percentage based on repo age and size
        const repoInfo = await githubService.getRepoInfo(owner, repo, token);
        const isLargeProject = estimatedTotalLines > 100000;

        if (isLargeProject) {
          // Large original projects likely have many contributors
          userLines = Math.floor(estimatedTotalLines * 0.2); // Assume 20% for large projects
        } else {
          // Smaller projects might have more owner contribution
          userLines = Math.floor(estimatedTotalLines * 0.6); // Assume 60% for smaller projects
        }
      }

      return {
        totalLines: estimatedTotalLines,
        userLines: userLines,
        context: null,
      };
    }
  } catch (error) {
    console.error(
      `Error in API line counting for ${owner}/${repo}: ${error.message}`,
    );
    throw error;
  }
};

/**
 * Fallback estimation method
 */
exports.estimateRepoStats = async (
  owner,
  repo,
  username,
  isFork,
  token = null,
) => {
  try {
    // Get basic repo info to estimate size
    const repoData = await githubService.getRepoInfo(owner, repo, token);

    // Use size (in KB) to estimate lines
    // Average estimate: ~30 lines per KB
    const estimatedTotalLines = repoData.size * 30;

    let userLines = estimatedTotalLines;

    // For forked repos, adjust user contribution
    if (isFork) {
      try {
        // Try to get contributors to see user's position
        const contributors = await githubService.getRepoContributors(
          owner,
          repo,
          token,
        );

        // Find the user in contributors
        const userContribution = contributors.find(
          (c) => c.login.toLowerCase() === username.toLowerCase(),
        );

        if (userContribution) {
          // Get percentage of contributions
          const totalContributions = contributors.reduce(
            (sum, c) => sum + c.contributions,
            0,
          );
          const userPercentage =
            userContribution.contributions / totalContributions;
          userLines = Math.floor(estimatedTotalLines * userPercentage);
        } else {
          // User not in top contributors
          userLines = Math.floor(estimatedTotalLines * 0.03); // Assume 3% contribution
        }
      } catch (error) {
        console.log(
          `Error getting contributors, using fixed estimate: ${error.message}`,
        );
        userLines = Math.floor(estimatedTotalLines * 0.05); // 5% fallback
      }
    } else {
      // For original repos, we need to consider the project size and collaboration
      const isLargeProject = estimatedTotalLines > 50000;

      if (isLargeProject) {
        // Large projects likely have multiple contributors
        userLines = Math.floor(estimatedTotalLines * 0.3); // Assume 30% for owner
      } else {
        // Smaller projects may be more owner-driven
        userLines = Math.floor(estimatedTotalLines * 0.7); // Assume 70% for owner
      }
    }

    return {
      totalLines: estimatedTotalLines,
      userLines: userLines,
    };
  } catch (error) {
    // If all else fails, return some minimal estimated values
    console.error(`Error in estimation fallback: ${error.message}`);
    const estimatedSize = 1000; // Assume 1000 lines as default
    return {
      totalLines: estimatedSize,
      userLines: isFork ? Math.floor(estimatedSize * 0.05) : estimatedSize,
    };
  }
};

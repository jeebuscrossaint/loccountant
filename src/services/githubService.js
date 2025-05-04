const { Octokit } = require("octokit");

/**
 * Creates an authenticated Octokit client
 */
function createOctokitClient(token) {
  return new Octokit({
    auth: token,
  });
}

/**
 * Get repositories for a user
 */
exports.getUserRepos = async (username, includeForks = false, token = null) => {
  try {
    const octokit = createOctokitClient(token);
    const repos = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await octokit.request("GET /users/{username}/repos", {
        username,
        per_page: 100,
        page,
        sort: "updated",
        direction: "desc",
      });

      if (includeForks) {
        repos.push(...response.data);
      } else {
        // Filter out forks
        const nonForkRepos = response.data.filter((repo) => !repo.fork);
        repos.push(...nonForkRepos);
      }

      // Check if there are more pages
      hasMore = response.data.length === 100;
      page++;
    }

    return repos;
  } catch (error) {
    console.error(`Error getting repos for ${username}: ${error.message}`);
    throw new Error(`Failed to get repositories: ${error.message}`);
  }
};

/**
 * Get language statistics for a repository
 */
exports.getRepoLanguages = async (owner, repo, token = null) => {
  try {
    const octokit = createOctokitClient(token);
    const { data } = await octokit.request(
      "GET /repos/{owner}/{repo}/languages",
      {
        owner,
        repo,
      },
    );
    return data;
  } catch (error) {
    console.error(
      `Error getting languages for ${owner}/${repo}: ${error.message}`,
    );
    throw error;
  }
};

/**
 * Get basic repository information
 */
exports.getRepoInfo = async (owner, repo, token = null) => {
  try {
    const octokit = createOctokitClient(token);
    const { data } = await octokit.request("GET /repos/{owner}/{repo}", {
      owner,
      repo,
    });
    return data;
  } catch (error) {
    console.error(
      `Error getting repo info for ${owner}/${repo}: ${error.message}`,
    );
    throw error;
  }
};

/**
 * Get commits by a specific user in a repository
 */
exports.getUserCommits = async (
  owner,
  repo,
  username,
  token = null,
  maxPages = 5,
) => {
  try {
    const octokit = createOctokitClient(token);
    const commits = [];
    let page = 1;
    let hasMore = true;

    while (hasMore && page <= maxPages) {
      const { data: pageCommits } = await octokit.request(
        "GET /repos/{owner}/{repo}/commits",
        {
          owner,
          repo,
          author: username,
          per_page: 100,
          page,
        },
      );

      commits.push(...pageCommits);
      hasMore = pageCommits.length === 100;
      page++;
    }

    return commits;
  } catch (error) {
    console.error(
      `Error getting commits for ${username} in ${owner}/${repo}: ${error.message}`,
    );
    throw error;
  }
};

/**
 * Get contributors to a repository
 */
exports.getRepoContributors = async (owner, repo, token = null) => {
  try {
    const octokit = createOctokitClient(token);
    const { data } = await octokit.request(
      "GET /repos/{owner}/{repo}/contributors",
      {
        owner,
        repo,
        per_page: 100,
      },
    );
    return data;
  } catch (error) {
    console.error(
      `Error getting contributors for ${owner}/${repo}: ${error.message}`,
    );
    throw error;
  }
};

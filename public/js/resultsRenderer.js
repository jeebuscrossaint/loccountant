/**
 * Functions for rendering job results
 */

/**
 * Update the UI with the current job status and data
 */
function updateResults(data) {
  let html = "";

  if (data.status === "running") {
    html = renderRunningState(data);
  } else if (data.status === "completed") {
    html = renderCompletedState(data);
  } else if (data.status === "canceled") {
    html = renderCanceledState(data);
  } else if (data.status === "error") {
    html = renderErrorState(data);
  }

  if (data.repos && data.repos.length > 0) {
    html += renderRepoTable(data.repos);
  }

  if (data.errors && data.errors.length > 0) {
    html += renderErrorList(data.errors);
  }

  document.getElementById("results").innerHTML = html;
}

/**
 * Render the running state of a job
 */
function renderRunningState(data) {
  const percent =
    data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0;

  let html = `
    <h2 class="card-title">
      <div class="loading"></div>
      Processing ${data.username}'s Repositories
    </h2>
    <div class="progress-container">
      <div class="progress-bar" style="width:${percent}%"></div>
    </div>
    <p>${data.completed} of ${data.total} repositories (${percent}%)</p>

    <div class="stat-group">
      <div class="stat-box">
        <div class="stat-label">Total Lines</div>
        <div class="stat-value">${formatNumber(data.totalLines)}</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">User's Contributions</div>
        <div class="stat-value">${formatNumber(data.userTotalLines)}</div>
      </div>
    </div>
  `;

  return html;
}

/**
 * Render the completed state of a job
 */
function renderCompletedState(data) {
  // Calculate percentage of code written by user
  const contributionPercentage =
    data.totalLines > 0
      ? ((data.userTotalLines / data.totalLines) * 100).toFixed(1)
      : 0;

  let html = `
    <h2 class="card-title">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
      Results for ${data.username}
    </h2>

    <div class="stat-group">
      <div class="stat-box">
        <div class="stat-label">Total Code in Repositories</div>
        <div class="stat-value">${formatNumber(data.totalLines)}</div>
        <div class="stat-subtext">Lines across all repositories</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">User's Contributions</div>
        <div class="stat-value">${formatNumber(data.userTotalLines)}</div>
        <div class="stat-subtext">${contributionPercentage}% of total code</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">Repositories</div>
        <div class="stat-value">${data.completed}</div>
        <div class="stat-subtext">Analyzed successfully</div>
      </div>
    </div>

    <div class="contribution-summary">
      <div class="contribution-overall-bar">
        <div class="contribution-overall-fill" style="width: ${contributionPercentage}%"></div>
        <span class="contribution-overall-text">User wrote ${contributionPercentage}% of total code</span>
      </div>
    </div>
  `;

  return html;
}

/**
 * Render the canceled state of a job
 */
function renderCanceledState(data) {
  let html = `
    <h2 class="card-title">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
      Analysis Canceled
    </h2>
    <p>The analysis for ${data.username} was canceled after processing ${data.completed} of ${data.total} repositories.</p>

    <div class="stat-group">
      <div class="stat-box">
        <div class="stat-label">Total Repository Lines</div>
        <div class="stat-value">${formatNumber(data.totalLines)}</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">User's Contributions</div>
        <div class="stat-value">${formatNumber(data.userTotalLines)}</div>
      </div>
    </div>
  `;

  return html;
}

/**
 * Render the error state of a job
 */
function renderErrorState(data) {
  return `
    <h2 class="card-title">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
      Error Processing ${data.username}
    </h2>
    <div class="error-message">
      An error occurred while processing this GitHub account. Please try again or check if the username is correct.
    </div>
  `;
}

/**
 * Render the table of repositories
 */
/**
 * Render the table of repositories
 */
function renderRepoTable(repos) {
  let html = `
     <h3 class="card-title">
       <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
       Repository Details
     </h3>
     <div class="table-container">
       <table>
         <thead>
           <tr>
             <th>Repository</th>
             <th>Type</th>
             <th>Total Lines</th>
             <th>User's Lines</th>
             <th>Contribution</th>
             <th>Status</th>
           </tr>
         </thead>
         <tbody>
   `;

  for (const repo of repos) {
    let statusHtml = repo.error
      ? `<span class="badge badge-error">Error</span>`
      : `<span class="badge badge-success">Success</span>`;

    let typeHtml = repo.fork
      ? `<span class="badge badge-fork">Fork</span>`
      : `<span class="badge badge-original">Original</span>`;

    // Calculate contribution percentage
    let contributionText = "N/A";
    if (!repo.error && repo.totalLines > 0) {
      const percentage =
        ((repo.userLines / repo.totalLines) * 100).toFixed(1) + "%";
      contributionText = `<div class="contribution-bar">
         <div class="contribution-fill" style="width: ${percentage}"></div>
         <span class="contribution-text">${percentage}</span>
       </div>`;
    }

    // If we have context, use it for a more detailed tooltip
    let contributionDetail = "";
    if (repo.context) {
      contributionDetail = `data-tooltip="Rank: ${repo.context.userRank || "N/A"} of ${repo.context.totalContributors} contributors
 ${repo.context.userContributions} of ${repo.context.totalContributions} commits (${repo.context.contributionPercentage})"`;
    }

    html += `
       <tr>
         <td>${repo.name}</td>
         <td>${typeHtml}</td>
         <td>${repo.error ? "N/A" : formatNumber(repo.totalLines)}</td>
         <td>${repo.error ? "N/A" : formatNumber(repo.userLines)}</td>
         <td class="contribution-cell" ${contributionDetail}>${contributionText}</td>
         <td>${statusHtml}</td>
       </tr>
     `;

    if (repo.error) {
      html += `
         <tr>
           <td colspan="6" class="error-message" style="font-size: 0.8rem;">
             ${repo.error}
           </td>
         </tr>
       `;
    }
  }

  html += `
         </tbody>
       </table>
     </div>
   `;
  return html;
}

/**
 * Render a list of errors
 */
function renderErrorList(errors) {
  let html = `
    <h3 class="card-title">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
      Issues Encountered
    </h3>
  `;

  for (const error of errors) {
    html += `<div class="error-message">${error}</div>`;
  }

  return html;
}

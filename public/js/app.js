/**
 * Main application logic
 */

// Global state
let currentJob = null;
let statusInterval = null;

// DOM elements
const startButton = document.getElementById("start-button");
const cancelButton = document.getElementById("cancel-button");
const usernameInput = document.getElementById("username");
const tokenInput = document.getElementById("token");
const resultsElement = document.getElementById("results");

// Event listeners
startButton.addEventListener("click", startJobHandler);
cancelButton.addEventListener("click", cancelJobHandler);

/**
 * Handler for starting a new job
 */
async function startJobHandler() {
  const username = usernameInput.value.trim();
  const token = tokenInput.value.trim();

  if (!username) {
    alert("Please enter a GitHub username");
    return;
  }

  // Update UI
  startButton.disabled = true;
  cancelButton.style.display = "inline-block";
  resultsElement.style.display = "block";
  resultsElement.innerHTML =
    '<p>Starting job... <div class="loading"></div></p>';

  try {
    const response = await fetch("/api/start", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, token }),
    });

    const data = await response.json();

    if (response.ok) {
      currentJob = data.jobId;
      await checkStatus();
      statusInterval = setInterval(checkStatus, 2000);
    } else {
      showError(data.error);
      resetUI();
    }
  } catch (error) {
    showError(error.message);
    resetUI();
  }
}

/**
 * Handler for canceling a job
 */
async function cancelJobHandler() {
  if (!currentJob) return;

  try {
    await fetch(`/api/cancel/${currentJob}`);
    await checkStatus();
    clearInterval(statusInterval);
  } catch (error) {
    console.error("Error canceling job:", error);
  }
}

/**
 * Check the status of the current job
 */
async function checkStatus() {
  if (!currentJob) return;

  try {
    const response = await fetch(`/api/status/${currentJob}`);
    const data = await response.json();

    updateResults(data);

    if (
      data.status === "completed" ||
      data.status === "error" ||
      data.status === "canceled"
    ) {
      clearInterval(statusInterval);
      resetUI();
    }
  } catch (error) {
    console.error("Error checking status:", error);
    resultsElement.innerHTML += `<p class="error">Error checking status: ${error.message}</p>`;
  }
}

/**
 * Utility functions for the client-side
 */

/**
 * Format a number with commas as thousands separators
 */
function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/**
 * Show an error message to the user
 */
function showError(message) {
  const resultsElement = document.getElementById("results");
  resultsElement.style.display = "block";
  resultsElement.innerHTML = `<p class="error">Error: ${message}</p>`;
}

/**
 * Reset the UI to its initial state
 */
function resetUI() {
  document.getElementById("start-button").disabled = false;
  document.getElementById("cancel-button").style.display = "none";
}

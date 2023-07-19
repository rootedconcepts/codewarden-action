const core = require('@actions/core');
const axios = require('axios');
const github = require('@actions/github');

async function runCodeWarden() {
  try {
    core.info('Code Warden workflow started');
    const githubToken = core.getInput('github-token');
    const jiraUrl = core.getInput('jira-url');
    const jiraUser = core.getInput('jira-user');
    const jiraPwd = core.getInput('jira-password');
    const codewardenUrl = `${jiraUrl}/rest/analyze/1.0/pr`;

    const { context } = github;
    const { eventName, payload } = context;

    if (eventName !== "pull_request") {
      core.setFailed('Only pull requests are supported.');
      return;
    }

    const { pull_request: pullRequest } = payload;

    const { commits_url: commitsUrl, title, url: pullRequestUrl, comments_url: commentsUrl, commits: numCommits } = pullRequest;

    const codewardenPayload = {
      action: 'review_requested',
      api_token: githubToken,
      pull_request: {
        commits: numCommits,
        commits_url: commitsUrl,
        title: title,
        files_url: pullRequestUrl + "/files",
        comments_url: commentsUrl
      }
    };

    core.debug('codewardenPayload:' + JSON.stringify(codewardenPayload));
    const config = {
      auth: {
        username: jiraUser,
        password: jiraPwd
      },
      headers: {
        'Content-Type': 'application/json'
      }
    };

    core.info('Calling Code Warden Endpoint: ' + codewardenUrl);
    const response = await axios.post(codewardenUrl, codewardenPayload, config);
    handleResponse(response);


  } catch (error) {
    handleError(null, error.message);
  }
}

function handleResponse(response) {
  const { status, data: responseBody } = response;

  const statuses = {
    200: () => core.info('Pull Request analyzed. Comment has been added to Pull Request'),
    400: () => handleError(responseBody, contextError = 'Bad Request: Please check all required fields'),
    404: () => handleError(responseBody, contextError = 'Not Found: Requested resource could not be found'),
    500: () => handleError(responseBody, contextError = 'Internal Server Error: Something went wrong on our side')
  };

  const defaultAction = () => core.setFailed('Unexpected Error: Failed to Analyze Pull Request');

  (statuses[status] || defaultAction)();
}

function handleError(responseBody = null, contextError = null) {
  let codeWardenErrorMessage = '';
  if (contextError != null) {
    codeWardenErrorMessage = `Unexpected Error: Code Warden encountered an issue \n ${contextError}`;
  }
  

  if (responseBody) {
    responseErrorCode = responseBody.errorCode;
    responseError = responseBody.errorMessage;

    if (responseErrorCode) {
      codeWardenErrorMessage = `Code Warden encountered Error Code: ${responseErrorCode} - Error Message: ${responseError} \n ${contextError}`
    }
  }
  return core.setFailed(codeWardenErrorMessage);
}

module.exports = { runCodeWarden };
// Check if running in GitHub Actions
if (process.env.GITHUB_ACTIONS === 'true') {
  runCodeWarden()
    .catch(error => {
      core.setFailed('UnExpected Error: Code Warden encountered an issue ' + error.message);
    });
}


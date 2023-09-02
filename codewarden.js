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
    const commentLanguage = core.getInput('comment-language');

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
      options: {
        language: commentLanguage,
      },
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
    if (error.response) {
      handleResponse(error.response);
    }
    else{
      handleError(null, error.message);
    }
   

  }
}

function handleResponse(response) {
  const { status, data: responseBody } = response;
  core.debug('response status:' + status);
  core.debug('response body:' + responseBody);

  const statuses = {
    200: () => handleSuccess(responseBody),
    400: () => handleError(responseBody, contextError = 'Bad Request: Please check all required fields'),
    401: () => handleError(responseBody, contextError = 'UnAuthorized: Invalid License'),
    404: () => handleError(responseBody, contextError = 'Not Found: Requested resource could not be found'),
    500: () => handleError(responseBody, contextError = 'Internal Server Error: Something went wrong on our side')
  };

  const defaultAction = () => core.setFailed('Unexpected Error: Failed to analyze pull request');

  (statuses[status] || defaultAction)();
}


function handleSuccess(responseBody) {
  let codeWardenMessage = responseBody.message;
  let checkForNoAnalysis = "Cannot perform Analysis -"
  if (codeWardenMessage.includes(checkForNoAnalysis)) {
    return core.warning(codeWardenMessage);
  }
  return core.info(codeWardenMessage);

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
}


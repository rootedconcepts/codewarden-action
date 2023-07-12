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

    const context = github.context;
    const eventName = context.eventName;

    if (eventName !== "pull_request") {
      core.setFailed('Only pull requests are supported.');

    }
    else {
      const pullRequest = context.payload.pull_request;
      const commitsUrl = pullRequest.commits_url;
      const title = pullRequest.title;
      const filesUrl = pullRequest.url + '/files';
      const commentsUrl = pullRequest.comments_url;
      const numCommits = pullRequest.commits;

      core.debug('commitsUrl:' + commitsUrl);
      core.debug('title:' + title);
      core.debug('filesUrl:' + filesUrl);
      core.debug('commentsUrl:' + filesUrl);

      const codewardenPayload = {
        action: 'review_requested',
        api_token: githubToken,
        pull_request: {
          commits: numCommits,
          commits_url: commitsUrl,
          title: title,
          files_url: filesUrl,
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


      if (response.status === 200) {
        core.info('Pull Request Analyzed by Codewarden. Comment has been added to Pull Request');
      } else {
        core.setFailed('Failed to Analyze Pull Request');
      }

    }


  } catch (error) {
    core.setFailed('UnExpected Error: Code Warden encountered an issue ' + error.message);
  }
}

module.exports = { runCodeWarden };
// Check if running in GitHub Actions
if (process.env.GITHUB_ACTIONS === 'true') {
  runCodeWarden()
    .catch(error => {
      core.setFailed('UnExpected Error: Code Warden encountered an issue ' + error.message);
    });
}


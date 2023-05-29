const core = require('@actions/core');
const axios = require('axios');
const github = require('@actions/github');

async function runCodeWarden() {
  try {
    const githubToken = core.getInput('github-token');
    const jiraUrl = core.getInput('jira-url');
    const jiraToken = core.getInput('jira-api-token');
    const codewardenUrl = `${jiraUrl}/jira/rest/analyze/1.0/pr`; 

    const context = github.context;
    const eventName = context.eventName;
  
    if ( eventName !== "pull_request" ) {
      core.setFailed('Only pull requests are supported.');
      process.exit(1);
   }
    
    const pullRequest = context.payload.pull_request;
    const commitsUrl = pullRequest.commits_url;
    const title = pullRequest.title;
    const filesUrl = pullRequest.url + '/files';
    const commentsUrl = pullRequest.comments_url;

    // Validate the title format
    const titleRegex = /^[A-Z]{2,}-\d+/; // [A-Z]{2,}-\d+ format
    if (!titleRegex.test(title)) {
      core.setFailed('Invalid title format. The format should be "[A-Z]{2,}-\\d+".')
      process.exit(1);
    }

    
    const codewardenPayload = {
      action: 'review_requested',
      api_token: githubToken,
      pull_request: {
        commits_url: commitsUrl,
        title: title,
        files_url: filesUrl,
        comments_url: commentsUrl
      }
    }; 

    const response = await axios.post(codewardenUrl, codewardenPayload, {
      headers: {
        Authorization: `Bearer ${jiraToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 200) {
      core.info('Pull Request Analyzed by Codewarden. Comment has been added to Pull Request');
    } else {
      core.setFailed('Failed to Analyze Pull Request');
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

module.exports = { runCodeWarden };


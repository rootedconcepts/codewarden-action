const axios = require('axios');
const core = require('@actions/core');
const { runCodeWarden } = require('../codewarden.js');


const githubToken = 'thisisnotagithubrealtoken';
const jiraUrl = 'http://codewarden-jira.com';
const jiraApiToken = 'thisisnotajirarealtoken';

// Mock the required inputs
jest.mock('@actions/core', () => ({
  getInput: jest.fn().mockImplementation((inputName) => ({
    'github-token': githubToken,
    'jira-url': jiraUrl,
    'jira-api-token': jiraApiToken,
  }[inputName] || '')),
  setFailed: jest.fn(),
  info: jest.fn(),
}));

// Mock the required GitHub context
jest.mock('@actions/github', () => ({
  context: {
    eventName: undefined,
    payload: {},
  },
}));

// Mock the Axios POST request
jest.mock('axios');

// Mock process.exit
jest.spyOn(process, 'exit').mockImplementation(() => {});

describe('Test Code Warden GitHub Action', () => {


  beforeEach(() => {
    jest.clearAllMocks(); // Reset all mocks before each test case
  });

  it('should handle invalid title format', async () => {
    const github = require('@actions/github');
    github.context.eventName = 'pull_request';
    github.context.payload = {
      pull_request: {
        commits_url: 'https://api.github.com/repos/owner/repo/pulls/1/commits',
        title: 'Invalid Title',
        url: 'https://api.github.com/repos/owner/repo/pulls/1',
        comments_url: 'https://api.github.com/repos/owner/repo/pulls/1/comments',
      },
    };

    await runCodeWarden();

    expect(process.exit).toHaveBeenCalled();
    expect(core.setFailed).toHaveBeenCalledWith('Invalid title format. The format should be "[A-Z]{2,}-\\d+".');
    expect(core.info).not.toHaveBeenCalled();
  });

 it('should analyze pull request and add comment', async () => {
    const mockPost = jest.spyOn(axios, 'post').mockResolvedValueOnce({ status: 200 });

    const github = require('@actions/github');
    github.context.eventName = 'pull_request';
    github.context.payload = {
      pull_request: {
        commits_url: 'https://api.github.com/repos/owner/repo/pulls/1/commits',
        title: 'ABC-123: Sample pull request title',
        url: 'https://api.github.com/repos/owner/repo/pulls/1',
        comments_url: 'https://api.github.com/repos/owner/repo/pulls/1/comments',
      },
    };

    await runCodeWarden();

    expect(mockPost).toHaveBeenCalledWith(
      `${jiraUrl}/jira/rest/analyze/1.0/pr`,
      {
        action: 'review_requested',
        api_token: githubToken,
        pull_request: {
          commits_url: 'https://api.github.com/repos/owner/repo/pulls/1/commits',
          title: 'ABC-123: Sample pull request title',
          files_url: 'https://api.github.com/repos/owner/repo/pulls/1/files',
          comments_url: 'https://api.github.com/repos/owner/repo/pulls/1/comments',
        },
      },
      {
        headers: {
          Authorization: `Bearer ${jiraApiToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    expect(core.info).toHaveBeenCalledWith('Pull Request Analyzed by Codewarden. Comment has been added to Pull Request');
    expect(core.setFailed).not.toHaveBeenCalled();
    expect(process.exit).not.toHaveBeenCalled();
  });

  it('should handle non-pull_request event', async () => {
    const github = require('@actions/github');
    github.context.eventName = 'push';
    github.context.payload = {};

    await runCodeWarden();

    expect(axios.post).not.toHaveBeenCalled();
    expect(core.setFailed).toHaveBeenCalledWith('Only pull requests are supported.');
    expect(core.info).not.toHaveBeenCalled();
    expect(process.exit).toHaveBeenCalled();
  });

  it('should handle failed analysis', async () => {
    const mockPostFailure = jest.spyOn(axios, 'post').mockResolvedValueOnce({ status: 500 });

    const github = require('@actions/github');
    github.context.eventName = 'pull_request';
    github.context.payload = {
      pull_request: {
        commits_url: 'https://api.github.com/repos/owner/repo/pulls/1/commits',
        title: 'ABC-123: Sample pull request title',
        url: 'https://api.github.com/repos/owner/repo/pulls/1',
        comments_url: 'https://api.github.com/repos/owner/repo/pulls/1/comments',
      },
    };
  
    await runCodeWarden();
  
    expect(mockPostFailure).toHaveBeenCalledWith(
      `${jiraUrl}/jira/rest/analyze/1.0/pr`,
      {
        action: 'review_requested',
        api_token: githubToken,
        pull_request: {
          commits_url: 'https://api.github.com/repos/owner/repo/pulls/1/commits',
          title: 'ABC-123: Sample pull request title',
          files_url: 'https://api.github.com/repos/owner/repo/pulls/1/files',
          comments_url: 'https://api.github.com/repos/owner/repo/pulls/1/comments',
        },
      },
      {
        headers: {
          Authorization: `Bearer ${jiraApiToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
  
    expect(core.info).not.toHaveBeenCalled();
    expect(core.setFailed).toHaveBeenCalledWith('Failed to Analyze Pull Request');
  });
  

  it('should handle errors', async () => {
    jest.spyOn(axios, 'post').mockRejectedValueOnce(new Error('Something went wrong'));

    await runCodeWarden();

    expect(core.setFailed).toHaveBeenCalledWith('Something went wrong');
    expect(core.info).not.toHaveBeenCalled();
  });
});


const axios = require('axios');
const core = require('@actions/core');
const { runCodeWarden } = require('../codewarden.js');


const githubToken = 'thisisnotagithubrealtoken';
const jiraUrl = 'http://codewarden-jira.com';
const jiraUser = 'myUser';
const jiraPwd = 'myPwd';

const postConfig = {
  auth: {
    username: jiraUser,
    password: jiraPwd
  },
  headers: {
    'Content-Type': 'application/json'
  }
};


const expectUrl =  `${jiraUrl}/rest/analyze/1.0/pr`; 

// Mock the required inputs
jest.mock('@actions/core', () => ({
  getInput: jest.fn().mockImplementation((inputName) => ({
    'github-token': githubToken,
    'jira-url': jiraUrl,
    'jira-user': jiraUser,
    'jira-password': jiraPwd,
  }[inputName] || '')),
  setFailed: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
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


 it('should analyze pull request and add comment', async () => {
    const mockPost = jest.spyOn(axios, 'post').mockResolvedValueOnce({ status: 200 });
    const expectedPayload = {
      action: 'review_requested',
      api_token: githubToken,
      pull_request: {
        commits:1,
        commits_url: 'https://api.github.com/repos/owner/repo/pulls/1/commits',
        title: 'ABC-123: Sample pull request title',
        files_url: 'https://api.github.com/repos/owner/repo/pulls/1/files',
        comments_url: 'https://api.github.com/repos/owner/repo/pulls/1/comments'
      }
    };

    const github = require('@actions/github');
    github.context.eventName = 'pull_request';
    github.context.payload = {
      pull_request: {
        commits:1,
        commits_url: 'https://api.github.com/repos/owner/repo/pulls/1/commits',
        title: 'ABC-123: Sample pull request title',
        url: 'https://api.github.com/repos/owner/repo/pulls/1',
        comments_url: 'https://api.github.com/repos/owner/repo/pulls/1/comments',
      },
    };

    await runCodeWarden();


    expect(mockPost).toHaveBeenCalledWith(
      expectUrl,
      expectedPayload,
      postConfig
    );

    expect(core.info).toHaveBeenCalledWith('Code Warden workflow started'); 
    expect(core.info).toHaveBeenCalledWith('Calling Code Warden Endpoint: http://codewarden-jira.com/rest/analyze/1.0/pr'); 
    expect(core.info).toHaveBeenCalledWith('Pull Request Analyzed by Code Warden. Comment has been added to Pull Request');
    expect(core.setFailed).not.toHaveBeenCalled();
    expect(process.exit).not.toHaveBeenCalled();
  });

  it('should handle non-pull_request event', async () => {
    const github = require('@actions/github');
    github.context.eventName = 'push';
    github.context.payload = {};

    await runCodeWarden();
   
    expect(core.info).toHaveBeenCalledWith('Code Warden workflow started'); 
    expect(axios.post).not.toHaveBeenCalled();
    expect(core.setFailed).toHaveBeenCalledWith('Only pull requests are supported.');
  });

  it('should handle failed analysis status eroor with no error code', async () => {
    const mockPostFailure = jest.spyOn(axios, 'post').mockResolvedValueOnce({ status: 500 });
    const expectedPayload = {
      action: 'review_requested',
      api_token: githubToken,
      pull_request: {
        commits:1,
        commits_url: 'https://api.github.com/repos/owner/repo/pulls/1/commits',
        title: 'ABC-123: Sample pull request title',
        files_url: 'https://api.github.com/repos/owner/repo/pulls/1/files',
        comments_url: 'https://api.github.com/repos/owner/repo/pulls/1/comments'
      }
    };

    const github = require('@actions/github');
    github.context.eventName = 'pull_request';
    github.context.payload = {
      pull_request: {
        commits:1,
        commits_url: 'https://api.github.com/repos/owner/repo/pulls/1/commits',
        title: 'ABC-123: Sample pull request title',
        url: 'https://api.github.com/repos/owner/repo/pulls/1',
        comments_url: 'https://api.github.com/repos/owner/repo/pulls/1/comments',
      },
    };
  
    await runCodeWarden();
  
    expect(mockPostFailure).toHaveBeenCalledWith(
      expectUrl,
      expectedPayload,
      postConfig
    );
    expect(core.info).toHaveBeenCalledWith('Code Warden workflow started'); 
    expect(core.setFailed).toHaveBeenCalledWith('UnExpected Error: Code Warden encountered an issue');
  });
  
  it('should handle failed analysis status 500 with error code', async () => {
    const mockPostFailure = jest.spyOn(axios, 'post').mockResolvedValueOnce({ status: 500 , data: {errorCode: 1003, errorMessage: 'Internal Error has occurred'} });
    const expectedPayload = {
      action: 'review_requested',
      api_token: githubToken,
      pull_request: {
        commits:1,
        commits_url: 'https://api.github.com/repos/owner/repo/pulls/1/commits',
        title: 'ABC-123: Sample pull request title',
        files_url: 'https://api.github.com/repos/owner/repo/pulls/1/files',
        comments_url: 'https://api.github.com/repos/owner/repo/pulls/1/comments'
      }
    };

    const github = require('@actions/github');
    github.context.eventName = 'pull_request';
    github.context.payload = {
      pull_request: {
        commits:1,
        commits_url: 'https://api.github.com/repos/owner/repo/pulls/1/commits',
        title: 'ABC-123: Sample pull request title',
        url: 'https://api.github.com/repos/owner/repo/pulls/1',
        comments_url: 'https://api.github.com/repos/owner/repo/pulls/1/comments',
      },
    };
  
    await runCodeWarden();
  
    expect(mockPostFailure).toHaveBeenCalledWith(
      expectUrl,
      expectedPayload,
      postConfig
    );
    expect(core.info).toHaveBeenCalledWith('Code Warden workflow started'); 
    expect(core.setFailed).toHaveBeenCalledWith('Code Warden encountered Error Code: 1003, Error Message: Internal Error has occurred');
  });

  it('should handle failed analysis status 400 with error code', async () => {
    const mockPostFailure = jest.spyOn(axios, 'post').mockResolvedValueOnce({ status: 400 , data: {errorCode: 1001, errorMessage: 'Bad Request'} });
    const expectedPayload = {
      action: 'review_requested',
      api_token: githubToken,
      pull_request: {
        commits:1,
        commits_url: 'https://api.github.com/repos/owner/repo/pulls/1/commits',
        title: 'ABC-123: Sample pull request title',
        files_url: 'https://api.github.com/repos/owner/repo/pulls/1/files',
        comments_url: 'https://api.github.com/repos/owner/repo/pulls/1/comments'
      }
    };

    const github = require('@actions/github');
    github.context.eventName = 'pull_request';
    github.context.payload = {
      pull_request: {
        commits:1,
        commits_url: 'https://api.github.com/repos/owner/repo/pulls/1/commits',
        title: 'ABC-123: Sample pull request title',
        url: 'https://api.github.com/repos/owner/repo/pulls/1',
        comments_url: 'https://api.github.com/repos/owner/repo/pulls/1/comments',
      },
    };
  
    await runCodeWarden();
  
    expect(mockPostFailure).toHaveBeenCalledWith(
      expectUrl,
      expectedPayload,
      postConfig
    );
    expect(core.info).toHaveBeenCalledWith('Code Warden workflow started'); 
    expect(core.setFailed).toHaveBeenCalledWith('Code Warden encountered Error Code: 1001, Error Message: Bad Request');
  });


  it('should handle failed analysis status 404 with error code', async () => {
    const mockPostFailure = jest.spyOn(axios, 'post').mockResolvedValueOnce({ status: 400 , data: {errorCode: 1004, errorMessage: 'Not Found'} });
    const expectedPayload = {
      action: 'review_requested',
      api_token: githubToken,
      pull_request: {
        commits:1,
        commits_url: 'https://api.github.com/repos/owner/repo/pulls/1/commits',
        title: 'ABC-123: Sample pull request title',
        files_url: 'https://api.github.com/repos/owner/repo/pulls/1/files',
        comments_url: 'https://api.github.com/repos/owner/repo/pulls/1/comments'
      }
    };

    const github = require('@actions/github');
    github.context.eventName = 'pull_request';
    github.context.payload = {
      pull_request: {
        commits:1,
        commits_url: 'https://api.github.com/repos/owner/repo/pulls/1/commits',
        title: 'ABC-123: Sample pull request title',
        url: 'https://api.github.com/repos/owner/repo/pulls/1',
        comments_url: 'https://api.github.com/repos/owner/repo/pulls/1/comments',
      },
    };
  
    await runCodeWarden();
  
    expect(mockPostFailure).toHaveBeenCalledWith(
      expectUrl,
      expectedPayload,
      postConfig
    );
    expect(core.info).toHaveBeenCalledWith('Code Warden workflow started'); 
    expect(core.setFailed).toHaveBeenCalledWith('Code Warden encountered Error Code: 1004, Error Message: Not Found');
  });

  it('should catch unhandled response status', async () => {
    const mockPostFailure = jest.spyOn(axios, 'post').mockResolvedValueOnce({ status: 414});
    const expectedPayload = {
      action: 'review_requested',
      api_token: githubToken,
      pull_request: {
        commits:1,
        commits_url: 'https://api.github.com/repos/owner/repo/pulls/1/commits',
        title: 'ABC-123: Sample pull request title',
        files_url: 'https://api.github.com/repos/owner/repo/pulls/1/files',
        comments_url: 'https://api.github.com/repos/owner/repo/pulls/1/comments'
      }
    };

    const github = require('@actions/github');
    github.context.eventName = 'pull_request';
    github.context.payload = {
      pull_request: {
        commits:1,
        commits_url: 'https://api.github.com/repos/owner/repo/pulls/1/commits',
        title: 'ABC-123: Sample pull request title',
        url: 'https://api.github.com/repos/owner/repo/pulls/1',
        comments_url: 'https://api.github.com/repos/owner/repo/pulls/1/comments',
      },
    };
  
    await runCodeWarden();
  
    expect(mockPostFailure).toHaveBeenCalledWith(
      expectUrl,
      expectedPayload,
      postConfig
    );
    expect(core.info).toHaveBeenCalledWith('Code Warden workflow started'); 
    expect(core.setFailed).toHaveBeenCalledWith('UnExpected Error: Failed to Analyze Pull Request');
  });



  it('should handle errors unexpected error', async () => {
    jest.spyOn(axios, 'post').mockRejectedValueOnce(new Error('Cannnot get key'));

    await runCodeWarden();
    expect(core.info).toHaveBeenCalledWith('Code Warden workflow started'); 
    expect(core.setFailed).toHaveBeenCalledWith('UnExpected Error: Code Warden encountered an issue Cannnot get key');

  });
});


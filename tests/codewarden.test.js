const axios = require('axios');
const core = require('@actions/core');
const { runCodeWarden } = require('../codewarden.js');


const githubToken = 'thisisnotagithubrealtoken';
const jiraUrl = 'http://codewarden-jira.com';
const jiraUser = 'myUser';
const jiraPwd = 'myPwd';
const commentLang = 'English';
;

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
    'comment-language': commentLang,
  }[inputName] || '')),
  setFailed: jest.fn(),
  info: jest.fn(),
  warning: jest.fn(),
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
    const mockPost = jest.spyOn(axios, 'post').mockResolvedValueOnce({ status: 200, data: {message: 'Pull Request Analyzed by Code Warden. Comment has been added to this Pull Request'} });
    const expectedPayload = {
      options: {
        language: commentLang
      },
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
    
    expect(core.info).toHaveBeenNthCalledWith(1, 'Code Warden workflow started');
    expect(core.info).toHaveBeenNthCalledWith(2, 'Calling Code Warden Endpoint: http://codewarden-jira.com/rest/analyze/1.0/pr');
    expect(core.info).toHaveBeenNthCalledWith(3, 'Pull Request Analyzed by Code Warden. Comment has been added to this Pull Request');
    expect(core.warning).not.toHaveBeenCalled();
    expect(core.setFailed).not.toHaveBeenCalled();
    expect(process.exit).not.toHaveBeenCalled();
  });

  it('should analyze pull request found no jira key', async () => {
    const mockPost = jest.spyOn(axios, 'post').mockResolvedValueOnce({ status: 200, data: {message: 'Cannot perform Analysis - No work item was found in the pull_request for the analysis'} });
    const expectedPayload = {
      options: {
        language: commentLang

      },
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
    
    expect(core.info).toHaveBeenNthCalledWith(1, 'Code Warden workflow started');
    expect(core.info).toHaveBeenNthCalledWith(2, 'Calling Code Warden Endpoint: http://codewarden-jira.com/rest/analyze/1.0/pr');
    expect(core.warning).toHaveBeenNthCalledWith(1, 'Cannot perform Analysis - No work item was found in the pull_request for the analysis');
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

  it('should handle failed analysis status error with no error code', async () => {
    const mockPostFailure = jest.spyOn(axios, 'post').mockResolvedValueOnce({ status: 500 });
    const expectedPayload = {
      options: {
        language: commentLang

      },
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
    expect(core.setFailed).toHaveBeenCalledWith('Unexpected Error: Code Warden encountered an issue \n Internal Server Error: Something went wrong on our side');
  });
  
  it('should handle failed analysis status 500 with error code', async () => {
    const mockPostFailure = jest.spyOn(axios, 'post').mockResolvedValueOnce({ status: 500 , data: {errorCode: 1003, errorMessage: 'Internal Error has occurred'} });
    const expectedPayload = {
      options: {
        language: commentLang

      },
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
    expect(core.setFailed).toHaveBeenCalledWith('Code Warden encountered Error Code: 1003 - Error Message: Internal Error has occurred \n Internal Server Error: Something went wrong on our side');
  });

  it('should handle failed analysis status 400 with error code', async () => {
    const mockPostFailure = jest.spyOn(axios, 'post').mockResolvedValueOnce({ status: 400 , data: {errorCode: 1001, errorMessage: 'Bad Request'} });
    const expectedPayload = {
      options: {
        language: commentLang

      },
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
    expect(core.setFailed).toHaveBeenCalledWith('Code Warden encountered Error Code: 1001 - Error Message: Bad Request \n Bad Request: Please check all required fields');
  });


  it('should handle failed analysis status 404 with error code', async () => {
    const mockPostFailure = jest.spyOn(axios, 'post').mockResolvedValueOnce({ status: 404 , data: {errorCode: 1004, errorMessage: 'Not Found'} });
    const expectedPayload = {
      options: {
        language: commentLang

      },
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
    expect(core.setFailed).toHaveBeenCalledWith('Code Warden encountered Error Code: 1004 - Error Message: Not Found \n Not Found: Requested resource could not be found');
  });

  it('should catch unhandled response status', async () => {
    const mockPostFailure = jest.spyOn(axios, 'post').mockResolvedValueOnce({ status: 414});
    const expectedPayload = {
      options: {
        language: commentLang

      },
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
    expect(core.setFailed).toHaveBeenCalledWith('Unexpected Error: Failed to analyze pull request');
  });



  it('should handle errors unexpected error', async () => {
    jest.spyOn(axios, 'post').mockRejectedValueOnce(new Error('Cannnot get key'));

    await runCodeWarden();
    expect(core.info).toHaveBeenCalledWith('Code Warden workflow started'); 
    expect(core.setFailed).toHaveBeenCalledWith('Unexpected Error: Code Warden encountered an issue \n Cannnot get key');

  });

  it('should handle unAuthorized status 401 with error code', async () => {
    const mockPostFailure = jest.spyOn(axios, 'post').mockResolvedValueOnce({ status: 401 , data: {errorCode: 1002, errorMessage: 'The Code Warden Jira plugin does not have a valid license'} });
    const expectedPayload = {
      options: {
        language: commentLang

      },
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
    expect(core.setFailed).toHaveBeenCalledWith('Code Warden encountered Error Code: 1002 - Error Message: The Code Warden Jira plugin does not have a valid license \n UnAuthorized: Invalid Liceense');
  });

});


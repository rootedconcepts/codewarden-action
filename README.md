# [Codewarden.ai](https://codewarden.ai) GitHub Action

This action will analyze your pull request code using [Codewarden](https://codewarden.ai) against the requirements detailed in your Jira ticket


## Getting Started

In order to use this action you will require

1. Jira Data Centre edition
2. The Jira [Codewarden plugin](https://marketplace.atlassian.com/) installed from the market place into your Jira Data Centre edition


## Usage

```yaml
on:
  pull_request:
    branches:
      - main

steps:
   - name: Codewarden Analyze
     uses: rootedconcepts/CodewardenAction@v1
     with:
     github-token: ${{ secrets.GITHUB_TOKEN }}
     jira-url : "https://myjira.com/"
     jira-token: ${{ secrets.JIRA_TOKEN }}
```

## Inputs   

### `github-token`

**Required** A token to access the PR detail within the Git repo. Required to update comment on PR get file associated with PR for analyzes.

### `jira-url`

**Required** The url of your Jira instance which has the Codewarden plugin installed.

### `jira-api-token`

**Required** The token to access the Jira API.```

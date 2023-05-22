# [codewarden.ai](https://codewarden.ai) GitHub Action

This action will analyze your pull request code using [Code Warden](https://codewarden.ai) against the requirements detailed in your Jira ticket


## Getting Started

In order to use this action you will require

1. Jira Data Center edition
2. The Jira [Code Warden plugin](https://marketplace.atlassian.com/) installed from the market place into your Jira Data Center edition


## Usage

```yaml
on:
  pull_request:
    branches:
      - main

permissions:
  contents: read
 
jobs:
  verification:
    runs-on: ubuntu-latest
    permissions:
      pull-requests: write
    steps:
      - name: Code Warden Analyze
        uses: rootedconcepts/codewarden-action@v1
        with:
        github-token: ${{ secrets.GITHUB_TOKEN }}
        jira-url : "https://myjira.com/"
        jira-api-token: ${{ secrets.JIRA_API_TOKEN }}
```

## Inputs   

### `github-token`

**Required** A token to access the PR detail within the Git repo. Required to update comment on PR get file associated with PR for analyzes.

### `jira-url`

**Required** The url of your Jira instance which has the Codew Warden plugin installed.

### `jira-api-token`

**Required** The token to access the Jira API.```

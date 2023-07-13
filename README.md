# [codewarden.ai](https://codewarden.ai) GitHub Action

This action will analyze your pull request code using [Code Warden](https://codewarden.ai) against the requirements detailed in your Jira ticket


## Getting Started

In order to use this action you will require

1. Jira Data Center edition
2. The Jira [Code Warden plugin](https://marketplace.atlassian.com/) installed from the market place into your Jira Data Center edition


## Usage

```yaml

name: Code Warden In Action

on:
  pull_request:
    branches:
      - main

permissions:
  contents: read
  pull-requests: write
 
jobs:
  codewarden-test:
    runs-on: ubuntu-latest
   
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Code Warden Analyze
        uses: rootedconcepts/codewarden-action@v1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          jira-url : "https://myjira.com"
          jira-user: ${{ secrets.JIRA_USER }}
          jira-password: ${{ secrets.JIRA_PWD }}
```

## Inputs   

### `github-token`

**Required** A token to access the PR detail within the Git repo. Required to update comment on PR get file associated with PR for analyzes.

### `jira-url`

**Required** The url of your Jira instance which has the Codew Warden plugin installed.

### `jira-user`

**Required** The user name for to logon to the Jira instance.```

### `jira-password`

**Required** The password for to user to logon to the Jira instance.```

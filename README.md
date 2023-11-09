[![Code Warden](./images/logo.png)](https://codewarden.ai)


# [codewarden.ai](https://codewarden.ai) GitHub Action

![jest Coverage](https://img.shields.io/badge/Jest%20Coverage-98-green.svg)

This action will analyze your pull request code using [Code Warden](https://codewarden.ai) against the requirements detailed in your Jira ticket

---
## Getting Started

In order to use this action you will require:

1. Jira Data Center edition or Jira Cloud edition
2. The Jira [Code Warden plugin](https://marketplace.atlassian.com/apps/1231947/code-warden) installed from the Atlassian Marketplace onto your Jira Data Center edition instance or Jira Cloud edition

---
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
## Advanced Usage

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
          jira-url : "https://myjiracloud.com/webtrigger"
          jira-user: ${{ secrets.JIRA_USER }}
          jira-password: ${{ secrets.JIRA_PWD }}
          jira-cloud-edition: true
          comment-language: "French"
```
---
## Inputs   

### `github-token`

**Required** - A token to access the PR detail within the Git repo. This is required for Code Warden to be able to post a comment on the PR and read files associated with the PR for analysis.

### `jira-url`

**Required** - The URL of your Jira instance which has the Code Warden plugin installed. `Note for Jira Cloud edition this generated after you install the Code Warden app and can be retrieved from the Jira UI `

### `jira-user`

**Required** - The user name to login to the Jira instance.

### `jira-password`

**Required** - The password for the user to login to the Jira instance. `Note for Jira Cloud edition this will be your API token `

## `jira-cloud-edition`

**Optional** - Specify if you are using Jira Cloud edition. Defaults to `false`

### `comment-language`

**Optional** - The language you want to display the Code Warden analysis in. Defaults  to `English`

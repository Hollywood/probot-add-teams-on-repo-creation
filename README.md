# Probot Example: Add Teams on Repo Creation

This repository contains a sample GitHub App built with [probot](https://github.com/probot/probot) that gives a team read access to a new repository when it is created. At present, the [api endpoint](https://octokit.github.io/rest.js/#api-Orgs-addTeamRepo) used to give teams access to a repository is not available for [GitHub Apps](https://developer.github.com/apps/). The `add-default-teams-github-app` branch implements the GitHub App authentication, but due to the current permissions model on GitHub.com, is not yet functional. The functionality in this branch can be implemented if and when this endpoint is enabled for GitHub Apps.  

## Setup

Please note that this app is meant to demonstrate the functional capabilities of a Probot app and is not production-ready. It is strongly recommended that a user takes the following steps prior to use:

- [Duplicate](https://help.github.com/articles/duplicating-a-repository/) this repository into a repository in your own user account or organization
- In your new repository, open a pull request between the `add-default-teams-github-app` and `master` branches and review the changes introduced. This represents all of the code used to implement this app.
  - Note that this app does not have any testing implemented. It is strongly recommended that you implement testing prior to production deployment. For guidance on implementing testing in a Probot app, see this [documentation](https://probot.github.io/docs/testing/).
- Configure a [GitHub App](https://probot.github.io/docs/development/#configuring-a-github-app) on GitHub
- Read the in-line documentation explaining the functionality of the app
- Customize the implementation to fit your needs

## Configuration
Under the current implementation, there are several configurable attributes. Defaults for these attributes can be set in the [defaults.js](./lib/defaults.js) file, but it is recommended that each org in which this is implemented creates an override file with a file called `.github/add-team-on-repo-creation.yml` file in the Repository, `org-settings`. This Repository will contain global settings for the Organization. You can name the settings repository anything you'd like; just add the repository name to your defaults.js file.

```yml
# Configuration for Create Issue Upon Repo Creation


# Enables addition of a team when a new repository is created
enableTeamAddition: true

# Issue Title when a team is given access
teamsAddedIssueTitle: 'Team given read access'

# Issue Body when a team is given access
teamsAddedIssueBody: 'The following team has been given read access to this repository:'

# Issue Title when a team has not been given access due to the repository creator's exempt status
exemptTeamIssueTitle: 'No default team added'

# Issue Body when a team has not been given access due to the repository creator's exempt status
exemptTeamIssueBody: 'Normally, a default team is given read access to this repository. However, the repository creator is a member of the following exempt team, and therefore no default access has been given.'

# The name of the team to add when a repository is created
teamNameToAdd: 'test_team'

# The name of the team that is exempt from having team access granted upon repository creation
exemptTeamName: 'admin',

# Users/Groups that should be cc'ed on the issue. Should be users/groups separated by a space.
# ccList: '@user123 @user456'
```

## Deployment

Probot is a standard NodeJS app, and thus can be deployed as such. [Documentation](https://probot.github.io/docs/deployment) is available on the Probot website, which provides directions for deployment using Glitch, Heroku, and Now.

If you have multiple Probot apps that you would like to deploy together, see [Combining apps](https://probot.github.io/docs/deployment/#combining-apps).

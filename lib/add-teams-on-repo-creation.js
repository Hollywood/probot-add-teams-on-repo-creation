const yaml = require('js-yaml')
const noOrgConfig = false

class AddTeamsOnRepoCreation {

  // Analyze checks for the existence of an organization-wide repository created for the purpose of configurng Probot apps. By default, the path of this configuration file is https://github.com/[ORG_NAME]/org-settings/.github/add-teams-on-repo-creation.yml. Both the repository name and file path can be configured in defaults.js. If no configuration file exists at the specified location, default values are used as configured in defaults.js
  static analyze (github, repo, payload, logger) {
    const defaults = require('./defaults')
    const orgRepo = (process.env.ORG_WIDE_REPO_NAME) ? process.env.ORG_WIDE_REPO_NAME : defaults.ORG_WIDE_REPO_NAME
    const filename = (process.env.FILE_NAME) ? process.env.FILE_NAME : defaults.FILE_NAME
    logger.info('Get config from: ' + repo.owner + '/' + orgRepo + '/' + filename)

    return github.repos.getContent({
      owner: repo.owner,
      repo: orgRepo,
      path: filename
    }).catch(() => ({
      noOrgConfig
    }))
      .then((orgConfig) => {
        if ('noOrgConfig' in orgConfig) {
          logger.info('NOTE: config file not found in: ' + orgRepo + '/' + filename + ', using defaults.')
          return new AddTeamsOnRepoCreation(github, repo, payload, logger, '').addTeams()
        } else {
          const content = Buffer.from(orgConfig.data.content, 'base64').toString()
          return new AddTeamsOnRepoCreation(github, repo, payload, logger, content).addTeams()
        }
      })
  }

  constructor (github, repo, payload, logger, config) {
    this.github = github
    this.repo = repo
    this.payload = payload
    this.logger = logger
    this.config = yaml.safeLoad(config)
  }


  async addTeams () {
    var configParams = Object.assign({}, require('./defaults'), this.config || {})

    if (!configParams.enableTeamAddition) {
        this.logger.info('Repo: ' + this.repo.repo + ' was created but enableTeamAddition is set to false')
        return
    }

    // Get a list of all teams within the org. This includes handling of pagination if the list exceeds 100 teams
    const response = await this.github.orgs.getTeams({org: this.repo.owner, per_page: 100})
    let teams = response.data
    while (this.github.hasNextPage(response)) {
      response = await this.github.getNextPage(response)
      teams = teams.concat(response.data)
    }

    // Get the team that is configured to be added to the new repository
    const matchedTeamToAdd = teams.find(function(team){
      return team.slug === configParams.teamNameToAdd.toLowerCase()
    })

    // Get the team that is configured to be exempt from the auto-team-addition
    const matchedTeamToExempt = teams.find(function(team){
      return team.slug === configParams.exemptTeamName.toLowerCase()
    })


    if (matchedTeamToExempt) {
      var isExempt

      // Determine whether the person who created the repo is a member of the exempt team. If they are not, the following api endpoint will return a 403 status, which is caught and logged.
      try {
        isExempt = await this.github.orgs.getTeamMembership({id: matchedTeamToExempt.id, username: this.payload.sender.login})
      } catch (err) {
        console.log('Error:', err)
      }
      // If the person who created the repo is a member of the exempt team, an issue is created notifying the user that no team has been added to the repository.
      if (isExempt) {
        const fullTeamName = '@' + this.repo.owner + '/' + configParams.teamName
        var issueBody = formIssueBody(this.payload, configParams.exemptTeamIssueBody, configParams.ccList, configParams.exemptTeamName)

        createIssue(this.repo, this.github, configParams.exemptTeamIssueTitle, issueBody)

        return
      }
    }

    // Checks to make sure that the configured team to be added exists in this org. If not, an error is thrown. Otherwise, the team is given read access to the newly-created repository
    if (!matchedTeamToAdd) {
      this.logger.error('Team:' + teamName + 'does not exist')
      return
    } else {
      const teamID = matchedTeamToAdd.id

      // NOTE: This endpoint is not yet enabled for GitHub Apps.
      const result = await this.github.orgs.addTeamRepo({id: teamID, org: this.repo.owner, repo: this.repo.repo, permission: 'pull'})
    }

    // An issue is created, notifying the users of the repository that the team has automatically been given read access.
    const fullTeamName = '@' + this.repo.owner + '/' + configParams.teamName
    var issueBody = formIssueBody(this.payload, configParams.teamsAddedIssueBody, configParams.ccList, fullTeamName)

    createIssue(this.repo, this.github, configParams.teamsAddedIssueTitle, issueBody)

  }

}

function createIssue(repo, github, title, body) {
  const issueParams = {
    title: title,
    body: body
  }
  const createIssueParams = Object.assign({}, repo, issueParams || {})
  github.issues.create(createIssueParams)
}

function formIssueBody(payload, body, ccList) {
  const owner = payload.sender.login
  var issueBody = body + '\n\n/cc @' + owner
  issueBody += (ccList) ? '\n/cc ' + ccList : ''
  return issueBody
}



module.exports = AddTeamsOnRepoCreation

var AddTeamsOnRepoCreation = require('./lib/add-teams-on-repo-creation')

function addTeamsOnRepoCreation (robot) {
  robot.on('repository.created', async context => {
    return AddTeamsOnRepoCreation.analyze(context.github, context.repo(), context.payload, robot.log)
  })
}

module.exports = addTeamsOnRepoCreation

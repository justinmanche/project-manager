const { Command } = require('commander')
const { prompt } = require('enquirer')
const { exec } = require("child_process");
const { exit } = require('process')
const { getProjects } = require('../prompts')
const { getConfig, initializeGit } = require('../utils')

const clean = async ({ configuration }) => {
  const config = getConfig(configuration)
  const projects = await getProjects(config)

  await initializeGit(projects)

  for (const project of projects) {
    const branches = await project.git.branchLocal()

    const branchNames = branches.all.filter(i => i !== 'master')

    if (branchNames.length == 0) continue

    console.log(`\n+++ Found ${branchNames.length} branches in ${project.name} +++\n`)

    let { toClean } = await prompt({
      type: 'multiselect',
      name: 'toClean',
      message: `Found ${branchNames.length} branches, which would you like to delete?`,
      initial: 'All',
      choices: ['All', ...branchNames]
    })

    const selectedToClean = toClean == 'All' ? branchNames : toClean

    try {
      await project.git.deleteLocalBranches(selectedToClean, true)
    } catch (err) {
      if (err.message.includes('checked out at')) {
        console.log(`Cannot delete all branches in ${project.name}.  Ensure no branches that you are attempting to delete are currently checked out.`)
      }
    }
  }
}

module.exports = new Command().command('clean')
                              .option('-c, --configuration <file>', 'must provide a config file location')
                              .action(clean)

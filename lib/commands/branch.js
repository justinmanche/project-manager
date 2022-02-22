const { Command } = require('commander')
const { prompt } = require('enquirer')
const { exec } = require("child_process");
const { exit } = require('process')
const { getProjects } = require('../prompts')
const { getConfig, initializeGit } = require('../utils')

const getBaseBranch = {
  type: 'input',
  name: 'baseBranchName',
  message: 'Enter the name of the branch you want to branch off, or "current" to use the current branch:',
  initial: 'current'
}

const getNewBranchName = {
  type: 'input',
  name: 'newBranchName',
  message: 'Enter a name for the branch you want to perform this work in, or "current" to use the current branch:',
  initial: 'current'
}

const validateProjectClean = async (project, baseBranch, newBranch) => {
  project.baseBranch = baseBranch == 'current' ? project.currentBranch : baseBranch
  project.newBranch = newBranch == 'current' ? project.currentBranch : newBranch

  if (project.baseBranch == project.currentBranch) return

  if (project.files.length > 0) {
    console.error(`${project.name} is dirty, cannot continue. (${project.path})`)
    exit(0)
  }
}

const branch = async ({ configuration }) => {
  const config = getConfig(configuration)
  const projects = await getProjects(config)

  await initializeGit(projects)

  let { baseBranchName, newBranchName } = await prompt([
    getBaseBranch,
    getNewBranchName
  ])

  for (const project of projects) {
    await validateProjectClean(project, baseBranchName, newBranchName)

    const { baseBranch, newBranch, currentBranch } = project

    if (baseBranch !== currentBranch) {
      await project.git.checkout(baseBranch)
      await project.git.pull()
    }

    if (newBranch !== currentBranch) {
      try {
        await project.git.checkoutBranch(newBranch, currentBranch)
      } catch (err) {
        if (err.message.match(/already exists/g)) {
          await project.git.checkout(newBranch)
        } else {
          console.error(err.message)
          exit(0)
        }
      }
    }
  }
}

module.exports = new Command().command('branch')
                              .option('-c, --configuration <file>', 'must provide a config file location')
                              .action(branch)

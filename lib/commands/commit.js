const { Command } = require('commander')
const { prompt } = require('enquirer')
const { default: simpleGit } = require('simple-git')
const { exec } = require("child_process");
const { exit } = require('process')
const { getProjects } = require('../prompts')
const { getConfig } = require('../utils')

const getShouldPush = {
  name: 'shouldPush',
  message: 'Do you want to push these changes? (y/n)',
  type: 'input',
  validate: input => {
    const validInput = ['y', 'Y', 'n', 'N']

    if (validInput.includes(input)) return true

    return `Input invalid, please enter one of the following: ${validInput.join(', ')}`
  },
  required: true
}

const getCommitMessage = {
  type: 'input',
  name: 'commitMessage',
  message: 'Enter a commit message for these changes:',
  required: true
}

const commitChanges = async projects => {
  let { commitMessage } = await prompt(getCommitMessage)

  for (const project of projects) {
    process.chdir(project.path)

    project.git.add('.').commit(commitMessage)
  }
}

const pushChanges = async projects => Promise.all(projects.map(project => (
  project.git.push(['-u', 'origin', 'HEAD'])
)))

const commit = async ({ configuration }) => {
  const config = getConfig(configuration)
  const projects = await getProjects(config)

  await initializeGit(projects)
  await commitChanges(projects)

  const { shouldPush } = await prompt(getShouldPush)

  if (shouldPush == 'y' || shouldPush == 'Y') await pushChanges(projects)
}

module.exports = new Command().command('commit')
                              .option('-c, --configuration <file>', 'must provide a config file location')
                              .action(commit)

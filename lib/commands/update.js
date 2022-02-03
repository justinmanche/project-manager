const { Command } = require('commander')
const { prompt } = require('enquirer')
const { default: simpleGit } = require('simple-git')
const { exec } = require("child_process");
const { exit } = require('process')
const { getProjects } = require('../prompts')

const update = async ({ configuration }) => {
  const config = require(configuration || '../../default-config.js')

  const getBaseBranch = {
    type: 'input',
    name: 'baseBranch',
    message: 'Enter the name of the branch you want to branch off, or "current" to use the current branch:',
    initial: 'current'
  }

  const getNewBranchName = {
    type: 'input',
    name: 'newBranch',
    message: 'Enter a name for the branch you want to perform this work in, or "current" to use the current branch:',
    initial: 'current'
  }

  const getCommand = {
    type: 'input',
    name: 'command',
    message: 'Enter the command you would like to run in each project:',
    required: true
  }

  const getCommitMessage = {
    type: 'input',
    name: 'commitMessage',
    message: 'Enter a commit message for these changes:',
    required: true
  }

  const booleanTemplate = {
    type: 'input',
    validate: input => {
      const validInput = ['y', 'Y', 'n', 'N']

      if (validInput.includes(input)) return true

      return `Input invalid, please enter one of the following: ${validInput.join(', ')}`
    },
    required: true
  }

  const getShouldCommit = {
    name: 'shouldCommit',
    message: 'Do you want to commit these changes? (y/n)',
    ...booleanTemplate
  }

  const getShouldPush = {
    name: 'shouldPush',
    message: 'Do you want to push these changes? (y/n)',
    ...booleanTemplate
  }

  const validateProjectsClean = async projects => {
    projects.forEach(project => {
      const { baseBranch, currentBranch, files } = project

      if (baseBranch == currentBranch) return

      if (files.length > 0) {
        throw `${project.name} is dirty, cannot continue. (${project.path})`
      }
    })
  }

  const prepareProjects = async projects => {
    let { baseBranch, newBranch } = await prompt([
      getBaseBranch,
      getNewBranchName
    ])

    for (const project of projects) {
      let git
      try {
        git = simpleGit(project.path)
      } catch (err) {
        console.log(`Unable to initialize git on path: ${project.path}`)
        exit(0)
      }
      await git.fetch()
      const { behind, current, files } = await git.status()

      if (behind > 0) {
        console.log(`${project.name} is ${behind} behind it's remote branch, cannot continue.`)
        exit(0)
      }

      project.currentBranch = current
      project.baseBranch = baseBranch == 'current' ? current : baseBranch
      project.newBranch = newBranch == 'current' ? current : newBranch
      project.files = files
      project.git = git
    }

    await validateProjectsClean(projects)

    for (const project of projects) {
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
            console.log("Branch already exists")
            await project.git.checkout(newBranch)
          } else {
            console.log(err.message)
            process.exit(0)
          }
        }
      }
    }
  }

  const executeCommmand = async projects => {
    let { command } = await prompt(getCommand)

    console.log(`\nExecuting ${command} in ${projects.map(p => p.path).join(', ')}`)

    for (const project of projects) {
      process.chdir(project.path)

      await new Promise(async resolve => {
        try {
          const output = await exec(command)
          console.log(`\n ===== BEGIN OUTPUT (${project.name}) ===== \n`)
          output.stdout.pipe(process.stdout)
          output.stdout.on('end', () => {
            console.log(`\n ===== END OUTPUT (${project.name}) ===== \n`)
            resolve()
          })
        } catch (err) {
          console.log(`Encountered an error while executing: ${command}`, err)
          exit(0)
        }
      })
    }
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

  const projects = await getProjects(config)
  await prepareProjects(projects)

  await executeCommmand(projects)

  const { shouldCommit } = await prompt(getShouldCommit)

  if (shouldCommit == 'y' || shouldCommit == 'Y') {
    await commitChanges(projects)

    const { shouldPush } = await prompt(getShouldPush)

    if (shouldPush == 'y' || shouldPush == 'Y') await pushChanges(projects)
  }
}

module.exports = new Command().command('update')
                              .option('-c, --configuration <file>', 'must provide a config file location')
                              .action(update)

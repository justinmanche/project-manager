const homedir = require('os').homedir()
const path = require('path')
const fs = require('fs')
const { spawn } = require('child_process')
const simpleGit = require('simple-git')

const getConfig = customConfigPath => {
  const defaultConfigPath = path.join(homedir, 'pm-config.js')

  if (customConfigPath) {
    if (!fs.existsSync(customConfigPath)) {
      throw `Config path invalid, no file exists: ${customConfigPath}`
    }

    return require(customConfigPath)
  } else {
    if (!fs.existsSync(defaultConfigPath)) {
      throw `Couldn't find config at ${homedir}/pm-config.js`
    }

    return require(defaultConfigPath)
  }
}

const exec = async cmd => new Promise(resolve => {
  const [commandName, ...args] = cmd.split(' ')

  console.log(`\n+++ Executing ${commandName} with args:`, args, '+++\n')

  const command = spawn(commandName, args);

  command.stdout.pipe(process.stdout)
  command.stderr.pipe(process.stderr)

  command.on('error', (error) => {
    console.log(`error: ${error.message}`)
  })

  command.on("close", code => {
    resolve()
  })
})

const initializeGit = async projects => await Promise.all(projects.map(async project => {
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
  project.files = files
  project.git = git
}))

module.exports = { getConfig, exec, initializeGit }

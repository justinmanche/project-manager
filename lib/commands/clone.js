const { Command } = require('commander')
const { prompt } = require('enquirer')
const { getProjects } = require('../prompts')
const simpleGit = require('simple-git')
const fs = require('fs')

const clone = async ({ configuration }) => {
  const config = require(configuration || '../../default-config.js')
  const projects = await getProjects(config)

  await Promise.all(projects.map(async ({ name, path, clone }) => {
    const git = simpleGit()

    if (fs.existsSync(path)) {
      console.log(`Exists: ${name} (${path})`)
    } else {
      await git.clone(clone, path, ['--recursive'])

      console.log(`Cloned: ${name} (${path})`)
    }
  }))
}

module.exports = new Command().command('clone')
                              .option('-c, --configuration <file>', 'must provide a config file location')
                              .action(clone)

const { Command } = require('commander')
const { prompt } = require('enquirer')
const { getProjects } = require('../prompts')
const { getConfig, exec } = require('../utils')

const getCommand = {
  type: 'input',
  name: 'command',
  message: 'Enter the command you would like to run in each project:',
  required: true
}

const execute = async ({ configuration }) => {
  const config = getConfig(configuration)
  const projects = await getProjects(config)

  let { command } = await prompt(getCommand)

  console.log(`\nExecuting ${command} in ${projects.map(p => p.path).join(', ')}`)

  await Promise.all(projects.map(async project => {
    process.chdir(project.path)

    await exec(command)
  }))
}

module.exports = new Command().command('execute')
                              .option('-c, --configuration <file>', 'must provide a config file location')
                              .action(execute)

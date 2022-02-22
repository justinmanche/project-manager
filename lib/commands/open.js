const { Command } = require('commander')
const { prompt } = require('enquirer')
const { getProjects } = require('../prompts')
const simpleGit = require('simple-git')
const { getConfig, exec } = require('../utils')

const open = async ({ configuration }) => {
  const config = getConfig(configuration)
  const projects = await getProjects(config)

  if (projects.length == 0) return console.log('No matching projects found')

  let { openWith } = await prompt({
    type: 'select',
    name: 'openWith',
    message: `Found ${projects.count} project/s, which IDE do you want to open them with?`,
    initial: 'atom',
    choices: [
      { message: 'Atom', value: 'atom' },
      { message: 'Visual Studio Code', value: 'vscode' }
    ]
  })

  await exec(`${openWith} ${projects.map(p => p.path).join(' ')}`)
}

module.exports = new Command().command('open')
                              .option('-c, --configuration <file>', 'must provide a config file location')
                              .action(open)

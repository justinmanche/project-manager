const { prompt, BooleanPrompt } = require('enquirer')
const program = require('./lib/program')
const commands = require('./lib/commands')

const run = async () => {
  const options = program.opts()

  Object.values(commands).forEach(cmd => {
    program.addCommand(cmd)
  })

  program.parse()
}

run()

const { prompt, BooleanPrompt } = require('enquirer')
const homedir = require('os').homedir()

module.exports = async config => {
  const all = 'all'
  const byName = 'byName'
  const byTag = 'byTag'
  let projects = config.projects.map(project => ({
    ...project,
    path: project.path.replace('~', homedir)
  }))

  const { selectionMethod } = await prompt({
    type: 'select',
    name: 'selectionMethod',
    message: 'Which projects would you like to target?',
    choices: [
      { message: 'All', value: all },
      { message: 'Select by name', value: byName },
      { message: 'Select by tag', value: byTag }
    ]
  })

  if (selectionMethod == byName) {
    let selectedProjects = []

    while (selectedProjects.length === 0) {
      const result = await prompt({
        type: 'multiselect',
        name: 'projects',
        message: 'Select all the projects you would like to target:',
        choices: [...projects.map(p => p.name)]
      })

      selectedProjects = result.projects

      if (selectedProjects.length === 0) {
        console.log('No projects selected.\n')
      }
    }

    projects = projects.filter(p => selectedProjects.includes(p.name))
  }

  if (selectionMethod == byTag) {
    const { tags } = await prompt({
      type: 'multiselect',
      name: 'tags',
      message: 'Select from the tags below, only projects with all selected tags will be targetted:',
      choices: [... new Set(projects.map(p => p.tags).flat())]
    })

    projects = projects.filter(p => tags.every(tag => p.tags.includes(tag)))
  }

  const exclude = await new BooleanPrompt({
    message: 'Do you want to exclude any projects?'
  })

  if (!exclude) return projects

  let excludedProjects = []

  while (excludedProjects.length === 0) {
    const result = await prompt({
      type: 'multiselect',
      name: 'projects',
      message: 'Select all the projects you would like to exclude:',
      choices: [...projects.map(p => p.name)]
    })

    excludedProjects = result.projects

    if (excludedProjects.length === 0) {
      console.log('No projects selected.\n')
    }
  }

  return projects.filter(p => !excludedProjects.includes(p.name))
}

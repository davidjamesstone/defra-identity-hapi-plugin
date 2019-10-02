const byRoleId = {
  '1eb54ab1-58b7-4d14-bf39-4f3e402616e8': 'Employee',
  '35a23b91-ec62-41ea-b5e5-c59b689ff0b4': 'Employer',
  'caaf4df7-0229-e811-a831-000d3a2b29f8': 'Agent',
  '776e1b5a-1268-e811-a83b-000d3ab4f7af': 'Agent/Customer',
  'bac3e1de-8b70-e811-a83c-000d3ab4fce4': 'Primary User',
  'bc7bd000-8c70-e811-a83c-000d3ab4fce4': 'SRO',
  '6495ea1d-8c70-e811-a83c-000d3ab4fce4': 'Intermediary',
  '878ed5f8-0a90-e811-a845-000d3ab4fddf': 'Citizen',
  '3fc7e717-0b90-e811-a845-000d3ab4fddf': 'Defra/Citizen'
}

module.exports = {
  byRoleId,
  byName: (name) => {
    let result = ''
    Object.keys(byRoleId).forEach(key => {
      if (byRoleId[key] === name) {
        result = key
      }
    })
    return result
  }
}

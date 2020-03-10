const path = require('path')

require('dotenv').config({ path: path.join(__dirname, '..', '..', 'demo', '.env') })

const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const lab = exports.lab = Lab.script()

const { describe, it } = lab
const { expect } = Code

const Server = require('../../server')

describe('Dynamics', () => {
  let server
  let idm

  // Get instance of server before each test
  lab.before(async () => {
    server = await Server()

    idm = server.methods.idm
  })

  it('should return an object of mappings for interaction with dynamics', () => {
    const mappings = idm.dynamics.getMappings()

    expect(mappings).to.be.an.object()
  })

  it('should return a token string', async () => {
    const token = await idm.dynamics.getToken()

    expect(token).to.be.a.string()
  })

  it('should parse authz api response correctly', async () => {
    const { enrolmentStatus } = idm.dynamics.getMappings()

    const orgId = '86ef4140-1fa6-e811-a954-000d3a39c2c9'
    const orgName = '123'
    const managerRoleId = 'bfe1c82a-e09b-e811-a94f-000d3a3a8543'
    const userRoleId = 'dea3a347-e09b-e811-a94f-000d3a3a8543'
    const pendingStatus = enrolmentStatus.pending
    const completeApprovedStatus = enrolmentStatus.completeApproved

    const jwtClaims = {
      exp: 1537200994,
      nbf: 1537197394,
      ver: '1.0',
      iss: 'https://login.microsoftonline.com/xxx/v2.0/',
      sub: 'xxx',
      aud: 'xxx',
      acr: 'b2c_1a_scp_signup_signin_roles_dynx',
      iat: 1537197394,
      auth_time: 1537197394,
      email: 'email@email.com',
      roles: [
        `${orgId}:${managerRoleId}:${pendingStatus}`,
        `${orgId}:${userRoleId}:${completeApprovedStatus}`
      ],
      roleMappings: [
        `${orgId}:${orgName}`,
        `${managerRoleId}:LE Manager`,
        `${pendingStatus}:Pending`,
        `${userRoleId}:LE User`,
        `${completeApprovedStatus}:Complete (Approved)`
      ]
    }

    const parsedResponse = idm.dynamics.parseAuthzRoles(jwtClaims)

    const expectedParsedResponse = {
      rolesByOrg: {
        [orgId]: {
          organisation: {
            id: orgId,
            name: orgName
          },
          roles: {
            [managerRoleId]: {
              id: managerRoleId,
              name: 'LE Manager',
              status: {
                id: pendingStatus,
                name: 'Pending'
              }
            },
            [userRoleId]: {
              id: userRoleId,
              name: 'LE User',
              status: {
                id: completeApprovedStatus,
                name: 'Complete (Approved)'
              }
            }
          }
        }
      },
      rolesByStatus: {
        2: {
          [orgId]: {
            organisation: {
              id: orgId,
              name: orgName
            },
            roles: {
              [managerRoleId]: {
                id: managerRoleId,
                name: 'LE Manager',
                status: {
                  id: pendingStatus,
                  name: 'Pending'
                }
              }
            }
          }
        },
        3: {
          [orgId]: {
            organisation: {
              id: orgId,
              name: orgName
            },
            roles: {
              [userRoleId]: {
                id: userRoleId,
                name: 'LE User',
                status: {
                  id: completeApprovedStatus,
                  name: 'Complete (Approved)'
                }
              }
            }
          }
        }
      },
      rolesByRole: {
        [managerRoleId]: {
          [orgId]: {
            id: managerRoleId,
            name: 'LE Manager',
            status: {
              id: pendingStatus,
              name: 'Pending'
            }
          }
        },
        [userRoleId]: {
          [orgId]: {
            id: userRoleId,
            name: 'LE User',
            status: {
              id: completeApprovedStatus,
              name: 'Complete (Approved)'
            }
          }
        }
      },
      flat: [
        {
          roleId: managerRoleId,
          roleName: 'LE Manager',
          orgId: orgId,
          orgName: orgName,
          orgRoleStatusIdNumber: pendingStatus,
          orgRoleStatusName: 'Pending'
        },
        {
          roleId: userRoleId,
          roleName: 'LE User',
          orgId: orgId,
          orgName: orgName,
          orgRoleStatusIdNumber: completeApprovedStatus,
          orgRoleStatusName: 'Complete (Approved)'
        }
      ]
    }

    expect(parsedResponse).to.equal(expectedParsedResponse)
  })
})

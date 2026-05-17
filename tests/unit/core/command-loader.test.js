const fs = require('fs');
const os = require('os');
const path = require('path');

const { loadCommandsRecursively } = require('../../../src/core/command-loader');

jest.mock('../../../src/utils/config', () => ({
  TOKEN: 'test-token',
  CLIENT_ID: 'test-client-id',
}));

jest.mock('discord.js', () => {
  const actual = jest.requireActual('discord.js');
  return {
    ...actual,
    REST: jest.fn().mockImplementation(() => ({
      setToken: jest.fn().mockReturnThis(),
      put: jest.fn().mockResolvedValue(undefined),
    })),
    Routes: {
      applicationCommands: jest.fn((clientId) => `/applications/${clientId}/commands`),
    },
    MessageFlags: { Ephemeral: 64 },
  };
});

describe('command-loader', () => {
  describe('loadCommandsRecursively', () => {
    let tempDir;

    beforeEach(() => {
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lbp-cmds-'));
    });

    afterEach(() => {
      fs.rmSync(tempDir, { recursive: true, force: true });
    });

    it('carrega comandos válidos de subdiretórios', () => {
      const subDir = path.join(tempDir, 'polls');
      fs.mkdirSync(subDir);
      fs.writeFileSync(
        path.join(subDir, 'sample-cmd.js'),
        `module.exports = {
          data: { name: 'sample', toJSON: () => ({ name: 'sample' }) },
          execute: async () => {},
        };`,
      );
      fs.writeFileSync(path.join(tempDir, 'invalid.js'), 'module.exports = { foo: 1 };');

      const loaded = loadCommandsRecursively(tempDir);

      expect(loaded).toHaveLength(1);
      expect(loaded[0].command.data.name).toBe('sample');
    });
  });
});

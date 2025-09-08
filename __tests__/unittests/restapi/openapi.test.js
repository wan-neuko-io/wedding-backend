const YAML = require('yaml');
const { readFileSync } = require('node:fs');

describe('Acceptance test', () => {
  let parseYaml = null;

  test('File can be parsed', () => {
    const readfile = readFileSync('./src/openapi.yaml', 'utf-8');
    parseYaml = YAML.parse(readfile);
    expect(true).toBe(true);
  });

  test('Version is correct', () => {
    expect(parseYaml.openapi).toBe('3.0.1');
  });

  test('Get /level_1_path/level_2_path check for params', () => {
    expect(parseYaml.paths['/security/keys'].get['x-amazon-apigateway-request-validator']).toEqual('params');
  });
  test('Post /level_1_path/level_2_path check for params', () => {
    expect(parseYaml.paths['/security/keys'].post['x-amazon-apigateway-request-validator']).toEqual('params');
  });
});

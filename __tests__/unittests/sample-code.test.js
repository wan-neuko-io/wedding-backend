const code = require('../../src/sample-code');

// ACCEPTANCE TEST
describe('Acceptance test', () => {
  const event = {
    attribute_a: 1.23,
  };

  test('Expect event', async () => {
    const response = await code.handler(event);
    expect(response).toEqual(event);
  });
});

// REJECTION TEST
describe('Rejection test', () => {
  const event = {
    attribute_a: '1.23',
  };

  test('Expect event', async () => {
    try {
      await code.handler(event);
    } catch (err) {
      expect(err.message).toContain('BadRequest');
    }
  });
});

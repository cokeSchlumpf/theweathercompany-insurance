const chai = require('chai');
const fs = require('fs');

const payloadSample = JSON.parse(fs.readFileSync('./testdata/payload.json', 'utf-8'));

describe('action', () => {
  it('is just a stupid test', () => {
    const action = require('./index');
    return action.main({
      payload: payloadSample
    }).then((result) => {
      console.log(JSON.stringify(result.payload.context.message, null, 2));
      // chai.expect(result.result).to.equal('WantToDrive');
    });
  }).timeout(50000);
});
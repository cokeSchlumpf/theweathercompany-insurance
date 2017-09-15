const _ = require('lodash');
const request = require('supertest');

const MAPQUEST_KEY = 'BK18DAPmOipwyBc45TcJ7FmFO7t1Idal';
const TWC_KEY = '626505b9091f4982a505b9091f798235';

exports.main = (params) => {
  const getMessage = () => {
    const intent = _.get(params, 'payload.context.wcs.intents[0].intent', 'Unkown');

    switch (intent) {
      case 'WantToDrive':
        const origin = _.get(params, 'payload.context.wcs.entities[0].value');
        const destination = _.get(params, 'payload.context.wcs.entities[1].value');

        if (_.isUndefined(origin) || _.isUndefined(destination)) {
          return Promise.resolve('DontKnowOriginDestination');
        } else {
          return request(`https://www.mapquestapi.com`)
            .get(`/directions/v2/route?key=${MAPQUEST_KEY}&from=${origin}&to=${destination}&outFormat=json&ambiguities=ignore&routeType=fastest&doReverseGeocode=false&enhancedNarrative=false&avoidTimedConditions=false`)
            .then((response) => _
              .chain(JSON.parse(response.text))
              .get('route.legs[0].maneuvers')
              .map(leg => {
                return _.get(leg, 'startPoint');
              })
              .sampleSize(5)
              .value())
            .then(geocodes => {
              return Promise.all(_.map(geocodes, geocode => {
                const url = `/v2/indices/drivingDifficulty/current?geocode=${geocode.lat}%2C${geocode.lng}&apiKey=${TWC_KEY}&format=json&language=en-US`;
                return request('https://api.weather.com')
                  .get(url)
                  .then(response => {
                    const resp = JSON.parse(response.text);
                    return _.get(resp, 'drivingDifficultyIndexCurrent.drivingDifficultyIndex', 0);
                  });
              }))
            }).then(result => {
              console.log(result);
              const max = _.max(result);
              if (max === 0) {
                return 'CheapInsurance';
              } else if (max === 3) {
                return 'NormalInsurance';
              } else {
                return 'HighInsurance';
              }
            });
        }
        break;
      default:
        return Promise.resolve(intent);
    }
  }

  return getMessage().then(message => {
    _.set(params, 'payload.context.message', message);

    return {
      statusCode: 200,
      payload: params.payload
    };
  }).catch(error => {
    console.log(error);
  });
}
import {routeMatcher} from './routeMatcher';

describe('RouteMatcher', () => {
  it('match url properly', async () => {
    const checker = jest.fn();

    const result = routeMatcher('/pim-connection/12345/flow/6789')
      .match('/pim-connection/:pimConnectionId/flow/:flowId', async ({pimConnectionId, flowId}) => {
        expect(pimConnectionId).toBe('12345');
        expect(flowId).toBe('6789');
      })
      .match('/pim-connection/:pimConnection', async ({pimConnection}) => {
        checker(pimConnection);
      })
      .match('/another/route', async ({}) => {
        checker();
      })
      .result();

    expect(await result).toEqual(true);
    expect(checker).not.toHaveBeenCalled();
  });

  it('matches URL containing query parameters', async () => {
    const result = routeMatcher('/pim-connection/12345/flow/6789?page=2')
      .match('/pim-connection/:pimConnectionId/flow/:flowId', async ({pimConnectionId, flowId}) => {
        expect(pimConnectionId).toBe('12345');
        expect(flowId).toBe('6789');
      })
      .result();

    expect(await result).toEqual(true);
  });

  it('returns false if there is no matcher for an url', async () => {
    const checker = jest.fn();

    const result = routeMatcher('unknown-url')
      .match('/pim-connection/:pimConnectionId/flow/:flowId', async ({pimConnectionId, flowId}) => {
        checker(pimConnectionId, flowId);

        return true;
      })
      .result();

    expect(await result).toEqual(false);
    expect(checker).not.toHaveBeenCalled();
  });

  it('returns false if the route is malformed', async () => {
    const checker = jest.fn();

    const result = routeMatcher('/pim-connection/pimConnectionId/flow/flowId')
      .match('/pim-connection/:pimConnectionId:anotherParameter/flow/:flowId', async ({flowId}) => {
        checker(flowId);

        return true;
      })
      .result();

    expect(await result).toEqual(false);
    expect(checker).not.toHaveBeenCalled();
  });

  it('returns the result from the callback', async () => {
    const checker = jest.fn();

    const result = routeMatcher('/pim-connection/pimConnectionId/flow/flowId')
      .match('/pim-connection/:pimConnectionId/flow/:flowId', async ({}) => {
        checker();

        return false;
      })
      .result();

    expect(await result).toEqual(false);
    expect(checker).toHaveBeenCalled();
  });
});

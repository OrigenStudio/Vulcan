import ApolloClient from 'apollo-client';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { createHttpLink } from 'apollo-link-http';
import { BatchHttpLink } from 'apollo-link-batch-http';
import { setContext } from 'apollo-link-context';
import 'cross-fetch/polyfill';
import { Meteor } from 'meteor/meteor';
import { getSetting, registerSetting } from './settings.js';
import { getFragmentMatcher } from './fragment_matcher.js';
import { Callbacks, runCallbacks } from './callbacks.js';

registerSetting(
  'developmentServerIp',
  Meteor.absoluteUrl(),
  'Development server IP',
);

const defaultNetworkInterfaceConfig = {
  path: '/graphql', // default graphql server endpoint
  opts: {}, // additional fetch options like `credentials` or `headers`
  useMeteorAccounts: true, // if true, send an eventual Meteor login token to identify the current user with every request
  batchingInterface: false, // using createHttpLink instead of BatchHttpLink, it used to be the other way around.
  //BatchHttpLink doesn't seem to have the same API as createHttpLink. See https://www.apollographql.com/docs/link/links/batch-http.html
  batchInterval: 10, // default batch interval
};

const createMeteorNetworkInterface = (givenConfig = {}) => {
  const config = { ...defaultNetworkInterfaceConfig, ...givenConfig };

  // absoluteUrl adds a '/', so let's remove it first
  let path = config.path;
  if (path[0] === '/') {
    path = path.slice(1);
  }

  const uri = Meteor.absoluteUrl(path, {
    rootUrl: getSetting('developmentServerIp', Meteor.absoluteUrl()),
  });

  // allow the use of a batching network interface; if the options.batchingInterface is not specified, fallback to the standard network interface
  const interfaceToUse = config.batchingInterface
    ? BatchHttpLink
    : createHttpLink;

  // default interface options
  const interfaceOptions = {
    uri,
    opts: {
      credentials: 'same-origin', // http://dev.apollodata.com/react/auth.html#Cookie
    },
  };

  // if a BatchingNetworkInterface is used with a correct batch interval, add it to the options
  if (config.batchingInterface && config.batchInterval) {
    interfaceOptions.batchInterval = config.batchInterval;
  }

  // if 'fetch' has been configured to be called with specific opts, add it to the options
  if (Object.keys(config.opts).length > 0) {
    interfaceOptions.opts = config.opts;
  }

  if (config.useMeteorAccounts) {
    const middlewareLink = setContext(() => {
      const currentUserToken = Meteor.isClient
        ? global.localStorage['Meteor.loginToken']
        : config.loginToken;

      if (!currentUserToken) {
        return {};
      } else {
        return {
          headers: {
            authorization: currentUserToken || null,
          },
        };
      }
    });

    return middlewareLink.concat(interfaceToUse(interfaceOptions));
  }

  return interfaceToUse(interfaceOptions);
};

const cache = new InMemoryCache({
  // Default to using Mongo _id, must use _id for queries.
  dataIdFromObject: result => {
    if (result._id && result.__typename) {
      const dataId = result.__typename + result._id;
      return dataId;
    }
    return null;
  },
  addTypename: true,
  fragmentMatcher: getFragmentMatcher(),
});

const meteorClientConfig = networkInterfaceConfig => {
  return {
    ssrMode: Meteor.isServer,
    link: createMeteorNetworkInterface(networkInterfaceConfig),
    queryDeduplication: true, // http://dev.apollodata.com/core/network.html#query-deduplication
    cache,
  };
};

export const createApolloClient = options => {
  runCallbacks('apolloclient.init.before');

  return new ApolloClient(meteorClientConfig(options));
};

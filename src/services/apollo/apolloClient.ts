import { ApolloClient } from 'apollo-client';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { ApolloLink, split } from 'apollo-link';
import { WebSocketLink } from 'apollo-link-ws';
import { HttpLink } from 'apollo-link-http';
import { onError } from 'apollo-link-error';
import { getMainDefinition } from 'apollo-utilities';

const daiKovanLink = makeEndpointLink(
  new HttpLink({
    uri: 'https://api.thegraph.com/subgraphs/name/raisehq/dai-kovan',
    credentials: 'same-origin',
  }),
  new WebSocketLink({
    uri: 'wss://api.thegraph.com/subgraphs/name/raisehq/dai-kovan',
    options: {
      reconnect: true,
    },
  }),
);

const compoundLink = makeEndpointLink(
  new HttpLink({
    uri: 'https://api.thegraph.com/subgraphs/name/compound-finance/compound-v2-rinkeby',
    credentials: 'same-origin',
  }),
  new WebSocketLink({
    uri: 'wss://api.thegraph.com/subgraphs/name/compound-finance/compound-v2-rinkeby',
    options: {
      reconnect: true,
    },
  }),
);

const allowedDirectives = ['dai', 'compound'] as const;
type DirectiveName = (typeof allowedDirectives)[number];

const linkByDirective: Record<DirectiveName | 'default', ApolloLink> = {
  dai: daiKovanLink,
  compound: compoundLink,
  default: daiKovanLink,
};

const link = new ApolloLink(operation => {
  const { query } = operation;

  const definition = getMainDefinition(query);

  const foundedDirective =
    'operation' in definition &&
    definition.directives &&
    definition.directives.length &&
    definition.directives.find(item => allowedDirectives.includes(item.name.value as DirectiveName));
  const directive: DirectiveName | 'default' = foundedDirective
    ? (foundedDirective.name.value as DirectiveName)
    : 'default';

  return linkByDirective[directive].request(operation);
});

export const apolloClient = new ApolloClient({
  link: ApolloLink.from([
    onError(({ graphQLErrors, networkError }) => {
      if (graphQLErrors) {
        graphQLErrors.map(({ message, locations, path }) =>
          console.error(`[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`),
        );
      }
      if (networkError) {
        console.error(`[Network error]: ${networkError}`);
      }
    }),
    link,
  ]),
  cache: new InMemoryCache(),
});

function makeEndpointLink(httpLink: HttpLink, wsLink: WebSocketLink) {
  return split(
    ({ query }) => {
      const definition = getMainDefinition(query);

      return definition.kind === 'OperationDefinition' && definition.operation === 'subscription';
    },
    wsLink,
    httpLink,
  );
}

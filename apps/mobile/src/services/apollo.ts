import { ApolloClient, InMemoryCache, createHttpLink, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import AsyncStorage from '@react-native-async-storage/async-storage';

const httpLink = createHttpLink({
  uri: process.env.EXPO_PUBLIC_GRAPHQL_URL || 'http://localhost:4000/graphql',
});

const authLink = setContext(async (_, { headers }) => {
  // Get the authentication token from local storage if it exists
  const token = await AsyncStorage.getItem('auth_token');
  
  // Return the headers to the context so httpLink can read them
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    }
  };
});

export const apolloClient = new ApolloClient({
  link: from([authLink, httpLink]),
  cache: new InMemoryCache({
    typePolicies: {
      User: {
        fields: {
          matches: {
            merge(existing = [], incoming) {
              return incoming;
            }
          },
          messages: {
            merge(existing = [], incoming) {
              return incoming;
            }
          }
        }
      },
      Match: {
        fields: {
          messages: {
            merge(existing = [], incoming) {
              return incoming;
            }
          }
        }
      }
    }
  }),
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'ignore',
    },
    query: {
      errorPolicy: 'all',
    },
  },
});
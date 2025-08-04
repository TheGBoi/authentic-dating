import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ApolloProvider } from '@apollo/client';
import { Provider as PaperProvider } from 'react-native-paper';
import Toast from 'react-native-toast-message';

import { apolloClient } from './src/services/apollo';
import { AuthProvider } from './src/store/AuthContext';
import { SocketProvider } from './src/store/SocketContext';
import { NavigationContainer } from '@react-navigation/native';
import { AppNavigator } from './src/navigation/AppNavigator';
import { theme } from './src/utils/theme';

export default function App() {
  return (
    <SafeAreaProvider>
      <ApolloProvider client={apolloClient}>
        <PaperProvider theme={theme}>
          <AuthProvider>
            <SocketProvider>
              <NavigationContainer>
                <StatusBar style="auto" />
                <AppNavigator />
                <Toast />
              </NavigationContainer>
            </SocketProvider>
          </AuthProvider>
        </PaperProvider>
      </ApolloProvider>
    </SafeAreaProvider>
  );
}
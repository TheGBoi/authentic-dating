import { gql } from '@apollo/client';

// Authentication
export const LOGIN = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input)
  }
`;

export const REGISTER = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      id
      email
      firstName
      lastName
      age
      gender
      interests
      verificationStatus
      subscriptionType
    }
  }
`;

export const ME = gql`
  query Me {
    me {
      id
      email
      firstName
      lastName
      age
      gender
      interests
      profilePhotoUrl
      bio
      verificationStatus
      subscriptionType
      badges
      conversationRating
      totalConversations
    }
  }
`;

// Discovery
export const GET_DISCOVERY_FEED = gql`
  query GetDiscoveryFeed($limit: Int) {
    getDiscoveryFeed(limit: $limit) {
      id
      firstName
      age
      interests
      profilePhotoUrl
      promptAnswers
    }
  }
`;

export const GET_MATCH_SUGGESTIONS = gql`
  query GetMatchSuggestions($limit: Int) {
    getMatchSuggestions(limit: $limit) {
      id
      firstName
      age
      interests
      profilePhotoUrl
      promptAnswers
    }
  }
`;

// Matching
export const CREATE_MATCH = gql`
  mutation CreateMatch($input: CreateMatchInput!) {
    createMatch(input: $input) {
      id
      status
      user1RevealLevel
      user2RevealLevel
      messageCount
      createdAt
      user1 {
        id
        firstName
        profilePhotoUrl
      }
      user2 {
        id
        firstName
        profilePhotoUrl
      }
    }
  }
`;

export const GET_MY_MATCHES = gql`
  query GetMyMatches {
    getMyMatches {
      id
      status
      user1RevealLevel
      user2RevealLevel
      messageCount
      lastMessageAt
      user1 {
        id
        firstName
        lastName
        profilePhotoUrl
        isOnline
        lastSeen
      }
      user2 {
        id
        firstName
        lastName
        profilePhotoUrl
        isOnline
        lastSeen
      }
      messages(limit: 1) {
        id
        content
        type
        createdAt
        sender {
          id
        }
      }
    }
  }
`;

export const UPDATE_REVEAL_LEVEL = gql`
  mutation UpdateRevealLevel($matchId: String!, $revealLevel: RevealLevel!) {
    updateRevealLevel(matchId: $matchId, revealLevel: $revealLevel) {
      id
      user1RevealLevel
      user2RevealLevel
    }
  }
`;

// Messages
export const SEND_MESSAGE = gql`
  mutation SendMessage($input: SendMessageInput!) {
    sendMessage(input: $input) {
      id
      content
      type
      createdAt
      sender {
        id
        firstName
      }
    }
  }
`;

export const GET_MESSAGES = gql`
  query GetMessages($matchId: String!, $limit: Int, $offset: Int) {
    getMessages(matchId: $matchId, limit: $limit, offset: $offset) {
      id
      content
      type
      mediaUrl
      createdAt
      readAt
      sender {
        id
        firstName
        profilePhotoUrl
      }
      metadata
    }
  }
`;

export const MARK_MESSAGE_AS_READ = gql`
  mutation MarkMessageAsRead($messageId: String!) {
    markMessageAsRead(messageId: $messageId)
  }
`;

// Personality
export const SUBMIT_PERSONALITY_QUIZ = gql`
  mutation SubmitPersonalityQuiz($input: SubmitQuizInput!) {
    submitPersonalityQuiz(input: $input) {
      id
      dimension
      score
      confidence
      details
    }
  }
`;

export const GET_MY_PERSONALITY_SCORES = gql`
  query GetMyPersonalityScores {
    getMyPersonalityScores {
      id
      dimension
      score
      confidence
      details
    }
  }
`;

export const GET_COMPATIBILITY_SCORE = gql`
  query GetCompatibilityScore($targetUserId: String!) {
    getCompatibilityScore(targetUserId: $targetUserId)
  }
`;

export const GET_ICEBREAKERS = gql`
  query GetIcebreakers($matchId: String!) {
    getIcebreakers(matchId: $matchId)
  }
`;

// Profile
export const UPDATE_PROFILE = gql`
  mutation UpdateProfile($input: UpdateProfileInput!) {
    updateProfile(input: $input) {
      id
      bio
      interests
      promptAnswers
      profilePhotoUrl
    }
  }
`;

export const UPDATE_PREFERENCES = gql`
  mutation UpdatePreferences($input: PreferencesInput!) {
    updatePreferences(input: $input) {
      id
      preferences
    }
  }
`;

export const UPDATE_ONLINE_STATUS = gql`
  mutation UpdateOnlineStatus($isOnline: Boolean!) {
    updateOnlineStatus(isOnline: $isOnline)
  }
`;
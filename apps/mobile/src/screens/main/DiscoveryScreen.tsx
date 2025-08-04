import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  PanResponder,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, Chip, IconButton } from 'react-native-paper';
import { useQuery, useMutation } from '@apollo/client';

import { GET_MATCH_SUGGESTIONS, CREATE_MATCH } from '../../services/queries';
import { theme } from '../../utils/theme';
import { useAuth } from '../../store/AuthContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = 120;

interface User {
  id: string;
  firstName: string;
  age: number;
  interests: string[];
  profilePhotoUrl?: string;
  promptAnswers: string[];
}

interface PromptCard {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export function DiscoveryScreen() {
  const { user } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cards, setCards] = useState<User[]>([]);
  const position = useRef(new Animated.ValueXY()).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const [revealLevel, setRevealLevel] = useState<'prompt' | 'name' | 'blurred' | 'full'>('prompt');

  const { data, loading, refetch } = useQuery(GET_MATCH_SUGGESTIONS, {
    variables: { limit: 10 },
  });

  const [createMatch] = useMutation(CREATE_MATCH);

  useEffect(() => {
    if (data?.getMatchSuggestions) {
      setCards(data.getMatchSuggestions);
    }
  }, [data]);

  const generatePromptCard = (user: User): PromptCard => {
    const prompts = [
      {
        question: "Describe your perfect weekend in one sentence",
        category: "lifestyle"
      },
      {
        question: "What's something that always makes you laugh?",
        category: "personality"
      },
      {
        question: "If you could master any skill overnight, what would it be?",
        category: "aspirations"
      },
      {
        question: "What's your go-to comfort food?",
        category: "food"
      },
      {
        question: "Beach or mountains? Why?",
        category: "travel"
      }
    ];

    const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];
    const randomAnswer = user.promptAnswers?.[0] || "I love exploring new places and trying different cuisines!";

    return {
      id: user.id,
      question: randomPrompt.question,
      answer: randomAnswer,
      category: randomPrompt.category
    };
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gesture) => {
      position.setValue({ x: gesture.dx, y: gesture.dy });
      rotate.setValue(gesture.dx * 0.1);
    },
    onPanResponderRelease: (_, gesture) => {
      if (gesture.dx > SWIPE_THRESHOLD) {
        handleSwipeRight();
      } else if (gesture.dx < -SWIPE_THRESHOLD) {
        handleSwipeLeft();
      } else {
        resetPosition();
      }
    },
  });

  const resetPosition = () => {
    Animated.parallel([
      Animated.spring(position, {
        toValue: { x: 0, y: 0 },
        useNativeDriver: false,
      }),
      Animated.spring(rotate, {
        toValue: 0,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const handleSwipeRight = async () => {
    if (currentIndex < cards.length) {
      const currentUser = cards[currentIndex];
      
      try {
        await createMatch({
          variables: {
            input: { targetUserId: currentUser.id }
          }
        });
        
        Alert.alert('✨ It\'s a Match!', 'You can now start chatting!');
      } catch (error) {
        console.error('Error creating match:', error);
      }
      
      swipeOut(SCREEN_WIDTH);
    }
  };

  const handleSwipeLeft = () => {
    swipeOut(-SCREEN_WIDTH);
  };

  const swipeOut = (direction: number) => {
    Animated.parallel([
      Animated.timing(position, {
        toValue: { x: direction, y: 0 },
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(rotate, {
        toValue: direction * 0.3,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start(() => {
      setCurrentIndex(currentIndex + 1);
      position.setValue({ x: 0, y: 0 });
      rotate.setValue(0);
      setRevealLevel('prompt'); // Reset reveal level for next card
    });
  };

  const handleRevealMore = () => {
    const levels = ['prompt', 'name', 'blurred', 'full'] as const;
    const currentLevelIndex = levels.indexOf(revealLevel);
    if (currentLevelIndex < levels.length - 1) {
      setRevealLevel(levels[currentLevelIndex + 1]);
    }
  };

  const renderCard = (user: User, index: number) => {
    if (index < currentIndex) return null;

    const promptCard = generatePromptCard(user);
    const isTopCard = index === currentIndex;

    const rotateString = rotate.interpolate({
      inputRange: [-200, 0, 200],
      outputRange: ['-15deg', '0deg', '15deg'],
    });

    const cardStyle = isTopCard
      ? [
          styles.card,
          {
            transform: [
              ...position.getTranslateTransform(),
              { rotate: rotateString },
            ],
          },
        ]
      : [
          styles.card,
          {
            transform: [{ scale: 0.95 - (index - currentIndex) * 0.05 }],
            zIndex: -index,
          },
        ];

    return (
      <Animated.View
        key={user.id}
        style={cardStyle}
        {...(isTopCard ? panResponder.panHandlers : {})}
      >
        <Card style={styles.promptCard}>
          <LinearGradient
            colors={theme.colors.primaryGradient}
            style={styles.cardGradient}
          >
            {/* Category Badge */}
            <View style={styles.categoryContainer}>
              <Chip
                mode="outlined"
                textStyle={styles.categoryText}
                style={styles.categoryChip}
              >
                {promptCard.category}
              </Chip>
            </View>

            {/* Main Content */}
            <View style={styles.contentContainer}>
              {/* Question */}
              <View style={styles.questionContainer}>
                <Text style={styles.questionText}>
                  "{promptCard.question}"
                </Text>
              </View>

              {/* Answer */}
              <View style={styles.answerContainer}>
                <Text style={styles.answerText}>
                  {promptCard.answer}
                </Text>
              </View>

              {/* Progressive Reveal */}
              {revealLevel !== 'prompt' && (
                <View style={styles.revealContainer}>
                  {revealLevel === 'name' && (
                    <Text style={styles.nameText}>
                      {user.firstName}, {user.age}
                    </Text>
                  )}

                  {revealLevel === 'blurred' && (
                    <BlurView intensity={80} style={styles.blurredPhoto}>
                      <View style={styles.photoPlaceholder}>
                        <Ionicons name="person" size={60} color="white" />
                      </View>
                    </BlurView>
                  )}

                  {revealLevel === 'full' && (
                    <View style={styles.fullReveal}>
                      <View style={styles.photoContainer}>
                        <View style={styles.photoPlaceholder}>
                          <Ionicons name="person" size={60} color="white" />
                        </View>
                      </View>
                      <View style={styles.interestsContainer}>
                        {user.interests.slice(0, 3).map((interest, idx) => (
                          <Chip key={idx} style={styles.interestChip}>
                            {interest}
                          </Chip>
                        ))}
                      </View>
                    </View>
                  )}
                </View>
              )}

              {/* Reveal Button */}
              {revealLevel !== 'full' && (
                <Button
                  mode="contained"
                  onPress={handleRevealMore}
                  style={styles.revealButton}
                  labelStyle={styles.revealButtonText}
                >
                  {revealLevel === 'prompt' && 'Show Name & Age'}
                  {revealLevel === 'name' && 'Show Blurred Photo'}
                  {revealLevel === 'blurred' && 'Show Full Profile'}
                </Button>
              )}
            </View>

            {/* Action Buttons */}
            <View style={styles.actionContainer}>
              <IconButton
                icon="close"
                size={30}
                iconColor="white"
                style={[styles.actionButton, styles.passButton]}
                onPress={handleSwipeLeft}
              />
              
              <IconButton
                icon="heart"
                size={30}
                iconColor="white"
                style={[styles.actionButton, styles.likeButton]}
                onPress={handleSwipeRight}
              />
            </View>
          </LinearGradient>
        </Card>
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Finding great conversations...</Text>
      </View>
    );
  }

  if (currentIndex >= cards.length) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="heart-outline" size={80} color={theme.colors.placeholder} />
        <Text style={styles.emptyText}>No more profiles to show</Text>
        <Button
          mode="contained"
          onPress={() => {
            setCurrentIndex(0);
            refetch();
          }}
          style={styles.refreshButton}
        >
          Refresh
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>MindMatch</Text>
        <Text style={styles.headerSubtitle}>Get to know the mind before the face</Text>
      </View>

      <View style={styles.cardContainer}>
        {cards
          .slice(currentIndex, currentIndex + 3)
          .map((user, index) => renderCard(user, currentIndex + index))}
      </View>

      <View style={styles.footer}>
        <Text style={styles.instructionText}>
          Swipe right to start a conversation, left to pass
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: theme.colors.placeholder,
    textAlign: 'center',
  },
  cardContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    position: 'absolute',
    width: SCREEN_WIDTH - 40,
    height: SCREEN_HEIGHT * 0.7,
  },
  promptCard: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    ...theme.shadows.large,
  },
  cardGradient: {
    flex: 1,
    padding: 20,
  },
  categoryContainer: {
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  categoryChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  categoryText: {
    color: 'white',
    fontSize: 12,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  questionContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
  },
  questionText: {
    fontSize: 18,
    color: 'white',
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 24,
  },
  answerContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
  },
  answerText: {
    fontSize: 16,
    color: 'white',
    lineHeight: 22,
    textAlign: 'center',
  },
  revealContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  nameText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  blurredPhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    marginBottom: 15,
  },
  photoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 60,
  },
  fullReveal: {
    alignItems: 'center',
  },
  photoContainer: {
    marginBottom: 15,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  interestChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 4,
  },
  revealButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 25,
    paddingVertical: 5,
  },
  revealButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 20,
  },
  actionButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    elevation: 5,
  },
  passButton: {
    backgroundColor: 'rgba(255, 107, 107, 0.8)',
  },
  likeButton: {
    backgroundColor: 'rgba(81, 207, 102, 0.8)',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  instructionText: {
    fontSize: 14,
    color: theme.colors.placeholder,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    fontSize: 18,
    color: theme.colors.placeholder,
    marginTop: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    color: theme.colors.placeholder,
    textAlign: 'center',
    marginVertical: 20,
  },
  refreshButton: {
    marginTop: 20,
    backgroundColor: theme.colors.primary,
  },
});
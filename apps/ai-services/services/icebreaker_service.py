import openai
import random
from typing import List, Dict, Any, Optional
from textblob import TextBlob
import os

class IcebreakerService:
    def __init__(self):
        self.openai_client = openai.OpenAI(
            api_key=os.getenv("OPENAI_API_KEY")
        )
        
        # Fallback icebreakers for when AI is unavailable
        self.fallback_icebreakers = [
            "What's the most interesting place you've ever been to?",
            "If you could have dinner with anyone, living or dead, who would it be and why?",
            "What's your favorite way to spend a weekend?",
            "What's something you're passionate about that most people don't know?",
            "If you could learn any skill instantly, what would it be?",
            "What's the best piece of advice you've ever received?",
            "What's your idea of a perfect day?",
            "What's something that always makes you laugh?",
            "What's a book/movie/show that changed your perspective?",
            "What's your favorite childhood memory?"
        ]

        # Category-based icebreakers
        self.categorized_icebreakers = {
            "travel": [
                "What's your dream travel destination and why?",
                "What's the most beautiful place you've ever seen?",
                "If you could live anywhere in the world for a year, where would it be?",
                "What's your favorite travel memory?",
                "Mountains or beaches? Why?"
            ],
            "food": [
                "What's your comfort food?",
                "If you could only eat one cuisine for the rest of your life, what would it be?",
                "What's the weirdest food you've ever tried?",
                "Are you more of a sweet or savory person?",
                "What's your go-to cooking dish?"
            ],
            "entertainment": [
                "What's the last show you binge-watched?",
                "What's your favorite genre of music/movies?",
                "What's a song that always gets you dancing?",
                "Do you prefer books or movies?",
                "What's your guilty pleasure TV show?"
            ],
            "lifestyle": [
                "Are you a morning person or night owl?",
                "What's your ideal way to relax after a long day?",
                "What's something on your bucket list?",
                "What's a skill you'd love to learn?",
                "How do you like to stay active?"
            ],
            "personality": [
                "What's something that makes you unique?",
                "What's your biggest pet peeve?",
                "What makes you feel most confident?",
                "What's your love language?",
                "What's something that always cheers you up?"
            ]
        }

    async def generate_icebreakers(
        self, 
        user1_id: str, 
        user2_id: str, 
        conversation_history: List[Dict[str, Any]] = None,
        context: Optional[Dict[str, Any]] = None
    ) -> List[str]:
        """Generate contextual icebreaker questions for a match"""
        
        try:
            # Get user profiles and interests
            user1_profile = await self._get_user_profile(user1_id)
            user2_profile = await self._get_user_profile(user2_id)
            
            # Find common interests
            common_interests = self._find_common_interests(user1_profile, user2_profile)
            
            # Generate AI-powered icebreakers if OpenAI is available
            if self.openai_client.api_key:
                ai_icebreakers = await self._generate_ai_icebreakers(
                    user1_profile, user2_profile, common_interests, conversation_history
                )
                if ai_icebreakers:
                    return ai_icebreakers
            
            # Fallback to curated icebreakers
            return self._generate_curated_icebreakers(common_interests, context)
            
        except Exception as e:
            print(f"Error generating icebreakers: {e}")
            return random.sample(self.fallback_icebreakers, 3)

    async def suggest_responses(self, message: str, context: Dict[str, Any] = None) -> List[str]:
        """Suggest thoughtful responses to help continue conversations"""
        
        try:
            # Analyze the message sentiment and content
            blob = TextBlob(message)
            sentiment = blob.sentiment.polarity
            
            # Generate response suggestions based on message type
            if self.openai_client.api_key:
                ai_suggestions = await self._generate_ai_responses(message, sentiment, context)
                if ai_suggestions:
                    return ai_suggestions
            
            # Fallback response suggestions
            return self._generate_curated_responses(message, sentiment)
            
        except Exception as e:
            print(f"Error suggesting responses: {e}")
            return self._get_fallback_responses()

    async def _generate_ai_icebreakers(
        self, 
        user1_profile: Dict, 
        user2_profile: Dict, 
        common_interests: List[str],
        conversation_history: List[Dict[str, Any]] = None
    ) -> List[str]:
        """Generate icebreakers using OpenAI"""
        
        try:
            prompt = self._build_icebreaker_prompt(user1_profile, user2_profile, common_interests, conversation_history)
            
            response = await self.openai_client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a dating app conversation expert. Generate thoughtful, engaging icebreaker questions that help people connect authentically."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=200,
                temperature=0.8
            )
            
            icebreakers_text = response.choices[0].message.content
            # Parse the response into individual icebreakers
            icebreakers = [q.strip().strip('"-') for q in icebreakers_text.split('\n') if q.strip() and '?' in q]
            
            return icebreakers[:3] if len(icebreakers) >= 3 else icebreakers
            
        except Exception as e:
            print(f"Error with OpenAI icebreakers: {e}")
            return None

    async def _generate_ai_responses(self, message: str, sentiment: float, context: Dict[str, Any] = None) -> List[str]:
        """Generate response suggestions using OpenAI"""
        
        try:
            prompt = f"""
            Given this message: "{message}"
            
            Generate 3 thoughtful, engaging response suggestions that:
            1. Show genuine interest and curiosity
            2. Keep the conversation flowing naturally
            3. Encourage the other person to share more about themselves
            
            Consider the message sentiment: {'positive' if sentiment > 0 else 'negative' if sentiment < 0 else 'neutral'}
            
            Format as numbered list.
            """
            
            response = await self.openai_client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a conversation coach helping people have meaningful dating conversations."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=150,
                temperature=0.7
            )
            
            suggestions_text = response.choices[0].message.content
            suggestions = [s.strip().split('. ', 1)[-1] for s in suggestions_text.split('\n') if s.strip() and '. ' in s]
            
            return suggestions[:3]
            
        except Exception as e:
            print(f"Error with OpenAI responses: {e}")
            return None

    def _generate_curated_icebreakers(self, common_interests: List[str], context: Dict[str, Any] = None) -> List[str]:
        """Generate icebreakers based on common interests"""
        
        icebreakers = []
        
        # Add interest-based icebreakers
        for interest in common_interests[:2]:
            category = self._get_interest_category(interest)
            if category in self.categorized_icebreakers:
                icebreakers.extend(random.sample(self.categorized_icebreakers[category], 1))
        
        # Fill remaining slots with general icebreakers
        remaining_slots = 3 - len(icebreakers)
        if remaining_slots > 0:
            general_icebreakers = random.sample(self.fallback_icebreakers, remaining_slots)
            icebreakers.extend(general_icebreakers)
        
        return icebreakers[:3]

    def _generate_curated_responses(self, message: str, sentiment: float) -> List[str]:
        """Generate curated response suggestions"""
        
        message_lower = message.lower()
        
        # Question responses
        if '?' in message:
            return [
                "That's a great question! Let me think about that...",
                "Interesting question! I'd say...",
                "I love that you asked that! My answer would be..."
            ]
        
        # Travel-related
        if any(word in message_lower for word in ['travel', 'trip', 'vacation', 'country', 'city']):
            return [
                "That sounds amazing! What was your favorite part?",
                "I've always wanted to go there! What would you recommend?",
                "Travel stories are the best! Tell me more about that experience."
            ]
        
        # Food-related
        if any(word in message_lower for word in ['food', 'eat', 'restaurant', 'cook', 'meal']):
            return [
                "Now I'm hungry! That sounds delicious.",
                "I love trying new foods! What's your go-to comfort meal?",
                "Food brings people together! Do you like to cook?"
            ]
        
        # Positive sentiment
        if sentiment > 0.1:
            return [
                "That's wonderful! What made it so special?",
                "I love your enthusiasm! Tell me more about that.",
                "That sounds really exciting! How did you get into that?"
            ]
        
        # Negative sentiment
        elif sentiment < -0.1:
            return [
                "I can understand that feeling. What helps you through tough times?",
                "Thanks for sharing that with me. How are you doing with it now?",
                "That sounds challenging. What keeps you motivated?"
            ]
        
        # Neutral/general
        return self._get_fallback_responses()

    def _get_fallback_responses(self) -> List[str]:
        """Get general response suggestions"""
        return [
            "That's really interesting! Can you tell me more about that?",
            "I'd love to hear more about your perspective on that.",
            "What's the story behind that? I'm curious to know more."
        ]

    async def _get_user_profile(self, user_id: str) -> Dict[str, Any]:
        """Get user profile from database (simplified for demo)"""
        # In production, this would query the actual database
        return {
            "interests": ["travel", "cooking", "hiking", "photography"],
            "bio": "Love exploring new places and trying different cuisines",
            "age": 28,
            "prompt_answers": ["Beach vacation", "Italian food", "Morning person"]
        }

    def _find_common_interests(self, user1_profile: Dict, user2_profile: Dict) -> List[str]:
        """Find common interests between two users"""
        interests1 = set(user1_profile.get("interests", []))
        interests2 = set(user2_profile.get("interests", []))
        return list(interests1.intersection(interests2))

    def _get_interest_category(self, interest: str) -> str:
        """Map interest to category"""
        interest_mapping = {
            "travel": "travel",
            "food": "food", "cooking": "food", "restaurants": "food",
            "movies": "entertainment", "music": "entertainment", "books": "entertainment",
            "fitness": "lifestyle", "yoga": "lifestyle", "hiking": "lifestyle",
            "art": "personality", "photography": "personality"
        }
        return interest_mapping.get(interest.lower(), "personality")

    def _build_icebreaker_prompt(
        self, 
        user1_profile: Dict, 
        user2_profile: Dict, 
        common_interests: List[str],
        conversation_history: List[Dict[str, Any]] = None
    ) -> str:
        """Build prompt for AI icebreaker generation"""
        
        prompt = f"""
        Generate 3 personalized icebreaker questions for two people who just matched on a dating app.
        
        Person 1 interests: {', '.join(user1_profile.get('interests', []))}
        Person 2 interests: {', '.join(user2_profile.get('interests', []))}
        Common interests: {', '.join(common_interests) if common_interests else 'None apparent'}
        
        Guidelines:
        - Make questions engaging and conversation-starting
        - Avoid generic questions like "How are you?"
        - Focus on shared interests when possible
        - Keep questions open-ended and fun
        - Each question should be on a new line
        
        Questions:
        """
        
        return prompt
# MindMatch Dating App

**"Get to know the mind before the face."**

MindMatch is a revolutionary dating app that prioritizes genuine conversation and personality compatibility over superficial swiping. By putting conversation first, we help users form deeper, more meaningful connections.

## 🌟 Key Features

### Conversation-First Approach
- **Prompt Cards**: Users see thoughtful conversation starters instead of photos
- **Tiered Profile Reveal**: Unlock profile information through meaningful interaction
  1. Prompt response only
  2. Name and age
  3. Blurred photo
  4. Full profile with photos and interests

### AI-Powered Matching
- **Personality Analysis**: Advanced psychometric profiling
- **Smart Icebreakers**: AI-generated conversation starters based on compatibility
- **Intelligent Matching**: Compatibility scoring using personality dimensions

### Enhanced Chat Experience
- **Voice & Video Messages**: Express yourself beyond text
- **Chat Challenges**: Fun activities to break the ice
- **Real-time Communication**: Instant messaging with typing indicators
- **Progressive Reveal**: Earn profile access through conversation quality

### Safety & Verification
- **Photo Verification**: Selfie-based identity confirmation
- **Content Moderation**: AI-powered safety features
- **Comprehensive Reporting**: Easy block and report functionality

## 🏗️ Architecture

### Frontend (React Native)
- **Framework**: React Native with Expo
- **Navigation**: React Navigation 6
- **State Management**: Apollo Client + Context API
- **UI Components**: React Native Paper + Custom Components
- **Real-time**: Socket.IO client
- **Animations**: React Native Reanimated

### Backend (Node.js)
- **Framework**: Express.js with TypeScript
- **API**: GraphQL with Type-GraphQL
- **Database**: PostgreSQL with TypeORM
- **Caching**: Redis
- **Real-time**: Socket.IO
- **Authentication**: JWT tokens

### AI Services (Python)
- **Framework**: FastAPI
- **ML Libraries**: scikit-learn, transformers
- **NLP**: TextBlob, sentence-transformers
- **AI Integration**: OpenAI GPT API
- **Personality Analysis**: Big Five model implementation

### Infrastructure
- **Hosting**: AWS (EC2, RDS, ElastiCache)
- **Storage**: AWS S3
- **CDN**: CloudFront
- **Push Notifications**: Firebase Cloud Messaging
- **CI/CD**: GitHub Actions

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Python 3.9+
- PostgreSQL 13+
- Redis 6+
- Expo CLI

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd mindmatch-dating-app
```

2. **Install dependencies**
```bash
npm run install:all
```

3. **Set up the database**
```bash
# Start PostgreSQL and Redis
# Create database
createdb mindmatch_db

# Copy environment files
cp apps/backend/.env.example apps/backend/.env
# Edit the .env file with your configuration
```

4. **Start the development servers**

Backend:
```bash
npm run dev:backend
```

AI Services:
```bash
npm run dev:ai
```

Mobile App:
```bash
npm run dev:mobile
```

### Database Setup

1. **Configure environment variables**
```bash
# In apps/backend/.env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=mindmatch
DB_PASSWORD=password
DB_NAME=mindmatch_db
```

2. **Run database setup**
```bash
npm run setup:db
```

## 📱 Mobile App Development

### Running on Device/Simulator

**iOS Simulator:**
```bash
cd apps/mobile
npm run ios
```

**Android Emulator:**
```bash
cd apps/mobile
npm run android
```

**Physical Device:**
```bash
cd apps/mobile
npm start
# Scan QR code with Expo Go app
```

## 🔧 Configuration

### Environment Variables

**Backend (`apps/backend/.env`):**
- `DB_*`: Database configuration
- `REDIS_*`: Redis configuration
- `JWT_SECRET`: JWT signing secret
- `OPENAI_API_KEY`: OpenAI API key for AI features
- `AWS_*`: AWS credentials for file storage

**AI Services (`apps/ai-services/.env`):**
- `OPENAI_API_KEY`: OpenAI API key
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string

**Mobile App:**
- `EXPO_PUBLIC_GRAPHQL_URL`: Backend GraphQL endpoint
- `EXPO_PUBLIC_AI_SERVICE_URL`: AI services endpoint

## 🧪 Testing

### Backend Tests
```bash
cd apps/backend
npm test
```

### Mobile App Tests
```bash
cd apps/mobile
npm test
```

### AI Services Tests
```bash
cd apps/ai-services
pytest
```

## 📖 API Documentation

### GraphQL Playground
Visit `http://localhost:4000/graphql` when the backend is running to explore the GraphQL schema and test queries.

### AI Services API
Visit `http://localhost:8000/docs` for FastAPI automatic documentation.

## 🎯 Roadmap

### MVP Features ✅
- [x] Conversation-first UI
- [x] Tiered profile reveal
- [x] Basic AI icebreakers
- [x] Personality quiz
- [x] Real-time chat
- [x] Photo verification

### v1.0 Features 🚧
- [ ] Voice/video notes
- [ ] Chat challenges
- [ ] Feedback system
- [ ] Premium subscriptions
- [ ] Advanced matching algorithm

### v2.0 Features 📋
- [ ] Group chats
- [ ] Calendar integration
- [ ] Advanced privacy modes
- [ ] Data export/portability
- [ ] Video calling
- [ ] Location-based matching

## 🔒 Security

- **Authentication**: JWT-based with refresh tokens
- **Authorization**: Role-based access control
- **Data Encryption**: TLS in transit, AES-256 at rest
- **Input Validation**: Comprehensive validation on all endpoints
- **Rate Limiting**: Protection against abuse
- **Content Moderation**: AI-powered safety features

## 📊 Analytics & Monitoring

- **User Analytics**: Mixpanel/Amplitude integration
- **Performance Monitoring**: Application performance metrics
- **Error Tracking**: Comprehensive error logging
- **Business Metrics**: Engagement and conversion tracking

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@mindmatch.app or join our community Discord.

## 🙏 Acknowledgments

- OpenAI for AI capabilities
- React Native community
- TypeORM and GraphQL communities
- All contributors and beta testers

---

**MindMatch** - Where meaningful connections begin with great conversations. 💝

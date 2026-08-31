# 🚀 Ghid Complet de Integrare - Flutter Japanese AI Tutor

## 📁 Structura Proiectului Flutter

```
japanese_tutor_flutter/
├── lib/
│   ├── main.dart                    # Entry point (demo-ul tău)
│   ├── config/
│   │   └── api_config.dart          # Configurare API
│   ├── models/
│   │   ├── chat_message.dart        # Model pentru mesaje
│   │   ├── conversation.dart        # Model pentru conversații
│   │   └── api_response.dart        # Model pentru răspunsuri API
│   ├── services/
│   │   ├── api_service.dart         # Service pentru API calls
│   │   └── storage_service.dart     # Local storage (opțional)
│   ├── providers/
│   │   ├── chat_provider.dart       # State management pentru chat
│   │   └── conversation_provider.dart # State management pentru conversații
│   ├── screens/
│   │   ├── home_screen.dart         # Ecranul principal (din demo)
│   │   └── settings_screen.dart     # Setări
│   └── widgets/
│       ├── sidebar.dart             # Componenta sidebar
│       ├── chat_message.dart        # Widget pentru mesaj
│       └── input_area.dart          # Input area componentă
├── pubspec.yaml
└── android/ios/...
```

---

## 📝 Pași de Integrare

### 1️⃣ **Creează Proiectul Flutter**

```bash
flutter create japanese_tutor_flutter
cd japanese_tutor_flutter
```

### 2️⃣ **Adaugă Dependențe în `pubspec.yaml`**

```yaml
dependencies:
  flutter:
    sdk: flutter
  
  # State Management
  provider: ^6.1.1
  
  # Networking
  http: ^1.1.0
  dio: ^5.4.0  # Alternative pentru requests mai complexe
  
  # Local Storage (opțional)
  shared_preferences: ^2.2.2
  hive: ^2.2.3
  hive_flutter: ^1.1.0
  
  # UI Enhancements
  shimmer: ^3.0.0
  flutter_markdown: ^0.6.18
  
  # Utils
  intl: ^0.18.1
  uuid: ^4.2.1

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^3.0.0
```

```bash
flutter pub get
```

---

## 🔧 Fișiere de Configurat

### 3️⃣ **Config API - `lib/config/api_config.dart`**

```dart
class ApiConfig {
  // Modifică URL-ul în funcție de setup-ul tău
  static const String baseUrl = 'http://localhost:3000/api';
  
  // Alternativ pentru Android emulator
  // static const String baseUrl = 'http://10.0.2.2:3000/api';
  
  // Pentru device fizic
  // static const String baseUrl = 'http://192.168.1.x:3000/api';
  
  // Endpoints
  static const String chatEndpoint = '/chat';
  static const String conversationsEndpoint = '/conversations';
  static const String healthEndpoint = '/health';
  static const String ragStatsEndpoint = '/rag/stats';
  
  // Timeouts
  static const Duration connectionTimeout = Duration(seconds: 30);
  static const Duration receiveTimeout = Duration(seconds: 60);
}
```

---

### 4️⃣ **Modele - `lib/models/`**

#### `chat_message.dart`
```dart
class ChatMessage {
  final String id;
  final String content;
  final bool isUser;
  final DateTime timestamp;
  final List<String>? sources;

  ChatMessage({
    required this.id,
    required this.content,
    required this.isUser,
    required this.timestamp,
    this.sources,
  });

  factory ChatMessage.fromJson(Map<String, dynamic> json) {
    return ChatMessage(
      id: json['id'] ?? '',
      content: json['content'] ?? '',
      isUser: json['role'] == 'user',
      timestamp: json['timestamp'] != null 
        ? DateTime.parse(json['timestamp'])
        : DateTime.now(),
      sources: json['sources'] != null 
        ? List<String>.from(json['sources'])
        : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'content': content,
      'role': isUser ? 'user' : 'assistant',
      'timestamp': timestamp.toIso8601String(),
      'sources': sources,
    };
  }
}
```

#### `conversation.dart`
```dart
class Conversation {
  final String id;
  final String title;
  final DateTime createdAt;
  final DateTime updatedAt;
  final List<ChatMessage> messages;

  Conversation({
    required this.id,
    required this.title,
    required this.createdAt,
    required this.updatedAt,
    this.messages = const [],
  });

  factory Conversation.fromJson(Map<String, dynamic> json) {
    return Conversation(
      id: json['id'] ?? '',
      title: json['title'] ?? 'Untitled',
      createdAt: DateTime.parse(json['createdAt']),
      updatedAt: DateTime.parse(json['updatedAt']),
      messages: json['messages'] != null
        ? (json['messages'] as List)
            .map((msg) => ChatMessage.fromJson(msg))
            .toList()
        : [],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
      'messages': messages.map((msg) => msg.toJson()).toList(),
    };
  }
}
```

---

### 5️⃣ **API Service - `lib/services/api_service.dart`**

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';
import '../models/chat_message.dart';
import '../models/conversation.dart';

class ApiService {
  final http.Client _client = http.Client();

  // Send a chat message
  Future<ChatMessage> sendMessage({
    required String message,
    String? conversationId,
    bool internetSearch = true,
    bool advancedRAG = false,
    String userLevel = 'beginner',
  }) async {
    try {
      final response = await _client.post(
        Uri.parse('${ApiConfig.baseUrl}${ApiConfig.chatEndpoint}'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'message': message,
          'conversationId': conversationId,
          'internetSearch': internetSearch,
          'advancedRAG': advancedRAG,
          'level': userLevel,
        }),
      ).timeout(ApiConfig.receiveTimeout);

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return ChatMessage(
          id: data['conversationId'] ?? '',
          content: data['response'] ?? '',
          isUser: false,
          timestamp: DateTime.now(),
          sources: data['sources'] != null 
            ? List<String>.from(data['sources'])
            : null,
        );
      } else {
        throw Exception('Failed to send message: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Error sending message: $e');
    }
  }

  // Get all conversations
  Future<List<Conversation>> getConversations() async {
    try {
      final response = await _client.get(
        Uri.parse('${ApiConfig.baseUrl}${ApiConfig.conversationsEndpoint}'),
      ).timeout(ApiConfig.connectionTimeout);

      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        return data.map((json) => Conversation.fromJson(json)).toList();
      } else {
        throw Exception('Failed to load conversations');
      }
    } catch (e) {
      throw Exception('Error loading conversations: $e');
    }
  }

  // Get a specific conversation
  Future<Conversation> getConversation(String id) async {
    try {
      final response = await _client.get(
        Uri.parse('${ApiConfig.baseUrl}${ApiConfig.conversationsEndpoint}/$id'),
      ).timeout(ApiConfig.connectionTimeout);

      if (response.statusCode == 200) {
        return Conversation.fromJson(jsonDecode(response.body));
      } else {
        throw Exception('Failed to load conversation');
      }
    } catch (e) {
      throw Exception('Error loading conversation: $e');
    }
  }

  // Delete a conversation
  Future<void> deleteConversation(String id) async {
    try {
      final response = await _client.delete(
        Uri.parse('${ApiConfig.baseUrl}${ApiConfig.conversationsEndpoint}/$id'),
      ).timeout(ApiConfig.connectionTimeout);

      if (response.statusCode != 200) {
        throw Exception('Failed to delete conversation');
      }
    } catch (e) {
      throw Exception('Error deleting conversation: $e');
    }
  }

  // Check API health
  Future<bool> checkHealth() async {
    try {
      final response = await _client.get(
        Uri.parse('${ApiConfig.baseUrl}${ApiConfig.healthEndpoint}'),
      ).timeout(ApiConfig.connectionTimeout);

      return response.statusCode == 200;
    } catch (e) {
      return false;
    }
  }

  void dispose() {
    _client.close();
  }
}
```

---

### 6️⃣ **State Management - `lib/providers/chat_provider.dart`**

```dart
import 'package:flutter/foundation.dart';
import '../models/chat_message.dart';
import '../services/api_service.dart';
import 'package:uuid/uuid.dart';

class ChatProvider with ChangeNotifier {
  final ApiService _apiService = ApiService();
  final List<ChatMessage> _messages = [];
  bool _isLoading = false;
  bool _internetSearch = true;
  bool _advancedRAG = false;
  String? _currentConversationId;
  String _errorMessage = '';

  List<ChatMessage> get messages => _messages;
  bool get isLoading => _isLoading;
  bool get internetSearch => _internetSearch;
  bool get advancedRAG => _advancedRAG;
  String? get currentConversationId => _currentConversationId;
  String get errorMessage => _errorMessage;

  // Toggle internet search
  void toggleInternetSearch() {
    _internetSearch = !_internetSearch;
    notifyListeners();
  }

  // Toggle advanced RAG
  void toggleAdvancedRAG() {
    _advancedRAG = !_advancedRAG;
    notifyListeners();
  }

  // Send message
  Future<void> sendMessage(String content) async {
    if (content.trim().isEmpty) return;

    _errorMessage = '';
    
    // Add user message
    final userMessage = ChatMessage(
      id: const Uuid().v4(),
      content: content,
      isUser: true,
      timestamp: DateTime.now(),
    );
    
    _messages.add(userMessage);
    _isLoading = true;
    notifyListeners();

    try {
      // Call API
      final aiMessage = await _apiService.sendMessage(
        message: content,
        conversationId: _currentConversationId,
        internetSearch: _internetSearch,
        advancedRAG: _advancedRAG,
      );

      // Update conversation ID if new
      if (_currentConversationId == null && aiMessage.id.isNotEmpty) {
        _currentConversationId = aiMessage.id;
      }

      // Add AI response
      _messages.add(aiMessage);
    } catch (e) {
      _errorMessage = e.toString();
      print('Error sending message: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Start new chat
  void startNewChat() {
    _messages.clear();
    _currentConversationId = null;
    _errorMessage = '';
    notifyListeners();
  }

  // Load conversation
  Future<void> loadConversation(String id) async {
    _isLoading = true;
    _errorMessage = '';
    notifyListeners();

    try {
      final conversation = await _apiService.getConversation(id);
      _currentConversationId = id;
      _messages.clear();
      _messages.addAll(conversation.messages);
    } catch (e) {
      _errorMessage = e.toString();
      print('Error loading conversation: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  @override
  void dispose() {
    _apiService.dispose();
    super.dispose();
  }
}
```

---

### 7️⃣ **Actualizează Main App - `lib/main.dart`**

Înlocuiește demo-ul actual cu versiunea care folosește Provider:

```dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'screens/home_screen.dart';
import 'providers/chat_provider.dart';
import 'providers/conversation_provider.dart';

void main() {
  runApp(const JapaneseTutorApp());
}

class JapaneseTutorApp extends StatelessWidget {
  const JapaneseTutorApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => ChatProvider()),
        ChangeNotifierProvider(create: (_) => ConversationProvider()),
      ],
      child: MaterialApp(
        title: 'Japanese AI Tutor',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          brightness: Brightness.dark,
          scaffoldBackgroundColor: const Color(0xFF0f172a),
          fontFamily: 'Inter',
        ),
        home: const HomeScreen(),
      ),
    );
  }
}
```

---

### 8️⃣ **Actualizează Home Screen pentru a folosi Provider**

În `home_screen.dart`, înlocuiește state-ul local cu Provider:

```dart
// În loc de setState, folosește:
final chatProvider = Provider.of<ChatProvider>(context);

// Pentru a trimite mesaje:
chatProvider.sendMessage(_messageController.text);

// Pentru a accesa mesajele:
chatProvider.messages

// Pentru loading state:
chatProvider.isLoading
```

---

## 🔐 Configurare Backend CORS

Asigură-te că backend-ul permite requests de la Flutter:

**`backend/server.js`** - actualizează CORS:
```javascript
app.use(cors({
  origin: '*', // În producție, specifică domain-ul exact
  credentials: true
}));
```

---

## 🧪 Testare

### Test API Connection:
```dart
void testApiConnection() async {
  final apiService = ApiService();
  final isHealthy = await apiService.checkHealth();
  print('API Health: $isHealthy');
}
```

### Test Send Message:
```dart
void testSendMessage() async {
  final apiService = ApiService();
  try {
    final response = await apiService.sendMessage(
      message: 'こんにちは',
      internetSearch: true,
    );
    print('Response: ${response.content}');
  } catch (e) {
    print('Error: $e');
  }
}
```

---

## 📱 Rulare pe Dispozitive

### Android Emulator:
```bash
flutter run
```

### iOS Simulator:
```bash
flutter run -d ios
```

### Device Fizic:
1. Conectează device-ul via USB
2. Activează USB Debugging (Android) / Trust Computer (iOS)
3. Modifică `ApiConfig.baseUrl` cu IP-ul computerului tău
4. ```bash
   flutter run
   ```

---

## 🚀 Next Steps

După integrarea de bază:

1. **Optimizări:**
   - Cache pentru conversații (Hive/SharedPreferences)
   - Offline mode
   - Error handling mai robust
   - Retry mechanism pentru failed requests

2. **Features Noi:**
   - Voice input
   - Image recognition pentru kanji
   - Spaced repetition system
   - Progress tracking

3. **UI Enhancements:**
   - Dark/Light theme toggle
   - Custom fonts
   - Animații avansate
   - Skeleton loaders

---

## 🆘 Troubleshooting

### Problema: "Connection refused"
**Soluție:** 
- Verifică că backend-ul rulează pe `localhost:3000`
- Pentru Android emulator, folosește `10.0.2.2:3000`
- Pentru device fizic, folosește IP-ul local al computerului

### Problema: "CORS error"
**Soluție:** 
- Verifică configurarea CORS în `server.js`
- Adaugă origin-ul Flutter în whitelist

### Problema: "Timeout"
**Soluție:**
- Crește timeout-urile în `ApiConfig`
- Verifică conexiunea la internet
- Verifică performanța backend-ului

---

## 📚 Resurse Utile

- [Flutter Documentation](https://flutter.dev/docs)
- [Provider Package](https://pub.dev/packages/provider)
- [HTTP Package](https://pub.dev/packages/http)
- [Flutter Networking](https://flutter.dev/docs/cookbook/networking)

---

**Succes cu integrarea! 🎉**

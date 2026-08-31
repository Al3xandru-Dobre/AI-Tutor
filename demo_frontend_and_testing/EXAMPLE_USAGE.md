# 💡 Exemple Practice de Utilizare

## 📝 Exemple de Cod pentru API Service

### 1. Trimitere Mesaj Simplu

```dart
import 'services/api_service.dart';

final apiService = ApiService();

// Trimite un mesaj
try {
  final response = await apiService.sendMessage(
    message: 'Cum zici "bună ziua" în japoneză?',
    internetSearch: true,
    advancedRAG: false,
  );
  
  print('AI Response: ${response['response']}');
  print('Conversation ID: ${response['conversationId']}');
  
  if (response['sources'] != null) {
    print('Sources used: ${response['sources']}');
  }
} catch (e) {
  print('Error: $e');
}
```

---

### 2. Continuare Conversație

```dart
// După ce ai primit un conversationId din primul mesaj
String conversationId = 'abc-123-xyz';

final response = await apiService.sendMessage(
  message: 'Îmi poți da mai multe exemple?',
  conversationId: conversationId, // Continuă conversația
  internetSearch: true,
);
```

---

### 3. Încărcare Conversații

```dart
// Obține toate conversațiile
final conversations = await apiService.getConversations();

print('Total conversations: ${conversations.length}');

for (var conv in conversations) {
  print('- ${conv.title} (${conv.messageCount} messages)');
  print('  Created: ${conv.getFormattedDate()}');
}
```

---

### 4. Încărcare Conversație Specifică

```dart
// Încarcă o conversație cu toate mesajele
final conversation = await apiService.getConversation('conv-id-123');

print('Title: ${conversation.title}');
print('Messages:');
for (var msg in conversation.messages) {
  print('${msg.isUser ? "User" : "AI"}: ${msg.content}');
}
```

---

### 5. Ștergere Conversație

```dart
try {
  await apiService.deleteConversation('conv-id-123');
  print('Conversation deleted successfully');
} catch (e) {
  print('Failed to delete: $e');
}
```

---

### 6. Health Check

```dart
// Verifică dacă backend-ul este disponibil
final health = await apiService.checkHealth();

print('Backend status: ${health['status']}');
print('Services: ${health['services']}');
```

---

## 🎨 Exemple UI cu setState

### 1. Integrare în Widget

```dart
class ChatScreen extends StatefulWidget {
  @override
  _ChatScreenState createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final ApiService _apiService = ApiService();
  final List<ChatMessage> _messages = [];
  bool _isLoading = false;
  String? _conversationId;

  Future<void> _sendMessage(String text) async {
    // Adaugă mesaj utilizator
    setState(() {
      _messages.add(ChatMessage(
        content: text,
        isUser: true,
      ));
      _isLoading = true;
    });

    try {
      // Trimite la backend
      final response = await _apiService.sendMessage(
        message: text,
        conversationId: _conversationId,
      );

      // Actualizează conversationId
      if (_conversationId == null) {
        _conversationId = response['conversationId'];
      }

      // Adaugă răspuns AI
      setState(() {
        _messages.add(ChatMessage(
          content: response['response'],
          isUser: false,
          sources: response['sources'],
        ));
      });
    } catch (e) {
      // Gestionează eroarea
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e')),
      );
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              itemCount: _messages.length,
              itemBuilder: (context, index) {
                final message = _messages[index];
                return MessageBubble(message: message);
              },
            ),
          ),
          if (_isLoading)
            CircularProgressIndicator(),
          MessageInput(onSend: _sendMessage),
        ],
      ),
    );
  }
}
```

---

## 🔄 Exemple cu Provider (State Management)

### 1. Setup Provider

```dart
// main.dart
void main() {
  runApp(
    ChangeNotifierProvider(
      create: (_) => ChatProvider(),
      child: MyApp(),
    ),
  );
}
```

---

### 2. Utilizare Provider în Widget

```dart
class ChatScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final chatProvider = Provider.of<ChatProvider>(context);

    return Scaffold(
      body: Column(
        children: [
          // Lista de mesaje
          Expanded(
            child: ListView.builder(
              itemCount: chatProvider.messages.length,
              itemBuilder: (context, index) {
                final message = chatProvider.messages[index];
                return MessageBubble(message: message);
              },
            ),
          ),
          
          // Loading indicator
          if (chatProvider.isLoading)
            LinearProgressIndicator(),
          
          // Input area
          MessageInput(
            onSend: (text) {
              chatProvider.sendMessage(text);
            },
          ),
        ],
      ),
    );
  }
}
```

---

### 3. Toggle Features cu Provider

```dart
// În widget-ul tău
Row(
  children: [
    // Internet Search Toggle
    Switch(
      value: Provider.of<ChatProvider>(context).internetSearch,
      onChanged: (value) {
        context.read<ChatProvider>().toggleInternetSearch();
      },
    ),
    Text('Internet Search'),
    
    SizedBox(width: 20),
    
    // Advanced RAG Toggle
    Switch(
      value: Provider.of<ChatProvider>(context).advancedRAG,
      onChanged: (value) {
        context.read<ChatProvider>().toggleAdvancedRAG();
      },
    ),
    Text('Advanced RAG'),
  ],
)
```

---

## 🎯 Pattern-uri Utile

### 1. Loading State cu Overlay

```dart
void _showLoadingOverlay() {
  showDialog(
    context: context,
    barrierDismissible: false,
    builder: (context) => Center(
      child: CircularProgressIndicator(),
    ),
  );
}

void _hideLoadingOverlay() {
  Navigator.of(context).pop();
}

// Utilizare
_showLoadingOverlay();
await apiService.sendMessage(...);
_hideLoadingOverlay();
```

---

### 2. Error Handling Elegant

```dart
Future<void> _sendMessageWithErrorHandling(String text) async {
  try {
    final response = await _apiService.sendMessage(message: text);
    // Success
  } on SocketException {
    _showError('Nu există conexiune la internet');
  } on TimeoutException {
    _showError('Request-ul a expirat. Încearcă din nou.');
  } on FormatException {
    _showError('Răspuns invalid de la server');
  } catch (e) {
    _showError('Eroare necunoscută: $e');
  }
}

void _showError(String message) {
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(
      content: Text(message),
      backgroundColor: Colors.red,
      action: SnackBarAction(
        label: 'OK',
        onPressed: () {},
      ),
    ),
  );
}
```

---

### 3. Retry Mechanism

```dart
Future<T> _retryRequest<T>(
  Future<T> Function() request, {
  int maxAttempts = 3,
}) async {
  int attempts = 0;
  
  while (attempts < maxAttempts) {
    try {
      return await request();
    } catch (e) {
      attempts++;
      if (attempts >= maxAttempts) rethrow;
      
      // Wait before retry (exponential backoff)
      await Future.delayed(Duration(seconds: attempts * 2));
    }
  }
  
  throw Exception('Max retry attempts reached');
}

// Utilizare
final response = await _retryRequest(() => 
  apiService.sendMessage(message: 'test')
);
```

---

### 4. Cache pentru Conversații (cu Hive)

```dart
import 'package:hive_flutter/hive_flutter.dart';

class ConversationCache {
  static const String boxName = 'conversations';
  
  Future<void> init() async {
    await Hive.initFlutter();
    await Hive.openBox<Map>(boxName);
  }
  
  Future<void> saveConversation(Conversation conv) async {
    final box = Hive.box<Map>(boxName);
    await box.put(conv.id, conv.toJson());
  }
  
  Future<List<Conversation>> getAllConversations() async {
    final box = Hive.box<Map>(boxName);
    return box.values
        .map((json) => Conversation.fromJson(Map<String, dynamic>.from(json)))
        .toList();
  }
  
  Future<void> deleteConversation(String id) async {
    final box = Hive.box<Map>(boxName);
    await box.delete(id);
  }
}

// Utilizare în Provider
class ChatProvider with ChangeNotifier {
  final ConversationCache _cache = ConversationCache();
  
  Future<void> loadConversations() async {
    // Încearcă din cache
    try {
      _conversations = await _cache.getAllConversations();
      notifyListeners();
    } catch (e) {
      // Dacă cache-ul eșuează, încarcă de pe server
      _conversations = await _apiService.getConversations();
      notifyListeners();
    }
  }
}
```

---

## 🔍 Debug Tips

### 1. Activează Logging

În `api_config.dart`:
```dart
static const bool debugMode = true;
```

### 2. Interceptează Toate Request-urile

```dart
class LoggingApiService extends ApiService {
  @override
  Future<Map<String, dynamic>> sendMessage(...) async {
    print('📤 Sending: $message');
    final response = await super.sendMessage(...);
    print('📥 Response: ${response['response']}');
    return response;
  }
}
```

---

## 🎯 Best Practices

1. **Folosește Provider pentru state global** (mesaje, conversații)
2. **Cache conversațiile local** pentru offline access
3. **Implementează retry logic** pentru network errors
4. **Arată loading states** pentru UX mai bun
5. **Handle errors gracefully** cu mesaje clare pentru user

---

**Succes cu integrarea! 🚀**

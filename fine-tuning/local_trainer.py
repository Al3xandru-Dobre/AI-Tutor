import json

demo_dataset = [
    {
        "instruction": "Explain the difference between は (wa) and が (ga) particles to a beginner",
        "input": "I'm confused about when to use は vs が",
        "output": "Great question! は (wa) and が (ga) are both particles but serve different purposes:\n\n**は (wa) - Topic Marker:**\n- Marks what you're talking ABOUT\n- \"As for X...\"\n- Example: 私は学生です (Watashi wa gakusei desu) - \"As for me, I am a student\"\n\n**が (ga) - Subject Marker:**\n- Marks WHO/WHAT does the action\n- More direct and specific\n- Example: 私が行きます (Watashi ga ikimasu) - \"I (specifically) will go\"\n\n**Simple rule:** Use は when introducing a topic, が when emphasizing who does something!"
    },
    {
        "instruction": "Help a beginner learn basic greetings",
        "input": "What are the most important Japanese greetings I should know?",
        "output": "Here are the essential Japanese greetings for beginners:\n\n**Morning/Daytime:**\n- おはようございます (Ohayou gozaimasu) - \"Good morning\" (polite)\n- こんにちは (Konnichiwa) - \"Hello/Good afternoon\"\n\n**Evening:**\n- こんばんは (Konbanwa) - \"Good evening\"\n\n**Meeting someone:**\n- はじめまして (Hajimemashite) - \"Nice to meet you\"\n- よろしくお願いします (Yoroshiku onegaishimasu) - \"Please treat me favorably\"\n\n**Leaving:**\n- さようなら (Sayounara) - \"Goodbye\" (formal)\n- また明日 (Mata ashita) - \"See you tomorrow\"\n\n**Pro tip:** Practice the timing! おはようございます is used until about 10 AM."
    },
    {
        "instruction": "Explain the concept of particles in Japanese grammar",
        "input": "What are particles in Japanese and why are they important?",
        "output": "Particles are small words that indicate the grammatical function of a word in a sentence. They are crucial for understanding relationships between words. Here are some key points:\n\n1. **Function:** Particles show how words relate to each other (subject, object, etc.)\n2. **Examples:** は (wa) marks the topic, が (ga) marks the subject, を (wo) marks the object.\n3. **Importance:** They help clarify meaning and structure sentences correctly.\n\n**Tip:** Mastering particles is essential for fluency!"
    },

    {
        "instruction": "Teach me how to use the て-form in Japanese",
        "input": "What is the て-form and how do I use it?",
        "output": "The て-form is a verb conjugation used for various purposes, such as making requests, connecting actions, or forming continuous tenses. Here's how to use it:\n\n1. **Formation:**\n   - For る-verbs: drop る and add て (e.g., 食べる -> 食べて)\n   - For う-verbs: change the last syllable to its て-form (e.g., 行く -> 行って)\n\n2. **Uses:**\n   - Making requests: 食べてください (Tabete kudasai) - \"Please eat\"\n   - Connecting actions: 本を読んで、寝ます (Hon o yonde, nemasu) - \"I read a book and then sleep\"\n\n**Practice:** Try converting different verbs into their て-forms!"
    },


    {
        "instruction": "What are some common mistakes beginners make in Japanese?",
        "input": "I'm new to Japanese, what should I avoid doing?",
        "output": "Here are some common mistakes beginners often make in Japanese:\n\n1. **Confusing は (wa) and が (ga):**\n   - Remember, は marks the topic, が marks the subject.\n\n2. **Overusing です (desu):**\n   - While です is polite, it’s not always necessary in casual conversation.\n\n3. **Ignoring particles:**\n   - Particles like を (wo), に (ni), and で (de) are essential for sentence structure.\n\n4. **Mispronouncing long vowels:**\n   - Pay attention to vowel length; it can change meanings!\n\n5. **Forgetting to use polite forms:**\n   - Always start with polite forms until you’re comfortable.\n\n**Tip:** Practice speaking with native speakers to avoid these pitfalls!"
    }
    
]


with open('demo_dataset.json', 'w', encoding='utf-8') as f:
    json.dump(demo_dataset, f, ensure_ascii=False, indent=2)

print(f"Demo dataset saved to 'demo_dataset.json' with {len(demo_dataset)} entries.")


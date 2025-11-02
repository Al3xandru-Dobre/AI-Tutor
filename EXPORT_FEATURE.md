# Conversation Export Feature

## Overview
The conversation export feature allows users to export their conversations in JSON format with an optional training data flag. This feature ensures conversation history remains intact while optionally creating a copy for training purposes.

## Features

### 1. JSON Export
- Export any conversation as a downloadable JSON file
- Preserves all conversation metadata (ID, title, messages, timestamps)
- Filename format: `conversation_{id}_{timestamp}.json`

### 2. Training Data Option
- Users can opt-in to contribute their conversation data for training
- When enabled, a copy is saved to `backend/data/training/` folder
- Original conversation history remains unchanged
- Non-intrusive - training data is collected separately

### 3. Multiple Export Options
- **Export as JSON**: Raw conversation data for backup or analysis
- **Export as Document**: Generate PDF, DOCX, or Markdown (existing feature)

## User Interface

### Export from Sidebar
Each conversation in the history sidebar has two export buttons:
1. **JSON Export Button** (📥): Opens the export modal with training option
2. **Document Export Button** (📄): Opens document generation modal

### Export from Header
When viewing a conversation, the header shows an "Export" dropdown with:
- Export as JSON (with training option)
- Export as Document (PDF/DOCX/Markdown)

## Backend Implementation

### New Endpoint
```
POST /api/conversations/:id/export
```

**Request Body:**
```json
{
  "useForTraining": true/false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Conversation exported successfully and saved for training",
  "filename": "conversation_abc123_2025-10-11T12-00-00-000Z.json",
  "data": { /* conversation object */ }
}
```

### File Structure
```
backend/
  data/
    history/
      conversations.json        # Main conversation storage (unchanged)
    training/
      conversation_*.json       # Training data copies (only if opted-in)
```

## Frontend Implementation

### New Files
- `frontend/js/export.js` - Export functionality and modal management

### Modified Files
- `frontend/index.html` - Added export modal and dropdown menu
- `frontend/style.css` - Added styles for modal, dropdown, and notifications
- `frontend/js/conversation-history.js` - Added JSON export button to history items
- `frontend/js/document-generation.js` - Updated header button visibility logic

### Backend Files
- `backend/services/conversationService.js` - Added `exportConversation` method
- `backend/controllers/conversationController.js` - Added `exportConversation` controller
- `backend/routes/conversationRoute.js` - Added export route

## Usage

### For Users
1. **Export from History:**
   - Hover over any conversation in the sidebar
   - Click the JSON export button (📥)
   - Check "Use for training data" if you want to contribute
   - Click "Export" to download

2. **Export from Header:**
   - While viewing a conversation, click "Export" in the header
   - Select "Export as JSON"
   - Check training option if desired
   - Click "Export" to download

### For Developers
```javascript
// Export a conversation programmatically
const response = await fetch(`/api/conversations/${conversationId}/export`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ useForTraining: true })
});

const result = await response.json();
// result.data contains the full conversation object
```

## Privacy & Data Handling

### Conversation History
- **Never modified** by export operations
- Remains in `backend/data/history/conversations.json`
- Continues to load normally in the UI
- Delete operations work independently of training data

### Training Data
- **Opt-in only** - users must explicitly check the box
- Stored separately in `backend/data/training/`
- Can be used for future model improvements
- Does not affect conversation history or loading

### Data Format
Both history and training data use the same format:
```json
{
  "id": "abc123...",
  "title": "Conversation on 10/11/2025",
  "messages": [
    {
      "role": "user",
      "content": "Hello",
      "timestamp": "2025-10-11T12:00:00.000Z"
    },
    {
      "role": "assistant",
      "content": "こんにちは",
      "timestamp": "2025-10-11T12:00:01.000Z"
    }
  ],
  "createdAt": "2025-10-11T12:00:00.000Z"
}
```

## Future Enhancements

### Potential Improvements
1. **Bulk Export**: Export multiple conversations at once
2. **Filter Training Data**: Allow filtering which messages to include
3. **Anonymization**: Option to remove personally identifiable information
4. **Training Data Management**: UI to view and manage training data contributions
5. **Statistics**: Show users how their contributions help improve the system
6. **Import**: Allow importing previously exported conversations

## Technical Notes

### File Naming
- Uses conversation ID + ISO timestamp
- Colons replaced with hyphens for filesystem compatibility
- Example: `conversation_a1b2c3d4_2025-10-11T12-00-00-000Z.json`

### Error Handling
- Validates conversation exists before export
- Creates training directory if it doesn't exist
- Graceful fallback if training save fails
- User notifications for all operations

### Performance
- Export operation is non-blocking
- Training save happens asynchronously
- No impact on conversation history loading
- Minimal disk I/O

## Testing

### Manual Testing Checklist
- [ ] Export conversation from sidebar
- [ ] Export conversation from header dropdown
- [ ] Export with training option unchecked
- [ ] Export with training option checked
- [ ] Verify file downloads correctly
- [ ] Verify training file is created when checked
- [ ] Verify conversation history still loads
- [ ] Verify delete conversation still works
- [ ] Test with no active conversation
- [ ] Test notification messages

### Automated Testing (Future)
```javascript
// Example test structure
describe('Conversation Export', () => {
  it('should export conversation as JSON', async () => {
    // Test implementation
  });
  
  it('should save to training folder when opted-in', async () => {
    // Test implementation
  });
  
  it('should not affect conversation history', async () => {
    // Test implementation
  });
});
```

## Support & Troubleshooting

### Common Issues

**Export button not showing:**
- Ensure you're viewing an active conversation
- Check browser console for JavaScript errors

**Training data not saving:**
- Check backend logs for permission errors
- Verify `backend/data/training/` directory permissions

**Download not starting:**
- Check browser download settings
- Verify browser allows file downloads from localhost

**Conversation history affected:**
- This should never happen - report as bug if it does
- Training data is always a separate copy

## Version History
- **v1.0** (October 2025): Initial release with JSON export and training option

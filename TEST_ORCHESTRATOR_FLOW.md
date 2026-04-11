# Smart Chat Orchestrator - Test Flow

## Test Case: Upload Symptom Image + Text Query

### Scenario
User uploads a symptom image using the "Upload Symptom" button AND types a text query like "tell me what disease I have"

### Expected Behavior
Both the image and text should be sent to the symptom agent, which should:
1. Analyze the image for visual symptoms
2. Consider the text query
3. Provide a comprehensive response addressing both inputs

### Frontend Flow
1. User clicks "+" button → dropdown appears
2. User clicks "Upload Symptom" → file picker opens
3. User selects image → `uploadIntent` set to 'symptom', file preview shown
4. User types text: "tell me what disease I have"
5. User clicks Send button
6. `handleSend` function:
   - Stores `currentInput` = "tell me what disease I have"
   - Stores `currentFile` = the selected file object
   - Stores `currentIntent` = "symptom"
   - Calls `aiService.chatOrchestrator()` with all three

### Backend Flow
1. `/api/v1/ai/chat-orchestrator` receives:
   - `message` = "tell me what disease I have"
   - `upload_intent` = "symptom"
   - `file` = uploaded image file

2. Orchestrator processes:
   - Converts file to base64
   - Calls `chat_orchestrator.process_chat_request()`
   - Routes to `_route_to_symptom_agent()`

3. Symptom agent:
   - Builds prompt with user message: "tell me what disease I have"
   - Adds instruction: "User has uploaded an image showing symptoms..."
   - Calls `llm.invoke_with_image()` with BOTH text prompt AND image
   - LLM analyzes both inputs together

4. Response returned with:
   - Comprehensive analysis of image + text
   - Suggested actions
   - Disclaimer

### Code Verification

#### Frontend (SmartChat.jsx)
```javascript
const response = await aiService.chatOrchestrator({
  message: currentInput,        // ✅ Text query
  upload_intent: currentIntent, // ✅ "symptom"
  file: currentFile,            // ✅ File object
  chat_history: messages.map(m => ({ role: m.role, content: m.content })),
  session_id: sessionId,
});
```

#### Service (ai.service.js)
```javascript
const formData = new FormData();
formData.append('message', data.message || '');      // ✅ Text
formData.append('upload_intent', data.upload_intent || 'none'); // ✅ Intent
if (data.file) {
  formData.append('file', data.file);                // ✅ File
}
```

#### Backend (chat_orchestrator.py)
```python
async def _route_to_symptom_agent(
    self,
    message: str,              # ✅ Receives text
    file_data: dict | None,    # ✅ Receives file data
    chat_history: list[dict],
) -> dict[str, Any]:
    # Builds prompt with message
    user_prompt = f"{history_context}\n\nCurrent Input: {message}\n\n"
    
    # Adds image instruction if file exists
    if file_data:
        user_prompt += "**Note: User has uploaded an image...**\n\n"
    
    # Calls LLM with BOTH text and image
    if file_data and file_data.get("base64"):
        response = self.llm.invoke_with_image(
            system_prompt,
            user_prompt,           # ✅ Contains text query
            file_data["base64"],   # ✅ Contains image
            file_data.get("mime_type", "image/jpeg"),
        )
```

## Conclusion

The implementation is **CORRECT**. Both text and image are properly sent to the backend and processed together by the symptom agent. The LLM receives:
1. A prompt containing the user's text query
2. The image data for visual analysis

This allows the AI to provide a comprehensive response considering both inputs.

## If Issue Persists

If you're still not getting responses, check:
1. **Backend logs** - Is the API receiving both message and file?
2. **LLM service** - Is `invoke_with_image()` working correctly?
3. **Network tab** - Verify FormData contains both fields
4. **Console errors** - Any JavaScript errors in browser console?

The orchestrator logic is sound and follows the exact same pattern as the standalone symptom checker agent.

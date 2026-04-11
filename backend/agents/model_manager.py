from enum import Enum
import logging

from langchain_google_genai import ChatGoogleGenerativeAI

from app.core.config import settings

logger = logging.getLogger(__name__)

class ModelTier(Enum):
    PRIMARY = "primary"
    SECONDARY = "secondary" 
    TERTIARY = "tertiary"
    FALLBACK = "fallback"

class ModelManager:
    """
    Manages AI model selection, fallback, and rate limits.
    Implements an agent-based approach for model management.
    """
    
    MODEL_CONFIG = {
        ModelTier.PRIMARY: {
            "provider": "gemini",
            "model": settings.gemini_model,
            "max_tokens": 2000,
            "temperature": 0.2
        },
        ModelTier.SECONDARY: {
            "provider": "gemini",
            "model": settings.gemini_model,
            "max_tokens": 2000,
            "temperature": 0.2
        },
        ModelTier.TERTIARY: {
            "provider": "gemini",
            "model": settings.gemini_model,
            "max_tokens": 2000, 
            "temperature": 0.2
        },
        ModelTier.FALLBACK: {
            "provider": "gemini",
            "model": settings.gemini_model,
            "max_tokens": 2000,
            "temperature": 0.2
        }
    }
    
    def __init__(self):
        self.clients = {}
        self._initialize_clients()

    def _initialize_clients(self):
        """Initialize API clients for each provider."""
        try:
            if settings.gemini_api_key:
                self.clients["gemini"] = ChatGoogleGenerativeAI(
                    model=settings.gemini_model,
                    temperature=0.2,
                    google_api_key=settings.gemini_api_key,
                )
        except Exception as e:
            logger.error(f"Failed to initialize Gemini client: {str(e)}")

    def generate_analysis(self, data, system_prompt, retry_count=0):
        """
        Generate analysis using the best available model with automatic fallback.
        Implements agent-based decision making for model selection.
        """
        if retry_count > 3:
            return {"success": False, "error": "All models failed after multiple retries"}

        # Determine which model tier to use based on retry count
        if retry_count == 0:
            tier = ModelTier.PRIMARY
        elif retry_count == 1:
            tier = ModelTier.SECONDARY
        elif retry_count == 2:
            tier = ModelTier.TERTIARY
        else:
            tier = ModelTier.FALLBACK
            
        model_config = self.MODEL_CONFIG[tier]
        provider = model_config["provider"]
        model = model_config["model"]
        
        # Check if we have a client for this provider
        if provider not in self.clients:
            logger.error(f"No client available for provider: {provider}")
            return self.generate_analysis(data, system_prompt, retry_count + 1)
            
        try:
            client = self.clients[provider]
            logger.info(f"Attempting generation with {provider} model: {model}")
            
            if provider == "gemini":
                response = client.invoke(
                    [
                        ("system", system_prompt),
                        ("human", str(data)),
                    ]
                )

                content = response.content if isinstance(response.content, str) else str(response.content)
                return {
                    "success": True,
                    "content": content,
                    "model_used": f"{provider}/{model}"
                }
                
        except Exception as e:
            error_message = str(e).lower()
            logger.warning(f"Model {model} failed: {error_message}")
            
            # Try next model in hierarchy
            return self.generate_analysis(data, system_prompt, retry_count + 1)
            
        return {"success": False, "error": "Analysis failed with all available models"}

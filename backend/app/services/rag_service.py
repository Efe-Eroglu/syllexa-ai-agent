import os
from ..utils.document_processor import DocumentProcessor
from ..models.chat import ChatFile
from sqlalchemy.orm import Session
from typing import List, Dict, Any

class RAGService:
    """
    Service class for RAG (Retrieval Augmented Generation) operations
    Handles document processing, storage, and retrieval
    """
    
    def __init__(self, db: Session = None):
        """Initialize RAG service with database session"""
        upload_dir = os.environ.get("UPLOAD_DIR", "./uploads")
        vector_db_dir = os.environ.get("VECTOR_DB_DIR", "./vector_db")
        
        # Initialize document processor
        self.document_processor = DocumentProcessor(vector_db_path=vector_db_dir)
        self.upload_dir = upload_dir
        self.db = db
        
    def process_uploaded_file(self, file_path: str, chat_id: int, file_metadata: Dict = None) -> bool:
        """
        Process an uploaded file and add it to the vector store
        
        Args:
            file_path: Path to the uploaded file
            chat_id: ID of the chat the file belongs to
            file_metadata: Additional metadata for the file
            
        Returns:
            bool: True if processing was successful
        """
        try:
            # Create a collection name based on chat ID
            collection_name = f"test_chat_{chat_id}"
            
            # Process document to get chunks
            chunks_with_metadata = self.document_processor.process_document(
                file_path=file_path,
                chat_id=chat_id,
                metadata=file_metadata
            )
            
            # Add chunks to vector store
            self.document_processor.add_documents_to_vectorstore(
                chunks_with_metadata=chunks_with_metadata,
                collection_name=collection_name
            )
            
            return True
        except Exception as e:
            print(f"Error processing file {file_path}: {e}")
            return False
    
    def retrieve_relevant_context(self, query: str, chat_id: int, limit: int = 5) -> List[Dict[str, Any]]:
        """
        Retrieve relevant context from vector store for a given query
        
        Args:
            query: User's query text
            chat_id: ID of the chat
            limit: Maximum number of relevant chunks to retrieve
            
        Returns:
            List of dictionaries containing relevant text chunks and metadata
        """
        try:
            # Create collection name based on chat ID
            collection_name = f"test_chat_{chat_id}"
            
            # Search for similar chunks
            results = self.document_processor.search_similar_chunks(
                query=query,
                collection_name=collection_name,
                limit=limit
            )
            
            # Format results
            formatted_results = []
            for content, metadata, score in results:
                formatted_results.append({
                    "content": content,
                    "metadata": metadata,
                    "relevance_score": score
                })
                
            return formatted_results
        except Exception as e:
            print(f"Error retrieving context for query '{query}': {e}")
            return []
    
    def enhance_prompt_with_context(self, query: str, chat_id: int) -> str:
        """
        Enhance a user query with relevant context from uploaded documents
        
        Args:
            query: User's original query
            chat_id: ID of the chat
            
        Returns:
            Enhanced prompt with relevant context
        """
        # Get relevant context
        context_items = self.retrieve_relevant_context(query, chat_id)
        
        if not context_items:
            return query  # Return original query if no context found
            
        # Build enhanced prompt
        enhanced_prompt = "Aşağıdaki bilgileri kullanarak soruyu yanıtla:\n\n"
        
        # Add context from documents
        for i, item in enumerate(context_items, 1):
            source = item["metadata"].get("source", "Bilinmeyen kaynak")
            enhanced_prompt += f"Belge {i} (Kaynak: {source}):\n{item['content']}\n\n"
            
        # Add original query
        enhanced_prompt += f"Soru: {query}\n"
        enhanced_prompt += "\nYukarıdaki belgelerde yanıt bulunamazsa, genel bilgilerinle yanıt ver."
        
        return enhanced_prompt 